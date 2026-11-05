/* tools.js – alat bersama MAB-Music (konversi format & ubah kecepatan).
   Semua diproses di browser pengguna, hasilnya langsung diunduh. */
(function(){
const MAB=window.MAB={};
let inp,sel,st,busy=false;
const say=m=>{ if(st) st.textContent=m; };

/* Simpan = unduh otomatis */
MAB.save=(b,name)=>{
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),60000);
  say('✅ Selesai dan diunduh: '+name);
};
const loadJs=u=>new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=u; s.onload=ok; s.onerror=()=>no(new Error('Gagal memuat pustaka MP3 (cek koneksi internet)')); document.head.appendChild(s); });

function toWav(b){
  const ch=b.numberOfChannels, n=b.length, a=new ArrayBuffer(44+n*ch*2), v=new DataView(a), w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  w(0,'RIFF'); v.setUint32(4,36+n*ch*2,true); w(8,'WAVEfmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,ch,true);
  v.setUint32(24,b.sampleRate,true); v.setUint32(28,b.sampleRate*ch*2,true); v.setUint16(32,ch*2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*ch*2,true);
  const d=[...Array(ch).keys()].map(i=>b.getChannelData(i)); let o=44;
  for(let i=0;i<n;i++) for(let k=0;k<ch;k++){ v.setInt16(o,Math.max(-1,Math.min(1,d[k][i]))*32767,true); o+=2; }
  return new Blob([a],{type:'audio/wav'});
}
async function toMp3(b){
  if(!window.lamejs) await loadJs('https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js');
  const ch=b.numberOfChannels>1?2:1, enc=new lamejs.Mp3Encoder(ch,b.sampleRate,128), out=[];
  const i16=f=>{ const o=new Int16Array(f.length); for(let i=0;i<f.length;i++) o[i]=Math.max(-1,Math.min(1,f[i]))*32767; return o; };
  const L=i16(b.getChannelData(0)), R=ch>1?i16(b.getChannelData(1)):null;
  for(let i=0;i<L.length;i+=1152){ const d=R?enc.encodeBuffer(L.subarray(i,i+1152),R.subarray(i,i+1152)):enc.encodeBuffer(L.subarray(i,i+1152)); if(d.length) out.push(d); }
  out.push(enc.flush()); return new Blob(out,{type:'audio/mpeg'});
}

/* Memutar file lalu merekamnya (real-time) pada kecepatan tertentu; nada tetap.
   Dipakai untuk: ubah kecepatan, dan video -> MP4/WebM. */
MAB.record=(f,speed,want)=>new Promise((ok,no)=>{
  const isV=f.type.startsWith('video'), el=document.createElement(isV?'video':'audio'), url=URL.createObjectURL(f);
  el.src=url; el.playsInline=true; el.preload='auto';
  el.onerror=()=>no(new Error('Browser tidak bisa membaca file ini'));
  el.onloadedmetadata=async()=>{
    try{
      el.playbackRate=speed; el.preservesPitch=el.mozPreservesPitch=el.webkitPreservesPitch=true;
      const list=isV?['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm']:['audio/webm;codecs=opus','audio/webm','audio/mp4'];
      const mt=list.filter(m=>!want||m.includes(want)).concat(list).find(m=>MediaRecorder.isTypeSupported(m));
      if(!mt) throw new Error('Browser ini tidak mendukung perekaman. Pakai Chrome atau Edge.');
      await el.play();
      const s=(el.captureStream||el.mozCaptureStream).call(el), rec=new MediaRecorder(s,{mimeType:mt}), ch=[];
      rec.ondataavailable=e=>{ if(e.data.size) ch.push(e.data); };
      rec.onstop=()=>{ URL.revokeObjectURL(url); ok({blob:new Blob(ch,{type:mt.split(';')[0]}),ext:mt.includes('mp4')?(isV?'mp4':'m4a'):'webm'}); };
      el.onended=()=>rec.stop();
      el.ontimeupdate=()=>say('Memproses… '+Math.round(el.currentTime/el.duration*100)+'% (sisa ±'+Math.ceil((el.duration-el.currentTime)/speed)+' dtk). Biarkan tab terbuka.');
      rec.start(1000);
    }catch(e){ no(e); }
  };
});

MAB.convert=async(f,to)=>{
  const k=f.type.split('/')[0];
  if(k=='image'){
    const im=await createImageBitmap(f), c=document.createElement('canvas'), x=c.getContext('2d'); c.width=im.width; c.height=im.height;
    if(to=='jpg'){ x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); }
    x.drawImage(im,0,0);
    return {blob:await new Promise(r=>c.toBlob(r,'image/'+(to=='jpg'?'jpeg':to),.92)),ext:to};
  }
  if(to=='wav'||to=='mp3'){
    const x=new (window.AudioContext||window.webkitAudioContext)(), b=await x.decodeAudioData(await f.arrayBuffer()); x.close();
    return {blob:to=='wav'?toWav(b):await toMp3(b),ext:to};
  }
  return MAB.record(f,1,to);
};

