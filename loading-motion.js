/* Isolated, frame-synchronised loading indicator; no application data access. */
(() => {
  'use strict';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const arcs=[...document.querySelectorAll('.concept-ring-arc')];
  let frame=0,previous=0,phase=0;
  const visible=arc=>!document.hidden&&!arc.closest('#loading')?.classList.contains('hidden');
  const draw=time=>{
    frame=0;
    if(!arcs.some(visible)){previous=0;return;}
    if(previous)phase=(phase+Math.min(time-previous,64)/(reduced?.matches?4000:1800))%1;
    previous=time;
    for(const arc of arcs)if(visible(arc))arc.style.strokeDashoffset=String(-100*phase);
    frame=requestAnimationFrame(draw);
  };
  const resume=()=>{if(!frame&&arcs.some(visible))frame=requestAnimationFrame(draw);};
  for(const loading of new Set(arcs.map(arc=>arc.closest('#loading')).filter(Boolean)))
    new MutationObserver(resume).observe(loading,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',resume);
  resume();
})();

