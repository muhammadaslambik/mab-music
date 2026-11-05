/* ---- Galeri semua klip: dipisah per jenis (Video, Gambar, Audio, Teks) ---- */
function galCard(c){
  const d=document.createElement('div'); d.className='shrink-0 w-44 rounded-xl border border-edge bg-ink p-2 cursor-pointer'+(c===sel?' ring-2 ring-ember':'');
  let th;
  if(c.type=='a'||c.type=='t'){
    th=document.createElement('div'); th.className='aspect-video rounded-lg bg-edge flex items-center justify-center text-center text-sm px-2 overflow-hidden';
    th.textContent=c.type=='t'?(c.txt||'T').slice(0,40):'🎵';
  } else {
    th=document.createElement(c.type=='i'?'img':'video'); th.className='w-full aspect-video object-cover rounded-lg bg-black';
    if(c.type=='v'){ th.muted=true; th.preload='metadata'; th.src=c.url+'#t='+c.s; th.onmouseenter=()=>{ th.currentTime=c.s; th.play().catch(()=>{}); }; th.onmouseleave=()=>th.pause(); }
    else th.src=c.url;
  }
  const cap=document.createElement('p'); cap.className='text-xs mt-1 truncate'; cap.textContent=c.name;
  const m=document.createElement('p'); m.className='text-[11px] text-mist'; m.textContent=fmt(c.at)+' • '+fmt(len(c))+((c.sp||1)!=1?' • '+c.sp+'×':'');
  d.append(th,cap,m); d.onclick=()=>{ sel=c; seek(c.at); renderTL(); props(); };
  return d;
}
function renderGal(){
  const box=$('galList'); box.innerHTML=''; box.className='space-y-3 mt-2';
  if(!clips.length){ box.innerHTML='<p class="text-sm text-mist">Belum ada klip.</p>'; return; }
  [['v','🎞 Video'],['i','🖼 Gambar'],['a','🎵 Audio'],['t','🔤 Teks']].forEach(([tp,judul])=>{
    const L=clips.filter(c=>c.type==tp).sort((a,b)=>a.at-b.at); if(!L.length) return;
    const h=document.createElement('p'); h.className='text-sm font-semibold'; h.textContent=judul+' ('+L.length+')';
    const row=document.createElement('div'); row.className='flex gap-3 overflow-x-auto pb-2 mt-1';
    L.forEach(c=>row.appendChild(galCard(c)));
    const w=document.createElement('div'); w.append(h,row); box.appendChild(w);
  });
}
