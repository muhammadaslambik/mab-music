# Sel 2b (tambalan): tempel di sel baru, jalankan SEKALI. Berlaku langsung tanpa restart.
import wave
import numpy as np
def to_audio(path, d):
    """Decode any audio/video to mono 16 kHz float32 with ffmpeg (avoids PyAV version problems)."""
    out = os.path.join(d, "16k.wav")
    r = subprocess.run(["ffmpeg", "-y", "-i", path, "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", out],
                       capture_output=True, text=True, timeout=600)
    if r.returncode or not os.path.exists(out):
        raise RuntimeError("Gagal membaca audio: " + r.stderr[-150:])
    with wave.open(out, "rb") as w:
        raw = w.readframes(w.getnframes())
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

def run(job):
    j = JOBS[job["id"]]
    try:
        path = job["path"]
        if job["url"]:
            j["message"] = "Mengunduh audio dari URL…"; path = download(job["url"], job["dir"])
        if job["separate"]:
            j["message"] = "Memisahkan vokal… (pertama kali memasang demucs, ±2 menit)"; path = separate(path, job["dir"]) or path
        j["message"] = "Mentranskripsi dengan model " + job["model"] + "…"
        audio = to_audio(path, job["dir"])
        segs, info = load_model(job["model"]).transcribe(
            audio, language=job["lang"] or None, beam_size=5, word_timestamps=True, condition_on_previous_text=False,
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
