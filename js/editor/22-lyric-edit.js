/* ---- Edit the running lyrics directly on the video screen: click a lyric line, type in place ---- */
(function(){
  const stage=$('stage'), ov=document.createElement('textarea');
  ov.id='lOv'; ov.className='absolute hidden'; ov.setAttribute('wrap','off'); ov.spellcheck=false;
  ov.setAttribute('aria-label','Edit baris lirik langsung');
  ov.style.cssText='color:transparent;caret-color:#fff;background:transparent;border:1px dashed #a78bfa;resize:none;overflow:hidden;padding:0;text-align:center;white-space:pre;font-family:"DM Sans",sans-serif;font-weight:700;outline:none;z-index:5';
  stage.appendChild(ov);
  let cur=-1, box=null;
  const nowLine=()=>{ let k=-1,b=-1; times.forEach((x,j)=>{ if(x!=null&&x<=T&&x>b){ b=x; k=j; } }); return k; };
  function boxOf(i,y,size0){      // same size rule as lyric() in 06-render.js: shrink until it fits 1150 px
    const s=lines[i]||'', f=n=>{ g.font='700 '+n+"px 'DM Sans',sans-serif"; }; let size=size0; f(size);
    while(g.measureText(s).width>1150&&size>22){ size-=2; f(size); }
    const w=Math.max(g.measureText(s).width,240)+32;
    return {i,size,by:y,bs:size0,x:640-w/2,y:y-size,w,h:size*1.35};
  }
  function hits(){      // the big current line and the small next line
    const k=nowLine(), out=[];
    if(k>=0) out.push(boxOf(k,390,64));
    if(lines[k+1]!==undefined) out.push(boxOf(k+1,480,36));
    return out;
  }
  const hitAt=p=>hits().find(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);
  function place(){
    if(!box||ov.classList.contains('hidden')) return;
    const p=cpt({clientX:0,clientY:0}), st=stage.getBoundingClientRect(), cr=cv.getBoundingClientRect();
    ov.style.left=(cr.left-st.left+p.ox+box.x*p.s)+'px'; ov.style.top=(cr.top-st.top+p.oy+box.y*p.s)+'px';
    ov.style.width=box.w*p.s+'px'; ov.style.height=box.h*p.s+'px';
    ov.style.fontSize=box.size*p.s+'px'; ov.style.lineHeight=box.h*p.s+'px';
  }
  function open(b){ if(playing) pause(); cur=b.i; box=b; ov.value=lines[cur]||''; ov.classList.remove('hidden'); place(); ov.focus(); ov.select(); }
  function close(){ ov.classList.add('hidden'); cur=-1; }
  ov.oninput=()=>{
    lines[cur]=ov.value.replace(/\n/g,' ');
    $('ly').value=lines.join('\n'); drawLines();      // keep the "Lirik berjalan" panel and its times in sync
    box=boxOf(cur,box.by,box.bs); place(); draw();
  };
  ov.onkeydown=e=>{ if(e.key=='Enter'||e.key=='Escape'){ e.preventDefault(); ov.blur(); } };
  ov.onblur=close;
  const up=cv.onpointerup;      // a click on a lyric line edits it; anywhere else keeps the old behaviour (play/pause)
  cv.onpointerup=e=>{
    if(tdrag&&!tdrag.hit&&!tdrag.moved&&lines.length){ const b=hitAt(cpt(e)); if(b){ tdrag=null; open(b); return; } }
    if(up) up(e);
  };
  cv.addEventListener('pointermove',e=>{ cv.style.cursor=(!tdrag&&lines.length&&hitAt(cpt(e)))?'text':''; });
  cv.title='Klik untuk putar/jeda; klik teks lirik untuk mengedit langsung; seret teks klip untuk memindahnya';
  addEventListener('resize',place);
})();
