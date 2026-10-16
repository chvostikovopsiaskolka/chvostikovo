/* Correct measured iOS fixed-position drift, without moving the page or photos. */
(function adminViewportNavV275(){
 'use strict';
 const nav=document.getElementById('bottomNav');if(!nav)return;
 let frame=0,shift=0;
 function update(){
  frame=0;
  const viewport=window.visualViewport;
  if(viewport&&Math.abs(viewport.scale-1)>0.01)return;
  const rect=nav.getBoundingClientRect();
  if(rect.height<=0)return; // Existing hidden/detail/chat rules stay authoritative.
  const height=viewport?.height||window.innerHeight;
  const top=viewport?.offsetTop||0;
  const gap=parseFloat(getComputedStyle(nav).bottom)||8;
  const correction=top+height-gap-rect.bottom;
  if(!Number.isFinite(correction)||Math.abs(correction)<1)return;
  shift=Math.round((shift+correction)*100)/100;
  nav.style.setProperty('--admin-nav-shift-v275',shift+'px');
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update)}
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('orientationchange',schedule,{passive:true});
 window.addEventListener('pageshow',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
 document.addEventListener('focusout',schedule);
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
 observer?.observe(nav);
 new MutationObserver(schedule).observe(nav,{attributes:true,attributeFilter:['class']});
 window.adminViewportNav275={schedule};schedule();
})();
