/* ---------- Simpan / baca URL backend (aman kalau browser memblokir storage) ---------- */
function loadSavedUrl() {
  try { return localStorage.getItem(KEY_API) || ""; } catch (e) { return ""; }
}
function saveUrl(url) {
  try { localStorage.setItem(KEY_API, url); } catch (e) { /* abaikan */ }
}

/* Rapikan URL: buang spasi, tambahkan https:// jika lupa, buang garis miring di akhir */
function getApiUrl() {
  let url = $("apiUrl").value.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

/* Header ini melewati halaman peringatan gratis milik ngrok. Tanpa ini, permintaan bisa gagal. */
const COMMON_HEADERS = { "ngrok-skip-browser-warning": "true" };

/* Ubah detik menjadi tampilan menit:detik, misalnya 90 -> 1:30 */
function formatDur(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

