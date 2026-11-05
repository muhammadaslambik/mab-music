"""MAB-Transcribe backend (Google Colab T4): faster-whisper + optional vocal separation + lyric matching + URL download."""
import os, re, uuid, glob, queue, shutil, difflib, tempfile, threading, subprocess
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MAB-Transcribe")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
JOBS, Q = {}, queue.Queue()
MODELS = {"turbo": "large-v3-turbo", "large": "large-v3", "small": "small"}
MAX_SECONDS = 15 * 60
_m = {"name": None, "obj": None}

def norm(s):
    return re.sub(r"[\W_]+", " ", s.lower()).split()

def match_lyrics(words, lines):
    """Give each lyric line (correct text) a start time by fuzzy-matching it to the recognised words, in order."""
    out, p = [], 0
    for text in lines:
        t = norm(text); n = len(t)
        if not t:
            continue
        best = (0.0, None, 0)
        for i in range(p, min(len(words), p + 3 * n + 30)):
            for k in range(max(1, n - 2), n + 3):
                seg = [w["t"] for w in words[i:i + k]]
                if not seg:
                    continue
                r = difflib.SequenceMatcher(None, " ".join(t), " ".join(seg)).ratio()
                if r > best[0]:
                    best = (r, i, k)
        if best[1] is not None and best[0] >= 0.35:
            out.append({"text": text, "start": words[best[1]]["s"]}); p = best[1] + best[2]
        else:
            out.append({"text": text, "start": None})
    prev = None                                   # fill unmatched lines by spacing them after the previous one
    for i, o in enumerate(out):
        if o["start"] is None:
            o["start"] = (prev + 2.0) if prev is not None else 0.0
        o["start"] = max(o["start"], prev if prev is not None else 0.0)
        prev = o["start"]
    for i, o in enumerate(out):
        o["end"] = out[i + 1]["start"] if i + 1 < len(out) else o["start"] + 4.0
    return out

def load_model(key):
    name = MODELS.get(key, "large-v3-turbo")
    if _m["name"] != name:
        from faster_whisper import WhisperModel
        import torch
        _m["obj"] = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            _m["obj"] = WhisperModel(name, device="cuda", compute_type="float16")
        else:
            _m["obj"] = WhisperModel(name, device="cpu", compute_type="int8")
        _m["name"] = name
    return _m["obj"]

def download(url, d):
    out = os.path.join(d, "dl.%(ext)s")
    r = subprocess.run(["yt-dlp", "-x", "--audio-format", "wav", "--no-playlist", "--match-filter", f"duration<={MAX_SECONDS}", "-o", out, url],
                       capture_output=True, text=True, timeout=600)
    f = glob.glob(os.path.join(d, "dl.*"))
    if r.returncode or not f:
        raise RuntimeError("Gagal mengunduh: platform memblokir, butuh login, atau durasi > 15 menit. " + r.stderr[-150:])
    return f[0]

def separate(path, d):
    """Optional: isolate vocals with Demucs (installed on first use). Returns the vocals file, or None to fall back."""
    try:
        try:
            import demucs  # noqa: F401
        except ImportError:
            subprocess.run(["pip", "install", "-q", "demucs"], check=True, timeout=900)
        subprocess.run(["python", "-m", "demucs.separate", "--two-stems=vocals", "-n", "htdemucs", "--mp3", "-d", "cuda",
                        "-o", os.path.join(d, "sep"), path], check=True, timeout=1800, capture_output=True)
        f = glob.glob(os.path.join(d, "sep", "*", "*", "vocals.mp3"))
        return f[0] if f else None
    except Exception:
        return None

def run(job):
    j = JOBS[job["id"]]
    try:
        path = job["path"]
        if job["url"]:
            j["message"] = "Mengunduh audio dari URL…"; path = download(job["url"], job["dir"])
        if job["separate"]:
            j["message"] = "Memisahkan vokal… (pertama kali memasang demucs, ±2 menit)"; path = separate(path, job["dir"]) or path
        j["message"] = "Mentranskripsi dengan model " + job["model"] + "…"
        segs, info = load_model(job["model"]).transcribe(
            path, language=job["lang"] or None, beam_size=5, word_timestamps=True, condition_on_previous_text=False,
            vad_filter=False, initial_prompt=(job["lyrics"][:400] or None))
        segs = list(segs)
        lines = [l.strip() for l in job["lyrics"].splitlines() if l.strip()]
        if lines:
            words = [{"t": x, "s": w.start} for s in segs for w in (s.words or []) for x in norm(w.word)]
            res = match_lyrics(words, lines)
        else:
            res = [{"start": s.start, "end": s.end, "text": s.text.strip()} for s in segs if s.text.strip()]
        j.update(status="done", result={"language": info.language, "lines": res})
    except Exception as e:
        j.update(status="error", message=str(e)[:300])
    finally:
        shutil.rmtree(job["dir"], ignore_errors=True)

def worker():
    while True:
        job = Q.get(); JOBS[job["id"]]["status"] = "running"; run(job)
threading.Thread(target=worker, daemon=True).start()

@app.get("/")
def root():
    try:
        import torch; dev = "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        dev = "cpu"
    return {"app": "MAB-Transcribe", "device": dev, "models": list(MODELS)}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(None), url: str = Form(""), language: str = Form(""), model: str = Form("turbo"),
                     separate: str = Form("0"), lyrics: str = Form("")):
    d, path = tempfile.mkdtemp(), None
    if file is not None:
        path = os.path.join(d, "in.wav")
        with open(path, "wb") as f:
            f.write(await file.read())
    elif not url.strip():
        raise HTTPException(400, "Kirim file atau url")
    jid = uuid.uuid4().hex[:12]
    JOBS[jid] = {"status": "queued", "message": "Antre…"}
    Q.put({"id": jid, "dir": d, "path": path, "url": url.strip(), "lang": language, "model": model, "separate": separate == "1", "lyrics": lyrics})
    return {"job_id": jid}

@app.get("/status/{jid}")
def status(jid: str):
    j = JOBS.get(jid)
    if not j:
        raise HTTPException(404, "Pekerjaan tidak ditemukan")
    return {"status": j["status"], "message": j.get("message", "")}

@app.get("/result/{jid}")
def result(jid: str):
    j = JOBS.get(jid)
    if not j or j["status"] != "done":
        raise HTTPException(404, "Belum selesai")
    return j["result"]
