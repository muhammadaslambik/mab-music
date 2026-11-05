/* ---- Ekspor: rekam kanvas + suara (real-time) ---- */
$('bExp').onclick=()=>{
  if(!total()) return say('Tambahkan file dulu.');
  pause(); seek(0);
  const s=cv.captureStream(30); dest.stream.getAudioTracks().forEach(x=>s.addTrack(x));
  const mt=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mt) return say('Browser ini tidak mendukung ekspor. Pakai Chrome atau Edge.');
  chunks=[]; rec=new MediaRecorder(s,{mimeType:mt,videoBitsPerSecond:5e6});
  rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  rec.onstop=()=>{
    exporting=false; const ext=mt.includes('mp4')?'mp4':'webm', a=$('dl');
    a.href=URL.createObjectURL(new Blob(chunks,{type:mt.split(';')[0]})); a.download='mab-video.'+ext;
    a.textContent='Unduh video (.'+ext+')'; a.classList.remove('hidden'); say('Ekspor selesai!'); rec=null;
  };
  $('dl').classList.add('hidden'); exporting=true; $('tOv').classList.add('hidden'); rec.start(1000);
  say('Merekam… biarkan tab ini terbuka dan terlihat sampai selesai ('+fmt(total())+').'); play();
};


