/* ---------- Indikator koneksi ---------- */
function setConn(state, text) {
  const colors = { idle: "bg-mist", ok: "bg-emerald-400", bad: "bg-red-400", wait: "bg-amber-300" };
  $("dot").className = "w-2.5 h-2.5 rounded-full " + colors[state];
  $("dotText").textContent = text;
}

async function testConnection() {
  const base = getApiUrl();
  if (!base) { setConn("bad", "URL kosong"); return false; }
  setConn("wait", "Mengecek…");
  try {
    const res = await fetch(base + "/", { headers: COMMON_HEADERS });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.app !== "MAB-Music") throw new Error("Bukan server MAB-Music");
    saveUrl(base);
    setConn("ok", "Terhubung (" + data.device + ")");
    return true;
  } catch (e) {
    setConn("bad", "Gagal terhubung");
    return false;
  }
}

