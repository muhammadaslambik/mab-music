/* ---------- Tombol Generate: aktif / loading ---------- */
let timer = null;
let jobInfo = "";                            // pesan status yang diisi saat menunggu lagu selesai

function setLoading(on) {
  const btn = $("genBtn");
  btn.disabled = on;
  $("genIcon").style.display = on ? "inline-flex" : "none";
  $("genText").textContent = on ? "Sedang membuat lagu…" : "Generate Music";
  clearInterval(timer);
  if (on) {
    const t0 = Date.now();
    timer = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      $("status").textContent = (jobInfo || "Mengirim pesanan…") + " " + formatDur(s) + " berlalu.";
    }, 500);
  }
}

