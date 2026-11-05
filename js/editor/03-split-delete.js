/* ---- Potong & hapus ---- */
function splitAt(t){
  const c=sel; if(!c||t<=c.at+.02||t>=c.at+len(c)-.02) return null;
  const cut=c.s+(t-c.at)*(c.sp||1);
  const n=mk({type:c.type,url:c.url,name:c.name,track:c.track,at:t,s:cut,e:c.e,max:c.max,vol:c.vol,fi:0,fo:c.fo,fx:c.fx,sp:c.sp,txt:c.txt,fs:c.fs,col:c.col,bg:c.bg,px:c.px,py:c.py,bold:c.bold,sh:c.sh});
  c.e=cut; c.fo=0; return n;
}
function split(){
  const n=splitAt(T); if(!n) return say('Pilih klip, lalu letakkan garis merah di dalam klip itu.');
  sel=n; renderTL(); props();
}
function isolate(){      // bagian yang disorot menjadi klip sendiri
  const c=sel; if(!c||!RNG) { say('Pilih klip, lalu sorot bagian di penggaris waktu.'); return false; }
  const a=Math.max(RNG[0],c.at), b=Math.min(RNG[1],c.at+len(c));
  if(b-a<.05){ say('Sorotan berada di luar klip terpilih.'); return false; }
  splitAt(b); const n=splitAt(a); sel=n||c; RNG=null; showRg(); renderTL(); props(); return true;
}
function del(){
  if(!sel) return; if(sel.el&&sel.el.pause) sel.el.pause();
  clips=clips.filter(c=>c!==sel); sel=null; compact(); renderTL(); props(); seek(T);
}
$('bCut').onclick=split; $('bDel').onclick=del; $('bIso').onclick=isolate; $('bRmv').onclick=()=>{ if(isolate()) del(); }; $('bRgX').onclick=()=>{ RNG=null; showRg(); renderTL(); };

