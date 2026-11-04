/* ---- Sinkron otomatis: cocokkan gelombang suara (korelasi silang lewat FFT) ----
   Mengukur selisih waktu dua rekaman dari suara yang sama, presisi di bawah 1 ms. */
const SR=8000, WIN=180;       // analisis 180 detik pertama tiap file, pada 8 kHz
function fft(re,im,inv){
  const n=re.length;
  for(let i=1,j=0;i<n;i++){ let b=n>>1; for(;j&b;b>>=1) j^=b; j^=b; if(i<j){ [re[i],re[j]]=[re[j],re[i]]; [im[i],im[j]]=[im[j],im[i]]; } }
  for(let len=2;len<=n;len<<=1){
    const a=(inv?2:-2)*Math.PI/len, wr=Math.cos(a), wi=Math.sin(a);
    for(let i=0;i<n;i+=len){ let cr=1, ci=0;
      for(let k=0;k<len/2;k++){ const u=i+k, v=u+len/2, xr=re[v]*cr-im[v]*ci, xi=re[v]*ci+im[v]*cr;
        re[v]=re[u]-xr; im[v]=im[u]-xi; re[u]+=xr; im[u]+=xi; const t=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=t; } }
  }
  if(inv) for(let i=0;i<n;i++){ re[i]/=n; im[i]/=n; }
}
async function pcm(c){
  const x=new AudioContext({sampleRate:SR}), b=await x.decodeAudioData(await (await fetch(c.url)).arrayBuffer()); x.close();
  return b.getChannelData(0).slice(0,SR*WIN);
}
async function autoSync(c,r){
  if(!r) return;
  if((c.sp||1)!=1||(r.sp||1)!=1) return say('Sinkron otomatis hanya untuk klip berkecepatan 1×. Atur kecepatan ke 1× dulu.');
  try {
    say('Menganalisis suara… (bisa 10-60 detik, jangan tutup tab)'); await new Promise(f=>setTimeout(f,50));
    const A=await pcm(r), B=await pcm(c), n=1<<Math.ceil(Math.log2(A.length+B.length));
    const ar=new Float64Array(n), ai=new Float64Array(n), br=new Float64Array(n), bi=new Float64Array(n);
    ar.set(A); br.set(B); fft(ar,ai); fft(br,bi);
    for(let i=0;i<n;i++){ const x=ar[i]*br[i]+ai[i]*bi[i], y=ar[i]*bi[i]-ai[i]*br[i]; ar[i]=x; ai[i]=y; }   // conj(A) × B
    fft(ar,ai,true);
    let pk=-Infinity, pi=0, sum=0;
    for(let i=0;i<n;i++){ const v=ar[i]; sum+=v*v; if(v>pk){ pk=v; pi=i; } }
    const y0=ar[(pi-1+n)%n], y2=ar[(pi+1)%n], d=.5*(y0-y2)/(y0-2*pk+y2||1);   // pembulatan sub-sampel
    const lag=((pi<n/2?pi:pi-n)+d)/SR, z=pk/Math.sqrt(sum/n);
    if(z<8) return say('Suara kedua rekaman kurang mirip (keyakinan rendah), sinkron dibatalkan. Pastikan keduanya merekam suara yang sama.');
    c.at=Math.max(0,r.at-r.s+c.s-lag);
    if(c.type=='a'&&r.type=='v') r.vol=0; else if(c.type=='v'&&r.type=='a') c.vol=0;   // bisukan suara video jelek
    renderTL(); props(); seek(T);
    say('Sinkron selesai: selisih '+(lag*1000).toFixed(1)+' ms (keyakinan '+z.toFixed(0)+'). Suara asli video dibisukan; bisa diatur ulang di Volume.');
  } catch(e){ say('Gagal menganalisis: file terlalu besar atau formatnya tidak bisa didekode browser.'); }
}

