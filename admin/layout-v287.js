(function(){
 const nav=document.getElementById('bottomNav');if(!nav)return;
 // Remove the old feedback correction: transformed bounds must never drive another transform.
 document.body.append(nav);let pending=0;
 function update(){pending=0;const height=nav.getBoundingClientRect().height;if(height>0){const reserve=Math.ceil(height+Math.max(8,parseFloat(getComputedStyle(nav).bottom)||0)+20)+'px';if(document.documentElement.style.getPropertyValue('--admin-nav-reserve')!==reserve)document.documentElement.style.setProperty('--admin-nav-reserve',reserve)}}
 function schedule(){if(!pending)pending=requestAnimationFrame(update)}
 if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(nav);
 window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});document.addEventListener('focusout',schedule);
 window.adminViewportNav275={schedule};schedule();
})();
