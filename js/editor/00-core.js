/* Editor multi-trek MAB-Music: semua berjalan di browser pengguna (tanpa server). */
const $=id=>document.getElementById(id), cv=$('cv'), g=cv.getContext('2d');
let LH=44; const RH=24, MAXT=10;
let dual=false, exporting=false, ms=false, tiles=[], solo=null, tsig='', hov={x:640,y:360}, clips=[], sel=null, uid=0, Z=40, T=0, T0=0, t0=0, playing=false, rec=null, chunks=[], drag=null, tap=-1, lines=[], times=[];
const ac=new AudioContext(), dest=ac.createMediaStreamDestination(), master=ac.createGain();
master.connect(ac.destination); master.connect(dest);
const esc=s=>s.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
const fmt=s=>{ s=Math.max(0,s); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=Math.floor(s%60); return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); };
const fmtMs=s=>{ s=Math.max(0,s); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return h+':'+String(m).padStart(2,'0')+':'+x.toFixed(3).padStart(6,'0'); };
const say=m=>$('st').textContent=m;
const kind=c=>c.type=='a'?'a':'v';                         // 'v' = trek video/gambar, 'a' = trek audio
const lanes=k=>Math.min(MAXT,Math.max(1,1+Math.max(-1,...clips.filter(c=>kind(c)==k).map(c=>c.track))));
const len=c=>(c.e-c.s)/(c.sp||1);                         // panjang di timeline (memperhitungkan kecepatan)
const total=()=>clips.reduce((m,c)=>Math.max(m,c.at+len(c)),0);

