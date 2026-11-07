/* ---- Project: undo/redo (Ctrl+Z / Ctrl+Y), save/open a project file, autosave with restore ----
   Only light metadata is stored (clip settings, lyrics). Media files are never copied: when a project is
   opened you pick the same files again and they are matched by file name. */
(function(){
  const PLAIN=['type','url','name','track','at','s','e','max','vol','fi','fo','fx','sp','txt','fs','col','bg','px','py','bold','sh'];
  const KEY='mab_autosave', LIM=100, known=new Map();      // known: every clip that was ever in a snapshot, so undo can bring deleted clips back
  const pick=c=>{ const o={id:c.id}; PLAIN.forEach(k=>{ if(c[k]!==undefined) o[k]=c[k]; }); return o; };
  const snap=()=>{ clips.forEach(c=>known.set(c.id,c)); return {clips:clips.map(pick),lines:[...lines],times:[...times],sel:sel?sel.id:null}; };
  const sigOf=()=>JSON.stringify([clips.map(pick),lines,times]);
  let hist=[snap()], hi=0, top=sigOf(), pend=null, busy=false, hold=false;

  /* --- undo / redo --- */
  function project(){ return {app:'MAB-Music',v:1,saved:new Date().toISOString(),clips:clips.map(c=>{ const o=pick(c); delete o.url; return o; }),lines:[...lines],times:[...times]}; }
  function autosave(){ if(hold) return; try{ if(clips.length||lines.length) localStorage.setItem(KEY,JSON.stringify(project())); }catch(e){} }
  function push(){
    const s=sigOf(); if(s===top) return;
    hist.length=hi+1; hist.push(snap()); if(hist.length>LIM) hist.shift(); hi=hist.length-1; top=s; btns(); autosave();
  }
  function restore(sn){
    busy=true;
    const keep=new Set(sn.clips.map(o=>o.id));
    clips.forEach(c=>{ if(!keep.has(c.id)&&c.el&&c.el.pause) c.el.pause(); });
    const next=[];
    sn.clips.forEach(o=>{
      const c=known.get(o.id); if(!c) return;
      PLAIN.forEach(k=>{ c[k]=o[k]; }); if(c.f) setFx(c); next.push(c);
    });
    clips=next; lines=[...sn.lines]; times=[...sn.times]; sel=clips.find(c=>c.id==sn.sel)||null;
    $('ly').value=lines.join('\n'); drawLines(); compact(); renderTL(); props(); seek(T);
    top=sigOf(); pend=null; busy=false; btns(); autosave();
  }
  const undo=()=>{ push(); if(hi>0){ hi--; restore(hist[hi]); } };
  const redo=()=>{ if(hi<hist.length-1){ hi++; restore(hist[hi]); } };
  setInterval(()=>{      // a change counts once it has stayed the same for ~0.4 s (so dragging/sliding makes one step)
    if(busy||drag||rg||phd) return;
    const s=sigOf(); if(s===top){ pend=null; return; }
    if(s===pend) push(); else pend=s;
  },400);

  /* --- buttons and shortcuts --- */
  const mkBtn=(t,title,fn)=>{ const b=document.createElement('button'); b.className='btn'; b.textContent=t; b.title=title; b.onclick=fn; return b; };
  const bu=mkBtn('↶ Urungkan','Ctrl+Z',undo), br=mkBtn('↷ Ulangi','Ctrl+Y',redo);
  $('bDel').after(bu,br);
  function btns(){ bu.disabled=hi<=0; br.disabled=hi>=hist.length-1; bu.style.opacity=bu.disabled?.4:''; br.style.opacity=br.disabled?.4:''; }
  btns();
  addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey)||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    const k=e.key.toLowerCase();
    if(k=='z'&&!e.shiftKey){ e.preventDefault(); undo(); } else if(k=='y'||(k=='z'&&e.shiftKey)){ e.preventDefault(); redo(); }
  });

  /* --- save / open project --- */
  const bar=document.createElement('div'); bar.className='hidden mb-3 p-3 rounded-xl border border-ember text-sm items-center gap-2 flex-wrap';
  $('top').before(bar);
  function barShow(msg,acts){
    bar.innerHTML=''; const p=document.createElement('span'); p.className='flex-1 min-w-[200px]'; p.textContent=msg; bar.append(p);
    acts.forEach(([t,fn])=>{ const b=document.createElement('button'); b.className='btn text-xs'; b.textContent=t; b.onclick=fn; bar.append(b); });
    bar.classList.remove('hidden'); bar.classList.add('flex');
  }
  const barHide=()=>{ bar.classList.add('hidden'); bar.classList.remove('flex'); };
  const fj=document.createElement('input'); fj.type='file'; fj.accept='.json,application/json'; fj.className='hidden';
  const fm=document.createElement('input'); fm.type='file'; fm.multiple=true; fm.accept='audio/*,video/*,image/*'; fm.className='hidden';
  document.body.append(fj,fm);
  let pending=null;
  function begin(p){
    if(!p||p.app!='MAB-Music'||!Array.isArray(p.clips)) return barShow('Berkas ini bukan proyek MAB-Music.',[['Tutup',barHide]]);
    hold=false; pending=p;
    const names=[...new Set(p.clips.filter(c=>c.type!='t').map(c=>c.name))];
    if(!names.length) return build(p,new Map());
    barShow('Proyek berisi '+p.clips.length+' klip. File media yang diperlukan: '+names.join(', ')+'. Pilih file-file itu (boleh sekaligus).',
      [['Pilih file media…',()=>fm.click()],['Batal',()=>{ pending=null; barHide(); }]]);
  }
  function build(p,files){
    if(clips.length&&!confirm('Proyek yang sedang dibuka akan diganti. Lanjutkan?')) return;
    busy=true;
    clips.forEach(c=>{ if(c.el&&c.el.pause) c.el.pause(); }); clips=[]; known.clear(); sel=null;
    const urls=new Map(), miss=new Set();
    p.clips.forEach(o=>{
      if(o.type!='t'){
        const f=files.get(o.name); if(!f){ miss.add(o.name); return; }
        if(!urls.has(o.name)) urls.set(o.name,URL.createObjectURL(f));
        o=Object.assign({},o,{url:urls.get(o.name)});
      }
      uid=Math.max(uid,o.id||0); mk(o);
    });
    lines=[...(p.lines||[])]; times=[...(p.times||[])]; $('ly').value=lines.join('\n'); drawLines();
    compact(); renderTL(); props(); seek(0);
    hist=[snap()]; hi=0; top=sigOf(); pend=null; busy=false; pending=null; btns(); autosave();
    barShow(miss.size?'Proyek dibuka. File tidak ditemukan, klipnya dilewati: '+[...miss].join(', '):'Proyek dibuka.',[['Tutup',barHide]]);
  }
  fm.onchange=()=>{ if(pending){ build(pending,new Map([...fm.files].map(f=>[f.name,f]))); } fm.value=''; };
  fj.onchange=async()=>{ const f=fj.files[0]; fj.value=''; if(!f) return; try{ begin(JSON.parse(await f.text())); }catch(e){ barShow('Berkas proyek rusak atau bukan JSON.',[['Tutup',barHide]]); } };
  const hb=document.createElement('div'); hb.className='ml-auto flex gap-2';
  hb.append(
    mkBtn('💾 Simpan proyek','Unduh berkas proyek (tanpa file media)',()=>{ MAB.save(new Blob([JSON.stringify(project(),null,1)],{type:'application/json'}),'proyek-'+new Date().toISOString().slice(0,10)+'.mab.json'); say('Proyek disimpan. File media tidak ikut disimpan; simpan di folder yang sama.'); }),
    mkBtn('📂 Buka proyek','Buka berkas proyek .mab.json',()=>fj.click()));
  $('bMenu').parentElement.append(hb);

  /* --- offer to restore the autosaved project after a reload --- */
  try{
    const raw=localStorage.getItem(KEY), p=raw&&JSON.parse(raw);
    if(p&&p.clips&&(p.clips.length||(p.lines||[]).length)){
      hold=true;      // do not overwrite the autosave until the person decides
      barShow('Ada proyek tersimpan otomatis ('+p.clips.length+' klip, '+new Date(p.saved).toLocaleString('id-ID')+').',
        [['Pulihkan',()=>begin(p)],['Abaikan',()=>{ hold=false; barHide(); }]]);
    }
  }catch(e){}
  window.MABHist={undo,redo,push,project,build};
})();
