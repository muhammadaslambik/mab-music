/* ---------- Pasang semua tombol saat halaman siap ---------- */
window.addEventListener("DOMContentLoaded", () => {
  $("apiUrl").value = loadSavedUrl();

  // Chip contoh gaya musik
  EXAMPLES.forEach((text) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = text.split(",")[0];
    chip.title = text;
    chip.className = "text-xs px-3 py-1.5 rounded-full border border-edge text-mist hover:text-white hover:border-lilac transition-colors";
    chip.onclick = () => { $("prompt").value = text; $("prompt").focus(); };
    $("chips").appendChild(chip);
  });

  $("duration").addEventListener("input", (e) => { $("durVal").textContent = formatDur(parseInt(e.target.value, 10)); });
  $("instrumental").addEventListener("change", (e) => { $("lyrics").disabled = e.target.checked; });
  $("genBtn").addEventListener("click", generate);
  $("testBtn").addEventListener("click", testConnection);
  $("apiUrl").addEventListener("change", () => { setConn("idle", "Belum dites"); });
  $("menuBtn").addEventListener("click", openMenu);
  $("overlay").addEventListener("click", closeMenu);
  document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => showView(b.dataset.nav)));

  const route=()=>{ const hv=(location.hash||"").slice(1); showView(["create","library","convert","files","help"].includes(hv)?hv:"create"); };
  addEventListener("hashchange",route); route();
  renderLibrary(); MAB.mount($("cvMount"));
});
