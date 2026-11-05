/* =============================================================================
   MAB-Music Frontend – Vanilla JavaScript
   Alur: kirim pesanan lagu ke /generate -> dapat job_id -> tanya /status/{job_id}
   setiap beberapa detik -> kalau selesai, ambil file mp3 dari /result/{job_id}
   -> tampilkan di pemutar.
   ============================================================================= */

// Jalan pintas untuk mengambil elemen HTML berdasarkan id
const $ = (id) => document.getElementById(id);

const KEY_API = "mabmusic_api_url";          // nama tempat menyimpan URL di browser
const songs = [];                            // daftar lagu selama halaman terbuka

const EXAMPLES = [
  "warm pop ballad, soft female vocal, piano and strings, emotional",
  "upbeat indie pop, male vocal, bright guitars, summer road trip",
  "lo-fi hip hop beat, mellow vocal, soft piano, rainy night",
  "epic cinematic rock, powerful vocal, big drums, anthemic chorus",
  "acoustic folk, gentle female vocal, warm guitar, sunset mood"
];

