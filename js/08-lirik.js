/* ---- Lirik ---- */
function syncLines(){ const nl=$('ly').value.split('\n').map(s=>s.trim()).filter(Boolean); times=nl.map((_,i)=>times[i]??null); lines=nl; drawLines(); }
function drawLines(){
  $('lt').innerHTML=lines.map((l,i)=>'<div class="flex items-center gap-2 text-sm py-1"><input type="number" step="0.1" min="0" value="'+(times[i]??'')+'" data-i="'+i+'" class="w-20" placeholder="dtk"><span class="truncate">'+esc(l)+'</span></div>').join('');
}
$('ly').oninput=syncLines;
$('lt').onchange=e=>{ const i=e.target.dataset.i; if(i!=null) times[i]=e.target.value===''?null:+e.target.value; };
$('bSplit').onclick=()=>{ const L=total()||1; times=lines.map((_,i)=>+(i*L/lines.length).toFixed(1)); drawLines(); };
function doTap(){
  times[tap]=+T.toFixed(1); tap++; drawLines();
  if(tap>=lines.length){ tap=-1; $('bTap').textContent='⏱ Mulai ketuk'; say('Semua baris sudah ditandai.'); } else say('Berikutnya: '+lines[tap]);
}
$('bTap').onclick=()=>{
  if(!lines.length) return say('Tulis lirik dulu.');
  if(tap<0){ times=lines.map(()=>null); tap=0; drawLines(); seek(0); play(); $('bTap').textContent='Ketuk! (atau Spasi)'; say('Ketuk saat baris pertama dinyanyikan: '+lines[0]); }
  else doTap();
};

