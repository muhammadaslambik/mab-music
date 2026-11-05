/* ---- Klip ---- */
const FX={none:['allpass',0,0],bass:['lowshelf',12,200],treble:['highshelf',10,3000],phone:['bandpass',0,1000]};
function setFx(c){ const p=FX[c.fx], f=c.f; f.type=p[0]; f.gain.value=p[1]; if(p[2]) f.frequency.value=p[2]; }
function mk(o){
  const c=Object.assign({id:++uid,vol:1,fi:0,fo:0,fx:'none',s:0},o);
  if(c.type=='t'){ c.max=1e9; }
  else if(c.type=='i'){ c.el=new Image(); c.el.src=c.url; c.max=1e9; }
  else {
    c.el=document.createElement(c.type=='v'?'video':'audio'); c.el.preload='auto'; c.el.playsInline=true; c.el.src=c.url;
    const s=ac.createMediaElementSource(c.el); c.f=ac.createBiquadFilter(); c.g=ac.createGain();
    s.connect(c.f); c.f.connect(c.g); c.g.connect(master); setFx(c);     // suara -> efek -> volume -> keluaran
  }
  clips.push(c); return c;
}
function add(c){ sel=c; compact(); renderTL(); props(); seek(T); }
function load(f){
  const url=URL.createObjectURL(f), k=f.type.split('/')[0], type=k=='image'?'i':k=='video'?'v':k=='audio'?'a':null;
  if(!type) return say('Jenis file tidak didukung: '+f.name);
  const kd=type=='a'?'a':'v', used=clips.some(c=>kind(c)==kd), nl=lanes(kd);
  const track=used?Math.min(nl,MAXT-1):0;                                // file baru = trek baru
  if(used&&nl>=MAXT) say('Trek sudah penuh (10), file ditaruh di trek terakhir.');
  const o={type,url,name:f.name,track,at:pendAt??insAt(type),s:0};
  if(type=='i') return add(mk({...o,e:insEnd('i',5)}));
  const p=document.createElement(type=='v'?'video':'audio'); p.preload='metadata';
  p.onloadedmetadata=()=>add(mk({...o,e:insEnd(type,p.duration),max:p.duration})); p.src=url;
}
['fV','fA'].forEach(id=>$(id).onchange=e=>{ [...e.target.files].forEach(load); e.target.value=''; pendAt=null; });
function compact(){      // buang trek kosong di tengah
  ['v','a'].forEach(k=>{ const cs=clips.filter(c=>kind(c)==k), u=[...new Set(cs.map(c=>c.track))].sort((a,b)=>a-b); cs.forEach(c=>c.track=u.indexOf(c.track)); });
}

