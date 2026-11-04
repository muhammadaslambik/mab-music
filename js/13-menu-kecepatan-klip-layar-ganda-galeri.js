/* ---- Menu, kecepatan klip, layar ganda, galeri ---- */
const mn=o=>{ $('dr').classList.toggle('-translate-x-full',!o); $('ov').classList.toggle('hidden',!o); };
$('bMenu').onclick=()=>mn(true); $('ov').onclick=()=>mn(false);
function setSp(c,v){ c.sp=v; $('sv').textContent=v.toFixed(2); renderTL(); seek(T); }
cv.addEventListener('pointermove',e=>{
  const p=cpt(e); hov={x:p.x,y:p.y};
  if(tdrag&&tdrag.hit){ const c=tdrag.hit; tdrag.moved=true; c.px=Math.min(100,Math.max(0,(p.x-tdrag.ox)/1280*100)); c.py=Math.min(100,Math.max(0,(p.y-tdrag.oy)/720*100)); if($('tx')){ $('tx').value=c.px; $('ty').value=c.py; } draw(); tOvShow(); }
});
