/* Isolated, frame-synchronised loading indicator; no application data access. */
(() => {
  'use strict';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const arcs=[...document.querySelectorAll('.concept-ring-arc')];
  const paws=[...document.querySelectorAll('.concept-orbit>.concept-paw')];
  let frame=0,previous=0,phase=0,breathe=0;
  const visible=arc=>!document.hidden&&!arc.closest('#loading')?.classList.contains('hidden');
  const draw=time=>{
    frame=0;
    if(!arcs.some(visible)){previous=0;return;}
    if(previous){
      const delta=Math.max(0,Math.min(time-previous,64));
      phase=(phase+delta/(reduced?.matches?4000:1800))%1;
      breathe=(breathe+delta/2200)%1;
    }
    previous=time;
    for(const arc of arcs)if(visible(arc))arc.style.strokeDashoffset=String(-100*phase);
    // HTML transforms have a stable centre on both WebKit and Android SVG renderers.
    const scale=reduced?.matches?1:1+.055*(.5-.5*Math.cos(2*Math.PI*breathe));
    for(const paw of paws)if(visible(paw))paw.style.transform='scale('+scale+')';
    frame=requestAnimationFrame(draw);
  };
  const resume=()=>{if(!frame&&arcs.some(visible))frame=requestAnimationFrame(draw);};
  for(const loading of new Set(arcs.map(arc=>arc.closest('#loading')).filter(Boolean)))
    new MutationObserver(resume).observe(loading,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',resume);
  reduced?.addEventListener?.('change',()=>{breathe=0;for(const paw of paws)paw.style.transform='scale(1)';resume();});
  resume();
})();

