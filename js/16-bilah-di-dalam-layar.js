/* ---- Bilah di dalam layar: geser posisi & lompat ke waktu ---- */
$('sk').oninput=e=>seek(+e.target.value/1000*total());
function jump(){
  const s=$('jt').value.trim(); if(!s) return; const q=s.split(':').map(Number);
  if(q.some(isNaN)) return say('Format waktu: menit:detik, contoh 2:30 atau 1:02:30.5');
  seek(q.reduce((a,x)=>a*60+x,0)); $('jt').value='';
}
$('jb').onclick=jump; $('jt').onkeydown=e=>{ if(e.key=='Enter') jump(); };

function renderGal(){
  const box=$('galList'); box.innerHTML='';
  if(!clips.length){ box.innerHTML='<p class="text-sm text-mist">Belum ada klip.</p>'; return; }
  [...clips].sort((a,b)=>a.at-b.at).forEach(c=>{
    const d=document.createElement('div'); d.className='shrink-0 w-44 rounded-xl border border-edge bg-ink p-2 cursor-pointer'+(c===sel?' ring-2 ring-ember':'');
    let th;
    if(c.type=='a'||c.type=='t'){ th=document.createElement('div'); th.className='aspect-video rounded-lg bg-edge flex items-center justify-center text-2xl'; th.textContent=c.type=='t'?'T':'🎵'; }
    else {
      th=document.createElement(c.type=='i'?'img':'video'); th.className='w-full aspect-video object-cover rounded-lg bg-black';
      if(c.type=='v'){ th.muted=true; th.preload='metadata'; th.src=c.url+'#t='+c.s; th.onmouseenter=()=>{ th.currentTime=c.s; th.play().catch(()=>{}); }; th.onmouseleave=()=>th.pause(); }
      else th.src=c.url;
    }
    const cap=document.createElement('p'); cap.className='text-xs mt-1 truncate'; cap.textContent=c.name;
    const m=document.createElement('p'); m.className='text-[11px] text-mist'; m.textContent=fmt(c.at)+' • '+fmt(len(c))+((c.sp||1)!=1?' • '+c.sp+'×':'');
    d.append(th,cap,m); d.onclick=()=>{ sel=c; seek(c.at); renderTL(); props(); };
    box.appendChild(d);
  });
}
$('gal').ontoggle=()=>{ if($('gal').open) renderGal(); };

setZoom(74); props(); draw();
