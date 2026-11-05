/* ---- Timeline ---- */
function renderTL(){
  const nv=lanes('v'), na=lanes('a'), H=RH+(nv+na)*LH, sc=$('sc');
  const W=Math.max((total()*1.1+20)*Z, sc.clientWidth), steps=[1,2,5,10,15,30,60,120,300,600,900,1800,3600,7200], st=steps.find(s=>s*Z>=80)||7200;
  let h='', lab='<div style="height:'+RH+'px"></div>';
  for(let s=0;s*Z<W;s+=st) h+='<div class="absolute text-[10px] text-mist border-l border-edge pl-1" style="left:'+s*Z+'px;top:0;height:'+H+'px">'+fmt(s)+'</div>';
  for(let r=0;r<nv+na;r++){
    const isV=r<nv, n=isV?nv-r:r-nv+1;
    h+='<div class="absolute left-0 right-0 border-t border-edge" style="top:'+(RH+r*LH)+'px;height:'+LH+'px;'+(isV?'':'background:rgba(16,185,129,.04)')+'"></div>';
    lab+='<div style="height:'+LH+'px;line-height:'+LH+'px;color:'+(isV?'#a78bfa':'#34d399')+'">'+(isV?'Video ':'Audio ')+n+'</div>';
  }
  clips.forEach(c=>{
    const row=kind(c)=='v'?nv-1-c.track:nv+c.track, col=c.type=='a'?'linear-gradient(#34d399,#10b981)':c.type=='t'?'linear-gradient(#fcd34d,#f59e0b)':c.type=='i'?'linear-gradient(#7dd3fc,#38bdf8)':'linear-gradient(#c4b5fd,#a78bfa)';
    h+='<div class="clip" data-id="'+c.id+'" style="left:'+c.at*Z+'px;width:'+Math.max(6,len(c)*Z)+'px;top:'+(RH+row*LH+3)+'px;height:'+(LH-6)+'px;line-height:'+(LH-6)+'px;background:'+col+(c===sel?';outline:2px solid #ff7a59':'')+'"><i class="h" data-h="l" style="left:0"></i><span class="px-2 block truncate">'+esc(c.name)+'</span><i class="h" data-h="r" style="right:0"></i></div>';
  });
  if(RNG) h+='<div class="absolute pointer-events-none" style="left:'+RNG[0]*Z+'px;width:'+(RNG[1]-RNG[0])*Z+'px;top:0;height:'+H+'px;background:rgba(255,122,89,.18);border-inline:1px solid #ff7a59"></div>';
  h+='<div id="ph" class="absolute w-0.5 bg-ember pointer-events-none" style="top:0;height:'+H+'px"></div>';
  $('lab').innerHTML=lab; $('inn').style.width=W+'px'; $('inn').style.height=H+'px'; $('inn').innerHTML=h; movePH();
}
function movePH(){
  const p=$('ph'); if(p) p.style.left=T*Z+'px'; $('t1').textContent=fmtMs(T); $('t2').textContent=fmtMs(total()); const k=$('sk'); if(document.activeElement!==k) k.value=total()?T/total()*1000:0;
  if((sel&&sel.type=='t')||!$('tOv').classList.contains('hidden')) tOvShow();
  const sc=$('sc'); if(playing&&T*Z>sc.scrollLeft+sc.clientWidth-30) sc.scrollLeft=T*Z-60;
}
let RNG=null, rg=null, pendAt=null;
function showRg(){ $('rgBox').classList.toggle('hidden',!RNG); $('rgBox').classList.toggle('flex',!!RNG); if(RNG) say('Bagian disorot: '+fmtMs(RNG[0])+' → '+fmtMs(RNG[1])+'. Pilih klip, lalu "Jadikan klip sendiri" untuk mengatur volume/efek/sinkron bagian ini saja.'); }
$('inn').onpointerdown=e=>{
  const d=e.target.closest('.clip'), r=$('inn').getBoundingClientRect(), x=(e.clientX-r.left)/Z, y=e.clientY-r.top;
  if(!d){
    if(y<RH){ rg={a:x,b:x}; return; }                         // penggaris: klik = pindah posisi, seret = sorot bagian
    pendAt=x; seek(x); (Math.floor((y-RH)/LH)<lanes('v')?$('fV'):$('fA')).click(); return;   // lajur kosong = tambah file di titik ini
  }
  const c=clips.find(x=>x.id==d.dataset.id); sel=c;
  drag={c,h:e.target.dataset.h,x:e.clientX,y:e.clientY,tr:c.track,at:c.at,s:c.s,e:c.e}; props(); renderTL();
};
addEventListener('pointermove',e=>{
  if(rg){ rg.b=(e.clientX-$('inn').getBoundingClientRect().left)/Z; if(Math.abs(rg.b-rg.a)*Z>6){ RNG=[Math.max(0,Math.min(rg.a,rg.b)),Math.max(rg.a,rg.b)]; renderTL(); showRg(); } return; }
  if(!drag) return; const c=drag.c, dx=(e.clientX-drag.x)/Z;
  if(drag.h=='l'){ const sp=c.sp||1, ns=Math.min(Math.max(0,drag.s+dx*sp),drag.e-.05); c.at=Math.max(0,drag.at+(ns-drag.s)/sp); c.s=ns; }
  else if(drag.h=='r') c.e=Math.min(Math.max(drag.e+dx*(c.sp||1),c.s+.05),c.max);
  else {
    c.at=Math.max(0,drag.at+dx);
    // pindah trek: perlu geseran ±80% tinggi trek, dan maksimal 2 trek dari posisi awal (tidak agresif)
    const k=Math.max(-2,Math.min(2,Math.trunc(((c.type=='a'?1:-1)*(e.clientY-drag.y))/(LH*.8))));
    c.track=Math.max(0,Math.min(drag.tr+k,Math.min(MAXT-1,lanes(kind(c)))));
  }
  renderTL();
});
addEventListener('pointerup',()=>{ if(rg){ if(Math.abs(rg.b-rg.a)*Z<=6){ RNG=null; showRg(); seek(rg.a); renderTL(); } rg=null; return; }
  if(drag){ drag=null; compact(); renderTL(); props(); seek(T); } });

/* Zoom: skala logaritmik, dari ±0,05 px/dtk (puluhan jam) sampai 400 px/dtk (detail) */
function setZoom(v){
  const sc=$('sc'), mid=(sc.scrollLeft+sc.clientWidth/2)/Z;
  Z=0.05*Math.pow(8000,v/100); renderTL(); sc.scrollLeft=mid*Z-sc.clientWidth/2;
}
$('zm').oninput=e=>setZoom(+e.target.value);
$('bFit').onclick=()=>{ const f=Math.max(.05,Math.min(400,($('sc').clientWidth-40)/Math.max(total()*1.1,10))); $('zm').value=100*Math.log(f/.05)/Math.log(8000); setZoom(+$('zm').value); $('sc').scrollLeft=0; };
$('sc').addEventListener('wheel',e=>{ if(!e.ctrlKey) return; e.preventDefault(); $('zm').value=Math.min(100,Math.max(0,+$('zm').value-Math.sign(e.deltaY)*4)); setZoom(+$('zm').value); },{passive:false});

