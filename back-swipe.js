'use strict';
/* Edge swipe reuses the existing close actions, including their save/onboarding guards. */
(function installBackSwipe(){
  const layerSelector='[role="dialog"],.legal-modal,.overlay,.v41-dashboard-modal,.settings-modal-v36,.booking-picker-v37,.photo-modal,.notification-popup,.vacc-proof-viewer-v104';
  const visible=el=>el&&!el.closest('.hidden')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
  const customerActive=()=>document.getElementById('appView')&&!document.getElementById('appView').classList.contains('hidden')&&typeof state!=='undefined';
  const closeButton=top=>{
    // The compact reservation page hides its header; keep its original guarded close action.
    if(top.id==='bookingPickerV37'&&top.classList.contains('design-reservations-page')){
      const close=top.querySelector('#bookingPickerCloseV37');if(close&&!close.disabled)return close;
    }
    return [...top.querySelectorAll('button')].find(b=>visible(b)&&!b.disabled&&(/close|backBtn|ModalBack|CreateBack/i.test(b.id)||b.getAttribute('aria-label')==='Zavrieť'||b.getAttribute('aria-label')==='Zatvoriť'));
  };
  const visibleLayers=()=>[...document.querySelectorAll(layerSelector)].filter(visible).sort((a,b)=>(parseInt(getComputedStyle(a).zIndex)||0)-(parseInt(getComputedStyle(b).zIndex)||0));
  function customerOverview(){
    // Existing close handlers keep mandatory onboarding, unsaved drafts and busy guards.
    for(let i=0;i<12;i++){
      const top=visibleLayers().at(-1);if(!top)break;
      const close=closeButton(top);if(!close)return false;
      close.click();if(visible(top))return false;
    }
    if(visibleLayers().length)return false;
    switchTab('booking');window.scrollTo(0,0);return true;
  }
  function horizontalSurface(target){
    for(let el=target;el&&el!==document.body;el=el.parentElement){
      if(el.matches('.design-overview-carousel,#designBookingCarousel,.photo-modal,.photo-actions-modal,[data-swipe-ignore]'))return true;
      if(el.scrollWidth>el.clientWidth+2&&/auto|scroll/.test(getComputedStyle(el).overflowX))return true;
    }
    return false;
  }
  function backAction(){
    if(customerActive()){
      if(visible(document.getElementById('loading')))return null;
      const top=visibleLayers().at(-1);
      if(top)return closeButton(top)?customerOverview:null;
      return state.activeTab==='booking'?null:customerOverview;
    }
    const layers=[...document.querySelectorAll(layerSelector)].filter(visible);
    layers.sort((a,b)=>(parseInt(getComputedStyle(a).zIndex)||0)-(parseInt(getComputedStyle(b).zIndex)||0));
    const top=layers.at(-1);
    if(top){
      const buttons=[...top.querySelectorAll('button')];
      const close=buttons.find(b=>visible(b)&&!b.disabled&&(/close|backBtn|ModalBack|CreateBack/i.test(b.id)||b.getAttribute('aria-label')==='Zavrieť'||b.getAttribute('aria-label')==='Zatvoriť'));
      return close?()=>close.click():null;
    }
    // Root screens do not navigate out of the installed application.
    if(document.getElementById('dogDetail')){
      const back=document.getElementById('socialBackV1');if(visible(back))return ()=>back.click();
      const stats=document.getElementById('statsSection');if(visible(stats))return ()=>switchTab('menu');
    }else if(document.getElementById('appView')&&!document.getElementById('appView').classList.contains('hidden')&&typeof state!=='undefined'&&state.activeTab==='menu')return ()=>switchTab('booking');
    return null;
  }
  let start=null;
  // Reuse the very same guarded close actions for Android system back.
  document.addEventListener('chvo-native-back',event=>{
    const action=backAction();
    if(action){event.preventDefault();action();return;}
    if(visibleLayers().length||visible(document.getElementById('loading')))event.preventDefault();
  });
  document.addEventListener('touchstart',e=>{
    start=null;if(e.touches.length!==1)return;
    const t=e.touches[0];if(e.target.closest('input,textarea,select,[contenteditable="true"],canvas,[data-swipe-ignore],#photoCropModal,#photoActionsModalV89,.vacc-proof-viewer-v104'))return;
    if(customerActive()){if(t.clientX>44&&horizontalSurface(e.target))return;}
    else if(t.clientX>44)return;
    const action=backAction();if(action)start={x:t.clientX,y:t.clientY,id:t.identifier,time:Date.now(),action};
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!start)return;if(e.touches.length!==1){start=null;return}
    const t=e.touches[0],dx=t.clientX-start.x,dy=Math.abs(t.clientY-start.y);
    if(dy>40||dx< -12){start=null;return}
    if(dx>25&&dx>dy*2.2&&e.cancelable)e.preventDefault();
  },{passive:false});
  document.addEventListener('touchend',e=>{
    const s=start;start=null;if(!s||Date.now()-s.time>1000)return;
    const t=[...e.changedTouches].find(t=>t.identifier===s.id);if(!t)return;
    const dx=t.clientX-s.x,dy=Math.abs(t.clientY-s.y);
    if(dx<80||dy>40||dx<dy*2.2)return;
    if(e.cancelable)e.preventDefault();s.action();
  },{passive:false});
  document.addEventListener('touchcancel',()=>{start=null},{passive:true});
})();

