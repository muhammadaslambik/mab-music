/* ---- Timeline: four track families (Text, Image, Video, Audio), each with its own numbered lanes ---- */
const FN={t:'Teks',i:'Gambar',v:'Video',a:'Audio'}, FC={t:'#fbbf24',i:'#38bdf8',v:'#a78bfa',a:'#34d399'};
function rowsOf(){      // rows top to bottom: Text n..1, Image n..1, Video n..1, then Audio 1..n
  const r=[]; ['t','i','v'].forEach(f=>{ for(let n=lanes(f);n>=1;n--) r.push({f,n}); });
  for(let n=1;n<=lanes('a');n++) r.push({f:'a',n}); return r;
}
function freeLane(f,a,d){      // first lane of a family with no overlap in [a, a+d]
  for(let n=0;n<MAXT;n++) if(!clips.some(c=>c.type==f&&c.track==n&&c.at<a+d&&c.at+len(c)>a)) return n;
  return MAXT-1;
}
function renderTL(){
  const R=rowsOf(), H=RH+R.length*LH, sc=$('sc');
  const W=Math.max((total()*1.1+20)*Z, sc.clientWidth), steps=[1,2,5,10,15,30,60,120,300,600,900,1800,3600,7200], st=steps.find(s=>s*Z>=80)||7200;
  let h='', lab='<div style="height:'+RH+'px"></div>';
  for(let s=0;s*Z<W;s+=st) h+='<div class="absolute text-[10px] text-mist border-l border-edge pl-1" style="left:'+s*Z+'px;top:0;height:'+H+'px">'+fmt(s)+'</div>';
  R.forEach((r,i)=>{
    h+='<div class="absolute left-0 right-0 border-t border-edge" style="top:'+(RH+i*LH)+'px;height:'+LH+'px;'+(r.f=='a'?'background:rgba(16,185,129,.04)':'')+'"></div>';
    lab+='<div style="height:'+LH+'px;line-height:'+LH+'px;color:'+FC[r.f]+'">'+FN[r.f]+' '+r.n+'</div>';
  });
  clips.forEach(c=>{
    const row=R.findIndex(x=>x.f==c.type&&x.n==c.track+1), col=c.type=='a'?'linear-gradient(#34d399,#10b981)':c.type=='t'?'linear-gradient(#fcd34d,#f59e0b)':c.type=='i'?'linear-gradient(#7dd3fc,#38bdf8)':'linear-gradient(#c4b5fd,#a78bfa)';
    h+='<div class="clip" data-id="'+c.id+'" style="left:'+c.at*Z+'px;width:'+Math.max(6,len(c)*Z)+'px;top:'+(RH+row*LH+3)+'px;height:'+(LH-6)+'px;line-height:'+(LH-6)+'px;background:'+col+(c===sel?';outline:2px solid #ff7a59':'')+'"><i class="h" data-h="l" style="left:0"></i><span class="px-2 block truncate">'+esc(c.name)+'</span><i class="h" data-h="r" style="right:0"></i></div>';
  });
  if(RNG) h+='<div class="absolute pointer-events-none" style="left:'+RNG[0]*Z+'px;width:'+(RNG[1]-RNG[0])*Z+'px;top:0;height:'+H+'px;background:rgba(255,122,89,.18);border-inline:1px solid #ff7a59"></div>';
  // red playhead: the line ignores the mouse, but its head (in the ruler) can be dragged
  h+='<div id="ph" class="absolute w-0.5 bg-ember pointer-events-none" style="top:0;height:'+H+'px"><div id="phh" title="Seret untuk memindah posisi" style="position:absolute;top:0;left:-7px;width:16px;height:'+RH+'px;cursor:ew-resize;pointer-events:auto;display:flex;justify-content:center"><i style="margin-top:4px;border:6px solid transparent;border-top:9px solid #ff7a59;border-bottom:0"></i></div></div>';
  $('lab').innerHTML=lab; $('inn').style.width=W+'px'; $('inn').style.height=H+'px'; $('inn').innerHTML=h; movePH();
}
function movePH(){
  const p=$('ph'); if(p) p.style.left=T*Z+'px'; $('t1').textContent=fmtMs(T); $('t2').textContent=fmtMs(total()); const k=$('sk'); if(document.activeElement!==k) k.value=total()?T/total()*1000:0;
  if((sel&&sel.type=='t')||!$('tOv').classList.contains('hidden')) tOvShow();
  const sc=$('sc'); if(playing&&T*Z>sc.scrollLeft+sc.clientWidth-30) sc.scrollLeft=T*Z-60;
}
let RNG=null, rg=null, pendAt=null, phd=false;
function showRg(){ $('rgBox').classList.toggle('hidden',!RNG); $('rgBox').classList.toggle('flex',!!RNG); if(RNG) say('Bagian disorot: '+fmtMs(RNG[0])+' → '+fmtMs(RNG[1])+'. Pilih klip, lalu "Jadikan klip sendiri" untuk mengatur volume/efek/sinkron bagian ini saja.'); }
$('inn').onpointerdown=e=>{
  const d=e.target.closest('.clip'), r=$('inn').getBoundingClientRect(), x=(e.clientX-r.left)/Z, y=e.clientY-r.top;
  if(e.target.closest('#phh')){ phd=true; return; }
  if(!d){
    if(y<RH){ rg={a:x,b:x}; return; }                         // ruler: click = move position, drag = highlight a part
    const row=rowsOf()[Math.floor((y-RH)/LH)]; if(!row) return;
    seek(x);                                                  // empty lane = add something of that family here
    if(row.f=='t'){ addText(); return; }
    pendAt=x; (row.f=='a'?$('fA'):$('fV')).click(); return;
  }
  const c=clips.find(x=>x.id==d.dataset.id); sel=c;
  drag={c,h:e.target.dataset.h,x:e.clientX,y:e.clientY,tr:c.track,at:c.at,s:c.s,e:c.e}; props(); renderTL();
};
addEventListener('pointermove',e=>{
  if(phd){ seek(Math.max(0,(e.clientX-$('inn').getBoundingClientRect().left)/Z)); return; }
  if(rg){ rg.b=(e.clientX-$('inn').getBoundingClientRect().left)/Z; if(Math.abs(rg.b-rg.a)*Z>6){ RNG=[Math.max(0,Math.min(rg.a,rg.b)),Math.max(rg.a,rg.b)]; renderTL(); showRg(); } return; }
  if(!drag) return; const c=drag.c, dx=(e.clientX-drag.x)/Z;
  if(drag.h=='l'){ const sp=c.sp||1, ns=Math.min(Math.max(0,drag.s+dx*sp),drag.e-.05); c.at=Math.max(0,drag.at+(ns-drag.s)/sp); c.s=ns; }
  else if(drag.h=='r') c.e=Math.min(Math.max(drag.e+dx*(c.sp||1),c.s+.05),c.max);
  else {
    c.at=Math.max(0,drag.at+dx);
    // move between lanes of the same family: needs ±80% lane height, at most 2 lanes from the start
    const k=Math.max(-2,Math.min(2,Math.trunc(((c.type=='a'?1:-1)*(e.clientY-drag.y))/(LH*.8))));
    c.track=Math.max(0,Math.min(drag.tr+k,Math.min(MAXT-1,lanes(kind(c)))));
  }
  renderTL();
});
addEventListener('pointerup',()=>{ if(phd){ phd=false; return; }
  if(rg){ if(Math.abs(rg.b-rg.a)*Z<=6){ RNG=null; showRg(); seek(rg.a); renderTL(); } rg=null; return; }
  if(drag){ drag=null; compact(); renderTL(); props(); seek(T); } });

/* Zoom: logarithmic scale, from ±0.05 px/s (tens of hours) to 400 px/s (detail) */
function setZoom(v){
  const sc=$('sc'), mid=(sc.scrollLeft+sc.clientWidth/2)/Z;
  Z=0.05*Math.pow(8000,v/100); renderTL(); sc.scrollLeft=mid*Z-sc.clientWidth/2;
}
$('zm').oninput=e=>setZoom(+e.target.value);
$('bFit').onclick=()=>{ const f=Math.max(.05,Math.min(400,($('sc').clientWidth-40)/Math.max(total()*1.1,10))); $('zm').value=100*Math.log(f/.05)/Math.log(8000); setZoom(+$('zm').value); $('sc').scrollLeft=0; };
$('sc').addEventListener('wheel',e=>{ if(!e.ctrlKey) return; e.preventDefault(); $('zm').value=Math.min(100,Math.max(0,+$('zm').value-Math.sign(e.deltaY)*4)); setZoom(+$('zm').value); },{passive:false});
