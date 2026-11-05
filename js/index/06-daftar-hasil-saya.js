/* ---------- Daftar "Hasil saya" ---------- */
function renderLibrary() {
  $("libCount").textContent = "(" + songs.length + ")";
  $("libEmpty").classList.toggle("hidden", songs.length > 0);
  const list = $("libList");
  list.innerHTML = "";
  songs.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "bg-panel border border-edge rounded-2xl p-4";

    const title = document.createElement("p");
    title.className = "text-sm mb-2";
    title.textContent = item.prompt;            // textContent = aman dari kode berbahaya

    const meta = document.createElement("p");
    meta.className = "text-xs text-mist mb-2";
    meta.textContent = formatDur(item.duration) + " menit · dibuat " + item.time;

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = item.url;

    const dl = document.createElement("a");
    dl.href = item.url;
    dl.download = "mab-music-" + (songs.length - i) + ".mp3";
    dl.textContent = "Unduh .mp3";
    dl.className = "inline-block mt-2 text-sm text-lilac underline underline-offset-4";

    card.append(title, meta, audio, dl);
    list.appendChild(card);
  });
}

