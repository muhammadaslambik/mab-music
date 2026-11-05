/* ---- Loading indicator for auto transcription: spinner + elapsed time (m:ss), also shown in the tab title ---- */
(function(){
  const go=$('trGo'), st=$('trSt'), baseTitle=document.title;
  const SPIN='inline-block w-4 h-4 rounded-full border-2 border-ember border-t-transparent animate-spin motion-reduce:animate-none';
  const ind=document.createElement('div');
  ind.className='hidden items-center gap-2 text-sm mt-2';
  ind.innerHTML='<span id="trSpin" class="'+SPIN+'"></span><span id="trTime" class="font-mono tabular-nums">0:00</span><span id="trLbl" class="text-xs text-mist">sedang diproses</span>';
  st.before(ind);
  const sp=ind.querySelector('#trSpin'), tm=ind.querySelector('#trTime'), lb=ind.querySelector('#trLbl');
  let timer=null, t0=0;
  const mmss=ms=>{ const s=Math.floor(ms/1000); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const show=on=>{ ind.classList.toggle('hidden',!on); ind.classList.toggle('flex',on); };
  function tick(){
    const t=mmss(Date.now()-t0); tm.textContent=t;
    if(trBusy){ document.title='⏳ '+t+' – '+baseTitle; return; }
    clearInterval(timer); timer=null; document.title=baseTitle;      // finished: swap the spinner for a result mark
    const ok=/^Selesai/.test(st.textContent);
    sp.className='text-base'; sp.textContent=ok?'✓':'⚠'; lb.textContent=ok?'selesai':'berhenti';
  }
  const prev=go.onclick;
  go.onclick=()=>{
    const was=trBusy; prev();
    if(was) return;                                  // a job is already running
    if(!trBusy){ show(false); return; }              // validation failed, nothing started
    t0=Date.now(); sp.className=SPIN; sp.textContent=''; lb.textContent='sedang diproses';
    show(true); clearInterval(timer); timer=setInterval(tick,500); tick();
  };
})();