/* Memasang panel konversi + kecepatan ke dalam elemen */
MAB.mount=el=>{
  const C='bg-ink border border-edge rounded-lg px-2 py-2 text-sm', B='px-3 py-2 rounded-lg border border-edge text-sm bg-panel hover:border-lilac whitespace-nowrap';
  el.innerHTML='<input id="mF" type="file" accept="image/*,video/*,audio/*" class="w-full text-sm">'+
    '<div class="flex gap-2 mt-3"><select id="mT" class="flex-1 '+C+'"></select><button id="mB" class="'+B+'">Konversi &amp; unduh</button></div>'+
    '<div class="mt-4 pt-3 border-t border-edge"><p class="text-xs text-mist mb-1">Ubah kecepatan (nada tetap). Hasil disimpan sesuai kecepatan baru.</p><div class="flex gap-2"><select id="mS" class="flex-1 '+C+'">'+
    [0.25,0.5,0.75,1.25,1.5,2,3,4].map(x=>'<option value="'+x+'"'+(x==1.5?' selected':'')+'>'+x+'×</option>').join('')+'</select><button id="mSB" class="'+B+'">Buat &amp; unduh</button></div></div>'+
    '<p id="mSt" class="text-xs text-mist mt-3 min-h-[18px]" role="status"></p>'+
    '<p class="text-xs text-mist mt-1">Gambar: PNG/JPG/WebP. Audio dan video: MP3/WAV. Video: MP4/WebM dan ubah kecepatan diproses real-time (lama proses = durasi ÷ kecepatan).</p>';
  inp=el.querySelector('#mF'); sel=el.querySelector('#mT'); st=el.querySelector('#mSt');
  inp.onchange=()=>{
    const f=inp.files[0], k=f&&f.type.split('/')[0];
    sel.innerHTML=({image:['png','jpg','webp'],audio:['mp3','wav'],video:['mp3','wav','mp4','webm']}[k]||[]).map(x=>'<option>'+x+'</option>').join('');
    say(f?'Siap: '+f.name:'');
  };
  const run=async fn=>{
    const f=inp.files[0]; if(!f) return say('Pilih file dulu.'); if(busy) return say('Masih memproses, mohon tunggu.');
    busy=true; say('Memproses…');
    try{ const r=await fn(f); MAB.save(r.blob,f.name.replace(/\.[^.]+$/,'')+r.suffix+'.'+r.ext); }
    catch(e){ say('Gagal: '+(e.message||e)); }
    busy=false;
  };
  el.querySelector('#mB').onclick=()=>run(async f=>({...await MAB.convert(f,sel.value),suffix:''}));
  el.querySelector('#mSB').onclick=()=>run(async f=>{
    if(!/^(audio|video)/.test(f.type)) throw new Error('Kecepatan hanya untuk audio atau video.');
    const s=+el.querySelector('#mS').value; return {...await MAB.record(f,s,null),suffix:'-'+s+'x'};
  });
};
/* Mengisi file dari luar (mis. dari Library) */
MAB.setFile=f=>{ const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; inp.onchange(); };
})();
