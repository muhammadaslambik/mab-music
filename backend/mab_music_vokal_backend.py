#@@CELL
# ==============================================================================
#  MAB-Music VOKAL (ACE-Step 1.5)  |  CELL 1 dari 3  |  INSTALL + UNDUH MODEL
#  Sebelum mulai: Runtime > Change runtime type > T4 GPU > Save
#  Cell ini lama (perkiraan 5-15 menit) karena mengunduh kode dan model AI.
#  Kalau muncul tulisan "Perintah gagal", salin pesannya dan kirim ke Claude.
# ==============================================================================
import subprocess, sys, os

REPO = "/content/ACE-Step-1.5"            # tempat kode ACE-Step disimpan di Colab


def run(cmd, cwd=None):
    """Menjalankan perintah, dan menampilkan pesan singkat kalau gagal."""
    hasil = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if hasil.returncode != 0:
        print("⚠️  Perintah gagal:", cmd[:90])
        print((hasil.stderr or hasil.stdout)[-700:])
    return hasil.returncode == 0


# 1) Unduh kode ACE-Step dari GitHub
if not os.path.isdir(REPO):
    run(f"git clone --depth 1 https://github.com/ACE-Step/ACE-Step-1.5.git {REPO}")

# 2) Pasang library: yang kita butuhkan untuk API + yang diminta ACE-Step
run(f"{sys.executable} -m pip install -q fastapi uvicorn nest_asyncio pyngrok huggingface_hub")
if os.path.exists(f"{REPO}/requirements.txt"):
    run(f"{sys.executable} -m pip install -q -r requirements.txt", cwd=REPO)
else:
    print("ℹ️  requirements.txt tidak ditemukan di folder ACE-Step (mungkin struktur repo berubah).")

# 3) Unduh model (versi 'turbo' = cepat). Kita tidak memuat model bahasa (LM)
#    agar hemat memori GPU, jadi lagu panjang lebih mungkin muat di T4.
try:
    from huggingface_hub import snapshot_download
    CKPT = f"{REPO}/checkpoints"
    snapshot_download(
        repo_id="ACE-Step/Ace-Step1.5",
        local_dir=CKPT,
        allow_patterns=["acestep-v15-turbo/*", "vae/*", "Qwen3-Embedding-0.6B/*"],
    )
    print("📦 Isi folder model:", sorted(os.listdir(CKPT)))
except Exception as err:
    print("⚠️  Gagal mengunduh model:", err)

print("✅ Cell 1 selesai. Lanjut ke CELL 2.")


#@@CELL
# ==============================================================================
#  CELL 2 dari 3  |  MUAT MODEL + BUAT API (FastAPI)
#  Alur API (dibuat "pesan lalu cek status" karena lagu panjang butuh waktu lama):
#    POST /generate        -> kirim pesanan, dapat job_id
#    GET  /status/{job_id} -> cek: queued / running / done / error
#    GET  /result/{job_id} -> ambil file .mp3 kalau sudah selesai
# ==============================================================================
import os, sys, time, queue, threading, subprocess

sys.path.insert(0, REPO)                  # supaya "import acestep" bisa menemukan kodenya
os.chdir(REPO)

import torch
if not torch.cuda.is_available():
    raise RuntimeError("GPU tidak aktif. Runtime > Change runtime type > T4 GPU, lalu mulai dari Cell 1.")

from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music

# ------------------------------ MEMUAT MODEL ----------------------------------
dit_handler = AceStepHandler()            # "mesin musik" utama
llm_handler = LLMHandler()                # model bahasa: sengaja TIDAK diaktifkan (hemat memori)

try:
    # offload_to_cpu: memindahkan bagian model ke memori biasa saat tidak dipakai
    status = dit_handler.initialize_service(
        project_root=REPO, config_path="acestep-v15-turbo",
        device="cuda", offload_to_cpu=True)
except TypeError:
    # Kalau versi ACE-Step ini tidak mengenal 'offload_to_cpu', coba tanpa itu
    status = dit_handler.initialize_service(
        project_root=REPO, config_path="acestep-v15-turbo", device="cuda")
print("Status model:", status)

OUT_DIR = "/content/mab_output"           # tempat file lagu sementara disimpan
os.makedirs(OUT_DIR, exist_ok=True)
MAX_DURATION = 480                        # batas 8 menit (detik)


def make_song(req: dict) -> str:
    """Membuat satu lagu, mengembalikan lokasi file .mp3."""
    instrumental = req["instrumental"]
    lyrics = "[Instrumental]" if instrumental else req["lyrics"]

    params = GenerationParams(
        task_type="text2music",
        caption=req["prompt"],            # gaya musik & penyanyi
        lyrics=lyrics,                    # lirik (dengan penanda [Verse], [Chorus])
        instrumental=instrumental,
        vocal_language=req["vocal_language"],
        duration=float(req["duration"]),
        inference_steps=8,                # nilai yang disarankan untuk model turbo
        shift=3.0,
        thinking=False,                   # LM dimatikan
        use_cot_metas=False, use_cot_caption=False, use_cot_language=False,
    )
    config = GenerationConfig(batch_size=1, audio_format="mp3")

    hasil = generate_music(dit_handler, llm_handler, params, config, save_dir=OUT_DIR)
    if not hasil.success or not hasil.audios:
        raise RuntimeError(hasil.error or hasil.status_message or "Pembuatan lagu gagal.")

    path = hasil.audios[0]["path"]
    # Jaga-jaga: kalau file yang keluar bukan mp3, ubah dengan ffmpeg
    if not path.lower().endswith(".mp3"):
        mp3 = os.path.splitext(path)[0] + ".mp3"
        subprocess.run(["ffmpeg", "-y", "-i", path, "-b:a", "192k", mp3],
                       check=True, capture_output=True)
        path = mp3
    return path


