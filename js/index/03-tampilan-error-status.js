/* ---------- Tampilan error / status ---------- */
function showError(msg) {
  const box = $("error");
  box.textContent = msg;
  box.classList.toggle("hidden", !msg);
}

/* Membaca pesan error dari backend (kalau ada) */
async function readError(res) {
  try { const d = await res.json(); return d.detail || ("HTTP " + res.status); }
  catch (e) { return "HTTP " + res.status; }
}

