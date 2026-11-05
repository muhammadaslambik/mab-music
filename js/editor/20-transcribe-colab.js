/* ---- Auto transcription on your own Colab GPU (accurate + fast), with optional media URL and lyric matching ---- */
(function(){
  const go=$('trGo'), KEY='mab_asr_url', H={'ngrok-skip-browser-warning':'true'};
  const LC={indonesian:'id',english:'en',malay:'ms',japanese:'ja',korean:'ko',chinese:'zh'};
  const box=document.createElement('div');
  box.innerHTML='<label class="text-xs text-mist block mt-2">Mesin<select id="trEng" class="w-full"><option value="colab">Colab GPU (akurat, cepat) – disarankan</option><option value="browser">Browser (offline, kurang akurat)</option></select></label>'+
   '<div id="trCol"><label class="text-xs text-mist block mt-2">URL backend transkripsi (dari Colab)<input id="trUrl" type="url" placeholder="https://xxxx.ngrok-free.app" class="w-full"></label>'+
   '<button id="trTest" class="btn text-xs mt-1">Tes koneksi</button> <span id="trConn" class="text-xs text-mist"></span>'+
   '<label class="text-xs text-mist block mt-2">Model Colab<select id="trCM" class="w-full"><option value="turbo">Turbo (cepat, sangat baik)</option><option value="large">Large-v3 (paling akurat)</option><option value="small">Small (ringan)</option></select></label>'+
   '<label class="text-xs text-mist block mt-2">URL media (opsional, menggantikan sumber di atas)<input id="trMedia" type="url" placeholder="URL YouTube, Suno, dll." class="w-full"></label>'+
   '<label class="flex items-center gap-2 text-xs text-mist mt-2"><input id="trSep" type="checkbox"> Pisahkan vokal dulu (lebih akurat untuk lagu, +1–2 menit)</label>'+
   '<label class="flex items-center gap-2 text-xs text-mist mt-1"><input id="trMatch" type="checkbox"> Cocokkan dengan lirik di kolom "Lirik berjalan" (teks pasti benar, waktu otomatis)</label></div>';
  go.before(box);
  try{ $('trUrl').value=localStorage.getItem(KEY)||''; }catch(e){}
  const eng=()=>$('trEng').value;
  const sync=()=>{ $('trCol').classList.toggle('hidden',eng()!='colab'); $('trMod').closest('label').classList.toggle('hidden',eng()=='colab'); };
  $('trEng').onchange=sync; sync();
  const base=()=>$('trUrl').value.trim().replace(/\/+$/,'');
  $('trTest').onclick=async()=>{
    const c=$('trConn'); c.textContent='Mengecek…';
    try{ const d=await (await fetch(base()+'/',{headers:H})).json(); if(d.app!='MAB-Transcribe') throw 0; c.textContent='Terhubung ('+d.device+')'; try{ localStorage.setItem(KEY,base()); }catch(e){} }
    catch(e){ c.textContent='Gagal terhubung'; }
  };
  function wav16(f){      // mono 16 kHz, 16-bit WAV: small upload (≈2 MB per minute)
    const n=f.length, b=new ArrayBuffer(44+n*2), v=new DataView(b), w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
    w(0,'RIFF'); v.setUint32(4,36+n*2,true); w(8,'WAVEfmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
    v.setUint32(24,16000,true); v.setUint32(28,32000,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*2,true);
    for(let i=0;i<n;i++) v.setInt16(44+i*2,Math.max(-1,Math.min(1,f[i]))*32767,true);
    return new Blob([b],{type:'audio/wav'});
  }
  async function colab(){
    const say2=m=>$('trSt').textContent=m;
    if(trBusy) return; if(!base()) return say2('Isi URL backend transkripsi dulu (dari Colab).');
    trBusy=true;
    try{
      const fd=new FormData(), media=$('trMedia').value.trim(); let at=0, sp=1;
      if(media) fd.append('url',media);
      else{
        let src;
        if($('trSrc').value=='file'){ const f=$('trFile').files[0]; if(!f) throw new Error('Pilih file dulu.'); src={url:URL.createObjectURL(f),s:0,e:0}; }
        else{ const c=sel; if(!c||(c.type!='a'&&c.type!='v')) throw new Error('Klik dulu sebuah klip audio atau video di timeline.'); src={url:c.url,s:c.s,e:c.e}; at=c.at; sp=c.sp||1; }
        say2('Menyiapkan audio…'); fd.append('file',wav16(await decode16k(src.url,src.s,src.e)),'audio.wav');
      }
      fd.append('language',LC[$('trLang').value]||''); fd.append('model',$('trCM').value); fd.append('separate',$('trSep').checked?'1':'0');
      if($('trMatch').checked) fd.append('lyrics',$('ly').value);
      say2('Mengirim ke Colab…');
      const r=await fetch(base()+'/transcribe',{method:'POST',body:fd,headers:H}); if(!r.ok) throw new Error('Backend menolak (HTTP '+r.status+')');
      const {job_id}=await r.json(); let info, fail=0;
      for(;;){
        await new Promise(f=>setTimeout(f,3000));
        try{ info=await (await fetch(base()+'/status/'+job_id,{headers:H})).json(); fail=0; }catch(e){ if(++fail>=6) throw new Error('Koneksi ke Colab terputus. Cek apakah Colab masih menyala.'); continue; }
        if(info.status=='error') throw new Error(info.message); if(info.status=='done') break; say2(info.message||'Menunggu…');
      }
      const res=await (await fetch(base()+'/result/'+job_id,{headers:H})).json(), L=res.lines.filter(l=>l.text&&l.text.trim());
      $('ly').value=L.map(l=>l.text.trim()).join('\n'); syncLines(); L.forEach((l,i)=>times[i]=+(at+l.start/sp).toFixed(2)); drawLines();
      $('ly').closest('details').open=true;
      say2('Selesai: '+L.length+' baris (bahasa terdeteksi: '+res.language+'). Cek hasilnya, lalu ekspor lewat "Lirik editor → file teks".');
    }catch(e){ say2('Gagal: '+(e.message||e)); }
    trBusy=false;
  }
  const orig=go.onclick; go.onclick=()=>eng()=='colab'?colab():orig();
})();
