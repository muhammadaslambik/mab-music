/* ---------- Navigasi sidebar ---------- */
function showView(name) {
  ["create", "library", "convert", "files", "help"].forEach((v) => {
    $("view-" + v).classList.toggle("hidden-view", v !== name);
  });
  document.querySelectorAll(".nav-btn").forEach((b) => {
    const active = b.dataset.nav === name;
    b.classList.toggle("bg-edge", active);
    b.classList.toggle("text-white", active);
    b.classList.toggle("text-mist", !active);
  });
  closeMenu();
}
function openMenu()  { $("sidebar").classList.remove("-translate-x-full"); $("overlay").classList.remove("hidden"); }
function closeMenu() { $("sidebar").classList.add("-translate-x-full");    $("overlay").classList.add("hidden"); }

