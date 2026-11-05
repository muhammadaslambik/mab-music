/* ---- Panel klip terpilih ---- */
function props(){
  const p=$('pr'), c=sel; setTimeout(()=>{ if($('gal').open) renderGal(); tilesCheck(); tOvShow(); },0);
  if(!c){ p.innerHTML='<p class="text-sm text-mist">Klik sebuah klip di timeline untuk mengatur suara, memotong, atau sinkron.</p>'; return; }
  if(c.type=='t') return propsText(c);
  const fxo=[['none','Normal'],['bass','Bass tebal'],['treble','Treble jernih'],['phone','Suara telepon']].map(o=>'<option value="'+o[0]+'"'+(c.fx==o[0]?' selected':'')+'>'+o[1]+'</option>').join('');
  const others=clips.filter(x=>x!==c&&x.type!='i'&&x.type!='t'), mine=c.type!='i';
  let h=typeBadge(c)+'<p class="text-sm truncate mb-2">'+esc(c.name)+'</p>'+
    '<label class="text-xs text-mist block">Posisi mulai (detik, bisa 1 ms)<input id="pa" type="number" step="0.001" min="0" value="'+c.at.toFixed(3)+'" class="w-full"></label>';
  if(mine) h+='<label class="text-xs text-mist block mt-2">Kecepatan <span id="sv">'+(c.sp||1).toFixed(2)+'</span>×<input id="ps" type="range" min="0.25" max="4" step="0.05" value="'+(c.sp||1)+'" class="w-full"></label><div class="flex gap-1 mt-1" id="spb">'+[0.5,1,1.5,2].map(x=>'<button data-sp="'+x+'" class="btn text-xs">'+x+'×</button>').join('')+'</div>';
  if(mine) h+='<label class="text-xs text-mist block mt-2">Volume <span id="vv">'+Math.round(c.vol*100)+'</span>%<input id="pv" type="range" min="0" max="200" value="'+c.vol*100+'" class="w-full"></label>'+
    '<div class="flex gap-2 mt-2 text-xs text-mist"><label>Fade masuk (dtk)<input id="pi" type="number" min="0" step="0.5" value="'+c.fi+'" class="w-full"></label><label>Fade keluar (dtk)<input id="po" type="number" min="0" step="0.5" value="'+c.fo+'" class="w-full"></label></div>'+
    '<label class="text-xs text-mist block mt-2">Efek suara<select id="px" class="w-full">'+fxo+'</select></label>';
  else h+='<label class="text-xs text-mist block mt-2">Lama tayang (detik)<input id="pd" type="number" min="0.1" step="0.1" value="'+(c.e-c.s).toFixed(1)+'" class="w-full"></label>';
  if(mine&&others.length) h+='<div class="mt-3 pt-3 border-t border-edge"><p class="text-xs text-mist mb-1">Sinkron otomatis dengan klip lain (cocokkan suara)</p><select id="rf" class="w-full">'+others.map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join('')+'</select><button id="sy" class="btn w-full mt-2 text-sm">🎯 Sinkronkan</button></div>';
  p.innerHTML=h;
  $('pa').onchange=e=>{ c.at=Math.max(0,+e.target.value); renderTL(); seek(T); }; if($('pd')) $('pd').onchange=e=>{ c.e=c.s+Math.max(.1,+e.target.value); renderTL(); seek(T); };
  if($('pv')){
    $('ps').oninput=e=>setSp(c,+e.target.value); $('spb').onclick=e=>{ const v=+e.target.dataset.sp; if(v){ $('ps').value=v; setSp(c,v); } };
    $('pv').oninput=e=>{ c.vol=e.target.value/100; $('vv').textContent=e.target.value; };
    $('pi').onchange=e=>c.fi=Math.max(0,+e.target.value); $('po').onchange=e=>c.fo=Math.max(0,+e.target.value);
    $('px').onchange=e=>{ c.fx=e.target.value; setFx(c); };
  }
  if($('sy')) $('sy').onclick=()=>autoSync(c,clips.find(x=>x.id==$('rf').value));
}

