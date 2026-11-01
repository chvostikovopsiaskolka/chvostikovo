// Native and legacy revenue disclosures, no data queries or financial mutations.
export function installRevenueDisclosure(doc=document){
 const selector='[data-revenue-month],[data-revenue-year],#revenueTotalToggle';
 const bodyFor=el=>doc.getElementById(el.dataset.revenueMonth?'revenue-'+el.dataset.revenueMonth:el.dataset.revenueYear?'revenue-year-'+el.dataset.revenueYear:'revenueTotalBody');
 const arrow=(el,open)=>{const icon=el.querySelector('.chevron,.revenue-disclosure-icon');if(icon){icon.classList.remove('chevron','open');icon.classList.add('revenue-disclosure-icon');const text=open?'↑':'↓';if(icon.textContent!==text)icon.textContent=text;icon.setAttribute('aria-hidden','true');}};
 const sync=()=>{
  doc.querySelectorAll(selector).forEach(el=>{const body=bodyFor(el);if(!body)return;const open=!body.classList.contains('hidden');el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-expanded',String(open));el.setAttribute('aria-controls',body.id);arrow(el,open);});
  doc.querySelectorAll('details[data-revenue-week-detail]').forEach(el=>arrow(el.querySelector('summary'),el.open));
 };
 let frame=0;
 const reveal=el=>{el.style.scrollMarginTop='calc(env(safe-area-inset-top, 0px) + 16px)';el.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 doc.addEventListener('click',event=>{
  const el=event.target.closest(selector);if(!el)return;const before=el.getAttribute('aria-expanded')==='true';cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>requestAnimationFrame(()=>{sync();if(el.isConnected&&!before&&el.getAttribute('aria-expanded')==='true')reveal(el);}));
 },true);
 doc.addEventListener('keydown',event=>{const el=event.target.closest(selector);if(el&&event.target===el&&(event.key==='Enter'||event.key===' ')){event.preventDefault();el.click();}});
 doc.addEventListener('toggle',event=>{const el=event.target;if(el.matches?.('details[data-revenue-week-detail]')){sync();if(el.open)requestAnimationFrame(()=>reveal(el.querySelector('summary')));}},true);
 const root=doc.getElementById('statsSummary');if(root)new MutationObserver(sync).observe(root,{childList:true,subtree:true});sync();
}
