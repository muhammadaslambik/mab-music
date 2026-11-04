/* ---- Pintasan keyboard ---- */
addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  if(e.code=='Space'){ e.preventDefault(); tap>=0?doTap():(playing?pause():play()); }
  if(e.key=='s'||e.key=='S') split();
  if(e.key=='Delete') del();
});

