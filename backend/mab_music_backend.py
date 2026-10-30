#@@CELL
# ==============================================================================
#  MAB-Music Backend  |  CELL 1 dari 3  |  INSTALL LIBRARY
#  Jalankan sekali di awal. Butuh sekitar 2-5 menit.
#  Sebelum mulai: Menu Runtime > Change runtime type > pilih T4 GPU > Save
# ==============================================================================
import subprocess, sys

def pip_install(*args):
    """Menjalankan 'pip install' dan menampilkan pesan singkat kalau gagal."""
    hasil = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q", *args],
        capture_output=True, text=True,
    )
    if hasil.returncode != 0:
        print("⚠️  Gagal install:", " ".join(args)[:80])
        print(hasil.stderr[-500:])
    return hasil.returncode == 0

# 1) Library utama (server web, tunnel, pengolah audio, model dari Hugging Face)
pip_install("fastapi", "uvicorn", "nest_asyncio", "pyngrok",
            "scipy", "transformers", "accelerate")

# 2) AudioCraft (library resmi Meta). Memakai --no-deps karena AudioCraft meminta
#    versi library lama yang sering bentrok dengan Colab terbaru, lalu kita pasang
#    pendukungnya satu per satu. Kalau bagian ini gagal, JANGAN PANIK:
#    CELL 2 otomatis memakai cadangan (model sama persis, via Hugging Face).
if pip_install("audiocraft", "--no-deps"):
    pip_install("einops", "flashy", "hydra-core", "hydra_colorlog", "julius",
                "num2words", "sentencepiece", "encodec", "torchmetrics",
                "librosa", "demucs", "av")

print("✅ Install selesai. Lanjut ke CELL 2.")


#@@CELL
# ==============================================================================
#  CELL 2 dari 3  |  MUAT MODEL AI + BUAT API (FastAPI)
#  Bagian ini mengunduh model facebook/musicgen-small (~2 GB, sekali saja).
# ==============================================================================
import io, base64, threading
import numpy as np
import torch
from scipy.io import wavfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_NAME = "facebook/musicgen-small"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
if DEVICE == "cpu":
    print("⚠️  GPU tidak aktif! Generate akan sangat lambat. "
          "Aktifkan: Runtime > Change runtime type > T4 GPU.")

# ---------------------------- MEMUAT MODEL ------------------------------------
ENGINE = None          # akan berisi "audiocraft" atau "transformers"
model = None
processor = None
SAMPLE_RATE = 32000    # MusicGen memakai 32 kHz

try:
    # Jalur utama: AudioCraft (library resmi Meta)
    from audiocraft.models import MusicGen
    model = MusicGen.get_pretrained(MODEL_NAME, device=DEVICE)
    SAMPLE_RATE = model.sample_rate
    ENGINE = "audiocraft"
except Exception as err:
    # Jalur cadangan: model SAMA, dijalankan lewat library Hugging Face
    print(f"ℹ️  AudioCraft tidak bisa dipakai ({type(err).__name__}). "
          "Memakai jalur cadangan Hugging Face (hasil musik sama).")
    from transformers import AutoProcessor, MusicgenForConditionalGeneration
    processor = AutoProcessor.from_pretrained(MODEL_NAME)
    model = MusicgenForConditionalGeneration.from_pretrained(MODEL_NAME).to(DEVICE)
    SAMPLE_RATE = model.config.audio_encoder.sampling_rate
    ENGINE = "transformers"

print(f"✅ Model siap | engine: {ENGINE} | device: {DEVICE} | sample rate: {SAMPLE_RATE}")

# GPU gratis hanya kuat mengerjakan satu lagu sekali waktu -> pakai antrean (lock)
GPU_LOCK = threading.Lock()


