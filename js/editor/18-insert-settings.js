/* ---- Insert settings: per clip type, "auto" (at the red line) or "manual" (chosen start/length) ---- */
const INS={v:{m:'auto',at:0,d:0},i:{m:'auto',at:0,d:5},a:{m:'auto',at:0,d:0},t:{m:'auto',at:0,d:4}};
const TYPE_NAME={v:'Video',i:'Gambar',a:'Audio',t:'Teks'};
function insAt(t){ return INS[t].m=='manual'?INS[t].at:T; }                 // start position of a new clip
function insEnd(t,full){                                                    // end point inside the file (length of a new clip)
  const s=INS[t]; if(s.m!='manual'||!(s.d>0)) return full;
  return (t=='i'||t=='t')?s.d:Math.min(s.d,full);
}
function typeBadge(c){ return '<p class="text-[11px] uppercase tracking-wide text-ember mb-1">'+TYPE_NAME[c.type]+'</p>'; }
(function(){
  const card=document.createElement('details'); card.className='card';
  card.innerHTML='<summary class="cursor-pointer text-lg">Saat memasukkan file</summary>'+
    '<p class="text-xs text-mist mt-1">Otomatis: klip masuk di garis merah. Manual: klip masuk di waktu yang Anda isi. Lama 0 = seluruh file. Klik lajur kosong di timeline tetap mengutamakan titik yang diklik.</p><div id="insRows" class="space-y-3 mt-2"></div>';
  const rows=card.querySelector('#insRows');
  rows.innerHTML=['v','i','a','t'].map(t=>'<div data-t="'+t+'" class="text-xs"><div class="flex items-center gap-2"><b class="w-14">'+TYPE_NAME[t]+'</b>'+
    '<select data-k="m" class="flex-1"><option value="auto">Otomatis</option><option value="manual">Manual</option></select></div>'+
    '<div data-man class="hidden gap-2 mt-1"><label class="flex-1 text-mist">Mulai (dtk)<input data-k="at" type="number" min="0" step="0.001" value="0" class="w-full"></label>'+
    '<label class="flex-1 text-mist">Lama (dtk)<input data-k="d" type="number" min="0" step="0.1" value="'+INS[t].d+'" class="w-full"></label></div></div>').join('');
  rows.onchange=e=>{
    const r=e.target.closest('[data-t]'), k=e.target.dataset.k; if(!r||!k) return;
    const s=INS[r.dataset.t], man=r.querySelector('[data-man]');
    s[k]=k=='m'?e.target.value:Math.max(0,+e.target.value||0);
    man.classList.toggle('hidden',s.m!='manual'); man.classList.toggle('flex',s.m=='manual');
  };
  $('pr').closest('.card').before(card);
})();
