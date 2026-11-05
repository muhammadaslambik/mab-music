/* ---------- Library: file lokal pengguna (dibaca saat dipilih, jadi ringan) ---------- */
let lib=[], pvUrl=null;
const EXT={a:/\.(mp3|wav|m4a|aac|ogg|oga|flac|opus)$/i,v:/\.(mp4|webm|mkv|mov|m4v|avi)$/i,i:/\.(jpe?g|png|webp|gif|bmp)$/i};
const typeOf=n=>EXT.a.test(n)?'a':EXT.v.test(n)?'v':EXT.i.test(n)?'i':'';
async function walk(dir,path,d){
  for await (const [n,h] of dir.entries()){
    if(h.kind=='file'){ const t=typeOf(n); if(t) lib.push({n,path:path+n,t,h}); }
    else if(d<4) await walk(h,path+n+'/',d+1);
  }
}
const getF=async x=>x.f||await x.h.getFile();
async function preview(x){
  const f=await getF(x); if(pvUrl) URL.revokeObjectURL(pvUrl); pvUrl=URL.createObjectURL(f);
  const el=document.createElement(x.t=='i'?'img':x.t=='v'?'video':'audio'); el.src=pvUrl; el.className='w-full max-h-72 rounded-xl';
  if(x.t!='i'){ el.controls=true; el.play().catch(()=>{}); }
  $("lbPv").replaceChildren(el);
}
function renderLib(){
  const q=$("lbSrc").value.toLowerCase(), t=$("lbTp").value, L=lib.filter(x=>(!t||x.t==t)&&x.path.toLowerCase().includes(q));
  $("lbCt").textContent=L.length+" file"+(L.length>200?" (menampilkan 200 pertama, gunakan pencarian)":"");
  const box=$("lbList"); box.innerHTML="";
  L.slice(0,200).forEach((x)=>{
    const row=document.createElement("div"); row.className="flex items-center gap-2 bg-panel border border-edge rounded-lg px-3 py-2 text-sm";
    const nm=document.createElement("span"); nm.className="flex-1 truncate"; nm.textContent=({a:"🎵 ",v:"🎞 ",i:"🖼 "})[x.t]+x.path;
    const b1=document.createElement("button"); b1.textContent="▶ Pratinjau"; b1.className="px-2 py-1 rounded border border-edge hover:border-lilac text-xs"; b1.onclick=()=>preview(x);
    const b2=document.createElement("button"); b2.textContent="Konversi"; b2.className="px-2 py-1 rounded border border-edge hover:border-lilac text-xs"; b2.onclick=async()=>{ showView("convert"); MAB.setFile(await getF(x)); };
    row.append(nm,b1,b2); box.appendChild(row);
  });
}
$("lbPick").onclick=async()=>{
  if(window.showDirectoryPicker){
    try{ const dir=await showDirectoryPicker(); lib=[]; $("lbCt").textContent="Membaca folder…"; await walk(dir,"",0); renderLib(); }catch(e){}
  } else $("lbIn").click();                 // browser tanpa akses folder (mis. HP): pilih banyak file
};
$("lbIn").onchange=(e)=>{ lib=[...e.target.files].map(f=>({n:f.name,path:f.name,t:typeOf(f.name),f})).filter(x=>x.t); renderLib(); };
$("lbSrc").oninput=renderLib; $("lbTp").onchange=renderLib;