def generate_wav_bytes(prompt: str, duration: int) -> bytes:
    """Membuat musik dari teks, mengembalikan isi file .wav dalam bentuk bytes."""
    with GPU_LOCK:
        if ENGINE == "audiocraft":
            model.set_generation_params(duration=duration)
            hasil = model.generate([prompt])                 # bentuk: [1, kanal, sampel]
            audio = hasil[0].detach().cpu().float().numpy()
        else:
            inputs = processor(text=[prompt], padding=True, return_tensors="pt").to(DEVICE)
            with torch.inference_mode():
                # MusicGen menghasilkan 50 "token" per detik audio
                hasil = model.generate(**inputs, do_sample=True, guidance_scale=3.0,
                                       max_new_tokens=int(duration * 50))
            audio = hasil[0].detach().cpu().float().numpy()

        if DEVICE == "cuda":
            torch.cuda.empty_cache()                         # bebaskan memori GPU

    if audio.ndim == 2:                                      # [kanal, sampel] -> mono
        audio = audio[0]

    # Ubah angka desimal (-1..1) menjadi 16-bit lalu bungkus jadi file WAV di memori
    audio = np.clip(audio, -1.0, 1.0)
    pcm16 = (audio * 32767).astype(np.int16)
    buffer = io.BytesIO()
    wavfile.write(buffer, SAMPLE_RATE, pcm16)
    return buffer.getvalue()


# ----------------------------- API (FASTAPI) ----------------------------------
app = FastAPI(title="MAB-Music API", version="1.0")

# CORS: izinkan website Frontend (domain berbeda) memanggil API ini.
# Kalau nanti sudah punya domain sendiri, ganti ["*"] dengan ["https://domainmu.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500)   # deskripsi musik
    duration: int = Field(10, ge=5, le=30)                   # detik (dibatasi 5-30)


@app.get("/")
def cek_status():
    """Dipakai tombol 'Tes koneksi' di Frontend."""
    return {"status": "ok", "app": "MAB-Music", "engine": ENGINE,
            "model": MODEL_NAME, "device": DEVICE}


@app.post("/generate")
def generate(req: GenerateRequest):
    """Terima {prompt, duration}, kembalikan audio WAV dalam bentuk base64."""
    try:
        wav_bytes = generate_wav_bytes(req.prompt.strip(), req.duration)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Gagal membuat musik: {err}")

    return {
        "audio_base64": base64.b64encode(wav_bytes).decode("utf-8"),
        "mime": "audio/wav",
        "duration": req.duration,
        "sample_rate": SAMPLE_RATE,
        "engine": ENGINE,
    }


print("✅ API siap. Lanjut ke CELL 3.")


#@@CELL
# ==============================================================================
#  CELL 3 dari 3  |  NYALAKAN SERVER + BUKA KE PUBLIK (ngrok)
#  1. Daftar gratis (tanpa kartu kredit) di https://dashboard.ngrok.com/signup
#  2. Ambil token di https://dashboard.ngrok.com/get-started/your-authtoken
#  3. Tempel token di bawah (di antara tanda kutip), lalu jalankan cell ini.
# ==============================================================================
NGROK_AUTHTOKEN = "PASTE_TOKEN_NGROK_KAMU_DI_SINI"

import time, threading
import nest_asyncio, uvicorn
from pyngrok import ngrok

if NGROK_AUTHTOKEN.startswith("PASTE"):
    raise ValueError("Isi dulu NGROK_AUTHTOKEN di atas dengan token dari dashboard ngrok.")

nest_asyncio.apply()                      # agar server bisa jalan di dalam Colab
ngrok.set_auth_token(NGROK_AUTHTOKEN)
ngrok.kill()                              # tutup tunnel lama kalau cell dijalankan ulang

# Jalankan server di "thread" terpisah supaya Colab tidak terkunci
PORT = 8000
server = uvicorn.Server(uvicorn.Config(app, host="0.0.0.0", port=PORT, log_level="warning"))
threading.Thread(target=server.run, daemon=True).start()
time.sleep(3)

# Buat alamat HTTPS publik yang mengarah ke server di atas
tunnel = ngrok.connect(PORT, "http")
public_url = tunnel.public_url

print("=" * 60)
print("🎵 MAB-Music Backend AKTIF")
print("👉 SALIN URL INI lalu tempel di kolom 'URL API Backend' pada website:")
print()
print("   ", public_url)
print()
print("   (URL berubah setiap Colab dinyalakan ulang. Biarkan tab Colab tetap terbuka.)")
print("=" * 60)

#  ALTERNATIF tanpa akun ngrok: localtunnel (butuh Node.js, tersedia di Colab)
#    !npm install -g localtunnel
#    !lt --port 8000
#  Catatan: localtunnel kadang meminta "password" (IP publik Colab) di halaman
#  peringatan; ngrok umumnya lebih stabil.
