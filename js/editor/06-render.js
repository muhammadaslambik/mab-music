/* ---- Menggambar frame ---- */
function draw(){
  g.fillStyle='#000'; g.fillRect(0,0,1280,720);
  for(let t=0;t<MAXT;t++){        // trek video bawah digambar dulu, trek atas menimpa
    const c=clips.find(c=>c.type!='a'&&c.type!='t'&&c.track==t&&T>=c.at&&T<c.at+len(c)); if(!c) continue;
    const el=c.el, w=c.type=='i'?el.naturalWidth:el.videoWidth, h=c.type=='i'?el.naturalHeight:el.videoHeight;
    if(w&&(c.type=='i'||el.readyState>1)){ const r=Math.max(1280/w,720/h); g.drawImage(el,(1280-w*r)/2,(720-h*r)/2,w*r,h*r); }
  }
  g.textAlign='center';
  if(lines.length){
    g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(0,0,1280,720);
    let k=-1,b=-1; times.forEach((x,j)=>{ if(x!=null&&x<=T&&x>b){b=x;k=j;} });
    g.shadowColor='#000'; g.shadowBlur=12;
    if(k>=0) lyric(lines[k],390,64,'#fff');
    if(lines[k+1]) lyric(lines[k+1],480,36,'rgba(255,255,255,.55)');
    g.shadowBlur=0;
  }
  clips.filter(c=>c.type=='t'&&T>=c.at&&T<c.at+len(c)).sort((a,b)=>a.track-b.track).forEach(drawTxt);
  if(!clips.length){ g.fillStyle='rgba(255,255,255,.6)'; g.font="500 30px 'DM Sans',sans-serif"; g.fillText('Klik di sini untuk menambahkan video atau gambar',640,370); }
  if(dual) detail();
}
const g2=$('cv2').getContext('2d');
function detail(){      // layar detail: perbesaran 3× di sekitar kursor/jari
  const w=1280/3, h=720/3, sx=Math.max(0,Math.min(1280-w,hov.x-w/2)), sy=Math.max(0,Math.min(720-h,hov.y-h/2));
  g2.drawImage(cv,sx,sy,w,h,0,0,480,270);
}
function drawTxt(c){
  const L=(c.txt||'').split('\n'), fs=c.fs||64, lh=fs*1.25;
  g.font=(c.bold?'700 ':'500 ')+fs+"px 'DM Sans',sans-serif"; g.textAlign='center'; g.textBaseline='middle';
  const w=Math.max(20,...L.map(s=>g.measureText(s).width)), hh=lh*L.length, x=c.px/100*1280, y=c.py/100*720;
  c._box={x:x-w/2-16,y:y-hh/2-10,w:w+32,h:hh+20};
  if(c.bg){ g.fillStyle='rgba(0,0,0,.6)'; g.fillRect(c._box.x,c._box.y,c._box.w,c._box.h); }
  g.shadowColor='#000'; g.shadowBlur=c.sh?10:0; g.fillStyle=c.col||'#fff';
  L.forEach((s,i)=>g.fillText(s,x,y-hh/2+lh*(i+.5)));
  g.shadowBlur=0; g.textBaseline='alphabetic';
  if(c===sel&&!exporting){ g.strokeStyle='rgba(255,122,89,.85)'; g.setLineDash([6,4]); g.strokeRect(c._box.x,c._box.y,c._box.w,c._box.h); g.setLineDash([]); }
}
function lyric(s,y,size,col){
  g.font='700 '+size+"px 'DM Sans',sans-serif";
  while(g.measureText(s).width>1150&&size>22){ size-=2; g.font='700 '+size+"px 'DM Sans',sans-serif"; }
  g.fillStyle=col; g.fillText(s,640,y);
}
setInterval(()=>{ if(!playing) draw(); },400);

