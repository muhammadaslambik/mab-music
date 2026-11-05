/* ---- Memutar ---- */
function sync(){
  clips.forEach(c=>{
    if(c.type=='i'||c.type=='t') return;
    const sp=c.sp||1, L=len(c), lt=T-c.at, act=lt>=0&&lt<L, want=c.s+lt*sp;
    if(act){
      if(c.el.playbackRate!=sp) c.el.playbackRate=sp;
      if(c.el.paused){ c.el.currentTime=want; c.el.play().catch(()=>{}); }
      else if(Math.abs(c.el.currentTime-want)>.1) c.el.currentTime=want;      // koreksi jika melenceng > 100 ms
      let k=c.vol; if(c.fi>0) k*=Math.min(1,lt/c.fi); if(c.fo>0) k*=Math.min(1,(L-lt)/c.fo);
      c.g.gain.value=Math.max(0,k);
    } else if(!c.el.paused) c.el.pause();
  });
}
function loop(){
  if(!playing) return;
  T=T0+(performance.now()-t0)/1000;
  if(T>=total()){ T=total(); pause(); movePH(); draw(); return; }
  sync(); tilesUpdate(); draw(); movePH(); requestAnimationFrame(loop);
}
function play(){
  if(!total()) return say('Tambahkan file dulu.');
  if(T>=total()-.05) T=0;
  ac.resume(); playing=true; T0=T; t0=performance.now(); $('bPlay').textContent='❚❚ Jeda'; requestAnimationFrame(loop);
}
function pause(){
  playing=false; clips.forEach(c=>c.el&&c.el.pause&&c.el.pause()); $('bPlay').textContent='▶ Putar';
  if(rec&&rec.state!='inactive') rec.stop();
  tilesUpdate(true);
  tap=-1; $('bTap').textContent='⏱ Mulai ketuk';
}
function seek(t){
  T=Math.max(0,t);
  if(playing){ T0=T; t0=performance.now(); }
  else clips.forEach(c=>{ if(c.type=='v'&&T>=c.at&&T<c.at+len(c)) c.el.currentTime=c.s+(T-c.at)*(c.sp||1); });
  movePH(); draw(); setTimeout(draw,150); tilesUpdate(true);
}
$('bPlay').onclick=()=>playing?pause():play();
$('bRew').onclick=()=>seek(0);

