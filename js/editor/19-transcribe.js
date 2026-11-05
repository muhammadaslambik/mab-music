/* ---- Auto transcription (speech -> lyric lines with timestamps), fully in the browser ----
   Whisper runs in a Web Worker, loaded only when the button is pressed; the model is cached by the browser.
   Result goes into the "Lirik berjalan" panel, so the existing .srt/.vtt/.lrc/.txt export works unchanged. */
const WK=`
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
env.allowLocalModels=false; env.useBrowserCache=true;
let asr=null, cur='';
onmessage=async e=>{
  const {model,audio,lang}=e.data;
  try{
    if(cur!==model){
      asr=await pipeline('automatic-speech-recognition',model,{progress_callback:p=>{ if(p.status==='progress') postMessage({t:'dl',p:p.progress}); }});
      cur=model;
    }
    postMessage({t:'run'});
    const r=await asr(audio,{return_timestamps:true,chunk_length_s:30,stride_length_s:5,task:'transcribe',language:lang||undefined});
    postMessage({t:'done',chunks:r.chunks||[{text:r.text,timestamp:[0,null]}]});
  }catch(err){ postMessage({t:'err',m:String((err&&err.message)||err)}); }
};`;
let trBusy=false;
async function decode16k(url,s,e){      // mono 16 kHz samples (what Whisper expects), optionally only s..e seconds
  const ctx=new AudioContext({sampleRate:16000});
  const buf=await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer()); ctx.close();
  return buf.getChannelData(0).slice(Math.floor(s*16000), e?Math.ceil(e*16000):undefined);
}
async function transcribe(src,model,lang,out){
  if(trBusy) return; trBusy=true;
  const wk=new Worker(URL.createObjectURL(new Blob([WK],{type:'text/javascript'})),{type:'module'});
  const done=()=>{ wk.terminate(); trBusy=false; };      // free memory when finished
  try{
    out('Membaca audio…'); const audio=await decode16k(src.url,src.s,src.e);
    wk.onmessage=m=>{
      const d=m.data;
      if(d.t=='dl') out('Mengunduh model… '+Math.round(d.p)+'% (hanya sekali, lalu tersimpan)');
      else if(d.t=='run') out('Mentranskripsi… (boleh lanjut mengedit, tapi jangan tutup tab)');
      else if(d.t=='err'){ out('Gagal: '+d.m); done(); }
      else if(d.t=='done'){
        const ch=d.chunks.filter(c=>c.text&&c.text.trim());
        $('ly').value=ch.map(c=>c.text.trim()).join('\n'); syncLines();
        ch.forEach((c,i)=>times[i]=+(src.at+c.timestamp[0]/src.sp).toFixed(2)); drawLines();
        $('ly').closest('details').open=true;
        out('Selesai: '+ch.length+' baris. Cek hasilnya, lalu ekspor lewat "Lirik editor → file teks".'); done();
      }
    };
    wk.onerror=ev=>{ out('Gagal memuat mesin transkripsi (cek koneksi internet).'); done(); };
    wk.postMessage({model,audio,lang},[audio.buffer]);
  }catch(err){ out('Gagal membaca audio: file tidak bisa didekode browser.'); done(); }
}
(function(){
  const card=document.createElement('details'); card.className='card';
  card.innerHTML='<summary class="cursor-pointer text-lg">Teks otomatis (SRT)</summary>'+
   '<p class="text-xs text-mist mt-1">Mengubah suara menjadi baris lirik berwaktu, diproses di perangkat Anda. Untuk lagu dengan musik keras hasilnya sering meleset; cek dan edit. Pakai hanya untuk konten milik sendiri atau berizin.</p>'+
   '<label class="text-xs text-mist block mt-2">Sumber<select id="trSrc" class="w-full"><option value="clip">Klip audio/video terpilih</option><option value="file">File lain…</option></select></label>'+
   '<input id="trFile" type="file" accept="audio/*,video/*" class="hidden w-full text-sm mt-1">'+
   '<div class="flex gap-2 mt-2 text-xs text-mist"><label class="flex-1">Model<select id="trMod" class="w-full"><option value="Xenova/whisper-tiny">Tiny (±40 MB, cepat)</option><option value="Xenova/whisper-base" selected>Base (±75 MB, seimbang)</option><option value="Xenova/whisper-small">Small (±250 MB, akurat, lambat)</option></select></label>'+
   '<label class="flex-1">Bahasa<select id="trLang" class="w-full"><option value="">Otomatis</option><option value="indonesian">Indonesia</option><option value="english">Inggris</option><option value="malay">Melayu</option><option value="japanese">Jepang</option><option value="korean">Korea</option><option value="chinese">Mandarin</option></select></label></div>'+
   '<button id="trGo" class="btn w-full mt-2 text-sm">✨ Buat teks otomatis</button><p id="trSt" class="text-xs text-mist mt-2 min-h-[18px]" role="status"></p>'+
   '<p class="text-[11px] text-mist mt-1">Dari URL (YouTube, TikTok, dll.): butuh backend Colab, menyusul.</p>';
  $('ly').closest('details').before(card);
  const out=m=>card.querySelector('#trSt').textContent=m;
  card.querySelector('#trSrc').onchange=e=>card.querySelector('#trFile').classList.toggle('hidden',e.target.value!='file');
  card.querySelector('#trGo').onclick=()=>{
    const mode=card.querySelector('#trSrc').value; let src;
    if(mode=='file'){ const f=card.querySelector('#trFile').files[0]; if(!f) return out('Pilih file dulu.'); src={url:URL.createObjectURL(f),s:0,e:0,at:0,sp:1}; }
    else { const c=sel; if(!c||(c.type!='a'&&c.type!='v')) return out('Klik dulu sebuah klip audio atau video di timeline.'); src={url:c.url,s:c.s,e:c.e,at:c.at,sp:c.sp||1}; }
    transcribe(src,card.querySelector('#trMod').value,card.querySelector('#trLang').value,out);
  };
})();
