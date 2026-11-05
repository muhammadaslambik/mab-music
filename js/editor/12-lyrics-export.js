/* ---- Konversi & kecepatan (tools.js) ---- */
/* konversi dipindah ke halaman terpisah (index.html#convert) */
$('lxB').onclick=()=>{
  if(!lines.length) return say('Tulis lirik dulu di panel Lirik berjalan.');
  const fm=$('lx').value, sep=fm=='srt'?',':'.', st=i=>times[i]??i*3, en=i=>times[i+1]??st(i)+3;
  const tm=(s,p)=>String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+(s%60).toFixed(3).padStart(6,'0').replace('.',p);
  let o;
  if(fm=='txt') o=lines.join('\n');
  else if(fm=='lrc') o=lines.map((l,i)=>'['+String(Math.floor(st(i)/60)).padStart(2,'0')+':'+(st(i)%60).toFixed(2).padStart(5,'0')+']'+l).join('\n');
  else o=(fm=='vtt'?'WEBVTT\n\n':'')+lines.map((l,i)=>(fm=='srt'?(i+1)+'\n':'')+tm(st(i),sep)+' --> '+tm(en(i),sep)+'\n'+l+'\n').join('\n');
  MAB.save(new Blob([o],{type:'text/plain'}),'lirik.'+fm);
};