# ------------------- ANTREAN PEKERJAAN (satu lagu sekali waktu) ----------------
JOBS = {}                                 # catatan semua pesanan: job_id -> info
QUEUE = queue.Queue()                     # antrean job_id yang menunggu giliran
_counter = {"n": 0}


def worker():
    """Pekerja di latar belakang: mengambil pesanan satu per satu dari antrean."""
    while True:
        job_id = QUEUE.get()
        job = JOBS[job_id]
        job["status"] = "running"
        job["started"] = time.time()
        try:
            job["path"] = make_song(job["req"])
            job["status"] = "done"
        except Exception as err:
            job["status"] = "error"
            job["message"] = str(err)[:400]
        finally:
            torch.cuda.empty_cache()      # bebaskan memori GPU untuk lagu berikutnya
            QUEUE.task_done()


if "WORKER_STARTED" not in globals():     # cegah pekerja ganda kalau cell dijalankan ulang
    threading.Thread(target=worker, daemon=True).start()
    WORKER_STARTED = True

# ----------------------------- API (FASTAPI) ----------------------------------
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app = FastAPI(title="MAB-Music Vokal API", version="2.0")

# CORS: izinkan website (domain berbeda) memanggil API ini
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=512)       # gaya musik & penyanyi
    lyrics: str = Field("", max_length=4096)                      # lirik lagu
    duration: int = Field(60, ge=10, le=MAX_DURATION)             # detik
    vocal_language: str = Field("en", max_length=10)              # en, id, ja, zh, ...
    instrumental: bool = False                                    # True = tanpa vokal


@app.get("/")
def cek_status():
    """Dipakai tombol 'Tes koneksi' di website."""
    return {"status": "ok", "app": "MAB-Music", "engine": "ace-step-1.5",
            "device": "cuda", "max_duration": MAX_DURATION}


@app.post("/generate")
def generate(req: GenerateRequest):
    """Terima pesanan lagu. Langsung membalas job_id; lagunya dikerjakan di belakang."""
    menunggu = sum(1 for j in JOBS.values() if j["status"] in ("queued", "running"))
    if menunggu >= 5:
        raise HTTPException(status_code=429, detail="Antrean penuh. Coba lagi beberapa menit lagi.")
    if not req.instrumental and len(req.lyrics.strip()) < 10:
        raise HTTPException(status_code=422, detail="Lirik terlalu pendek. Isi lirik atau pilih instrumental.")

    job_id = uuid.uuid4().hex[:12]
    _counter["n"] += 1
    JOBS[job_id] = {"status": "queued", "seq": _counter["n"], "req": req.model_dump(),
                    "created": time.time()}
    QUEUE.put(job_id)
    return {"job_id": job_id}


@app.get("/status/{job_id}")
def status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job_id tidak ditemukan (Colab mungkin sudah dinyalakan ulang).")
    posisi = 0
    if job["status"] == "queued":         # hitung berapa pesanan yang ada di depan
        posisi = 1 + sum(1 for j in JOBS.values()
                         if j["status"] == "running" or (j["status"] == "queued" and j["seq"] < job["seq"]))
    return {"status": job["status"], "message": job.get("message", ""), "queue_position": posisi}


@app.get("/result/{job_id}")
def result(job_id: str):
    job = JOBS.get(job_id)
    if not job or job["status"] != "done":
        raise HTTPException(status_code=404, detail="Lagu belum siap atau tidak ditemukan.")
    return FileResponse(job["path"], media_type="audio/mpeg", filename=f"mab-music-{job_id}.mp3")


print("✅ Model dan API siap. Lanjut ke CELL 3.")


#@@CELL
# ==============================================================================
#  CELL 3 dari 3  |  NYALAKAN SERVER + BUKA KE PUBLIK (ngrok)
#  Tempel token ngrok Anda di bawah (di antara tanda kutip), lalu jalankan.
#  Token: https://dashboard.ngrok.com/get-started/your-authtoken
# ==============================================================================
NGROK_AUTHTOKEN = "PASTE_TOKEN_NGROK_KAMU_DI_SINI"

import time, threading
import nest_asyncio, uvicorn
from pyngrok import ngrok

if NGROK_AUTHTOKEN.startswith("PASTE"):
    raise ValueError("Isi dulu NGROK_AUTHTOKEN di atas dengan token dari dashboard ngrok.")

nest_asyncio.apply()
ngrok.set_auth_token(NGROK_AUTHTOKEN)
ngrok.kill()                              # tutup tunnel lama kalau cell dijalankan ulang

PORT = 8000
server = uvicorn.Server(uvicorn.Config(app, host="0.0.0.0", port=PORT, log_level="warning"))
threading.Thread(target=server.run, daemon=True).start()
time.sleep(3)

public_url = ngrok.connect(PORT, "http").public_url

print("=" * 60)
print("🎤 MAB-Music VOKAL Backend AKTIF")
print("👉 SALIN URL INI lalu tempel di kolom 'URL API Backend' pada website:")
print()
print("   ", public_url)
print()
print("   (URL berubah tiap Colab dinyalakan ulang. Biarkan tab Colab terbuka.)")
print("=" * 60)
