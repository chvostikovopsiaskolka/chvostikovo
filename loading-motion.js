/* Small, isolated loading indicator. No startup waits or application data access. */
(() => {
  'use strict';
  const started=Date.now();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const draw=()=>{
    if(document.hidden)return;
    const period=reduced?.matches?4000:1800;
    document.querySelectorAll('.concept-ring-arc').forEach(arc=>{
      const loading=arc.closest('#loading');
      if(loading?.classList.contains('hidden'))return;
      // A timer drives this tiny status arc even when iOS suppresses CSS animations.
      arc.style.strokeDashoffset=String(-100*((Date.now()-started)%period)/period);
    });
  };
  draw();
  window.setInterval(draw,80);
  document.addEventListener('visibilitychange',draw);
})();
