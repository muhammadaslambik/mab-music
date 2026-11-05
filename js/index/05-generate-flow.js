/* ---------- Fungsi utama: kirim pesanan -> tanya status -> ambil mp3 ---------- */
async function generate() {
  showError("");
  const base = getApiUrl();
  const prompt = $("prompt").value.trim();
  const lyrics = $("lyrics").value.trim();
  const instrumental = $("instrumental").checked;
  const duration = parseInt($("duration").value, 10);
  const language = $("lang").value;

  if (!base) return showError("Isi dulu URL API Backend di pojok atas (salin dari Google Colab).");
  if (prompt.length < 3) return showError("Gaya musik terlalu pendek. Tulis minimal beberapa kata.");
  if (!instrumental && lyrics.length < 10) return showError("Tulis lirik dulu, atau centang 'Tanpa vokal (instrumental)'.");

  setLoading(true);
  try {
    // 1) Kirim pesanan lagu, dapat nomor pekerjaan (job_id)
    const res = await fetch(base + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...COMMON_HEADERS },
      body: JSON.stringify({ prompt, lyrics, duration, vocal_language: language, instrumental })
    });
    if (!res.ok) throw new Error(await readError(res));
    const { job_id } = await res.json();

    // 2) Tanya status setiap 4 detik sampai selesai (maksimal 90 menit)
    const mulai = Date.now();
    let gagalBerturut = 0;                   // toleransi gangguan jaringan sesaat
    let done = false;
    while (!done) {
      if (Date.now() - mulai > 90 * 60 * 1000) throw new Error("Terlalu lama menunggu (lebih dari 90 menit).");
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const st = await fetch(base + "/status/" + job_id, { headers: COMMON_HEADERS });
        if (!st.ok) throw new Error(await readError(st));
        const info = await st.json();
        gagalBerturut = 0;
        if (info.status === "queued") jobInfo = "Antre, urutan ke-" + info.queue_position + "…";
        else if (info.status === "running") jobInfo = "AI sedang membuat lagu…";
        else if (info.status === "error") { const err = new Error(info.message || "Backend melaporkan error."); err.fatal = true; throw err; }
        else if (info.status === "done") done = true;
      } catch (e) {
        if (e.fatal) throw e;                // error dari backend: berhenti
        gagalBerturut++;                     // gangguan jaringan: coba lagi, maksimal 6 kali berturut-turut
        jobInfo = "Koneksi terputus sesaat, mencoba lagi…";
        if (gagalBerturut >= 6) throw new Error("Koneksi ke backend terputus. Cek apakah Colab masih menyala.");
      }
    }

    // 3) Ambil file mp3 dan tampilkan di pemutar
    jobInfo = "Mengunduh lagu…";
    const audioRes = await fetch(base + "/result/" + job_id, { headers: COMMON_HEADERS });
    if (!audioRes.ok) throw new Error(await readError(audioRes));
    const url = URL.createObjectURL(await audioRes.blob());

    $("audio").src = url;
    $("download").href = url;
    $("playerTitle").textContent = prompt + " · " + formatDur(duration);
    $("player").classList.remove("hidden");
    $("emptyNote").classList.add("hidden");
    $("audio").play().catch(() => {});       // beberapa browser memblokir autoplay; tidak masalah

    // Catat ke daftar "Hasil saya"
    songs.unshift({ prompt, duration, url, time: new Date().toLocaleTimeString("id-ID") });
    renderLibrary();

    setConn("ok", "Terhubung");
    $("status").textContent = "Selesai! Lagu siap diputar.";
  } catch (e) {
    showError("Gagal membuat lagu: " + e.message + ". Pastikan Colab masih menyala dan URL benar.");
    $("status").textContent = "";
  } finally {
    jobInfo = "";
    setLoading(false);
  }
}

