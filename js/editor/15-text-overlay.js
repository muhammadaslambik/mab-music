/* ---- Teks langsung di layar ---- */
function addText(){
  const nv=lanes('v'), track=clips.some(c=>kind(c)=='v')?Math.min(nv,MAXT-1):0;
  add(mk({type:'t',name:'Teks',track,at:insAt('t'),s:0,e:insEnd('t',4),txt:'Ketik teks di sini',fs:64,col:'#ffffff',bg:0,px:50,py:85,bold:1,sh:1}));
  setTimeout(()=>{ tOvShow(); $('tOv').focus(); $('tOv').select(); },60);
}
function tOvShow(){      // kotak ketik transparan tepat di atas teks pada layar
  const o=$('tOv'), c=sel; $('stage').classList.toggle('edt',!!(c&&c.type=='t'));
  if(!c||c.type!='t'||!c._box||exporting||!(T>=c.at&&T<c.at+len(c))){ o.classList.add('hidden'); return; }
  const p=cpt({clientX:0,clientY:0}), st=$('stage').getBoundingClientRect(), cr=cv.getBoundingClientRect();
  o.classList.remove('hidden');
  o.style.left=(cr.left-st.left+p.ox+c._box.x*p.s)+'px'; o.style.top=(cr.top-st.top+p.oy+c._box.y*p.s)+'px';
  o.style.width=c._box.w*p.s+'px'; o.style.height=c._box.h*p.s+'px'; o.style.fontSize=c.fs*p.s+'px'; o.style.fontWeight=c.bold?700:500; o.style.paddingTop=(10*p.s)+'px';
  if(o.dataset.id!=c.id){ o.value=c.txt; o.dataset.id=c.id; }
}
$('tOv').oninput=e=>{ const c=sel; c.txt=e.target.value; c.name=(c.txt.split('\n')[0]||'Teks').slice(0,24); if($('tt')) $('tt').value=c.txt; renderTL(); draw(); };
function propsText(c){
  const p=$('pr'), pos=[[15,12],[50,12],[85,12],[15,50],[50,50],[85,50],[15,88],[50,88],[85,88]];
  p.innerHTML=typeBadge(c)+'<label class="text-xs text-mist block">Teks (boleh diketik langsung di layar)<textarea id="tt" rows="3" class="w-full text-sm">'+esc(c.txt)+'</textarea></label>'+
   '<label class="text-xs text-mist block mt-2">Posisi mulai (detik)<input id="pa" type="number" step="0.001" min="0" value="'+c.at.toFixed(3)+'" class="w-full"></label>'+
   '<label class="text-xs text-mist block mt-2">Ukuran huruf <span id="fv">'+c.fs+'</span><input id="fs" type="range" min="16" max="200" value="'+c.fs+'" class="w-full"></label>'+
   '<div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-mist"><label>Warna <input id="tc" type="color" value="'+c.col+'"></label><label><input id="tb" type="checkbox"'+(c.bold?' checked':'')+'> Tebal</label><label><input id="tk" type="checkbox"'+(c.bg?' checked':'')+'> Kotak</label><label><input id="th" type="checkbox"'+(c.sh?' checked':'')+'> Bayangan</label></div>'+
   '<p class="text-xs text-mist mt-3 mb-1">Posisi otomatis</p><div class="grid grid-cols-3 gap-1 w-28">'+pos.map((q,i)=>'<button data-i="'+i+'" class="btn text-xs" aria-label="Posisi '+(i+1)+'">•</button>').join('')+'</div>'+
   '<label class="text-xs text-mist block mt-2">Geser kiri-kanan<input id="tx" type="range" min="0" max="100" value="'+c.px+'" class="w-full"></label>'+
   '<label class="text-xs text-mist block mt-1">Geser atas-bawah<input id="ty" type="range" min="0" max="100" value="'+c.py+'" class="w-full"></label>'+
   '<p class="text-xs text-mist mt-2">Lama tayang: seret tepi kanan klip teks di timeline. Seret teks di layar untuk memindahnya.</p>';
  const upd=()=>{ c.name=(c.txt.split('\n')[0]||'Teks').slice(0,24); renderTL(); draw(); tOvShow(); };
  $('tt').oninput=e=>{ c.txt=e.target.value; $('tOv').value=c.txt; upd(); };
  $('pa').onchange=e=>{ c.at=Math.max(0,+e.target.value); renderTL(); seek(T); };
  $('fs').oninput=e=>{ c.fs=+e.target.value; $('fv').textContent=c.fs; upd(); };
  $('tc').oninput=e=>{ c.col=e.target.value; draw(); };
  $('tb').onchange=e=>{ c.bold=e.target.checked?1:0; upd(); }; $('tk').onchange=e=>{ c.bg=e.target.checked?1:0; draw(); }; $('th').onchange=e=>{ c.sh=e.target.checked?1:0; draw(); };
  $('tx').oninput=e=>{ c.px=+e.target.value; upd(); }; $('ty').oninput=e=>{ c.py=+e.target.value; upd(); };
  p.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ const q=pos[+b.dataset.i]; c.px=q[0]; c.py=q[1]; $('tx').value=q[0]; $('ty').value=q[1]; upd(); });
}
$('bTxt').onclick=addText;

