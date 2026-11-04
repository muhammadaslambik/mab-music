/* ---- Multi-layar manual: pilih jumlah, mode putar, ukuran, isi ---- */
const tsigOf=()=>$('msN').value+'|'+clips.filter(c=>c.type=='v'||c.type=='i').map(c=>c.id+':'+c.track).join(',');
function tilesCheck(){ if(ms&&tsigOf()!=tsig){ tsig=tsigOf(); buildTiles(); } }
function buildTiles(){
  const box=$('tiles'); box.innerHTML=''; tiles=[];
  const n=$('msN').value, list=clips.filter(c=>c.type=='v'||c.type=='i').sort((a,b)=>a.track-b.track||a.at-b.at).slice(0,n=='all'?1e9:+n);
  if(!list.length) box.innerHTML='<p class="text-xs text-mist">Belum ada video/gambar.</p>';
  if(!list.some(c=>c.id==solo)) solo=list[0]&&list[0].id;
  list.forEach(c=>{
    const d=document.createElement('div'); d.className='shrink-0 rounded-xl border-2 border-edge bg-black overflow-hidden cursor-pointer'; d.style.width=$('msZ').value+'px';
    const v=document.createElement(c.type=='v'?'video':'img'); v.className='w-full aspect-video'; v.style.objectFit=$('msF').value; v.muted=true; v.playsInline=true; v.preload='metadata'; v.src=c.url;
    const cap=document.createElement('p'); cap.className='text-[11px] px-1 truncate'; cap.textContent=c.name;
    d.append(v,cap); d.onclick=()=>{ solo=c.id; sel=c; renderTL(); props(); tilesUpdate(true); };
    box.appendChild(d); tiles.push({c,v,d});
  });
  tilesUpdate(true);
}
function tilesUpdate(force){
  if(!ms) return; const all=$('msM').value=='all';
  tiles.forEach(({c,v,d})=>{
    d.style.borderColor=c.id==solo?'#ff7a59':''; if(c.type!='v') return;
    const sp=c.sp||1, lt=T-c.at, act=lt>=0&&lt<len(c), want=Math.min(c.e,Math.max(c.s,c.s+lt*sp));
    d.style.opacity=act?1:.45;
    if(playing&&act&&(all||c.id==solo)){
      if(v.playbackRate!=sp) v.playbackRate=sp;
      if(v.paused||Math.abs(v.currentTime-want)>.3){ v.currentTime=want; v.play().catch(()=>{}); }
    } else { if(!v.paused) v.pause(); if((force||!playing)&&Math.abs(v.currentTime-want)>.04) v.currentTime=want; }
  });
}
$('bDual').onclick=()=>{
  ms=!ms; $('mSrc').classList.toggle('hidden',!ms); $('bDual').style.borderColor=ms?'#a78bfa':'';
  tsig=''; if(ms) tilesCheck(); else { $('tiles').innerHTML=''; tiles=[]; }
};
$('msN').onchange=tilesCheck; $('msM').onchange=()=>tilesUpdate(true);
$('msZ').oninput=()=>tiles.forEach(t=>t.d.style.width=$('msZ').value+'px');
$('msF').onchange=()=>tiles.forEach(t=>t.v.style.objectFit=$('msF').value);
$('msD').onchange=e=>{ dual=e.target.checked; $('mDet').classList.toggle('hidden',!dual); };

