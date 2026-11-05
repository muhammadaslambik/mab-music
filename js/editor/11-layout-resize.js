/* ---- Sematkan layar, geser panel (mouse & sentuh), tinggi trek ---- */
const cpt=e=>{ const r=cv.getBoundingClientRect(), s=Math.min(r.width/1280,r.height/720), ox=(r.width-1280*s)/2, oy=(r.height-720*s)/2; return {x:(e.clientX-r.left-ox)/s,y:(e.clientY-r.top-oy)/s,s,ox,oy}; };
let tdrag=null;
cv.onpointerdown=e=>{
  const p=cpt(e), hit=[...clips].reverse().find(c=>c.type=='t'&&c._box&&T>=c.at&&T<c.at+len(c)&&p.x>=c._box.x&&p.x<=c._box.x+c._box.w&&p.y>=c._box.y&&p.y<=c._box.y+c._box.h);
  tdrag={hit,moved:false,ox:hit?p.x-hit.px/100*1280:0,oy:hit?p.y-hit.py/100*720:0};
  if(hit){ sel=hit; renderTL(); props(); cv.setPointerCapture(e.pointerId); }
};
cv.onpointerup=()=>{      // klik kosong = putar/jeda; klik teks = ketik langsung
  if(tdrag&&!tdrag.hit){ if(!clips.length) $('fV').click(); else playing?pause():play(); }
  else if(tdrag&&!tdrag.moved){ tOvShow(); $('tOv').focus(); }
  tdrag=null;
};
$('bPin').onclick=()=>{ const on=$('pin').classList.toggle('sticky'); ['top-0','z-20','bg-ink'].forEach(k=>$('pin').classList.toggle(k,on)); $('bPin').style.borderColor=on?'#a78bfa':''; $('bPin').textContent=on?'📌 Disematkan':'📌 Sematkan'; };
function grip(id,fn){ const el=$(id); el.onpointerdown=e=>{ el.setPointerCapture(e.pointerId); el.onpointermove=fn; el.onpointerup=()=>{ el.onpointermove=null; }; }; }
grip('sp1',e=>{ const r=$('top').getBoundingClientRect(); $('top').style.setProperty('--rw',Math.min(Math.max(r.right-e.clientX,240),r.width-380)+'px'); });
grip('sp2',e=>{ const r=cv.getBoundingClientRect(); cv.style.maxHeight=Math.min(Math.max(e.clientY-r.top,120),innerHeight*.8)+'px'; });
$('bH1').onclick=()=>{ LH=Math.max(30,LH-8); renderTL(); }; $('bH2').onclick=()=>{ LH=Math.min(96,LH+8); renderTL(); };

