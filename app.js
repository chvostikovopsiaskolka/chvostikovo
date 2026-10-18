
function createCompactChatLayout(modal,card,thread,input){
 let frame=0,preferred=0,baselineHeight=0,stickToBottom=true;
 const nearBottom=()=>thread.scrollHeight-thread.scrollTop-thread.clientHeight<90;
 function latest(){requestAnimationFrame(()=>{thread.scrollTop=thread.scrollHeight;stickToBottom=true})}
 function resizeInput(){
  const keep=stickToBottom||nearBottom();
  input.style.height='0px';
  const style=getComputedStyle(input),line=parseFloat(style.lineHeight)||24;
  const padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom),border=parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
  const max=line*3+padding+border;
  input.style.height=Math.min(input.scrollHeight+border,max)+'px';
  input.style.overflowY=input.scrollHeight+border>max?'auto':'hidden';
  if(keep)latest();
 }
 function layout(force=false){
  frame=0;if(!force&&modal.classList.contains('hidden'))return;
  const v=window.visualViewport;
  const h=Math.max(200,Math.round(v?.height||innerHeight||document.documentElement.clientHeight));
  const top=Math.max(0,Math.round(v?.offsetTop||0));
  baselineHeight=Math.max(baselineHeight,h);
  const keyboardOpen=baselineHeight-h>80;
  const topGap=keyboardOpen?8:12,bottomGap=keyboardOpen?18:12;
  if(!preferred){
    const full=Math.max(document.documentElement.clientHeight||0,innerHeight||0,baselineHeight,h);
    preferred=Math.min(560,Math.max(320,full*.56));
  }
  const cardHeight=Math.min(preferred,Math.max(180,h-topGap-bottomGap));
  const cardTop=top+Math.max(topGap,Math.round((h-cardHeight)/2));
  modal.style.setProperty('--chat-card-top',cardTop+'px');
  modal.style.setProperty('--chat-card-height',cardHeight+'px');
  if(stickToBottom||document.activeElement===input)latest();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>layout(false))}
 thread.addEventListener('scroll',()=>{stickToBottom=nearBottom()},{passive:true});
 input.addEventListener('input',resizeInput);
 input.addEventListener('focus',()=>{stickToBottom=true;schedule();latest()});
 input.addEventListener('blur',schedule);
 window.visualViewport?.addEventListener('resize',schedule);
 window.visualViewport?.addEventListener('scroll',schedule);
 window.addEventListener('resize',schedule);
 modal.addEventListener('touchmove',event=>{
  const target=event.target;
  if(thread.contains(target)||input.contains(target))return;
  event.preventDefault();
 },{passive:false});
 return {
  prepare(){preferred=0;baselineHeight=0;stickToBottom=true;layout(true)},
  open(){layout(true);resizeInput();latest()},
  close(){input.blur();if(frame)cancelAnimationFrame(frame);frame=0;modal.style.removeProperty('--chat-card-top');modal.style.removeProperty('--chat-card-height')},
  resizeInput,latest
 };
}
(function preservePhoneLayout(){
    // Screen dimensions remain stable when the keyboard opens or the phone rotates.
    if (matchMedia('(pointer:coarse)').matches) {
      const portraitWidth = Math.min(screen.width, screen.height);
      if (portraitWidth >= 280 && portraitWidth <= 520) {
        document.documentElement.style.setProperty('--phone-portrait-width', portraitWidth + 'px');
        document.documentElement.classList.add('phone-portrait-layout');
      }
    }

})();
'use strict';

/* v30: hard zoom lock for installed customer PWA on iOS */
(function customerPwaZoomLockV30(){
  const standalone=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;
  const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent); if(!standalone||!isiOS||window.__chvostikovoCustomerZoomLockV30)return;
  window.__chvostikovoCustomerZoomLockV30=true;
  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport)viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  document.documentElement.style.touchAction='pan-x pan-y';
  document.body?.style.setProperty('touch-action','pan-x pan-y');
  const blockMultiTouch=e=>{if(e.touches&&e.touches.length>1)e.preventDefault()};
  document.addEventListener('touchstart',blockMultiTouch,{passive:false,capture:true});
  document.addEventListener('touchmove',blockMultiTouch,{passive:false,capture:true});
  ['gesturestart','gesturechange','gestureend'].forEach(type=>document.addEventListener(type,e=>e.preventDefault(),{passive:false,capture:true}));
  let tapStart=null,lastTap=null;
  document.addEventListener('touchstart',e=>{const t=e.touches[0];tapStart=e.touches.length===1?{x:t.clientX,y:t.clientY,moved:false}:null},{passive:true,capture:true});
  document.addEventListener('touchmove',e=>{const t=e.touches[0];if(tapStart&&t&&(Math.abs(t.clientX-tapStart.x)>8||Math.abs(t.clientY-tapStart.y)>8))tapStart.moved=true},{passive:true,capture:true});
  document.addEventListener('touchend',e=>{const start=tapStart;tapStart=null;if(!start||start.moved){lastTap=null;return}const now=Date.now();if(lastTap&&now-lastTap.at<280&&Math.abs(start.x-lastTap.x)<20&&Math.abs(start.y-lastTap.y)<20&&e.cancelable)e.preventDefault();lastTap={...start,at:now}},{passive:false,capture:true});
  document.addEventListener('touchcancel',()=>{tapStart=null;lastTap=null},{passive:true,capture:true});
})();
const APP_BUILD='20261018-photo-chooser-v301';
const APP_VERSION='1.0.117';
const CUSTOMER_IOS_V171=(()=>{
  const ua=navigator.userAgent||'';
  const iOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  document.documentElement.classList.toggle('customer-ios-v171',iOS);
  return iOS;
})();
// iOS home-screen badge follows unread customer data, not the number of received pushes.
const CUSTOMER_BADGE_EXCLUDED_V186=new Set(['staff_message_customer','customer_message_admin','pass_request_admin','pass_interest_registered','dog_approved','weekly_booking_reminder','weekly_booking_reminder_test']);
function customerUnreadBadgeCountV186(){
  if(!state.session||!state.data)return null;
  const messages=(state.data.messages||[]).filter(m=>m.sender_role==='staff'&&!m.read_at).length;
  const notices=(state.data.notifications||[]).filter(n=>!n.read_at&&!CUSTOMER_BADGE_EXCLUDED_V186.has(n.notification_type)&&careNotificationIsCurrent(n)).length;
  return messages+notices;
}
async function setCustomerAppBadgeV186(count){
  if(!CUSTOMER_IOS_V171)return;
  const safe=Math.max(0,Math.floor(Number(count)||0));
  try{
    if(safe>0&&'setAppBadge' in navigator)await navigator.setAppBadge(safe);
    else if(safe===0&&'clearAppBadge' in navigator)await navigator.clearAppBadge();
    else if(safe===0&&'setAppBadge' in navigator)await navigator.setAppBadge(0);
  }catch(_){}
  if(!('serviceWorker' in navigator))return;
  try{
    const message={type:'SET_CUSTOMER_BADGE_COUNT_V186',count:safe,updatedAt:Date.now()};
    if(navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage(message);
    else (await navigator.serviceWorker.ready).active?.postMessage(message);
  }catch(_){}
}
function syncCustomerAppBadgeV186(){
  const count=customerUnreadBadgeCountV186();
  if(count!==null)void setCustomerAppBadgeV186(count);
}
async function clearCustomerAppBadgeV171(){await setCustomerAppBadgeV186(0);}


const termsVersionLabel=version=>window.customerTermsVersionLabel(version);
const TERMS_ACCEPTANCE_TEXT='Potvrdzujem, že som si Podmienky psej škôlky Chvostíkovo prečítal/a, ich obsahu rozumiem a súhlasím s nimi.';
const CUSTOMER_PUBLIC_URL='https://app.chvostikovo.sk/';
const CUSTOMER_EMAIL_CONFIRM_URL=CUSTOMER_PUBLIC_URL+'email-confirmed.html';
const SUPABASE_URL='https://tlhcqwsluyqpywymjoxn.supabase.co';
const SUPABASE_KEY='sb_publishable_43vD4AvQwchu1V2MwDbniA_j2tLiLi_';
const API=SUPABASE_URL+'/functions/v1/customer-portal-api';
const PUSH_API=SUPABASE_URL+'/functions/v1/admin-push';
const VAPID='BCFhf2kRc1P8blGDHKugmyBhCOfa-x8qbYSMo_qeO-650GSxg3I6naMHVqFTs7UOrTXotemfg9LhNElm56Zhv6k';
const SESSION_KEY='chvostikovo_customer_session';
const PASSWORD_MIN_MESSAGE='Minimálne 8 znakov, malé a veľké písmeno a aspoň 1 číslica.';
const PASSWORD_STRONG_RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
let state={data:null,session:null,storage:localStorage,selectedDogId:null,activeTab:'booking',pushChecked:false,pushEnabled:false};
// One concurrent read for onboarding, settings and rules; never share account state.
let customerTermsReadV146=null;
let bootstrapInFlight=null,lastResumeRefresh=0;
async function readActiveCustomerTermsV146(force=false){
  const session=state.session;if(!session)return null;
  const key=String(session.user?.id||'')+'|'+session.access_token;
  const current=customerTermsReadV146;
  if(current?.key===key&&(current.pending||(!force&&Date.now()-current.at<60000)))return current.promise;
  const entry={key,at:Date.now(),pending:true,promise:null};
  entry.promise=(async()=>{
    const now=new Date().toISOString();
    const r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_documents?active=eq.true&effective_from=lte.'+encodeURIComponent(now)+'&select=id,version,title,body,document_hash,effective_from&order=effective_from.desc&limit=1',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token},cache:'no-store'});
    if(!r.ok)throw new Error('Pravidlá sa nepodarilo načítať.');
    const rows=await r.json();return rows?.[0]||null;
  })();
  customerTermsReadV146=entry;
  try{return await entry.promise}catch(error){if(customerTermsReadV146===entry)customerTermsReadV146=null;throw error}finally{entry.pending=false}
}
const customerHooks={
  afterRenderPassSummary:[],
  afterRenderDog:[],
  afterRenderMessages:[],
  afterUpdateUnread:[],
  afterRenderStaff:[],
  afterApi:[],
  afterBootstrap:[],
  afterSwitchTab:[]
};
const customerRenderers={announcements:null,upcoming:null,days:null};
function addCustomerHook(name,fn){if(typeof fn==='function'&&customerHooks[name])customerHooks[name].push(fn)}
function runCustomerHooks(name,...args){for(const fn of customerHooks[name]||[]){try{fn(...args)}catch(error){console.warn('Customer hook failed',name,error)}}}

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skDate=v=>{if(!v)return'';try{return new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',year:'numeric'}).format(new Date(String(v).slice(0,10)+'T12:00:00'))}catch(_){return String(v)}};
const skDay=v=>{try{return new Intl.DateTimeFormat('sk-SK',{weekday:'long'}).format(new Date(v+'T12:00:00'))}catch(_){return''}};
const skTime=v=>{try{return new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(_){return''}};
function bratislavaToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),map=Object.fromEntries(parts.map(x=>[x.type,x.value]));return map.year+'-'+map.month+'-'+map.day}
function dogAgeParts(birthDate,today=bratislavaToday()){if(!birthDate)return null;const b=String(birthDate).slice(0,10).split('-').map(Number),t=String(today).slice(0,10).split('-').map(Number);if(b.length!==3||t.length!==3||b.some(Number.isNaN)||t.some(Number.isNaN))return null;let months=(t[0]-b[0])*12+t[1]-b[1]-(t[2]<b[2]?1:0);if(months<0)return null;return{months,years:Math.floor(months/12)}}
function dogAgeText(birthDate,today){const age=dogAgeParts(birthDate,today);if(!age)return'';if(age.months<12){if(age.months===0)return'menej ako mesiac';if(age.months===1)return'1 mesiac';if(age.months>=2&&age.months<=4)return age.months+' mesiace';return age.months+' mesiacov'}if(age.years===1)return'1 rok';if(age.years>=2&&age.years<=4)return age.years+' roky';return age.years+' rokov'}
function toast(msg,duration=3300){const el=$('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),duration)}
function loading(on){const el=$('loading');if(!el)return;const inApp=!!on&&!$('appView')?.classList.contains('hidden');el.classList.toggle('in-app',inApp);el.classList.toggle('hidden',!on);if(!on){el.classList.remove('in-app');scheduleCustomerUpdateApply()}}
function box(type,msg){return `<div class="${type}-box">${esc(msg)}</div>`}
function authMessage(type,msg){$('authMessage').innerHTML=box(type,msg)}
function currentSession(){for(const s of [localStorage,sessionStorage]){try{const x=JSON.parse(s.getItem(SESSION_KEY)||'null');if(x?.access_token){state.storage=s;return x}}catch(_){}}return null}
function saveSession(s,remember=true){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);state.storage=remember?localStorage:sessionStorage;state.storage.setItem(SESSION_KEY,JSON.stringify(s));state.session=s}
function clearSession(){void clearCustomerAppBadgeV171();localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);state.session=null;state.data=null;state.selectedDogId=0;clearVaccinationProofStageV104();stopCustomerLive();['passInterestConfirmationV44','schoolTermsModal','schoolTermsReadModal','schoolRulesModalV55','dogDetailsModal','privacyInfoModal','waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75','announcementModalV75','betaVersionModal'].forEach(id=>$(id)?.classList.add('hidden'));window.__customerOnboardingCompleteV75=false}
async function authFetch(path,opts={}){const r=await fetch(SUPABASE_URL+path,{...opts,headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',...(opts.headers||{})}});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok){const error=new Error(data?.msg||data?.error_description||data?.message||'Požiadavka sa nepodarila.');error.code=data?.code||data?.error_code||'';throw error}return data}
let sessionRefreshInFlight=null;
async function refreshSession(){
  if(sessionRefreshInFlight)return sessionRefreshInFlight;
  if(!state.session?.refresh_token)throw new Error('Prihlásenie vypršalo.');
  const token=state.session.refresh_token,remember=state.storage===localStorage;
  const run=(async()=>{const s=await authFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:token})});saveSession(s,remember);startCustomerLive(true);return s})();
  sessionRefreshInFlight=run;
  try{return await run}finally{sessionRefreshInFlight=null}
}
// A quote is read-only: retry a broken transport once without repeating a booking write.
async function sharedQuoteResponseV265(opts){
  for(let attempt=0;attempt<2;attempt++){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(API,{...opts,signal:controller.signal});
      const text=await response.text();return {response,text};
    }catch(error){
      if(attempt===0&&navigator.onLine!==false)continue;
      throw new Error('Nepodarilo sa spojiť so škôlkou. Skontrolujte pripojenie a skúste rezerváciu znova.');
    }finally{clearTimeout(timer)}
  }
}
async function apiCore(body=null,retry=true){if(!state.session)throw new Error('Najprv sa prihláste.');const token=state.session.access_token,opts={method:body?'POST':'GET',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'}};if(body)opts.body=JSON.stringify(body);const quote=body?.action==='shared_booking_v257'&&!body.operation_id;const result=quote?await sharedQuoteResponseV265(opts):null;const r=result?result.response:await fetch(API,opts);const txt=result?result.text:await r.text();let data={};try{data=txt?JSON.parse(txt):{}}catch(_){data={error:txt}}if(r.status===401&&retry){if(state.session.access_token===token)await refreshSession();return apiCore(body,false)}if(!r.ok||data.error)throw new Error(data.error||'Požiadavka sa nepodarila.');return data}
let customerApiMutationsInFlight=0;
async function api(body=null,retry=true){if(body)customerApiMutationsInFlight++;try{const result=await apiCore(body,retry);runCustomerHooks('afterApi',body,result);return result}finally{if(body)customerApiMutationsInFlight--;scheduleCustomerUpdateApply()}}
function showAuth(mode='login'){$('supportChatBtnV52')?.classList.add('hidden');$('supportChatModalV52')?.classList.add('hidden');document.documentElement.classList.remove('support-chat-open-v52');document.documentElement.classList.remove('customer-awaiting-dog-v107');$('appView').inert=false;$('appView').classList.add('hidden');$('authView').inert=false;$('authView').classList.remove('hidden');for(const id of ['loginForm','signupForm','forgotForm','newPasswordForm'])$(id).classList.add('hidden');$('showLogin').classList.toggle('active',mode==='login');$('showSignup').classList.toggle('active',mode==='signup');$(mode==='signup'?'signupForm':mode==='forgot'?'forgotForm':mode==='newPassword'?'newPasswordForm':'loginForm').classList.remove('hidden')}
function showApp(){$('authView').classList.add('hidden');$('authView').inert=true;$('appView').classList.remove('hidden')}
function pluralDogs(n){return n===1?'1 prihlásený psík':n+' prihlásených psíkov'}
function taxiLabel(mode){if(mode==='pickup')return'🚕 vyzdvihnutie/odvoz';if(mode==='pickup_dropoff')return'🚕 vyzdvihnutie aj dovoz';return''}
function selectedDog(){const dogs=state.data?.dogs||[];return dogs.find(d=>Number(d.id)===Number(state.selectedDogId))||dogs[0]||null}
function dogName(id){return (state.data?.dogs||[]).find(d=>Number(d.id)===Number(id))?.name||'Psík'}

function dogPhotoIdentityV260(dog){return [state.session?.user?.id||'',dog?.id,dog?.photo_path||String(dog?.photo_url||'').split('?')[0],dog?.photo_updated_at||''].join('|')}
function updateDogPhotoV260(root,dog,alt='Fotka psíka'){
  if(!root)return;
  const key=dogPhotoIdentityV260(dog);
  if(root.dataset.dogPhotoV260!==key){
    root.replaceChildren();root.dataset.dogPhotoV260=key;
    if(dog?.photo_url){const img=document.createElement('img');img.src=dog.photo_url;img.decoding='async';img.alt=alt;root.append(img)}else root.textContent='🐾';
  }
  const img=root.querySelector('img');if(img)img.alt=alt;
  stabilizeDogVisualV218(root);
}
// Keep a decoded/cached photo in the DOM; only reveal new images after they load.
function stabilizeDogVisualV218(root){
  if(!root)return;
  root.querySelectorAll('img').forEach(img=>{
    if(img.dataset.photoBoundV218==='1')return;
    img.dataset.photoBoundV218='1';
    const ready=()=>img.classList.add('photo-ready-v218');
    if(img.complete&&img.naturalWidth>0)ready();
    else img.addEventListener('load',ready,{once:true});
  });
}
async function preloadDogVisualV56(data=state.data){
  await Promise.all((data?.dogs||[]).map(async dog=>{
    const key=dogPhotoIdentityV260(dog);
    if(!dog.photo_url||[...document.querySelectorAll('[data-dog-photo-v260]')].some(el=>el.dataset.dogPhotoV260===key&&el.querySelector('img')))return;
    try{const img=new Image();img.src=dog.photo_url;const ready=typeof img.decode==='function'?img.decode():new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});await Promise.race([ready,new Promise(resolve=>setTimeout(resolve,1500))])}catch(_){}
  }));
}

async function settleCustomerFirstPhotosV291(limit=850){
 const images=[...($('appView')?.querySelectorAll('img')||[])].filter(img=>img.getAttribute('src')&&!img.closest('.hidden')).slice(0,24);
 if(!images.length)return;
 const ready=Promise.allSettled(images.map(async img=>{
   if(!img.complete)await new Promise(resolve=>{
     const done=()=>{img.removeEventListener('load',done);img.removeEventListener('error',done);resolve()};
     img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});
     if(img.complete)done();
   });
   if(img.complete&&img.naturalWidth>0&&typeof img.decode==='function')await img.decode().catch(()=>{});
 }));
 await Promise.race([ready,new Promise(resolve=>setTimeout(resolve,limit))]);
}

function bootstrapCore(showSpinner=true){
  if(bootstrapInFlight)return bootstrapInFlight;
  if(showSpinner)loading(true);
  const run=(async()=>{try{
    const d=await api();state.data=d;
    const hasAssignedDog=!!d.dogs?.length;
    document.documentElement.classList.toggle('customer-awaiting-dog-v107',!hasAssignedDog);
    if(!state.selectedDogId&&hasAssignedDog)state.selectedDogId=Number(d.dogs[0].id);
    // v291: Keep the existing loader over the first data/photo/notice render.
    // No fake "no notices" flash; never remount an unchanged image after revealing.
    await Promise.race([
      Promise.allSettled([preloadDogVisualV56(d),loadAnnouncements()]),
      new Promise(resolve=>setTimeout(resolve,2300))
    ]);
    showApp();renderAll();
    await settleCustomerFirstPhotosV291(850);
    startCustomerLive();
    if(typeof ensurePushState==='function')Promise.resolve(ensurePushState()).finally(()=>{
      if(state.data&&typeof applyPushToggle==='function')applyPushToggle();
    });
  }catch(e){
    const message=String(e?.message||'');
    const staleAuth=/prihl|vypršalo|refresh\s*token|invalid\s+(?:refresh\s+)?token|jwt|token\s+not\s+found|unauthorized/i.test(message);
    if(staleAuth){
      clearSession();
      showAuth('login');
      if($('authMessage'))$('authMessage').innerHTML='';
      const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
      if(!standalone){
        sessionStorage.removeItem('chvostikovo_install_guide_seen_v1');
        setTimeout(()=>document.getElementById('installHelpLink')?.click(),220);
      }
    }else{if($('appView')?.classList.contains('hidden'))showAuth('login');toast(message||'Aplikáciu sa nepodarilo načítať.');}
  }})();
  bootstrapInFlight=run.finally(()=>{if(showSpinner)loading(false);bootstrapInFlight=null});
  return bootstrapInFlight;
}
async function bootstrap(showSpinner=true){const result=await bootstrapCore(showSpinner);runCustomerHooks('afterBootstrap',result);return result}
function renderUpcoming(){return typeof customerRenderers.upcoming==='function'?customerRenderers.upcoming():undefined}
function overviewClock(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),m=Object.fromEntries(parts.map(p=>[p.type,p.value]));return {date:m.year+'-'+m.month+'-'+m.day,minutes:Number(m.hour)*60+Number(m.minute)}}
function overviewDayVisible(date,clock=overviewClock()){return date>clock.date||date===clock.date&&clock.minutes<18*60}
let overviewCutoffTimer=null;
function scheduleOverviewCutoff(){clearTimeout(overviewCutoffTimer);overviewCutoffTimer=null;if(document.visibilityState!=='visible'||!state.data)return;const now=new Date(),clock=overviewClock(now),minutes=clock.minutes<1080?1080-clock.minutes:1440-clock.minutes;overviewCutoffTimer=setTimeout(()=>{overviewCutoffTimer=null;renderDays()},Math.max(1000,minutes*60000-now.getSeconds()*1000-now.getMilliseconds()))}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.data)renderDays();else{clearTimeout(overviewCutoffTimer);overviewCutoffTimer=null}});
function renderDays(){const out=typeof customerRenderers.days==='function'?customerRenderers.days():undefined;scheduleOverviewCutoff();return out}
function renderAll(){renderWeekHeader();renderNotifications();renderPassSummary();renderUpcoming();renderDays();renderMessages();renderDogSelector();renderDog();renderProfile();renderStaff();updateUnread()}

/* consolidated stability: unchanged resume data does not touch the DOM */
function customerDataFingerprintV18(data){
  try{
    return JSON.stringify(data??null,(key,value)=>{
      if(key==='photo_url'||key==='image_url'||key==='imageUrl'||key==='signed_url'||key==='signedUrl')return undefined;
      return value;
    });
  }catch(_){return ''}
}
function nextPaintV18(fn){
  return new Promise(resolve=>requestAnimationFrame(()=>{try{fn()}finally{resolve()}}));
}

/* v45: one authenticated Realtime socket, coalesced component resyncs, and resume recovery. */
let customerLiveSocket=null,customerLiveHeartbeat=0,customerLiveReconnect=0,customerLiveAttempt=0,customerSyncTimer=0,customerSyncInFlight=null;
const customerPendingScopes=new Set();
function customerLiveRecord(message){return message?.payload?.data?.record||message?.payload?.record||message?.payload?.data?.new||null}
function queueCustomerSync(scope='all',delay=180){customerPendingScopes.add(scope);clearTimeout(customerSyncTimer);customerSyncTimer=setTimeout(flushCustomerSync,delay)}
async function flushCustomerSync(){
  if(customerSyncInFlight){customerPendingScopes.add('all');return customerSyncInFlight}
  if(!state.session||document.visibilityState==='hidden')return;
  const scopes=new Set(customerPendingScopes);customerPendingScopes.clear();
  customerSyncInFlight=(async()=>{try{
    const mutationRevision=customerMutationRevisionV145;
    const previousData=state.data;
    const previousFingerprint=customerDataFingerprintV18(previousData);
    const previousDogs=new Map((previousData?.dogs||[]).map(d=>[Number(d.id),d]));
    const next=await api();
    if(dogSaveInFlightV145||mutationRevision!==customerMutationRevisionV145){customerPendingScopes.add('all');return}

    for(const dog of (next.dogs||[])){
      const previous=previousDogs.get(Number(dog.id));
      const samePhoto=previous&&String(previous.photo_path||'')===String(dog.photo_path||'')&&String(previous.photo_updated_at||'')===String(dog.photo_updated_at||'');
      if(samePhoto&&previous?.photo_url)dog.photo_url=previous.photo_url;
      else if(dog.photo_path&&!dog.photo_url&&previous?.photo_url&&String(dog.photo_path)===String(previous.photo_path))dog.photo_url=previous.photo_url;
    }

    const nextFingerprint=customerDataFingerprintV18(next);
    state.data=next;
    syncCustomerAppBadgeV186();
    const nextDogs=next.dogs||[];
    if(!state.selectedDogId&&nextDogs.length)state.selectedDogId=Number(nextDogs[0].id);
    if(state.selectedDogId&&!nextDogs.some(d=>Number(d.id)===Number(state.selectedDogId)))state.selectedDogId=nextDogs.length?Number(nextDogs[0].id):null;

    // Same build + same data = keep the existing DOM exactly as it is.
    if(previousData&&previousFingerprint===nextFingerprint){
      return;
    }

    const all=scopes.has('all')||previousDogs.size!==nextDogs.length;
    const renderDogNeeded=all||scopes.has('passes')||scopes.has('dog');
    if(renderDogNeeded)await preloadDogVisualV56(next);

    await nextPaintV18(()=>{
      if(all||scopes.has('bookings')){
        renderWeekHeader();
        renderUpcoming();
        renderDays();
      }
      if(all||scopes.has('messages')){
        renderMessages();
        updateUnread();
      }
      if(all||scopes.has('passes')||scopes.has('bookings'))renderPassSummary();
      if(all||scopes.has('dog')){
        renderDogSelector();
        renderProfile();
      }
      if(renderDogNeeded)renderDog();
      if(all||scopes.has('notifications'))renderNotifications();
      renderStaff();
      if(typeof window.runCustomerOnboardingV75==='function')window.runCustomerOnboardingV75();
    });

    if(all||scopes.has('announcements'))await loadAnnouncements();
  }catch(error){
    if(navigator.onLine)console.warn('Live resync zlyhal',error)
  }finally{
    customerSyncInFlight=null;
    if(customerPendingScopes.size)queueCustomerSync('all',80)
  }})();
  return customerSyncInFlight;
}
function customerScopeForMessage(message){
  const table=message?.payload?.data?.table||message?.payload?.table||'';
  if(table==='portal_live_events')return customerLiveRecord(message)?.scope||'all';
  if(table==='customer_booking_requests'||table==='portal_day_settings')return 'bookings';
  if(table==='customer_pass_requests')return 'passes';
  if(table==='portal_announcements')return 'announcements';
  if(table==='portal_notifications'){
    const type=String(customerLiveRecord(message)?.notification_type||'');
    if(type==='dog_approved')return 'all';
    if(type.includes('message'))return 'messages';if(type.includes('pass'))return 'passes';if(type.includes('announcement'))return 'announcements';return 'bookings';
  }
  if(['customer_dog_submissions','customer_owner_links','dogs','vaccinations','portal_dog_onboarding','portal_terms_acceptances'].includes(table))return 'all';
  return 'all';
}
function scheduleCustomerReconnect(){if(!state.session||customerLiveReconnect)return;const wait=[1000,2000,5000,10000,20000,30000][Math.min(customerLiveAttempt++,5)];customerLiveReconnect=setTimeout(()=>{customerLiveReconnect=0;startCustomerLive(true)},wait)}
function stopCustomerLive(){clearInterval(customerLiveHeartbeat);clearTimeout(customerLiveReconnect);customerLiveHeartbeat=customerLiveReconnect=0;if(customerLiveSocket){const socket=customerLiveSocket;customerLiveSocket=null;try{socket.close()}catch(_){}}}
function startCustomerLive(force=false){
  if(!state.session?.access_token||document.visibilityState==='hidden')return;
  if(customerLiveSocket&&!force&&[WebSocket.OPEN,WebSocket.CONNECTING].includes(customerLiveSocket.readyState))return;
  stopCustomerLive();
  const url=SUPABASE_URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SUPABASE_KEY)+'&vsn=1.0.3';
  let socket;try{socket=new WebSocket(url)}catch(error){console.warn('Realtime spojenie sa nepodarilo otvoriť',error);scheduleCustomerReconnect();return}customerLiveSocket=socket;
  socket.onopen=()=>{if(socket!==customerLiveSocket)return;customerLiveAttempt=0;const changes=['customer_booking_requests','customer_pass_requests','portal_notifications','portal_announcements','portal_day_settings','portal_live_events','customer_dog_submissions','customer_owner_links','dogs','vaccinations'].map(table=>({event:'*',schema:'public',table}));socket.send(JSON.stringify({topic:'realtime:customer-portal',event:'phx_join',payload:{config:{broadcast:{ack:false,self:false},presence:{enabled:false},postgres_changes:changes,private:false},access_token:state.session.access_token},ref:'1',join_ref:'1'}));customerLiveHeartbeat=setInterval(()=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(Date.now()),join_ref:null}))},20000);scheduleWaitingDogFallbackV101()};
  socket.onmessage=event=>{try{const message=JSON.parse(event.data);if(message.event==='postgres_changes')queueCustomerSync(customerScopeForMessage(message))}catch(_){}};
  socket.onerror=()=>{};socket.onclose=()=>{if(socket!==customerLiveSocket)return;customerLiveSocket=null;clearInterval(customerLiveHeartbeat);customerLiveHeartbeat=0;scheduleCustomerReconnect()};
}
function renderWeekHeader(){const days=state.data?.availability?.days||[];const el=$('weekTitle');if(!el)return;if(!days.length){el.textContent='Nasledujúce dni';return}const a=String(days[0].date||''),b=String(days[days.length-1].date||'');const pa=a.split('-').map(Number),pb=b.split('-').map(Number);if(pa.length<3||pb.length<3){el.textContent='Nasledujúce dni';return}el.textContent=pa[0]===pb[0]?`${pa[2]}. ${pa[1]}. – ${pb[2]}. ${pb[1]}. ${pb[0]}`:`${pa[2]}. ${pa[1]}. ${pa[0]} – ${pb[2]}. ${pb[1]}. ${pb[0]}`}
function careNotificationIsCurrent(n,today=bratislavaToday()){if(n.visible_from&&n.visible_from>today)return false;if(n.visible_until&&n.visible_until<today)return false;if(n.notification_type==='vaccination_expiry'){const vaccination=(state.data?.vaccinations||[]).find(v=>Number(v.id)===Number(n.entity_id));return !!vaccination?.valid_until&&vaccination.valid_until>=today&&n.event_key===`vaccination:${vaccination.dog_id}:${vaccination.vaccination_type}:${vaccination.valid_until}`}if(n.notification_type==='pass_expiry'){const pass=(state.data?.passes||[]).find(p=>Number(p.id)===Number(n.entity_id));const remaining=pass?Number(pass.total_entries)-Number(pass.used_entries):0;return !!pass&&pass.status==='active'&&pass.no_expiry!==true&&remaining>2&&pass.valid_until>=today&&n.event_key===`pass_expiry:${pass.id}:${pass.valid_until}:14`}if(n.notification_type==='dog_birthday'){const dog=(state.data?.dogs||[]).find(d=>Number(d.id)===Number(n.entity_id));return !!dog?.birth_date&&String(dog.birth_date).slice(5)===today.slice(5)}return true}
const customerClosedNotificationIdsV59=new Set();
function customerCareAction(n){
  $('notificationPopup')?.classList.add('hidden');
  if(n.notification_type==='pass_expiry'){
    const pass=(state.data?.passes||[]).find(p=>Number(p.id)===Number(n.entity_id));
    if(pass){state.selectedDogId=Number(pass.dog_id);renderDogSelector();renderDog()}
    switchTab('booking');
    const openPicker=window.openBookingPickerV37;
    if(typeof openPicker==='function')setTimeout(()=>openPicker(),0);
    else setTimeout(()=>$('openBookingPickerV37')?.click(),0);
  }else{
    const vaccination=(state.data?.vaccinations||[]).find(v=>Number(v.id)===Number(n.entity_id));
    if(vaccination){state.selectedDogId=Number(vaccination.dog_id);renderDogSelector();renderDog()}
    switchTab('menu');openDogDetails('vaccinations',false);
  }
}
function vaccinationCopyV234(n){
  const body=String(n.body||'');
  if(n.notification_type!=='vaccination_expiry')return body;
  const record=(state.data?.vaccinations||[]).find(v=>Number(v.id)===Number(n.entity_id));
  if(record?.vaccination_type==='infectious'&&(state.data?.vaccinations||[]).some(v=>Number(v.dog_id)===Number(record.dog_id)&&v.vaccination_type==='lepto_l4')){
    return body.replaceAll('DHPPi+L','DHPPi');
  }
  return body;
}
const vaccinationCarePolicyV233='Po skončení platnosti treba pred ďalšou rezerváciou aktualizovať dátum aj fotografiu očkovacieho preukazu. Zdravie psíkov je pre nás prvoradé.';
function renderNotifications(){
  if(window.__customerOnboardingCompleteV75!==true){$('notificationPopup')?.classList.add('hidden');return}
  const careRows=(state.data?.notifications||[]).filter(n=>n.notification_type==='pass_expiry'&&careNotificationIsCurrent(n)).slice(0,12);
  const notice=$('notificationList'),booking=$('bookingTab');
  if(notice&&booking&&notice.parentElement!==booking)$('bookingDogProfile')?.insertAdjacentElement('afterend',notice);
  const groups=new Map();
  for(const n of careRows){
    const vaccination=(state.data?.vaccinations||[]).find(v=>Number(v.id)===Number(n.entity_id));
    const key=n.notification_type==='vaccination_expiry'?`vaccination:${vaccination?.dog_id}:${n.visible_until}`:n.event_key;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(n);
  }
  notice.innerHTML=[...groups.values()].map(group=>`<div class="care-notice"><strong>${esc(group[0].title)}</strong><p>${group.map(n=>esc(vaccinationCopyV234(n))).join('<br>')}</p>${group[0].notification_type==='vaccination_expiry'?`<p class="vacc-policy-note-v233">${esc(vaccinationCarePolicyV233)}</p>`:''}<button class="btn secondary compact" type="button" data-care-notice="${Number(group[0].id)}">${group[0].notification_type==='pass_expiry'?'Vybrať termín':'Pozrieť očkovania'}</button></div>`).join('');
  notice.querySelectorAll('[data-care-notice]').forEach(b=>b.addEventListener('click',()=>{const row=careRows.find(n=>Number(n.id)===Number(b.dataset.careNotice));if(row)customerCareAction(row)}));
  const rows=(state.data?.notifications||[]).filter(n=>!n.read_at&&!customerClosedNotificationIdsV59.has(Number(n.id))&&!['pass_interest_registered','dog_approved','weekly_booking_reminder','weekly_booking_reminder_test','staff_message_customer'].includes(n.notification_type)&&careNotificationIsCurrent(n)).slice(0,5);
  let modal=$('notificationPopup');
  if(!rows.length){modal?.classList.add('hidden');return}
  if(!modal){
    document.body.insertAdjacentHTML('beforeend','<div id="notificationPopup" class="notification-popup hidden" role="dialog" aria-modal="true" aria-label="Správy zo škôlky"><div class="notification-popup-card"><button id="notificationPopupClose" class="notification-popup-close" type="button" aria-label="Zavrieť">×</button><h2 id="notificationPopupTitle" class="hidden">Oznam pre majiteľov škôlkarov</h2><div id="notificationPopupList" class="notification-popup-list"></div></div></div>');
    modal=$('notificationPopup');
  }
  const visibleIds=rows.map(n=>Number(n.id)).filter(Boolean);
  $('notificationPopupTitle').classList.toggle('hidden',!rows.some(n=>n.notification_type==='announcement_push'));
  modal.querySelector('.notification-popup-card').classList.toggle('notification-popup-without-heading',!rows.some(n=>n.notification_type==='announcement_push'));
  const list=$('notificationPopupList');
  list.innerHTML=rows.map(n=>`<div class="notification-popup-item"><strong>${esc(n.title||'Upozornenie')}</strong><div>${esc(vaccinationCopyV234(n))}</div>${n.notification_type==='vaccination_expiry'?`<p class="vacc-policy-note-v233">${esc(vaccinationCarePolicyV233)}</p>`:''}${['pass_expiry','vaccination_expiry'].includes(n.notification_type)?`<button type="button" class="btn compact" data-popup-care="${Number(n.id)}">${n.notification_type==='pass_expiry'?'Vybrať termín':'Pozrieť očkovania'}</button>`:''}</div>`).join('');
  list.querySelectorAll('[data-popup-care]').forEach(b=>b.addEventListener('click',()=>{const row=rows.find(n=>Number(n.id)===Number(b.dataset.popupCare));if(row){close();customerCareAction(row)}}));
  const close=async()=>{
    visibleIds.forEach(id=>customerClosedNotificationIdsV59.add(id));
    modal.classList.add('hidden');
    const stamp=new Date().toISOString();
    (state.data?.notifications||[]).forEach(n=>{if(visibleIds.includes(Number(n.id)))n.read_at=stamp});
    syncCustomerAppBadgeV186();
    try{
      await api({action:'mark_notifications_read',notification_ids:visibleIds});
    }catch(_){queueCustomerSync('notifications',80)}
  };
  $('notificationPopupClose').onclick=close;
  const hasOtherModal=[...document.querySelectorAll('[aria-modal="true"]')].some(el=>el!==modal&&!el.classList.contains('hidden'));
  if(!hasOtherModal)modal.classList.remove('hidden');
}
function passAllowsDogV244(pass,dogId){return Number(pass.dog_id)===Number(dogId)||(pass.dog_ids||[]).map(Number).includes(Number(dogId))}
function sharedDogBillingV260(dogId){return (state.data?.shared_dog_ids||[]).map(Number).includes(Number(dogId))||(state.data?.passes||[]).some(p=>passAllowsDogV244(p,dogId)&&p.is_shared)||(state.data?.pass_requests||[]).some(p=>p.status==='pending'&&p.dog_ids?.length===2&&passAllowsDogV244(p,dogId))}
function activePassFor(dogId){const today=bratislavaToday();return (state.data?.passes||[]).find(p=>passAllowsDogV244(p,dogId)&&p.status==='active'&&Number(p.used_entries)<Number(p.total_entries)&&(!p.valid_until||p.valid_until>=today))||(state.data?.passes||[]).find(p=>passAllowsDogV244(p,dogId)&&p.status==='queued')||null}
/* v299: grandfather the historically issued 20-entry pass; do not offer it to new customers. */
function legacyPassRenewalTotalV299(dogId){
  const passes=(state.data?.passes||[]).filter(p=>passAllowsDogV244(p,dogId))
    .sort((a,b)=>Number(b.id)-Number(a.id));
  const current=passes.find(p=>p.status==='active'||p.status==='queued')||passes[0];
  return Number(current?.total_entries)===20?20:10;
}
function renewalAlreadyPreparedV299(dogId,currentPassId=0){
  return (state.data?.pass_requests||[]).some(r=>r.status==='pending'&&passAllowsDogV244(r,dogId))
    ||(state.data?.passes||[]).some(p=>passAllowsDogV244(p,dogId)
      &&Number(p.used_entries)<Number(p.total_entries)
      &&(p.status==='queued'
        ||(currentPassId>0&&Number(p.id)!==Number(currentPassId)&&p.status==='active')));
}
function plannedPassSummaryV162(dogId){
  const interest=(state.data?.pass_requests||[]).find(p=>passAllowsDogV244(p,dogId)&&p.status==='pending');
  if(!interest)return null;
  const total=Number(interest.total_entries)||10,today=bratislavaToday();
  const dates=[...(state.data?.reservations||[]).filter(r=>passAllowsDogV244(r,dogId)&&r.status==='booked'&&!r.pass_id&&Number(r.planned_entry_number)>0&&Number(r.planned_pass_total)===total),
    ...(state.data?.requests||[]).filter(r=>Number(r.dog_id)===Number(dogId)&&['pending','approved'].includes(r.status)&&Number(r.planned_pass_request_id)===Number(interest.id))]
    .map(r=>String(r.reservation_date)).filter(date=>date>=today).sort();
  const start=dates[0]||null;
  let until=null;
  if(start){const [year,month,day]=start.split('-').map(Number),endMonth=new Date(Date.UTC(year,month-1+2,1)),lastDay=new Date(Date.UTC(endMonth.getUTCFullYear(),endMonth.getUTCMonth()+1,0)).getUTCDate();endMonth.setUTCDate(Math.min(day,lastDay));until=endMonth.toISOString().slice(0,10)}
  return {total,start,until};
}
function renderPassSummaryCore(){
  const d=selectedDog(),today=bratislavaToday();
  const completedToday=d?(state.data?.passes||[]).find(pass=>passAllowsDogV244(pass,d.id)&&Number(pass.used_entries)===Number(pass.total_entries)&&(state.data?.reservations||[]).some(r=>Number(r.dog_id)===Number(d.id)&&Number(r.pass_id)===Number(pass.id)&&r.status==='attended'&&r.reservation_date===today)):null;
  const p=completedToday||(d?activePassFor(d.id):null),planned=d?plannedPassSummaryV162(d.id):null;
  if(p){
    const firstBooked=Number(p.used_entries)===0?(state.data?.reservations||[]).filter(r=>Number(r.dog_id)===Number(d.id)&&Number(r.pass_id)===Number(p.id)&&r.status==='booked'&&r.reservation_date>=today).map(r=>r.reservation_date).sort()[0]:null;
    let start=p.valid_from||firstBooked,until=p.valid_until;
    if(start&&!until&&!p.no_expiry){const [year,month,day]=start.split('-').map(Number),endMonth=new Date(Date.UTC(year,month-1+2,1)),lastDay=new Date(Date.UTC(endMonth.getUTCFullYear(),endMonth.getUTCMonth()+1,0)).getUTCDate();endMonth.setUTCDate(Math.min(day,lastDay));until=endMonth.toISOString().slice(0,10)}
    const validity=p.no_expiry===true?'<small>Platnosť bez obmedzenia</small>':Number(p.used_entries)===0&&start?`<small>Platnosť od ${skDate(start)}${until?` do ${skDate(until)}`:''}</small>`:until?`<small>Platí do ${skDate(until)}</small>`:'';
    $('passSummary').innerHTML=`<span>Permanentka</span><small>Použité vstupy</small><strong>${Number(p.used_entries)||0} z ${Number(p.total_entries)||0}</strong>${validity}`;
    return;
  }
  if(planned){$('passSummary').innerHTML=`<span>Permanentka</span><small>Použité vstupy</small><strong>0 z ${planned.total}</strong>${planned.start?`<small>Platnosť od ${skDate(planned.start)} do ${skDate(planned.until)}</small>`:'<small class="pass-validity-pending" title="Platí 2 mesiace od prvého rezervovaného vstupu">2 mesiace od 1. vstupu</small>'}`;return}
  if(d?.default_entry_type==='free'){
    $('passSummary').innerHTML='<span>Vstup</span><strong class="free-entry-label-v96">Bezplatne</strong>';
    return;
  }
  $('passSummary').innerHTML='<span>Vstup</span><strong class="single-entry-label-v75">Jednorazový</strong>';
}
let customerPassSummaryDate='';
function renderPassSummary(){customerPassSummaryDate=bratislavaToday();const out=renderPassSummaryCore();runCustomerHooks('afterRenderPassSummary',out);return out}
function futureItems(){const today=overviewClock().date;const requests=(state.data?.requests||[]).filter(r=>r.reservation_date>=today&&['pending','approved'].includes(r.status));const covered=new Set(requests.map(r=>Number(r.reservation_id)).filter(Boolean));const legacy=(state.data?.reservations||[]).filter(r=>r.reservation_date>=today&&!covered.has(Number(r.id))).map(r=>({...r,status:'approved',_legacy:true,reservation_id:r.id}));return [...requests,...legacy].sort((a,b)=>String(a.reservation_date).localeCompare(String(b.reservation_date)))}
async function cancelBooking(btn){if(!confirm('Naozaj chcete zrušiť túto rezerváciu?'))return;try{loading(true);const requestId=Number(btn.dataset.request)||0,reservationId=Number(btn.dataset.reservation)||0;await api({action:'cancel_booking',request_id:requestId,reservation_id:reservationId,reason:null});const request=(state.data?.requests||[]).find(r=>Number(r.id)===requestId),reservation=(state.data?.reservations||[]).find(r=>Number(r.id)===reservationId);if(request)request.status='cancelled';if(reservation)reservation.status='cancelled';if(reservationId)for(const row of state.data?.requests||[])if(Number(row.reservation_id)===reservationId)row.status='cancelled';renderUpcoming();renderDays();renderMessages();renderPassSummary();toast('Rezervácia bola zrušená.');queueCustomerSync('bookings',80)}catch(e){toast(e.message)}finally{loading(false)}}
function bookingFor(dogId,date){return (state.data?.requests||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.reservation_date===date&&['pending','approved'].includes(r.status))||(state.data?.reservations||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.reservation_date===date)}
function applyLocalBooking(result,fallback){const row=result?.data||result?.booking||result?.request||fallback;if(!row)return;const rows=state.data?.requests||(state.data.requests=[]),index=rows.findIndex(r=>Number(r.id)===Number(row.id));if(index>=0)rows[index]={...rows[index],...row};else rows.push({...fallback,...row});renderUpcoming();renderDays();renderMessages();renderPassSummary()}
async function loadAnnouncements(){return customerRenderers.announcements?customerRenderers.announcements():undefined}
function renderMessagesCore(){const rows=state.data?.messages||[];$('messageThread').innerHTML=rows.length?rows.map(m=>`<div class="message-bubble ${m.sender_role==='customer'?'mine':''}"><p>${esc(m.body)}</p><small>${skTime(m.created_at)}</small></div>`).join(''):'<div class="message-empty">Zatiaľ tu nemáte žiadne správy.</div>';setTimeout(()=>{$('messageThread').scrollTop=$('messageThread').scrollHeight},0);const opts=futureItems();$('messageBooking').innerHTML='<option value="">Bez konkrétnej rezervácie</option>'+opts.map(r=>`<option value="${r.id||''}">${esc(dogName(r.dog_id))} · ${skDate(r.reservation_date)}</option>`).join('')}
function renderMessages(){const out=renderMessagesCore();runCustomerHooks('afterRenderMessages',out);return out}
function updateUnreadCore(){const unread=(state.data?.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);$('messageUnread').classList.toggle('hidden',!unread);$('menuMessageUnread')?.classList.toggle('hidden',!unread)}
function updateUnread(){const out=updateUnreadCore();runCustomerHooks('afterUpdateUnread',out);syncCustomerAppBadgeV186();return out}
function renderDogSelector(){const dogs=state.data?.dogs||[];$('dogSelectorWrap').classList.toggle('hidden',dogs.length<=1);const options=dogs.map(d=>`<option value="${d.id}" ${Number(d.id)===Number(state.selectedDogId)?'selected':''}>${esc(d.name)}</option>`).join('');$('dogSelector').innerHTML=options;const booking=$('bookingDogSelector');if(booking){booking.classList.toggle('hidden',dogs.length<=1);booking.innerHTML=options}}
function totalVisits(dog){const visits=(state.data?.visits||[]).filter(v=>Number(v.dog_id)===Number(dog.id)).length;const monthly=(state.data?.monthly_totals||[]).filter(m=>Number(m.dog_id)===Number(dog.id)).reduce((s,m)=>s+Number(m.visits||0),0);return Math.max(Number(dog.legacy_total_visits)||0,visits,monthly)}
function ensureDogFormInModalV51(){
  const modal=$('dogDetailsModal'),form=$('dogForm'),card=modal?.querySelector('.dog-details-card');
  if(form&&card&&form.parentElement!==card)card.appendChild(form);
}

let dogEditorKeyboardBoundV211=false,dogEditorResizeFrameV211=0;
function clearDogEditorViewportV211(){
 const modal=$('dogDetailsModal');if(!modal)return;
 modal.style.removeProperty('--dog-editor-height-v211');
 modal.style.removeProperty('--dog-editor-top-v211');
}
function fitDogEditorViewportV211(){
 dogEditorResizeFrameV211=0;
 const modal=$('dogDetailsModal');
 if(!modal||modal.classList.contains('hidden'))return;
 const viewport=window.visualViewport;
 const visibleHeight=Math.max(240,Math.round(viewport?.height||window.innerHeight));
 const offsetTop=Math.max(0,Math.round(viewport?.offsetTop||0));
 modal.style.setProperty('--dog-editor-height-v211',visibleHeight+'px');
 modal.style.setProperty('--dog-editor-top-v211',offsetTop+'px');
 const active=document.activeElement,card=modal.querySelector('.dog-details-card');
 if(!card||!active||!modal.contains(active)||!active.matches('textarea,input,select'))return;
 requestAnimationFrame(()=>{
  if(modal.classList.contains('hidden')||document.activeElement!==active)return;
  const a=active.getBoundingClientRect(),c=card.getBoundingClientRect();
  const bottom=Math.min(c.bottom,offsetTop+visibleHeight-12);
  if(a.bottom>bottom)card.scrollTop+=a.bottom-bottom+24;
  else if(a.top<c.top+8)card.scrollTop-=c.top+8-a.top;
 });
}
function requestDogEditorFitV211(){
 if(!dogEditorResizeFrameV211)dogEditorResizeFrameV211=requestAnimationFrame(fitDogEditorViewportV211);
}
function ensureDogEditorKeyboardV211(){
 if(dogEditorKeyboardBoundV211)return;
 dogEditorKeyboardBoundV211=true;
 const modal=$('dogDetailsModal');if(!modal)return;
 modal.addEventListener('focusin',event=>{
  if(event.target.matches('textarea,input,select')){
   requestDogEditorFitV211();
   setTimeout(requestDogEditorFitV211,110);
   setTimeout(requestDogEditorFitV211,300);
  }
 });
 modal.addEventListener('input',event=>{
  if(event.target.matches('textarea'))requestDogEditorFitV211();
 });
 window.visualViewport?.addEventListener('resize',requestDogEditorFitV211,{passive:true});
 window.visualViewport?.addEventListener('scroll',requestDogEditorFitV211,{passive:true});
 window.addEventListener('resize',requestDogEditorFitV211,{passive:true});
}

let dogDetailsModeV96='details',dogDetailsMandatoryV96=false,dogDetailsSnapshotV96='';
let dogSaveInFlightV145=false,customerMutationRevisionV145=0;
function customerVaccinationsCompleteV96(dog){
  if(!dog)return false;
  const required=['rabies','infectious','kennel_cough'];
  const rows=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(dog.id));
  const proofs=(state.data?.vaccination_proofs||[]).filter(p=>Number(p.dog_id)===Number(dog.id));
  const today=typeof bratislavaClockV95==='function'?bratislavaClockV95().date:new Date().toISOString().slice(0,10);
  return proofs.length>0&&required.every(type=>rows.some(v=>v.vaccination_type===type&&v.valid_until&&String(v.valid_until)>=today))&&(!rows.some(v=>v.vaccination_type==='lepto_l4')||rows.some(v=>v.vaccination_type==='lepto_l4'&&v.valid_until&&String(v.valid_until)>=today));
}
window.customerVaccinationsCompleteV96=customerVaccinationsCompleteV96;
function dogFormSnapshotV96(){
  const form=$('dogForm');if(!form)return'';
  return [...new FormData(form).entries()].map(([k,v])=>k+'='+String(v)).join('&');
}
function vaccinationDaysWordV96(n){return n===1?'deň':n>=2&&n<=4?'dni':'dní'}
function vaccinationValidityV96(validUntil){
  if(!validUntil)return {kind:'neutral',text:'Platnosť: dátum konca zatiaľ nebol zadaný'};
  const todayIso=typeof bratislavaClockV95==='function'?bratislavaClockV95().date:new Date().toISOString().slice(0,10);
  const today=new Date(todayIso+'T12:00:00'),until=new Date(String(validUntil).slice(0,10)+'T12:00:00');
  const days=Math.round((until-today)/86400000);
  if(!Number.isFinite(days))return {kind:'neutral',text:'Platnosť: dátum konca zatiaľ nebol zadaný'};
  if(days<0){const n=Math.abs(days);return {kind:'expired',text:'Platnosť: skončila pred '+n+' '+vaccinationDaysWordV96(n)}}
  if(days===0)return {kind:'warning',text:'Platnosť: končí dnes'};
  return {kind:days<=14?'warning':'valid',text:'Platnosť: ešte '+days+' '+vaccinationDaysWordV96(days)};
}
function updateVaccinationStatusesV96(){
  for(const [inputId,statusId] of [['rabiesUntil','rabiesStatusV96'],['infectiousUntil','infectiousStatusV96'],['kennelUntil','kennelStatusV96'],['leptoL4UntilV211','leptoL4StatusV211']]){
    const box=$(statusId);if(!box)continue;
    const value=vaccinationValidityV96($(inputId)?.value||'');
    box.className='vaccine-validity-v96 '+value.kind;
    box.textContent=value.text;
  }
}
function updateVaccineSplitLabelV234(){
 const input=$('leptoL4UntilV211'),box=input?.closest('.vaccine-box'),active=!!input?.value;
 const title=box?.querySelector('strong'),hint=box?.querySelector('.vaccine-disease-hint-v96 span:last-child');
 if(title)title.textContent=active?'Infekčné ochorenia (DHPPi)':'Infekčné ochorenia (DHPPi+L)';
 if(hint)hint.textContent=active?'Psia parainfluenza':'Psia parainfluenza · leptospiróza';
 if(input&&!input.dataset.v234Bound){input.dataset.v234Bound='1';input.addEventListener('change',updateVaccineSplitLabelV234)}
}
function openDogDetails(mode='details',mandatory=false){
  ensureDogFormInModalV51();const dog=selectedDog();if(!dog)return;
  ensureDogEditorKeyboardV211();
  if(mode!=='vaccinations')clearVaccinationProofStageV104();
  rememberVaccineDraftV287();
  if(Number($('dogId')?.value)!==Number(dog.id)){clearVaccinationProofStageV104();$('vaccProofEditorV244')?.classList.add('hidden')}
  fillDogForm(dog,true);
  const draft=mode==='vaccinations'&&vaccineDraftsV287.get(vaccineKeyV287(dog.id));
  if(draft)['rabiesUntil','infectiousUntil','kennelUntil','leptoL4UntilV211'].forEach((id,i)=>$(id).value=draft[i]);
  vaccinationProofFilesV104=mode==='vaccinations'?(vaccineStagesV287.get(vaccineKeyV287(dog.id))||[]):[];
  $('vaccineErrorV287')?.remove();updateVaccineSplitLabelV234();
  const l4=$('leptoL4DetailsV211');
  if(l4 && mode==='vaccinations' && mandatory)l4.open=true;
  applyDogDetailsModeV96(mode,mandatory);updateVaccinationStatusesV96();bindVaccinationProofInputsV104();renderVaccinationProofsV104(dog.id);
  renderDetailsPhoto(dog);
  dogDetailsSnapshotV96=dogFormSnapshotV96();
  const editor=$('dogDetailsModal');
  editor.classList.remove('hidden');document.documentElement.classList.add('dog-details-open');
  editor.scrollTop=0;
  const editorCard=editor.querySelector('.dog-details-card');if(editorCard)editorCard.scrollTop=0;
  requestDogEditorFitV211();
  requestAnimationFrame(()=>{if(editor.classList.contains('hidden'))return;requestDogEditorFitV211();editor.scrollTop=0;if(editorCard)editorCard.scrollTop=0});
}

/* v276: generic dog actions ask which authorised dog to edit, without changing existing per-dog cards. */
let dogChoiceReturnFocusV276=null;
function closeDogChoiceV276(restoreFocus=true){
  const modal=$('dogChoiceModalV276');
  if(!modal||modal.classList.contains('hidden'))return;
  modal.classList.add('hidden');document.documentElement.classList.remove('dog-choice-open-v276');
  if(restoreFocus&&dogChoiceReturnFocusV276?.isConnected)dogChoiceReturnFocusV276.focus({preventScroll:true});
}
function openDogWithChoiceV276(mode='details'){
  const dogs=state.data?.dogs||[];
  if(dogs.length<=1){openDogDetails(mode,false);return}
  const modal=$('dogChoiceModalV276'),list=$('dogChoiceListV276');
  if(!modal||!list)return;
  dogChoiceReturnFocusV276=document.activeElement;
  $('dogChoiceContextV276').textContent=mode==='vaccinations'?'Očkovania':'Údaje psíka';
  list.replaceChildren();
  for(const dog of dogs){
    const button=document.createElement('button');button.type='button';button.className='dog-choice-item-v276';
    button.setAttribute('aria-label',(mode==='vaccinations'?'Otvoriť očkovania: ':'Otvoriť údaje: ')+(dog.name||'Psík'));
    const avatar=document.createElement('span');avatar.className='dog-choice-avatar-v276';
    if(dog.photo_url){const img=document.createElement('img');img.src=dog.photo_url;img.alt='';img.decoding='async';avatar.append(img)}
    else avatar.textContent='🐾';
    const name=document.createElement('strong');name.textContent=dog.name||'Psík';
    const arrow=document.createElement('span');arrow.className='dog-choice-arrow-v276';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
    button.append(avatar,name,arrow);
    button.addEventListener('click',()=>{
      const current=(state.data?.dogs||[]).find(d=>Number(d.id)===Number(dog.id));
      if(!current){closeDogChoiceV276();return}
      closeDogChoiceV276(false);
      if(Number(state.selectedDogId)!==Number(current.id)){
        rememberVaccineDraftV287();clearVaccinationProofStageV104();state.selectedDogId=Number(current.id);
        renderDogSelector();renderPassSummary();renderDog();renderUpcoming();renderDays();
      }
      openDogDetails(mode,false);
    });
    list.append(button);
  }
  modal.classList.remove('hidden');document.documentElement.classList.add('dog-choice-open-v276');
  list.querySelector('button')?.focus({preventScroll:true});
}
$('dogChoiceCloseV276')?.addEventListener('click',()=>closeDogChoiceV276());
$('dogChoiceModalV276')?.addEventListener('click',e=>{if(e.target===$('dogChoiceModalV276'))closeDogChoiceV276()});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('dogChoiceModalV276')?.classList.contains('hidden')){e.preventDefault();closeDogChoiceV276()}
});
function closeDogDetails(force=false){
  if(!force&&dogDetailsMandatoryV96)return false;
  if(!force&&dogFormSnapshotV96()!==dogDetailsSnapshotV96&&!confirm('Máte neuložené zmeny. Zavrieť bez uloženia?'))return false;
  rememberVaccineDraftV287();$('dogDetailsModal').classList.add('hidden');document.documentElement.classList.remove('dog-details-open');
  clearDogEditorViewportV211();
  dogDetailsMandatoryV96=false;dogDetailsModeV96='details';return true;
}
function renderDogProfilePrompt(){for(const id of ['bookingNotice','dogStatus']){const root=$(id);if(root)root.innerHTML=''}}
function renderDetailsPhoto(dog=selectedDog()){
  const preview=$('dogDetailsPhotoPreview'),button=$('dogDetailsPhotoButton');
  if(!preview||!button)return;
  updateDogPhotoV260(preview,dog);
  preview.className='dog-details-photo-preview '+dogSexClassV100(dog);
  $('dogDetailsPhotoControl').className='dog-details-photo-control '+dogSexClassV100(dog);
  button.setAttribute('aria-label',dog?.photo_url?'Upraviť, zmeniť alebo zmazať fotku':'Pridať fotku');
  button.title=button.getAttribute('aria-label');
  if(!$('dogDetailsModal')?.classList.contains('hidden'))syncDogDetailsSexTintV297();
}
function dogSexClassV100(dog){return dog?.sex==='male'?'dog-male-v100':dog?.sex==='female'?'dog-female-v100':'dog-neutral-v100'}
function renderDogHeaderV56(dog){
  const root=$('dogProfilePhoto');if(!root)return;
  const sexClass=dogSexClassV100(dog);
  const key=String(state.session?.user?.id||'')+'|'+String(dog.id||'');
  if(!root.querySelector('.dog-hub-v99')||root.dataset.dogVisualKey!==key){
    root.innerHTML=`<div class="card dog-photo-feature-v99 ${sexClass}"><div class="dog-photo-paws-v99" aria-hidden="true"></div><div class="dog-photo-feature-inner-v99"><div class="profile-photo-wrap"><span class="dog-avatar profile">🐾</span><button id="dogPhotoActionBtnV89" class="photo-pencil" type="button" title="${dog.photo_url?'Upraviť fotku':'Pridať fotku'}" aria-label="${dog.photo_url?'Upraviť fotku':'Pridať fotku'}">✎</button></div><h2 class="dog-photo-name">${esc(dog.name)}</h2></div></div>
    <div class="card dog-hub-v99"><div class="dog-hub-grid-v99">
      <button id="dogDataOpenV96" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">📝</span><strong>Údaje psíka</strong></button>
      <button id="dogVaccinationsOpenV96" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">💉</span><strong>Očkovania</strong></button>
      <button id="schoolRulesCardV55" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">📄</span><strong>Pravidlá škôlky</strong></button>
      <button id="dogVisitsOpenV99" class="dog-hub-tile-v99 dog-hub-visits-v100" type="button"><span class="dog-hub-emoji-v99">🐾</span><strong>Návštevy psíka v škôlke</strong></button>
      <button class="dog-hub-tile-v99 dog-hub-gradebook-v99" type="button" disabled><span class="dog-hub-emoji-v99">📚</span><span><strong>Žiacka knižka</strong><small>Pripravujeme</small></span></button>
      <button id="dogMenuOpenV99" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">⚙️</span><strong>Nastavenia</strong></button>
    </div></div>`;
    root.dataset.dogVisualKey=key;
    $('dogDataOpenV96')?.addEventListener('click',()=>openDogWithChoiceV276('details'));
    $('dogVaccinationsOpenV96')?.addEventListener('click',()=>openDogWithChoiceV276('vaccinations'));
    $('dogVisitsOpenV99')?.addEventListener('click',()=>window.openDogVisitsV99?.());
    $('dogMenuOpenV99')?.addEventListener('click',()=>window.openCustomerSettingsV102?.());
  }
  const photo=root.querySelector('.dog-avatar.profile');updateDogPhotoV260(photo,dog,dog.name||'Fotka psíka');
  root.querySelector('.dog-photo-name').textContent=dog.name||'Psík';
  root.querySelector('.dog-photo-feature-v99').className='card dog-photo-feature-v99 '+sexClass;
  const action=$('dogPhotoActionBtnV89');action.title=dog.photo_url?'Upraviť fotku':'Pridať fotku';action.setAttribute('aria-label',action.title);
  action.onclick=()=>{const current=selectedDog();current?.photo_url?showPhotoActionsV89(current):selectNewDogPhotoV89()};
}
function renderDogCore(){ensureDogFormInModalV51();const dog=selectedDog();if(!dog){$('dogProfilePhoto').innerHTML='';$('dogProfilePhoto').removeAttribute('data-dog-visual-key');$('dogProfileSettings').innerHTML='';$('dogStats').innerHTML=box('info','Psíka najprv priradí Chvostíkovo k vášmu účtu.');$('dogForm').classList.add('hidden');renderDogProfilePrompt();return}$('dogForm').classList.remove('hidden');state.selectedDogId=Number(dog.id);renderDogHeaderV56(dog);renderDetailsPhoto(dog);stabilizeDogVisualV218($('dogProfilePhoto'));stabilizeDogVisualV218($('dogDetailsPhotoPreview'));const cachedPush=state.pushChecked?!!state.pushEnabled:(typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('chvostikovo_push_enabled')==='1');$('dogProfileSettings').innerHTML=`<div class="card profile-settings"><div class="privacy-row"><div><strong>Upozornenia</strong><small>Rezervácie, správy a oznamy z Chvostíkova.</small></div><button id="pushToggle" class="push-switch syncing ${cachedPush?'active':''}" type="button" aria-label="Upozornenia"><span></span></button></div><div class="privacy-row"><div><strong>Zobraziť meno psa a fotku ostatným</strong><small>Súhlas môžete kedykoľvek vypnúť.</small></div><button id="privacyToggle" class="push-switch ${dog.share_name_photo?'active':''}" type="button" aria-label="Zdieľanie"><span></span></button></div></div>`;$('pushToggle').addEventListener('click',togglePush);$('privacyToggle').addEventListener('click',togglePrivacy);applyPushToggle();$('dogStats').innerHTML='';fillDogForm(dog);renderDogProfilePrompt()}
function renderDog(){const out=renderDogCore();runCustomerHooks('afterRenderDog',out);return out}
function dogCareFields(d){return {allergies:String(d?.allergies||''),temperament:String(d?.temperament||'')}}
function dogBreedWeightValueV124(d){
  const breed=String(d?.breed||'').trim(),rawWeight=Number(d?.weight_kg);
  if(!Number.isFinite(rawWeight)||rawWeight<=0||/\d+(?:[.,]\d+)?\s*kg\b/i.test(breed))return breed;
  const weight=Number.isInteger(rawWeight)?String(rawWeight):String(rawWeight).replace('.',',');
  return (breed?breed+', ':'')+weight+' kg';
}
function parseDogBreedWeightV124(value){
  const text=String(value||'').trim(),match=text.match(/^(.*?)(?:\s*[,;|\/-]?\s*)(\d+(?:[.,]\d+)?)\s*kg\s*$/i);
  if(!match)return {breed:text,weight_kg:null};
  const breed=String(match[1]||'').replace(/[\s,;|\/-]+$/,'').trim(),weight=Number(String(match[2]).replace(',','.'));
  return {breed,weight_kg:Number.isFinite(weight)&&weight>0?weight:null};
}
/* v297: display age and field warnings while entering a date, not only after blur.
   Onboarding may start with an empty date; never save a future birthday. */
function syncDogAgeField(){
  const input=$('dogBirthDate'),age=$('dogAge');
  if(!input||!age)return;
  const today=bratislavaToday(),birth=input.value;
  input.max=today;
  const future=!!birth&&birth>today;
  if(future)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');
  $('dogBirthDateErrorV297')?.classList.toggle('hidden',!future);
  const calculated=future?'':dogAgeText(birth);
  age.value=calculated;age.readOnly=true;age.setAttribute('aria-readonly','true');
  age.placeholder=future?'Opravte dátum narodenia':calculated?'Vypočítané z dátumu narodenia':'Vek po zadaní dátumu narodenia';
  age.title=future?'Dátum narodenia nemôže byť v budúcnosti.':'Vek sa automaticky vypočíta po zadaní dátumu narodenia.';
}
/* v297: live preview of gender tint uses unsaved form selection; never alters dog data or image nodes. */
function syncDogDetailsSexTintV297(){
  const sex=$('dogSex')?.value,cls=sex==='male'?'dog-male-v100':sex==='female'?'dog-female-v100':'dog-neutral-v100';
  for(const id of ['dogDetailsPhotoControl','dogDetailsPhotoPreview']){
    const root=$(id);if(!root)continue;
    root.classList.remove('dog-male-v100','dog-female-v100','dog-neutral-v100');
    root.classList.add(cls);
  }
}
function syncDogInlineChoicesV297(){
  for(const id of ['dogSex','dogNeutered']){
    const input=$(id),group=input?.parentElement?.querySelector('.dog-inline-choices-v297');
    if(!group)continue;
    for(const btn of group.querySelectorAll('[data-choice-v297]')){
      const checked=btn.dataset.choiceV297===input.value;
      btn.setAttribute('aria-checked',String(checked));
      btn.tabIndex=checked||(!input.value&&btn===group.firstElementChild)?0:-1;
    }
  }
}
/* v298: show two explicit choices on all platforms, retaining the original
   nullable select as the sole saved value for one or two assigned dogs. */
function mountDogInlineChoicesV297(){
  for(const id of ['dogSex','dogNeutered']){
    const select=$(id);
    if(!select||select.dataset.inlineChoicesV298==='1')continue;
    const group=document.createElement('div');
    group.className='dog-inline-choices-v297';group.setAttribute('role','radiogroup');
    group.setAttribute('aria-label',select.parentElement?.querySelector('label')?.textContent?.trim()||id);
    for(const option of select.options){
      if(!option.value)continue; // missing data means neither button is selected
      const btn=document.createElement('button');
      btn.type='button';btn.className='dog-inline-choice-v297';btn.textContent=option.textContent;
      btn.dataset.choiceV297=option.value;btn.setAttribute('role','radio');
      btn.addEventListener('click',()=>{
        select.value=btn.dataset.choiceV297;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        syncDogInlineChoicesV297();
      });
      group.appendChild(btn);
    }
    group.addEventListener('keydown',event=>{
      const buttons=[...group.querySelectorAll('[data-choice-v297]')];
      const current=buttons.indexOf(document.activeElement);
      let next=-1;
      if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(current+1)%buttons.length;
      if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(current+buttons.length-1)%buttons.length;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=buttons.length-1;
      if(next<0)return;
      event.preventDefault();buttons[next].focus();buttons[next].click();
    });
    select.after(group);select.dataset.inlineChoicesV298='1';
    select.classList.add('dog-inline-native-select-v298');select.setAttribute('aria-hidden','true');select.tabIndex=-1;
    select.addEventListener('change',syncDogInlineChoicesV297);
  }
  syncDogInlineChoicesV297();
}
function fillDogForm(d,force=false){
  if(!force&&!$('dogDetailsModal')?.classList.contains('hidden'))return;
  $('dogId').value=d.id;$('dogName').value=d.name||'';$('dogBirthDate').value=d.birth_date||'';syncDogAgeField();$('dogBreed').value=d.breed||'';$('dogWeight').value=d.weight_kg??'';$('dogSex').value=d.sex||'';$('dogNeutered').value=d.neutered===true?'true':d.neutered===false?'false':'';syncDogInlineChoicesV297();syncDogDetailsSexTintV297();
  const care=dogCareFields(d);if($('dogAllergies'))$('dogAllergies').value=care.allergies;if($('dogTemperament'))$('dogTemperament').value=care.temperament;
  const allergiesDetails=$('dogAllergiesDetailsV298');if(allergiesDetails)allergiesDetails.open=!!care.allergies.trim();
  const vs=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(d.id));
  for(const [type,inputId] of [['rabies','rabiesUntil'],['infectious','infectiousUntil'],['kennel_cough','kennelUntil'],['lepto_l4','leptoL4UntilV211']]){
    const v=vs.find(x=>x.vaccination_type===type)||{};$(inputId).value=v.valid_until||'';
  }
  const savedL4=vs.some(v=>v.vaccination_type==='lepto_l4'&&v.valid_until);
  const details=$('leptoL4DetailsV211');if(details)details.open=savedL4;
  updateVaccinationStatusesV96();
  renderVaccinationProofsV104(d.id);
}
let vaccinationProofFilesV104=[];
let vaccinationProofReplaceModeV104=false; const vaccinationFreshUploadV234=new Set();
const vaccineDraftsV287=new Map(),vaccineStagesV287=new Map(),vaccineRetriesV287=new Map();
const vaccineKeyV287=id=>String(state.session?.user?.id||'')+':'+Number(id);
function vaccineErrorV287(message,target='vaccProofReplaceV104'){
 let box=$('vaccineErrorV287');if(!box){box=document.createElement('div');box.id='vaccineErrorV287';box.className='error vaccination-error-alert-v289';box.setAttribute('role','alert');box.tabIndex=-1;$('dogVaccinationFieldsV96').prepend(box)}
 box.textContent=message;box.hidden=false;box.focus({preventScroll:true});box.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 $(target)?.setAttribute('aria-invalid','true');
}
function rememberVaccineDraftV287(){const id=Number($('dogId')?.value);if(id&&dogDetailsModeV96==='vaccinations'&&!$('dogDetailsModal')?.classList.contains('hidden')){vaccineDraftsV287.set(vaccineKeyV287(id),['rabiesUntil','infectiousUntil','kennelUntil','leptoL4UntilV211'].map(id=>$(id)?.value||''));vaccineStagesV287.set(vaccineKeyV287(id),vaccinationProofFilesV104.slice())}}


function vaccinationProofsForDogV104(dogId){
  return (state.data?.vaccination_proofs||[]).filter(p=>Number(p.dog_id)===Number(dogId));
}
function ensureVaccinationProofViewerV104(){
  let modal=$('vaccProofViewerV104');if(modal)return modal;
  document.body.insertAdjacentHTML('beforeend','<div id="vaccProofViewerV104" class="vacc-proof-viewer-v104 hidden" role="dialog" aria-modal="true"><button id="vaccProofViewerCloseV104" class="vacc-proof-viewer-close-v104" type="button" aria-label="Zavrieť">×</button><img id="vaccProofViewerImgV104" alt="Fotografia očkovacieho preukazu"></div>');
  modal=$('vaccProofViewerV104');
  const close=()=>modal.classList.add('hidden');
  $('vaccProofViewerCloseV104').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
  return modal;
}
function openVaccinationProofViewerV104(url){
  if(!url)return;const modal=ensureVaccinationProofViewerV104();$('vaccProofViewerImgV104').src=url;installVaccinationViewerZoomV244(modal);window.resetVaccViewerZoomV244?.();modal.classList.remove('hidden');
}
async function saveDog(e){
  e.preventDefault();
  if(dogSaveInFlightV145)return;
  const savedAccountV287=state.session?.user?.id;
  const savedMode=dogDetailsModeV96,mandatoryFlow=dogDetailsMandatoryV96,neut=$('dogNeutered').value,birthDate=$('dogBirthDate').value,sex=$('dogSex').value,ageText=dogAgeText(birthDate)||selectedDog()?.age_text||'',dogId=Number($('dogId').value);
  syncDogAgeField();
  if(birthDate&&birthDate>bratislavaToday()){
    $('dogBirthDate')?.focus({preventScroll:true});
    toast('Dátum narodenia nemôže byť v budúcnosti.');
    return;
  }
  const vaccinations=[
    {type:'rabies',valid_until:$('rabiesUntil').value},
    {type:'infectious',valid_until:$('infectiousUntil').value},
    {type:'kennel_cough',valid_until:$('kennelUntil').value}
  ];
  if(savedMode==='vaccinations'){
    const missingVacc=vaccinations.find(v=>!v.valid_until);
    if(missingVacc){
      vaccineErrorV287('Doplňte dátumy platnosti všetkých troch povinných očkovaní.');
      return;
    }
    const today=typeof bratislavaClockV95==='function'?bratislavaClockV95().date:new Date().toISOString().slice(0,10);
    const expiredVacc=vaccinations.find(v=>String(v.valid_until||'')<today);
    if(expiredVacc){
      vaccineErrorV287('Očkovanie je po platnosti. Po skutočnom preočkovaní zadajte nový dátum „Platí do“ a priložte aktuálnu fotografiu dokladu. Dátum neposúvajte bez preočkovania. Rezervácia zostáva zablokovaná.');return;
    }
  }
  const l4Date=$('leptoL4UntilV211')?.value||'';
  const hadL4=Boolean((state.data?.vaccinations||[]).find(v=>Number(v.dog_id)===dogId&&v.vaccination_type==='lepto_l4'));
  if(savedMode==='vaccinations'){
    const today=bratislavaToday();
    if(hadL4&&!l4Date){vaccineErrorV287('Evidovanú L4 nemožno vymazať. Ak máte spoločnú DHPPi+L vakcínu, kontaktujte škôlku.');return;}
    if(l4Date&&l4Date<today){vaccineErrorV287('L4 je po platnosti. Po preočkovaní zadajte nový dátum a aktuálnu fotografiu dokladu.');return;}
    const prior=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===dogId);
    const oldDate=(type)=>String(prior.find(v=>v.vaccination_type===type)?.valid_until||'');
    const changed=vaccinations.some(v=>!!oldDate(v.type)&&oldDate(v.type)!==String(v.valid_until||''))||
      (l4Date!==oldDate('lepto_l4')&&(hadL4||!!l4Date)&&prior.length>0);
    if(!changed&&prior.length>=3&&vaccinations.every(v=>oldDate(v.type)===String(v.valid_until||''))&&!vaccinationFreshUploadV234.has(vaccineKeyV287(dogId))){
      // No real vaccination change: never claim an update or create a staff-review event.
      $('vaccineErrorV287')?.setAttribute('hidden','');
      closeDogDetails(true);
      toast('Dátumy očkovaní zostali nezmenené. Nie je potrebná ďalšia kontrola škôlkou.');
      return;
    }
    if(changed&&!vaccinationFreshUploadV234.has(vaccineKeyV287(dogId))){
      vaccineErrorV287('Zmenili ste dátum očkovania. Priložte aktuálnu fotografiu dokladu cez „Upraviť fotky“. Pôvodná fotografia nestačí.');
      renderVaccinationProofsV104(dogId);
      return;
    }
  }
  const breedWeight={breed:$('dogBreed').value.trim(),weight_kg:$('dogWeight').value.trim()?Number($('dogWeight').value.replace(',','.')):null};
  const body={action:'save_dog',dog_id:dogId,dog_name:$('dogName').value,age_text:ageText,birth_date:birthDate||null,breed:breedWeight.breed,weight_kg:breedWeight.weight_kg,sex,neutered:neut===''?null:neut==='true',allergies:$('dogAllergies')?.value||'',temperament:$('dogTemperament')?.value||'',care_fields_version:2};
  if(savedMode==='vaccinations'){body.vaccinations=vaccinations;body.require_vaccination_proof=true;body.lepto_l4_until=l4Date||null;body.include_optional_l4=!!(l4Date||hadL4)}
  try{
    dogSaveInFlightV145=true;customerMutationRevisionV145++;
    loading(true);
    if(window.__vaccinationProofProcessingV105){toast('Počkajte, kým sa fotografie spracujú.');return}
    if(vaccinationProofUploadInFlightV143)await vaccinationProofUploadInFlightV143;
    if(savedMode==='vaccinations'&&vaccinationProofFilesV104.length)await uploadVaccinationProofsV104(true);
    if(savedMode==='vaccinations'&&!vaccinationProofsForDogV104(dogId).length){
      vaccineErrorV287('Nahrajte aspoň jednu aktuálnu fotografiu očkovacieho preukazu.');return;
    }
    const result=await api(body);
    // The optional L4 is a separate vaccine entry, not a fourth mandatory requirement.
    // Skip the RPC when nothing was ever recorded, to avoid unnecessary requests.
    if(savedMode==='vaccinations'&&(l4Date||hadL4)&&!result?.data?.vaccinations_atomic_v287){
      try{
        await authFetch('/rest/v1/rpc/portal_set_optional_l4',{
          method:'POST',
          headers:{Authorization:'Bearer '+state.session.access_token},
          body:JSON.stringify({p_dog_id:dogId,p_valid_until:l4Date||null})
        });
      }catch(error){throw new Error('Tri povinné očkovania sú uložené, ale samostatné L4 sa nepodarilo uložiť. Skúste uloženie znova.');}
    }
    if(savedAccountV287!==state.session?.user?.id)return;
    const dog=(state.data?.dogs||[]).find(d=>Number(d.id)===dogId);
    if(dog)Object.assign(dog,{name:body.dog_name,age_text:body.age_text,birth_date:body.birth_date||null,breed:body.breed||null,weight_kg:body.weight_kg?Number(body.weight_kg):null,sex:body.sex||null,neutered:body.neutered,allergies:body.allergies||null,temperament:body.temperament||null});
    if(state.data&&savedMode==='vaccinations'){
      const other=(state.data.vaccinations||[]).filter(v=>Number(v.dog_id)!==dogId||!['rabies','infectious','kennel_cough','lepto_l4'].includes(v.vaccination_type));
      state.data.vaccinations=[...other,...vaccinations.map(v=>({dog_id:dogId,vaccination_type:v.type,valid_until:v.valid_until})),...(l4Date?[{dog_id:dogId,vaccination_type:'lepto_l4',valid_until:l4Date}]:[])];
      if(result?.data?.onboarding_complete){
        state.data.dog_onboarding=state.data.dog_onboarding||[];
        const row=state.data.dog_onboarding.find(x=>Number(x.dog_id)===dogId);
        if(row){row.details_prompt_answered_at=new Date().toISOString();row.details_prompt_skipped=false}
        else state.data.dog_onboarding.push({dog_id:dogId,details_prompt_answered_at:new Date().toISOString(),details_prompt_skipped:false});
      }
    }
    if(Number($('dogId').value)!==dogId||Number(state.selectedDogId)!==dogId){queueCustomerSync('all',80);return}
    dogDetailsSnapshotV96=dogFormSnapshotV96();
    if(savedMode==='details'&&mandatoryFlow){
      applyDogDetailsModeV96('vaccinations',true);fillDogForm(dog);bindVaccinationProofInputsV104();dogDetailsSnapshotV96=dogFormSnapshotV96();toast('Údaje sú uložené. Teraz doplňte platnosť očkovaní a fotografie preukazu.');return;
    }
    $('dogDetailsOnboardingModalV75')?.classList.add('hidden');
    closeDogDetails(true);renderDog();renderPassSummary();renderUpcoming();renderDays();
    if(savedMode==='vaccinations')vaccinationFreshUploadV234.delete(vaccineKeyV287(dogId));vaccineDraftsV287.delete(vaccineKeyV287(dogId));vaccineStagesV287.delete(vaccineKeyV287(dogId)); toast(savedMode==='vaccinations'?'Očkovanie bolo aktualizované. Rezervácie sú opäť sprístupnené.':'Údaje psíka sú uložené.',savedMode==='vaccinations'?6500:3300);
    queueCustomerSync('all',80);
  }catch(e){if(savedMode==='vaccinations')vaccineErrorV287(e.message);else toast(e.message)}finally{dogSaveInFlightV145=false;customerMutationRevisionV145++;loading(false);window.runCustomerOnboardingV75?.()}
}
function ensurePassInterestConfirmation(){
  if($('passInterestConfirmationV44'))return;
  document.body.insertAdjacentHTML('beforeend','<div id="passInterestConfirmationV44" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="passInterestConfirmationTitleV44"><div class="legal-card"><div class="legal-kicker">Chvostíkovo</div><h2 id="passInterestConfirmationTitleV44">Permanentka je pripravená</h2><div class="legal-body"><p>Novú 10-vstupovú permanentku sme zaradili k vášmu psíkovi. V prehľade ju uvidíte ako 0/10 a jej platnosť sa počíta na 2 mesiace od prvého naplánovaného vstupu. Uhradíte ju pri návšteve škôlky.</p></div><button id="passInterestConfirmationCloseV44" class="btn full" type="button">Ďakujem</button></div></div>');
  $('passInterestConfirmationCloseV44').onclick=()=>$('passInterestConfirmationV44').classList.add('hidden');
}
function showPassInterestConfirmation(sharedDogIds=[],totalEntries=10){
  $('passInterestConfirmationV44')?.remove();ensurePassInterestConfirmation();
  if(sharedDogIds.length===2)$('passInterestConfirmationV44').querySelector('.legal-body').textContent='Novú spoločnú 10-vstupovú permanentku sme zaradili k vašim psíkom. V prehľade ju uvidíte ako 0/10 a jej platnosť sa počíta na 2 mesiace od prvého naplánovaného vstupu. Uhradíte ju pri návšteve škôlky.';
  if(Number(totalEntries)===20){
    const body=$('passInterestConfirmationV44').querySelector('.legal-body');
    body.textContent=body.textContent.replaceAll('10-vstupovú','20-vstupovú').replaceAll('0/10','0/20');
  }
  $('passInterestConfirmationV44').classList.remove('hidden');
}
function openSharedPassRequestV260(dogId){
  $('passInterestConfirmationV44')?.remove();ensurePassInterestConfirmation();
  const modal=$('passInterestConfirmationV44'),card=modal.querySelector('.legal-card'),dogs=state.data?.dogs||[],account=state.session?.user?.id;
  card.querySelector('h2').textContent='Záujem o permanentku';
  const content=card.querySelector('.legal-body');
  content.innerHTML='<label>Permanentka pre<select class="input" data-pass-scope>'+dogs.map(d=>'<option value="'+d.id+'">'+esc(d.name)+'</option>').join('')+(dogs.length===2?'<option value="both">Spoločná · '+dogs.map(d=>esc(d.name)).join(' a ')+'</option>':'')+'</select></label><label>Počet vstupov<select class="input" data-pass-total><option value="10">10 vstupov · 200 €</option></select></label><p>Platnosť začne prvým využitím. Kúpu potvrdí personál.</p><p role="alert" data-pass-error></p>';
  const shared=(state.data.passes||[]).find(p=>p.is_shared&&passAllowsDogV244(p,dogId));
  content.querySelector('[data-pass-scope]').value=dogs.length===2&&(shared||!activePassFor(dogId))?'both':String(dogId);
  const scopePicker=content.querySelector('[data-pass-scope]'),totalPicker=content.querySelector('[data-pass-total]');
  const refreshLegacyTotal=()=>{
    const ids=scopePicker.value==='both'?dogs.map(d=>Number(d.id)):[Number(scopePicker.value)];
    const eligible=ids.length>0&&ids.every(id=>legacyPassRenewalTotalV299(id)===20);
    totalPicker.innerHTML='<option value="10">10 vstupov · 200 €</option>'+(eligible?'<option value="20">20 vstupov · 320 €</option>':'');
    totalPicker.value=eligible?'20':'10';
  };
  scopePicker.addEventListener('change',refreshLegacyTotal);refreshLegacyTotal();
  const send=$('passInterestConfirmationCloseV44');send.textContent='Odoslať záujem';send.onclick=null;
  const back=document.createElement('button');back.type='button';back.className='btn secondary full';back.textContent='Späť';card.append(back);modal.classList.remove('hidden');
  return new Promise(resolve=>{
    let operation=crypto.randomUUID(),lastPayload='',busy=false;
    const finish=row=>{modal.remove();resolve(row)};back.onclick=()=>{if(!busy)finish(null)};
    send.onclick=async()=>{
      if(busy)return;busy=true;send.disabled=back.disabled=true;
      const ids=content.querySelector('[data-pass-scope]').value==='both'?dogs.map(d=>Number(d.id)):[Number(content.querySelector('[data-pass-scope]').value)];
      const total=Number(content.querySelector('[data-pass-total]').value),payload=JSON.stringify([ids,total]);if(lastPayload&&payload!==lastPayload)operation=crypto.randomUUID();lastPayload=payload;
      try{
        const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_request_pass_v244',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_dog_ids:ids,p_total_entries:total,p_operation_id:operation})});
        const data=await r.json();if(!r.ok)throw Error(data?.message||'Záujem sa nepodarilo odoslať.');if(state.session?.user?.id!==account){finish(null);return}const row=Array.isArray(data)?data[0]:data;
        state.data.pass_requests=state.data.pass_requests||[];if(!state.data.pass_requests.some(p=>Number(p.id)===Number(row.id)))state.data.pass_requests.unshift(row);
        renderPassSummary();renderDog();queueCustomerSync('all',80);toast('Záujem o permanentku sme prijali.');finish(row);
      }catch(e){content.querySelector('[data-pass-error]').textContent=e.message}finally{busy=false;send.disabled=back.disabled=false}
    };
  });
}
const passRenewalOperationsV261=new Map();
async function requestPass(totalEntries,{dogId=Number(state.selectedDogId),showConfirmation=true,renewal=false}={}){
  if(!renewal&&state.data?.shared_passes_enabled&&((state.data.dogs||[]).length===2||sharedDogBillingV260(dogId)))return openSharedPassRequestV260(dogId);
  const total=Number(totalEntries)||10;
  if(![10,20].includes(total)||(total===20&&legacyPassRenewalTotalV299(dogId)!==20))return null;
  const account=state.session?.user?.id;
  const pass=renewal&&state.data?.shared_passes_enabled?(state.data.passes||[]).find(p=>p.is_shared&&p.status==='active'&&passAllowsDogV244(p,dogId)):null;
  const ids=pass?[...new Set((pass.dog_ids||[]).map(Number))].sort((a,b)=>a-b):[dogId];
  if(pass&&(ids.length!==2||ids.some(id=>!(state.data.dogs||[]).some(d=>Number(d.id)===id)))){toast('O obnovu spoločnej permanentky požiadajte škôlku.');return null}
  const operationKey=account+'|'+(pass?.id||dogId)+'|'+total;
  const useV244=!!pass||total===20;
  if(useV244&&!passRenewalOperationsV261.has(operationKey))passRenewalOperationsV261.set(operationKey,crypto.randomUUID());
  const body=useV244?{p_dog_ids:ids,p_total_entries:total,p_operation_id:passRenewalOperationsV261.get(operationKey)}:{p_dog_id:dogId,p_total_entries:total};
  try{
    loading(true);
    const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+(useV244?'portal_request_pass_v244':'portal_request_pass'),{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}
    if(!r.ok)throw new Error(data?.message||data?.error||'Záujem sa nepodarilo odoslať.');
    if(state.session?.user?.id!==account)return null;
    const row=Array.isArray(data)?data[0]:data;
    if(row&&typeof row==='object'){state.data.pass_requests=state.data.pass_requests||[];if(!state.data.pass_requests.some(x=>Number(x.id)===Number(row.id)))state.data.pass_requests.unshift(row)}
    renderPassSummary();renderDog();queueCustomerSync('bookings',0);if(showConfirmation)showPassInterestConfirmation(pass?ids:[],total);return row;
  }catch(e){toast(e.message);return null}finally{loading(false)}
}
async function offerRecentPassRenewalV157(dogId,isCurrent=()=>true){
  const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_pass_renewal_eligible',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_dog_id:dogId})});
  if(!response.ok)throw new Error('Nepodarilo sa overiť permanentku. Skúste to znova.');
  if(await response.json()!==true)return true;
  if(Number(state.selectedDogId)!==dogId||!isCurrent())return false;
  if(renewalAlreadyPreparedV299(dogId))return true;
  const renewalTotal=legacyPassRenewalTotalV299(dogId);
  return new Promise(resolve=>{
    const modal=document.createElement('div');modal.className='legal-modal';modal.id='recentPassRenewalV157';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','recentPassTitleV157');
    modal.innerHTML='<div class="legal-card"><div class="legal-kicker">Chvostíkovo</div><h2 id="recentPassTitleV157">Máte záujem o novú permanentku?</h2><p>Predchádzajúca permanentka sa skončila alebo už má rezervované všetky vstupy. Chcete pokračovať s novou 10-vstupovou permanentkou?</p><p>Rezervácie sa budú počítať ako vstupy z novej 10-vstupovej permanentky. Permanentku uhradíte pri najbližšej návšteve škôlky.</p><div class="stack"><button type="button" class="btn full" data-renewal="yes">Áno, mám záujem</button><button type="button" class="btn secondary full" data-renewal="single">Pokračovať jednorazovo</button><button type="button" class="btn secondary full" data-renewal="cancel">Späť</button></div></div>';
    if(renewalTotal===20)modal.innerHTML=modal.innerHTML.replaceAll('10-vstupov','20-vstupov');
    const finish=result=>{modal.remove();resolve(result)};
    modal.querySelector('[data-renewal="single"]').onclick=()=>finish(true);
    modal.querySelector('[data-renewal="cancel"]').onclick=()=>finish(false);
    modal.querySelector('[data-renewal="yes"]').onclick=async()=>{
      if(Number(state.selectedDogId)!==dogId||!isCurrent()){finish(false);return}
      modal.querySelectorAll('button').forEach(b=>b.disabled=true);
      const row=await requestPass(renewalTotal,{dogId,showConfirmation:false,renewal:true});
      if(row){finish(true);showPassInterestConfirmation([],renewalTotal)}
      else modal.querySelectorAll('button').forEach(b=>b.disabled=false);
    };
    document.body.append(modal);
  });
}
function renderProfile(){const p=state.data?.profile||{};$('profileName').value=p.full_name||'';$('profileEmail').value=p.email||'';$('profilePhone').value=p.phone||''}
async function saveProfile(e){e.preventDefault();try{await api({action:'save_profile',full_name:$('profileName').value,phone:$('profilePhone').value});toast('Kontaktné údaje sú uložené.');await bootstrap(false)}catch(e){toast(e.message)}}
async function togglePrivacy(){
  const d=selectedDog(),button=$('privacyToggle');if(!d||!button||button.disabled)return;
  const previous=Boolean(d.share_name_photo),granted=!previous;
  d.share_name_photo=granted;button.classList.toggle('active',granted);button.setAttribute('aria-checked',granted?'true':'false');button.disabled=true;
  try{await api({action:'set_photo_visibility',dog_id:Number(d.id),granted});toast(granted?'Zdieľanie je zapnuté.':'Zdieľanie je vypnuté.')}
  catch(e){d.share_name_photo=previous;button.classList.toggle('active',previous);button.setAttribute('aria-checked',previous?'true':'false');toast(e.message)}
  finally{button.disabled=false}
}
function ensurePhotoEditor(){
  if($('photoCropModal'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="photoCropModal" class="photo-modal hidden"><div class="photo-modal-card"><div class="photo-modal-head"><div><strong>Upraviť fotku</strong><small>Fotku posuňte jedným prstom. Dvoma prstami ju priblížte.</small></div><button id="photoCropClose" class="icon-btn" type="button">✕</button></div><div class="crop-shell"><canvas id="photoCropCanvas" width="640" height="640"></canvas></div><div class="photo-modal-actions"><button id="photoCropCancel" class="btn secondary" type="button">Zrušiť</button><button id="photoCropSave" class="btn" type="button">Použiť fotku</button></div></div></div>`);
  $('photoCropClose').onclick=$('photoCropCancel').onclick=closePhotoEditor;
  $('photoCropSave').onclick=saveCroppedPhoto;
  bindPhotoGesturesV89($('photoCropCanvas'));
}
function bindPhotoGesturesV89(canvas){
  if(!canvas||canvas.__photoGesturesV89)return;
  canvas.__photoGesturesV89=true;
  const pointers=new Map();
  let pinch=null;
  const point=e=>{const r=canvas.getBoundingClientRect(),ratio=640/r.width;return{x:(e.clientX-r.left)*ratio,y:(e.clientY-r.top)*ratio}};
  const startPinch=()=>{
    if(pointers.size<2||!state.photoEdit){pinch=null;return}
    const [a,b]=[...pointers.values()].slice(0,2),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},dist=Math.hypot(a.x-b.x,a.y-b.y)||1,e=state.photoEdit;
    const base=Math.max(640/e.img.width,640/e.img.height),scale=base*e.zoom;
    pinch={dist,startZoom:e.zoom,imgX:(mid.x-e.ox)/scale,imgY:(mid.y-e.oy)/scale};
  };
  canvas.addEventListener('pointerdown',e=>{
    if(!state.photoEdit)return;
    e.preventDefault();
    const p=point(e);pointers.set(e.pointerId,p);
    try{canvas.setPointerCapture(e.pointerId)}catch(_){}
    if(pointers.size===2)startPinch();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!state.photoEdit||!pointers.has(e.pointerId))return;
    e.preventDefault();
    const prev=pointers.get(e.pointerId),next=point(e);
    pointers.set(e.pointerId,next);
    if(pointers.size>=2){
      if(!pinch)startPinch();
      const [a,b]=[...pointers.values()].slice(0,2),dist=Math.hypot(a.x-b.x,a.y-b.y)||1,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},edit=state.photoEdit;
      const nextZoom=Math.max(1,Math.min(3,pinch.startZoom*(dist/pinch.dist)));
      const base=Math.max(640/edit.img.width,640/edit.img.height),scale=base*nextZoom;
      edit.zoom=nextZoom;
      edit.ox=mid.x-pinch.imgX*scale;
      edit.oy=mid.y-pinch.imgY*scale;
      clampPhotoOffset();
      drawPhotoCrop();
    }else{
      const edit=state.photoEdit;
      edit.ox+=next.x-prev.x;
      edit.oy+=next.y-prev.y;
      clampPhotoOffset();
      drawPhotoCrop();
    }
  });
  const release=e=>{
    pointers.delete(e.pointerId);
    if(pointers.size<2)pinch=null;
    else startPinch();
  };
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
}
function ensurePhotoActionsV89(){
  if($('photoActionsModalV89'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="photoActionsModalV89" class="photo-modal photo-actions-modal-v89 hidden"><div class="photo-actions-card-v89"><div class="photo-modal-head"><div><strong>Fotka psíka</strong><small>Vyberte, čo chcete s fotkou urobiť.</small></div><button id="photoActionsCloseV89" class="icon-btn" type="button">✕</button></div><div class="photo-actions-list-v89"><button id="photoEditCurrentV89" class="btn secondary" type="button">Upraviť aktuálnu fotku</button><button id="photoReplaceV89" class="btn secondary" type="button">Nahrať novú fotku</button><button id="photoDeleteV89" class="btn danger" type="button">Zmazať fotku</button></div><div class="photo-picker-status-v301" role="status" aria-live="polite">Vyberte zdroj novej fotky v systémovej ponuke telefónu. Po zrušení sa môžete vrátiť k týmto možnostiam.</div></div></div>`);
  $('photoActionsCloseV89').onclick=closePhotoActionsV89;
  $('photoActionsModalV89').addEventListener('click',e=>{if(e.target===$('photoActionsModalV89'))closePhotoActionsV89()});
}
let photoPickerFromActionsV184=false;
function closePhotoActionsV89(){
  photoPickerFromActionsV184=false;
  const modal=$('photoActionsModalV89');
  modal?.classList.remove('photo-picker-waiting-v184');
  modal?.removeAttribute('aria-busy');
  modal?.classList.add('hidden');
}
function selectNewDogPhotoV89(){
  const modal=$('photoActionsModalV89'),input=$('dogPhotoInput');
  if(!input)return;
  photoPickerFromActionsV184=!!modal&&!modal.classList.contains('hidden');
  if(photoPickerFromActionsV184){
    modal.classList.add('photo-picker-waiting-v184');
    modal.setAttribute('aria-busy','true');
  }
  try{input.click()}
  catch(error){
    modal?.classList.remove('photo-picker-waiting-v184');
    modal?.removeAttribute('aria-busy');
    photoPickerFromActionsV184=false;
    toast('Nepodarilo sa otvoriť výber fotky. Skúste to znova.');
  }
}
function showPhotoActionsV89(dog){
  ensurePhotoActionsV89();
  $('photoActionsModalV89').dataset.dogId=String(dog.id);
  $('photoEditCurrentV89').onclick=()=>{closePhotoActionsV89();openExistingPhotoEditorV89(dog)};
  $('photoReplaceV89').onclick=selectNewDogPhotoV89;
  $('photoDeleteV89').onclick=()=>deleteCurrentDogPhotoV89(dog);
  const photoModal=$('photoActionsModalV89');
  photoModal.classList.remove('photo-picker-waiting-v184');
  photoModal.removeAttribute('aria-busy');
  photoModal.classList.remove('hidden');
}
function fileDataUrlV88(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error||new Error('read failed'));reader.readAsDataURL(file)})}
function imageFromDataUrlV88(dataUrl){return new Promise((resolve,reject)=>{const img=new Image();let done=false;const finish=(ok)=>{if(done)return;done=true;clearTimeout(timer);ok?resolve(img):reject(new Error('decode failed'))};const timer=setTimeout(()=>finish(false),15000);img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=dataUrl})}
async function decodePhotoFileV88(file){
  if(typeof createImageBitmap==='function'){
    try{const bitmap=await createImageBitmap(file);if(bitmap?.width&&bitmap?.height)return bitmap}catch(_){}
  }
  const dataUrl=await fileDataUrlV88(file);
  const img=await imageFromDataUrlV88(dataUrl);
  if(!img.width||!img.height)throw new Error('decode failed');
  return img
}
function beginPhotoEditV89(img,options={}){
  ensurePhotoEditor();
  const startZoom=Math.max(1,Math.min(3,Number(options.startZoom)||1));
  state.photoEdit={img,url:null,zoom:startZoom,ox:0,oy:0};
  clampPhotoOffset(true);
  drawPhotoCrop();
  $('photoCropModal').classList.remove('hidden');
}
async function openPhotoEditor(e){
  const file=e.target.files?.[0];
  window.__customerPhotoPickerV88=false;
  if(!file){
    $('photoActionsModalV89')?.classList.remove('photo-picker-waiting-v184');
    $('photoActionsModalV89')?.removeAttribute('aria-busy');
    photoPickerFromActionsV184=false;
    return;
  }
  if(photoPickerFromActionsV184)closePhotoActionsV89();
  photoPickerFromActionsV184=false;
  window.__customerPhotoDecodeV88=true;
  try{
    const img=await decodePhotoFileV88(file);
    beginPhotoEditV89(img);
  }catch(_){
    const heic=/hei[cf]/i.test(String(file.type||''))||/\.hei[cf]$/i.test(String(file.name||''));
    toast(heic?'Túto HEIC fotku iPhone nevedel spracovať. Skúste inú fotku alebo screenshot.':'Fotku sa nepodarilo načítať. Skúste ju vybrať znova.')
  }finally{
    window.__customerPhotoDecodeV88=false;
    window.__customerPhotoPickerV88=false;
    e.target.value=''
  }
}
async function openExistingPhotoEditorV89(dog){
  if(!dog?.photo_url)return;
  try{
    loading(true);
    const response=await fetch(dog.photo_url,{cache:'no-store'});
    if(!response.ok)throw new Error('download failed');
    const blob=await response.blob();
    const img=await decodePhotoFileV88(blob);
    // The stored profile image is already square-cropped. Start slightly zoomed
    // so there is immediately room to reposition it with one finger.
    beginPhotoEditV89(img,{startZoom:1.12});
  }catch(_){
    toast('Aktuálnu fotku sa nepodarilo otvoriť na úpravu. Skúste nahrať novú.')
  }finally{loading(false)}
}
async function deleteCurrentDogPhotoV89(dog){
  if(!dog?.photo_url)return closePhotoActionsV89();
  if(!confirm('Naozaj chcete zmazať profilovú fotku psíka?'))return;
  try{
    loading(true);
    await api({action:'delete_dog_photo',photo_scope:'account',dog_id:Number(dog.id)});
    closePhotoActionsV89();
    dog.photo_url=null;dog.photo_path=null;dog.photo_updated_at=new Date().toISOString();
    toast('Fotka bola zmazaná.');
    await bootstrap(false);
  }catch(e){toast(e.message||'Fotku sa nepodarilo zmazať.')}
  finally{loading(false)}
}
function clampPhotoOffset(reset=false){const e=state.photoEdit;if(!e)return;const base=Math.max(640/e.img.width,640/e.img.height),scale=base*e.zoom,w=e.img.width*scale,h=e.img.height*scale;if(reset){e.ox=(640-w)/2;e.oy=(640-h)/2}e.ox=Math.min(0,Math.max(640-w,e.ox));e.oy=Math.min(0,Math.max(640-h,e.oy))}
function drawPhotoCrop(){const e=state.photoEdit;if(!e)return;const c=$('photoCropCanvas'),ctx=c.getContext('2d'),base=Math.max(640/e.img.width,640/e.img.height),scale=base*e.zoom;ctx.clearRect(0,0,640,640);ctx.drawImage(e.img,e.ox,e.oy,e.img.width*scale,e.img.height*scale)}
function closePhotoEditor(){if(state.photoEdit?.url)URL.revokeObjectURL(state.photoEdit.url);try{state.photoEdit?.img?.close?.()}catch(_){}state.photoEdit=null;$('photoCropModal')?.classList.add('hidden')}
function photoJpegData(){const c=$('photoCropCanvas');for(const q of [.9,.84,.78,.72]){const data=c.toDataURL('image/jpeg',q),bytes=Math.ceil((data.length-data.indexOf(',')-1)*3/4);if(bytes<900000)return data}return c.toDataURL('image/jpeg',.68)}
async function saveCroppedPhoto(){if(!state.photoEdit)return;try{loading(true);await api({action:'upload_dog_photo',photo_scope:'account',dog_id:Number(state.selectedDogId),image_data:photoJpegData()});closePhotoEditor();toast('Fotka je uložená.');await bootstrap(false)}catch(e){toast(e.message)}finally{loading(false)}}
function urlBase64ToUint8Array(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function registerSW(){if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})}catch(e){console.warn(e)}}

/* Check a static release marker only on foreground entry, never by polling. */
const CUSTOMER_UPDATE_INTERVAL=5*60*1000;
const CUSTOMER_UPDATE_CHECK_KEY='chvostikovo-release-check-v1';
const CUSTOMER_UPDATE_ATTEMPT_KEY='chvostikovo-release-reload-v1';
let customerUpdateCheckInFlight=null,customerUpdateLastCheck=0,customerUpdatePending='',customerUpdateReloading=false,customerUpdateApplyTimer=0;
const customerUpdateFieldBaselines=new WeakMap(),customerUpdateDirtyFields=new Set();
function customerUpdateFieldValue(el){return el.type==='checkbox'||el.type==='radio'?String(el.checked):String(el.value??el.textContent??'')}
function customerUpdateVisible(el){return !!el?.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'}
function customerUpdateSafe(){
  if(document.visibilityState!=='visible'||navigator.onLine===false||customerApiMutationsInFlight||bootstrapInFlight||customerSyncInFlight||dogSaveInFlightV145||vaccinationProofUploadInFlightV143||state.photoEdit||window.__customerPhotoPickerV88||window.__customerPhotoDecodeV88||window.__vaccinationProofProcessingV105)return false;
  if(customerUpdateVisible($('loading')))return false;
  if(document.activeElement?.matches('input,textarea,select,[contenteditable="true"]'))return false;
  if([...document.querySelectorAll('[aria-modal="true"]')].some(customerUpdateVisible))return false;
  if(['supportMessageBodyV52','messageBody'].some(id=>String($(id)?.value||'').trim()))return false;
  for(const el of customerUpdateDirtyFields){
    if(!el.isConnected){customerUpdateDirtyFields.delete(el);continue}
    if(customerUpdateVisible(el)&&customerUpdateFieldValue(el)!==customerUpdateFieldBaselines.get(el))return false;
  }
  return true;
}
function applyPendingCustomerUpdate(){
  if(!customerUpdatePending||customerUpdateReloading||!customerUpdateSafe())return false;
  try{
    if(sessionStorage.getItem(CUSTOMER_UPDATE_ATTEMPT_KEY)===customerUpdatePending)return false;
    // Persist before reloading: even a stale HTML response cannot cause a reload loop.
    sessionStorage.setItem(CUSTOMER_UPDATE_ATTEMPT_KEY,customerUpdatePending);
    if(sessionStorage.getItem(CUSTOMER_UPDATE_ATTEMPT_KEY)!==customerUpdatePending)return false;
  }catch(_){return false}
  customerUpdateReloading=true;
  window.location.reload();
  return true;
}
function scheduleCustomerUpdateApply(){
  if(!customerUpdatePending||customerUpdateReloading)return;
  clearTimeout(customerUpdateApplyTimer);
  customerUpdateApplyTimer=setTimeout(()=>{customerUpdateApplyTimer=0;applyPendingCustomerUpdate()},250);
}
async function checkCustomerRelease(){
  if(document.visibilityState!=='visible'||navigator.onLine===false||customerUpdateReloading)return;
  if(applyPendingCustomerUpdate())return;
  if(customerUpdateCheckInFlight)return customerUpdateCheckInFlight;
  const now=Date.now();
  try{customerUpdateLastCheck=Math.max(customerUpdateLastCheck,Number(sessionStorage.getItem(CUSTOMER_UPDATE_CHECK_KEY))||0)}catch(_){}
  if(customerUpdateLastCheck&&now-customerUpdateLastCheck<CUSTOMER_UPDATE_INTERVAL)return;
  customerUpdateLastCheck=now;
  try{sessionStorage.setItem(CUSTOMER_UPDATE_CHECK_KEY,String(now))}catch(_){}
  customerUpdateCheckInFlight=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
    try{
      const response=await fetch('/version.json',{cache:'no-store',credentials:'same-origin',signal:controller.signal});
      if(!response.ok)return;
      const release=await response.json(),build=release?.build;
      if(typeof build!=='string'||! /^[A-Za-z0-9_-]{1,100}$/.test(build))return;
      customerUpdatePending=build===APP_BUILD?'':build;
      applyPendingCustomerUpdate();
    }catch(_){}finally{clearTimeout(timer)}
  })().finally(()=>{customerUpdateCheckInFlight=null});
  return customerUpdateCheckInFlight;
}
document.addEventListener('focusin',event=>{
  const el=event.target;if(!el?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
  if(!customerUpdateDirtyFields.has(el))customerUpdateFieldBaselines.set(el,customerUpdateFieldValue(el));
});
document.addEventListener('input',event=>{
  const el=event.target;if(!el?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
  if(!customerUpdateFieldBaselines.has(el))customerUpdateFieldBaselines.set(el,el.defaultValue??'');
  if(customerUpdateFieldValue(el)===customerUpdateFieldBaselines.get(el))customerUpdateDirtyFields.delete(el);else customerUpdateDirtyFields.add(el);
});
for(const event of ['click','focusout','change','reset'])document.addEventListener(event,scheduleCustomerUpdateApply);
async function pushSubscription(){if(!('serviceWorker'in navigator))return null;const reg=await navigator.serviceWorker.ready;return reg.pushManager.getSubscription()}
function applyPushToggle(){const b=$('pushToggle');if(!b)return;b.classList.toggle('active',!!state.pushEnabled);b.classList.remove('syncing');b.setAttribute('aria-checked',state.pushEnabled?'true':'false')}
let customerPushSyncInFlightV216=null;
let customerPushSyncLastSuccessV216={key:'',at:0};
let customerPushSyncLastFailureV216={key:'',at:0};
async function syncPushSubscriptionV75(sub){
  if(!sub||!state.session?.access_token)throw new Error('Prihlásenie alebo odber upozornení chýba.');
  const key=String(state.session?.user?.id||state.session?.access_token||'')+'|'+String(sub.endpoint||'');
  const now=Date.now();
  if(customerPushSyncInFlightV216?.key===key)return customerPushSyncInFlightV216.promise;
  if(customerPushSyncLastSuccessV216.key===key&&now-customerPushSyncLastSuccessV216.at<300000)return true;
  if(customerPushSyncLastFailureV216.key===key&&now-customerPushSyncLastFailureV216.at<60000)throw new Error('Synchronizácia upozornení bola nedávno neúspešná.');
  async function send(retry){
    const token=state.session?.access_token;
    if(!token)throw new Error('Prihlásenie vypršalo.');
    const r=await fetch(PUSH_API,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({audience:'customer',action:'subscribe',subscription:sub.toJSON()})});
    if(!r.ok){
      let data={};try{data=await r.json()}catch(_){}
      const reason=String(data?.error||data?.message||'');
      if(retry&&(r.status===400||r.status===401)&&/vypršal|vypršalo|expired|jwt/i.test(reason)){
        if(state.session?.access_token===token)await refreshSession();
        return send(false);
      }
      throw new Error('Upozornenia sa nepodarilo synchronizovať.');
    }
    return true;
  }
  const promise=send(true).then(()=>{
    customerPushSyncLastSuccessV216={key,at:Date.now()};
    customerPushSyncLastFailureV216={key:'',at:0};
    if(state.data)state.data.push_subscription_active=true;
    return true;
  }).catch(error=>{
    customerPushSyncLastFailureV216={key,at:Date.now()};
    throw error;
  }).finally(()=>{if(customerPushSyncInFlightV216?.promise===promise)customerPushSyncInFlightV216=null;});
  customerPushSyncInFlightV216={key,promise};
  return promise;
}
async function completePushPromptV75(){
  const result=await api({action:'complete_push_prompt'}),at=result?.data?.answered_at||new Date().toISOString();
  if(state.data?.profile)state.data.profile.push_prompt_answered_at=at;
  return at;
}
async function ensurePushState(force=false){
  if(state.pushChecked&&!force)return state.pushEnabled;
  let on=false;
  try{
    if('serviceWorker'in navigator&&typeof Notification!=='undefined'){
      const sub=await pushSubscription();on=!!sub&&Notification.permission==='granted';
      if(on&&state.session){await syncPushSubscriptionV75(sub);if(!state.data?.profile?.push_prompt_answered_at)await completePushPromptV75()}
    }
  }catch(e){console.warn('Push synchronizácia zlyhala',e)}
  state.pushChecked=true;state.pushEnabled=on;localStorage.setItem('chvostikovo_push_enabled',on?'1':'0');return on;
}
async function enablePushForCurrentUserV75(){
  if(!('serviceWorker'in navigator)||typeof Notification==='undefined'||!('PushManager'in window))throw new Error('Toto zariadenie nepodporuje push upozornenia.');
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(permission!=='granted')throw new Error('Upozornenia neboli povolené.');
  const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID)});
  await syncPushSubscriptionV75(sub);await completePushPromptV75();
  state.pushChecked=true;state.pushEnabled=true;if(state.data)state.data.push_subscription_active=true;
  localStorage.setItem('chvostikovo_push_enabled','1');applyPushToggle();return true;
}
async function togglePush(){
  const b=$('pushToggle');if(!b||b.disabled)return;b.disabled=true;
  try{
    const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
    if(sub&&state.pushEnabled){
      await fetch(PUSH_API,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({audience:'customer',action:'unsubscribe',endpoint:sub.endpoint})});
      await sub.unsubscribe();state.pushChecked=true;state.pushEnabled=false;if(state.data)state.data.push_subscription_active=false;
      localStorage.setItem('chvostikovo_push_enabled','0');applyPushToggle();toast('Upozornenia sú vypnuté.');
    }else{await enablePushForCurrentUserV75();toast('Upozornenia sú zapnuté.')}
  }catch(e){await ensurePushState(true);applyPushToggle();toast(e.message||'Upozornenia sa nepodarilo zmeniť.')}finally{b.disabled=false}
}
function renderStaffCore(){const is=!!state.data?.is_staff;$('navStaff').classList.toggle('hidden',!is);if(!is)return;const s=state.data?.staff||{};$('staffSummary').innerHTML=`<div class="stats-grid"><div class="stat-card"><span>Nové účty</span><strong>${(s.profiles||[]).filter(x=>x.status==='pending').length}</strong></div><div class="stat-card"><span>Rezervácie</span><strong>${(s.bookings||[]).length}</strong></div></div><div class="card"><strong>Správa žiadostí</strong><p class="hint">Kompletné schvaľovanie zostáva v internej Chvostíkovo aplikácii.</p></div>`}
function renderStaff(){const out=renderStaffCore();runCustomerHooks('afterRenderStaff',out);return out}
function repairCustomerScrollV60(){
  const html=document.documentElement;
  const pairs=[
    ['settings-open-v36','#dogSettingsModalV36'],
    ['booking-picker-open-v37','#bookingPickerV37'],
    ['dog-details-open','#dogDetailsModal'],
    ['support-chat-open-v52','#supportChatModalV52']
  ];
  for(const [cls,sel] of pairs){const el=document.querySelector(sel);if(!el||el.classList.contains('hidden'))html.classList.remove(cls)}
  document.body.style.touchAction='pan-y';
}
function switchTabCore(tab){repairCustomerScrollV60();if(tab==='menu'&&state.activeTab!=='menu'){const dog=$('menuDogGroup'),settings=$('menuSettingsGroup');if(dog)dog.open=false;if(settings)settings.open=false}state.activeTab=tab;for(const t of ['booking','messages','dog','menu','staff'])$(t+'Tab').classList.toggle('hidden',t!==tab);for(const t of ['Booking','Messages','Staff'])$('nav'+t)?.classList.toggle('active',t.toLowerCase()===tab);$('navDog')?.classList.toggle('active',tab==='menu')}
function switchTab(tab){const openChat=tab==='messages';if(tab==='dog'||openChat)tab='menu';const out=switchTabCore(tab);runCustomerHooks('afterSwitchTab',tab,out);if(openChat)openCustomerChat();return out}
function openCustomerChat(){if(typeof window.openCustomerSupportChatV176==='function')return window.openCustomerSupportChatV176();$('supportChatBtnV52')?.click()}
async function sendMessage(e){e.preventDefault();const body=$('messageBody').value.trim();if(!body)return;try{const btn=e.submitter;btn.disabled=true;const result=await api({action:'send_message',message:body,booking_request_id:Number($('messageBooking').value)||null}),row=result?.data||result?.message||{id:-Date.now(),body,sender_role:'customer',created_at:new Date().toISOString()};(state.data.messages||(state.data.messages=[])).push(row);$('messageBody').value='';renderMessages();updateUnread();switchTab('messages');toast('Správa bola odoslaná.');queueCustomerSync('messages',80)}catch(e){toast(e.message)}finally{e.submitter&&(e.submitter.disabled=false)}}
function handleRecoveryHash(){
  const hash=new URLSearchParams(location.hash.replace(/^#/,'')),access=hash.get('access_token'),refresh=hash.get('refresh_token'),type=hash.get('type');
  if(hash.get('error')||hash.get('error_code')){history.replaceState(null,'',location.pathname);showAuth('login');authMessage('error','Odkaz je neplatný alebo jeho platnosť vypršala. Vyžiadajte si nový potvrdzovací e-mail alebo obnovenie hesla.');return true}
  if(access&&refresh){
    if(type==='signup'){
      location.replace(CUSTOMER_EMAIL_CONFIRM_URL+location.hash);
      return true;
    }
    saveSession({access_token:access,refresh_token:refresh,expires_in:Number(hash.get('expires_in'))||3600,token_type:'bearer'},true);
    history.replaceState(null,'',location.pathname+location.search);
    if(type==='recovery'){showAuth('newPassword');return true}
  }
  return false
}
function handleVerifiedEmailReturn(){
  const params=new URLSearchParams(location.search);
  if(params.get('email_confirmed')!=='1')return false;
  let verified=null;
  try{verified=JSON.parse(sessionStorage.getItem('chvostikovo_verified_email_return')||'null');sessionStorage.removeItem('chvostikovo_verified_email_return')}catch(_){}
  params.delete('email_confirmed');
  history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():''));
  if(!verified||typeof verified.email!=='string'||typeof verified.at!=='number'||Date.now()-verified.at>300000||verified.at>Date.now())return false;
  showAuth('login');
  $('loginEmail').value=verified.email;
  authMessage('info','E-mail je potvrdený. Môžete sa prihlásiť.');
  loading(false);
  return true;
}
async function init(){registerSW();if(handleRecoveryHash()||handleVerifiedEmailReturn()){loading(false);return}state.session=currentSession();if(state.session)await bootstrap();else{showAuth('login');loading(false)}}
$('showLogin').addEventListener('click',()=>showAuth('login'));$('showSignup').addEventListener('click',()=>showAuth('signup'));$('forgotPasswordBtn').addEventListener('click',()=>showAuth('forgot'));$('backToLogin').addEventListener('click',()=>showAuth('login'));
const pendingLoginEmail=localStorage.getItem('chvostikovo_pending_login_email');if(pendingLoginEmail&&!$('loginEmail').value)$('loginEmail').value=pendingLoginEmail;
(function customerSignupPasswordV19(){
  if(window.__customerSignupPasswordV19)return;window.__customerSignupPasswordV19=true;
  const first=$('signupPassword');if(!first)return;
  const firstGroup=first.parentElement;
  const style=document.createElement('style');style.id='customer-signup-password-v19-style';style.textContent='.password-field-v19{position:relative}.password-field-v19 .input{padding-right:52px}.password-eye-v19{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:40px;height:38px;border:0;border-radius:10px;background:transparent;font-size:18px;cursor:pointer}.password-eye-v19[aria-pressed="true"]{background:#f3f4f6}.booking-picker-error-v95{margin:10px 0 12px;padding:12px 13px;border:1px solid #fdba74;border-radius:14px;background:#fff7ed;color:#9a3412;font-size:13px;line-height:1.4}.booking-picker-error-v95 strong{display:block;margin-bottom:5px}.booking-picker-error-v95 button{margin-top:9px}';document.head.appendChild(style);
  function wrap(input){
    if(!input||input.parentElement?.classList.contains('password-field-v19'))return;
    const holder=document.createElement('div');holder.className='password-field-v19';input.parentNode.insertBefore(holder,input);holder.appendChild(input);
    const eye=document.createElement('button');eye.type='button';eye.className='password-eye-v19';eye.textContent='👁';eye.setAttribute('aria-label','Zobraziť heslo');eye.setAttribute('aria-pressed','false');holder.appendChild(eye);
    eye.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';eye.setAttribute('aria-pressed',show?'true':'false');eye.setAttribute('aria-label',show?'Skryť heslo':'Zobraziť heslo')});
  }
  wrap(first);
  if(!$('signupPasswordAgain')){
    const group=document.createElement('div');group.innerHTML='<label for="signupPasswordAgain">Zopakujte heslo</label><input id="signupPasswordAgain" class="input" type="password" autocomplete="new-password" minlength="8" required>';
    firstGroup?.insertAdjacentElement('afterend',group);wrap($('signupPasswordAgain'));
  }
  const infectious=[...document.querySelectorAll('.vaccine-box strong')].find(el=>el.textContent.trim()==='Infekčné ochorenia');
  if(infectious&&!document.getElementById('infectiousInfoV19')){infectious.textContent='Infekčné ochorenia (DHPPi+L)';infectious.insertAdjacentHTML('afterend','<div id="infectiousInfoV19" class="hint" style="margin-top:5px">Psinka · infekčný zápal pečene · parvoviróza · psia parainfluenza · leptospiróza</div>')}
})();
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();if(e.submitter?.disabled)return;try{if(e.submitter)e.submitter.disabled=true;loading(true);const s=await authFetch('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('loginEmail').value.trim(),password:$('loginPassword').value})});saveSession(s,$('rememberLogin').checked);localStorage.removeItem('chvostikovo_pending_login_email');await bootstrap(false)}catch(e){authMessage('error',e.message)}finally{if(e.submitter)e.submitter.disabled=false;loading(false)}});
function showExistingSignupAccount(email){
  showAuth('login');
  $('loginEmail').value=email;
  $('forgotEmail').value=email;
  authMessage('info','Pre tento e-mail už máte účet. Prihláste sa alebo si obnovte heslo.');
}
$('signupForm').addEventListener('submit',async e=>{e.preventDefault();if(e.submitter?.disabled)return;const password=$('signupPassword').value,passwordAgain=$('signupPasswordAgain')?.value||'',signupEmail=$('signupEmail').value.trim();if(!PASSWORD_STRONG_RE.test(password)){authMessage('error',PASSWORD_MIN_MESSAGE);$('signupPassword').focus();return}if(password!==passwordAgain){authMessage('error','Heslá sa nezhodujú.');$('signupPasswordAgain')?.focus();return}try{if(e.submitter)e.submitter.disabled=true;loading(true);localStorage.setItem('chvostikovo_pending_login_email',signupEmail);const data=await authFetch('/auth/v1/signup?redirect_to='+encodeURIComponent(CUSTOMER_PUBLIC_URL),{method:'POST',body:JSON.stringify({email:signupEmail,password,data:{full_name:$('signupName').value.trim(),phone:$('signupPhone').value.trim(),dog_name:$('signupDogName').value.trim(),privacy_notice_version:'privacy-v1',privacy_notice_acknowledged_at:new Date().toISOString()}})});const identities=data?.identities??data?.user?.identities;if(!data?.access_token&&Array.isArray(identities)&&identities.length===0){showExistingSignupAccount(signupEmail)}else if(data?.access_token){saveSession(data,true);localStorage.removeItem('chvostikovo_pending_login_email');await bootstrap(false)}else{showAuth('login');$('loginEmail').value=signupEmail;authMessage('info','Potvrdzovací e-mail bol odoslaný na '+signupEmail+'. Skontrolujte, či je adresa správna, a potvrďte e-mail cez odkaz v správe.')}}catch(e){if(e.code==='user_already_exists'||/^User already registered[.!]?$/i.test(e.message||''))showExistingSignupAccount(signupEmail);else authMessage('error',e.message)}finally{if(e.submitter)e.submitter.disabled=false;loading(false)}});
$('forgotForm').addEventListener('submit',async e=>{e.preventDefault();try{await authFetch('/auth/v1/recover?redirect_to='+encodeURIComponent(CUSTOMER_PUBLIC_URL),{method:'POST',body:JSON.stringify({email:$('forgotEmail').value.trim()})});authMessage('success','Odkaz na obnovu hesla sme poslali na váš e-mail.')}catch(e){authMessage('error',e.message)}});
$('newPasswordForm').addEventListener('submit',async e=>{e.preventDefault();const password=$('newPassword').value;if(!PASSWORD_STRONG_RE.test(password)){authMessage('error',PASSWORD_MIN_MESSAGE);$('newPassword').focus();return}if(password!==$('newPasswordAgain').value){authMessage('error','Heslá sa nezhodujú.');return}try{await authFetch('/auth/v1/user',{method:'PUT',headers:{Authorization:'Bearer '+state.session.access_token},body:JSON.stringify({password})});authMessage('success','Heslo je zmenené.');await bootstrap()}catch(e){authMessage('error',e.message)}});
$('logoutBtn').addEventListener('click',async()=>{
  ['dogSettingsModalV36','privacyInfoModal','schoolTermsModal','dogDetailsModal','waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75','announcementModalV75','betaVersionModal','customerContactModal','customerGradebookModal'].forEach(id=>$(id)?.classList.add('hidden'));
  document.documentElement.classList.remove('settings-open-v36','customer-modal-open');
  try{if(state.session)await authFetch('/auth/v1/logout',{method:'POST',headers:{Authorization:'Bearer '+state.session.access_token}})}catch(_){}
  clearSession();showAuth('login');
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(!standalone){
    sessionStorage.removeItem('chvostikovo_install_guide_seen_v1');
    setTimeout(()=>document.getElementById('installHelpLink')?.click(),180);
  }
});
$('navBooking').addEventListener('click',()=>switchTab('booking'));$('navDog').addEventListener('click',()=>switchTab('menu'));$('navMessages').addEventListener('click',()=>switchTab('messages'));$('navStaff').addEventListener('click',()=>switchTab('staff'));
$('dogSelector').addEventListener('change',e=>{const editing=!$('dogDetailsModal')?.classList.contains('hidden'),mode=dogDetailsModeV96;rememberVaccineDraftV287();clearVaccinationProofStageV104();state.selectedDogId=Number(e.target.value);renderPassSummary();renderDog();if(editing)openDogDetails(mode,false)});['input','change'].forEach(type=>$('dogBirthDate').addEventListener(type,syncDogAgeField));
$('dogSex').addEventListener('change',syncDogDetailsSexTintV297);
mountDogInlineChoicesV297();['rabiesUntil','infectiousUntil','kennelUntil','leptoL4UntilV211'].forEach(id=>['input','change'].forEach(type=>$(id)?.addEventListener(type,()=>{$('vaccineErrorV287')?.remove();$(id)?.removeAttribute('aria-invalid');updateVaccinationStatusesV96();renderVaccinationProofsV104()})));$('dogForm').addEventListener('submit',saveDog);$('dogDetailsClose').addEventListener('click',()=>closeDogDetails(false));$('dogDetailsModal').addEventListener('click',e=>{if(e.target===$('dogDetailsModal'))e.preventDefault()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('dogDetailsModal').classList.contains('hidden'))closeDogDetails(false)});$('profileForm').addEventListener('submit',saveProfile);$('accountToggle').addEventListener('click',()=>$('profileForm').classList.toggle('hidden'));$('messageForm').addEventListener('submit',sendMessage);
$('bookingDogSelector').addEventListener('change',e=>{state.selectedDogId=Number(e.target.value);renderDogSelector();renderPassSummary();renderDog();renderUpcoming();renderDays()});
// v242: the hero's photo/name and blank surface open the existing "Údaje psíka" editor.
// Do not steal clicks from vaccination, visits, gradebook, pass actions or dog selection.
$('bookingDogDetailsOpenV242')?.addEventListener('click',()=>openDogWithChoiceV276('details'));
$('bookingDogProfile')?.addEventListener('click',event=>{
  const target=event.target;
  if(!(target instanceof Element))return;
  if(target.closest('button,a,select,input,textarea,label,[role="button"],[role="link"],[contenteditable="true"]'))return;
  openDogWithChoiceV276('details');
});

$('dogDetailsPhotoButton').addEventListener('click',()=>{const dog=selectedDog();if(dog?.photo_url)showPhotoActionsV89(dog);else selectNewDogPhotoV89()});
$('dogPhotoInput').addEventListener('click',()=>{window.__customerPhotoPickerV88=true;setTimeout(()=>{if(!window.__customerPhotoDecodeV88)window.__customerPhotoPickerV88=false},15000)});
$('dogPhotoInput').addEventListener('change',openPhotoEditor);
$('dogPhotoInput').addEventListener('cancel',()=>{
  window.__customerPhotoPickerV88=false;
  photoPickerFromActionsV184=false;
  const modal=$('photoActionsModalV89');
  modal?.classList.remove('photo-picker-waiting-v184');
  modal?.removeAttribute('aria-busy');
});
$('bookingVaccinationStatus').addEventListener('click',()=>openDogWithChoiceV276('vaccinations'));
$('bookingVisitCount').addEventListener('click',()=>window.openDogVisitsV99?.());
function openCustomerRules(){if(window.openCustomerRulesV55)window.openCustomerRulesV55();else $('schoolRulesCardV55')?.click()}
function closeCustomerSmallModal(id){$(id).classList.add('hidden');document.documentElement.classList.remove('customer-modal-open')}
function openCustomerGradebook(){$('customerGradebookModal').classList.remove('hidden');document.documentElement.classList.add('customer-modal-open')}
$('menuRules').addEventListener('click',openCustomerRules);
$('bookingGradebook').addEventListener('click',openCustomerGradebook);
$('menuGradebook').addEventListener('click',openCustomerGradebook);
$('customerGradebookClose').addEventListener('click',()=>closeCustomerSmallModal('customerGradebookModal'));
$('customerGradebookModal').addEventListener('click',e=>{if(e.target===$('customerGradebookModal'))closeCustomerSmallModal('customerGradebookModal')});
$('menuDogDetails').addEventListener('click',()=>openDogWithChoiceV276('details'));
$('menuVaccinations').addEventListener('click',()=>openDogWithChoiceV276('vaccinations'));
$('menuMessage').addEventListener('click',openCustomerChat);
$('menuContact').addEventListener('click',()=>{const card=document.querySelector('.account-card');if(card)$('customerContactContent').appendChild(card);renderProfile();$('profileForm').classList.remove('hidden');$('customerContactModal').classList.remove('hidden');document.documentElement.classList.add('customer-modal-open');requestAnimationFrame(renderProfile)});
$('customerContactClose').addEventListener('click',()=>closeCustomerSmallModal('customerContactModal'));
$('customerContactModal').addEventListener('click',e=>{if(e.target===$('customerContactModal'))closeCustomerSmallModal('customerContactModal')});
function openMenuSettings(section){window.openCustomerSettingsV102?.(section)}
$('menuNotifications').addEventListener('click',()=>openMenuSettings('notifications'));
$('menuLegal').addEventListener('click',()=>openMenuSettings('legal'));
$('menuLogout').addEventListener('click',()=>$('logoutBtn').click());
$('menuBuildVersion').textContent='Beta 1 · Verzia '+APP_VERSION;
$('menuCopyrightYear').textContent=String(new Date().getFullYear());
window.addEventListener('pageshow',()=>setTimeout(repairCustomerScrollV60,0));
window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(repairCustomerScrollV60));
async function refreshOnResume(){
  const now=Date.now();
  void checkCustomerRelease();
  if(window.__customerPhotoPickerV88===true||window.__customerPhotoDecodeV88===true)return;
  if(!state.session||document.visibilityState==='hidden'||now-lastResumeRefresh<5000)return;
  if(state.data&&customerPassSummaryDate!==bratislavaToday())renderPassSummary();
  lastResumeRefresh=now;
  startCustomerLive();
  queueCustomerSync('all',40);
}
window.addEventListener('focus',refreshOnResume);window.addEventListener('online',refreshOnResume);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshOnResume();else stopCustomerLive()});
let waitingDogFallbackV101=0;
function scheduleWaitingDogFallbackV101(){
  clearTimeout(waitingDogFallbackV101);
  if(!state.session||document.visibilityState==='hidden'||(state.data?.dogs||[]).length)return;
  waitingDogFallbackV101=setTimeout(()=>{
    waitingDogFallbackV101=0;
    if(state.session&&document.visibilityState==='visible'&&!(state.data?.dogs||[]).length){
      queueCustomerSync('all',0);
      scheduleWaitingDogFallbackV101();
    }
  },60000);
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleWaitingDogFallbackV101();else{clearTimeout(waitingDogFallbackV101);waitingDogFallbackV101=0}});
setTimeout(scheduleWaitingDogFallbackV101,1500);
(function betaUiV75Runtime(){
  const badge=$('betaVersionBadge'),modal=$('betaVersionModal'),close=$('betaVersionClose'),messages=$('betaVersionMessages');if(!badge||!modal)return;
  badge.addEventListener('click',()=>modal.classList.remove('hidden'));close?.addEventListener('click',()=>modal.classList.add('hidden'));modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});messages?.addEventListener('click',()=>{modal.classList.add('hidden');switchTab('messages')});
})();
init().finally(()=>{void checkCustomerRelease()});
/* consolidated booking layout: section heading + reservation deadline */
function ensureBookingLayout(){
  const booking=$('bookingTab'),week=$('weekDays');if(!booking||!week)return;
  const oldHead=[...booking.querySelectorAll('.section-head')].find(x=>x.querySelector('h2')?.textContent?.trim()==='Vyberte deň');
  if(oldHead)oldHead.remove();
  if(!booking.querySelector('.booking-section-head')){
    week.insertAdjacentHTML('beforebegin','<div class="section-head booking-section-head"><div><h2>Vyberte deň</h2><span id="weekTitle" class="week-range-v36">Nasledujúce dni</span></div></div><div id="deadlineText" class="deadline-card"><strong>Prosíme o rezerváciu na ďalší týždeň do nedele 20:00.</strong><span class="hidden"></span></div>');
  }
}
ensureBookingLayout();
function placeDeadlineV59(){
  const deadline=$('deadlineText'),board=$('customerBulletinV229'),upcoming=$('upcomingBookings');
  // Keep ONE existing, dynamic reminder; move its element inside the noticeboard.
  if(deadline&&board){if(deadline.parentElement!==board)board.appendChild(deadline);return}
  if(deadline&&upcoming&&deadline.nextElementSibling!==upcoming)upcoming.parentElement?.insertBefore(deadline,upcoming);
}
placeDeadlineV59();

/* v75: persistent announcement cards + read-on-close modal */
(function customerAnnouncementsV75Runtime(){
  async function markAnnouncementModalReadV75(id){
    try{
      const r=await fetch(SUPABASE_URL+'/rest/v1/portal_announcement_dismissals?on_conflict=announcement_id,user_id',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({announcement_id:Number(id)})});
      if(!r.ok)throw new Error('Oznam sa nepodarilo označiť ako prečítaný.');
    }catch(e){toast(e.message||'Oznam sa nepodarilo označiť ako prečítaný.')}
  }
  function ensureAnnouncementModalV75(){
    let modal=$('announcementModalV75');if(modal)return modal;
    document.body.insertAdjacentHTML('beforeend','<div id="announcementModalV75" class="legal-modal announcement-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="announcementModalTitleV75"><div class="legal-card announcement-modal-card-v75"><button id="announcementModalCloseV75" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Oznam Chvostíkova</div><h2 id="announcementModalTitleV75"></h2><div id="announcementModalBodyV75" class="legal-body"></div></div></div>');return $('announcementModalV75');
  }
  function showAnnouncementModalV75(row){
    if(!row||window.__customerOnboardingCompleteV75!==true)return;
    const modal=ensureAnnouncementModalV75();modal.dataset.announcementId=String(row.id);$('announcementModalTitleV75').textContent=row.title||'Oznam';$('announcementModalBodyV75').textContent=row.body||'';
    $('announcementModalCloseV75').onclick=async()=>{const id=Number(modal.dataset.announcementId||0);modal.classList.add('hidden');if(id)await markAnnouncementModalReadV75(id)};
    modal.classList.remove('hidden');
  }
  customerRenderers.announcements=async()=>{
    if(!state.session)return;
    try{
      const headers={apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token};
      const [annRes,disRes]=await Promise.all([
        fetch(SUPABASE_URL+'/rest/v1/portal_announcements?active=eq.true&select=id,title,body,valid_until,created_at&order=created_at.desc&limit=10',{headers,cache:'no-store'}),
        fetch(SUPABASE_URL+'/rest/v1/portal_announcement_dismissals?select=announcement_id',{headers,cache:'no-store'})
      ]);
      if(!annRes.ok)return;
      const now=Date.now(),rows=(await annRes.json()).filter(a=>!a.valid_until||new Date(a.valid_until).getTime()>now);
      const dismissed=disRes.ok?new Set((await disRes.json()).map(x=>Number(x.announcement_id))):new Set();
      $('announcementNotice').innerHTML=rows.length?'<div class="portal-announcements">'+rows.map(a=>'<div class="portal-announcement" data-announcement-id="'+Number(a.id)+'"><div class="portal-announcement-head">📣 <strong>'+esc(a.title)+'</strong></div><div class="portal-announcement-body">'+esc(a.body)+'</div></div>').join('')+'</div>':'';
      const unread=rows.find(a=>!dismissed.has(Number(a.id)));if(unread)showAnnouncementModalV75(unread);else $('announcementModalV75')?.classList.add('hidden');
    }catch(e){console.warn('Oznamy sa nepodarilo načítať',e)}
  };
})();
(function installGuideV83(){
  const KEY='chvostikovo_install_guide_seen_v1';
  let deferredPrompt=null,installTimer=null,installConfirmed=false;
  const standalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const platform=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)?'ios':/android/i.test(navigator.userAgent)?'android':'other';

  function installedUi(){
    installConfirmed=true;
    if(installTimer){clearTimeout(installTimer);installTimer=null}
    ensureGuide();
    const steps=document.querySelector('#installGuideModal .install-steps');
    if(steps)steps.innerHTML='<div class="install-step"><b>✓</b><span><strong>Aplikácia je nainštalovaná.</strong><br>Otvorte Chvostíkovo cez ikonu aplikácie v telefóne.</span></div>';
    const ib=document.getElementById('installGuideInstallBtn');
    if(ib){ib.classList.add('hidden');ib.disabled=false;ib.textContent='Nainštalovať aplikáciu'}
    const cb=document.getElementById('installGuideContinue');
    if(cb)cb.textContent='Rozumiem';
    sessionStorage.setItem(KEY,'1');
  }

  function pendingUi(){
    const steps=document.querySelector('#installGuideModal .install-steps');
    if(steps)steps.innerHTML='<div class="install-step"><b>…</b><span><strong>Android prijal inštaláciu.</strong><br>Čakám, kým telefón potvrdí jej dokončenie.</span></div>';
    const ib=document.getElementById('installGuideInstallBtn');
    if(ib){ib.disabled=true;ib.textContent='Inštaluje sa…'}
    if(installTimer)clearTimeout(installTimer);
    installTimer=setTimeout(()=>{
      if(installConfirmed||standalone())return installedUi();
      const target=document.querySelector('#installGuideModal .install-steps');
      if(target)target.innerHTML='<div class="install-step"><b>!</b><span><strong>Android zatiaľ nepotvrdil dokončenie inštalácie.</strong><br>Skontrolujte, či sa Chvostíkovo objavilo medzi aplikáciami. Ak nie, znovu otvorte tento odkaz v <strong>Chrome</strong> a skúste inštaláciu ešte raz.</span></div>';
      const b=document.getElementById('installGuideInstallBtn');
      if(b){b.classList.add('hidden');b.disabled=false;b.textContent='Nainštalovať aplikáciu'}
      const cb=document.getElementById('installGuideContinue');
      if(cb)cb.textContent='Zavrieť';
    },20000);
  }

  window.addEventListener('appinstalled',installedUi);
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    ensureGuide();
    if(platform()==='android'){const steps=document.querySelector('#installGuideModal .install-steps');if(steps)steps.innerHTML='<div class="install-step"><span>Kliknite na tlačidlo <strong>Nainštalovať aplikáciu</strong> nižšie a potvrďte inštaláciu.</span></div>'}
    const b=document.getElementById('installGuideInstallBtn');
    if(b){b.classList.remove('hidden');b.disabled=false;b.textContent='Nainštalovať aplikáciu'}
    if(!standalone())setTimeout(openGuide,0);
  });

  function ensureGuide(){
    if(document.getElementById('installGuideModal'))return;
    const p=platform();
    const steps=p==='ios'
      ?'<div class="install-step"><b>1</b><span>V Safari otvorte <strong>⋯ → Zdieľať → Zobraziť viac</strong>.</span></div><div class="install-step"><b>2</b><span>Vyberte <strong>Pridať na plochu</strong>.</span></div><div class="install-step"><b>3</b><span>Zapnite <strong>Otvoriť ako webovú apku</strong>, potvrďte <strong>Pridať</strong> a otvorte Chvostíkovo cez ikonu na ploche.</span></div>'
      :p==='android'
      ?'<div class="install-step"><span>Otvorte tento odkaz v <strong>Chrome</strong>. Keď prehliadač ponúkne inštaláciu, kliknite na tlačidlo <strong>Nainštalovať aplikáciu</strong> a potvrďte ju.</span></div>'
      :'<div class="install-step"><b>1</b><span>Otvorte menu prehliadača.</span></div><div class="install-step"><b>2</b><span>Vyberte možnosť <strong>Inštalovať aplikáciu</strong> alebo <strong>Pridať na plochu</strong>.</span></div>';
    document.body.insertAdjacentHTML('beforeend','<div id="installGuideModal" class="install-guide-modal hidden" role="dialog" aria-modal="true" aria-labelledby="installGuideTitle"><div class="install-guide-card"><button id="installGuideClose" class="install-guide-close" type="button" aria-label="Zavrieť">×</button><div class="install-guide-logo">Chvostíkovo</div><h2 id="installGuideTitle">Pridajte si Chvostíkovo ako aplikáciu</h2><p>Je to najjednoduchší spôsob, ako mať rezervácie, správy a upozornenia vždy poruke.</p><div class="install-steps">'+steps+'</div><button id="installGuideInstallBtn" class="btn full hidden" type="button">Nainštalovať aplikáciu</button><button id="installGuideContinue" class="btn secondary full" type="button">Zavrieť</button></div></div>');
    document.getElementById('installGuideModal')?.classList.toggle('install-guide-ios',p==='ios');
    if(deferredPrompt)document.getElementById('installGuideInstallBtn')?.classList.remove('hidden');
    const close=()=>{sessionStorage.setItem(KEY,'1');document.getElementById('installGuideModal')?.classList.add('hidden')};
    document.getElementById('installGuideClose')?.addEventListener('click',close);
    document.getElementById('installGuideContinue')?.addEventListener('click',close);
    document.getElementById('installGuideInstallBtn')?.addEventListener('click',async()=>{
      if(!deferredPrompt)return;
      const prompt=deferredPrompt;
      deferredPrompt=null;
      prompt.prompt();
      const choice=await prompt.userChoice.catch(()=>null);
      if(choice?.outcome==='accepted')pendingUi();
      else{
        const steps=document.querySelector('#installGuideModal .install-steps');if(steps)steps.innerHTML='<div class="install-step"><span>Inštaláciu ste nepotvrdili. Znovu otvorte tento odkaz v <strong>Chrome</strong> a potvrďte <strong>Nainštalovať aplikáciu</strong>.</span></div>';
        const b=document.getElementById('installGuideInstallBtn');
        if(b){b.classList.add('hidden');b.disabled=false;b.textContent='Nainštalovať aplikáciu'}
      }
    });
  }
  function openGuide(){ensureGuide();document.getElementById('installGuideModal')?.classList.remove('hidden')}
  function mountHelpLink(){const login=document.getElementById('loginForm');if(!login||document.getElementById('installHelpLink')||standalone())return;const b=document.createElement('button');b.id='installHelpLink';b.type='button';b.className='install-help-link';b.textContent='Ako si nainštalovať aplikáciu?';b.addEventListener('click',openGuide);login.appendChild(b)}
  const start=()=>{mountHelpLink();const emailReturn=/type=signup/i.test(location.hash);if(standalone())installedUi();else if(!emailReturn&&sessionStorage.getItem(KEY)!=='1')setTimeout(()=>{if(sessionStorage.getItem(KEY)!=='1')openGuide()},180)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
/* v75: Supabase-backed customer onboarding state machine */
(function customerOnboardingV75Runtime(){
  const PRIVACY_VERSION='privacy-v1';let privacyMandatory=false,running=false,rerun=false;window.__customerOnboardingCompleteV75=false;
  function authHeaders(){return {apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'}}
  function flowIds(){return ['waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75','personalPhotoOnboardingV162']}
  function hideFlow(except=''){for(const id of flowIds())if(id!==except)$(id)?.classList.add('hidden');if(except!=='schoolTermsModal')$('schoolTermsModal')?.classList.add('hidden');$('notificationPopup')?.classList.add('hidden')}
  function ensureWaiting(){if(!$('waitingDogAssignmentModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="waitingDogAssignmentModalV75" class="legal-modal onboarding-modal-v75 waiting-dog-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="waitingDogAssignmentTitleV75"><div class="legal-card waiting-dog-card-v75"><div class="legal-kicker">Chvostíkovo</div><h2 id="waitingDogAssignmentTitleV75">Registrácia je úspešná</h2><div class="legal-body"><p>Účet je pripravený. Teraz čakáme na priradenie vášho psíka k profilu.</p><p class="hint">Po priradení vám pošleme upozornenie a aplikácia sa automaticky sprístupní.</p><p class="hint">Potom si vyhraďte približne 5 minút na pravidlá škôlky, kontrolu údajov psíka a doplnenie platnosti očkovaní aj fotografií očkovacieho preukazu.</p></div></div></div>');return $('waitingDogAssignmentModalV75')}
function ensurePushModal(){if(!$('pushOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="pushOnboardingModalV75" class="legal-modal onboarding-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="pushOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Upozornenia</div><h2 id="pushOnboardingTitleV75">Zapnúť upozornenia?</h2><div class="legal-body"><p>Pripomenieme vám návštevu deň vopred a upozorníme vás na rezervácie, správy a blížiaci sa koniec platnosti očkovania či permanentky.</p></div><button id="pushOnboardingEnableV75" class="btn full" type="button">Zapnúť upozornenia</button><button id="pushOnboardingSkipV75" class="btn secondary full onboarding-secondary-v75" type="button">Teraz nie</button></div></div>');return $('pushOnboardingModalV75')}
  function ensureShareModal(){if(!$('shareOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="shareOnboardingModalV75" class="legal-modal onboarding-modal-v75 centered-onboarding-v97 hidden" role="dialog" aria-modal="true" aria-labelledby="shareOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Súkromie psíka</div><h2 id="shareOnboardingTitleV75">Zobraziť meno a fotku psíka?</h2><div class="legal-body"><p>Ak to povolíte, meno a fotku vášho psíka uvidia ostatní majitelia, ktorí majú psíka prihláseného v rovnaký deň. Toto nastavenie môžete kedykoľvek neskôr zmeniť.</p></div><button id="shareOnboardingYesV75" class="btn full" type="button">Áno, zobrazovať</button><button id="shareOnboardingNoV75" class="btn secondary full onboarding-secondary-v75" type="button">Nie, ponechať anonymne</button></div></div>');return $('shareOnboardingModalV75')}
  function ensureDetailsModal(){if(!$('dogDetailsOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="dogDetailsOnboardingModalV75" class="legal-modal onboarding-modal-v75 centered-onboarding-v97 hidden" role="dialog" aria-modal="true" aria-labelledby="dogDetailsOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Môj psík</div><h2 id="dogDetailsOnboardingTitleV75">Doplňte údaje o psíkovi</h2><div class="legal-body"><p>Najprv doplňte pár základných údajov o psíkovi.</p><p>Potom doplníte povinné očkovania. Bez nich nie je možné využívať rezervačný systém ani vytvárať rezervácie do škôlky.</p></div><button id="dogDetailsOnboardingFillV75" class="btn full" type="button">Doplniť údaje</button></div></div>');return $('dogDetailsOnboardingModalV75')}
  function openPrivacyInfo(mandatory=false){privacyMandatory=!!mandatory;const modal=$('privacyInfoModal');if(!modal)return;hideFlow();$('privacyInfoClose')?.classList.toggle('hidden',privacyMandatory);if($('privacyInfoOk'))$('privacyInfoOk').textContent=privacyMandatory?'Potvrdiť a pokračovať':'Rozumiem';modal.classList.remove('hidden')}
  function closePrivacyInfo(){if(privacyMandatory)return;$('privacyInfoModal')?.classList.add('hidden')}
  async function acknowledgePrivacy(){if(!privacyMandatory){closePrivacyInfo();return}const btn=$('privacyInfoOk');if(btn)btn.disabled=true;try{const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_acknowledge_privacy_notice',{method:'POST',headers:authHeaders(),body:JSON.stringify({p_version:PRIVACY_VERSION})});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok)throw new Error(data?.message||data?.error||'Potvrdenie sa nepodarilo uložiť.');if(state.data?.profile){state.data.profile.privacy_notice_version=PRIVACY_VERSION;state.data.profile.privacy_notice_acknowledged_at=new Date().toISOString()}privacyMandatory=false;$('privacyInfoModal')?.classList.add('hidden');runCustomerOnboardingV75()}catch(e){toast(e.message||'Potvrdenie sa nepodarilo uložiť.')}finally{if(btn)btn.disabled=false}}
  async function activeTermsDocument(){try{return await readActiveCustomerTermsV146()}catch(_){return null}}
  async function acceptedTerms(version){const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_sync_owner_terms_v254',{method:'POST',headers:authHeaders(),body:JSON.stringify({p_terms_version:version}),cache:'no-store'});if(!r.ok)return[];return await r.json()}
  function termParagraphsV106(body){
    const split=String(body||'').replace(/\. (?=(?:Majiteľ|Fenky|Ak|Chvostíkovo|Aj pri|Psia škôlka|Psík|Do kolektívu|Pri závažných|Pri úvodnej|V prípade|Náklady|Kapacita|Bez včasného|Pri závažných dôvodoch|Permanentka|10-vstupová|Platnosť permanentky|Nevyužité vstupy|Služba|Aktuálna cena|Podmienky sa)\b)/g,'.\n');
    return split.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  }
  function formatSchoolTermsV97(text){
    const chunks=String(text||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
    let html='';
    for(let i=0;i<chunks.length;i++){
      const headingText=chunks[i];
      if(/^\d+\.\s+/.test(headingText)){
        let body='';
        while(i+1<chunks.length&&!/^\d+\.\s+/.test(chunks[i+1]))body+=(body?'\n\n':'')+chunks[++i];
        const paragraphs=termParagraphsV106(body);
        html+='<section class="terms-point-v97"><strong>'+esc(headingText)+'</strong>'+paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('')+'</section>';
      }else html+='<p class="terms-loose-v97">'+esc(headingText)+'</p>';
    }
    return html;
  }
  function showSchoolTerms(dog,doc){
    const modal=$('schoolTermsModal');if(!modal)return false;
    hideFlow('schoolTermsModal');
    modal.dataset.dogId=String(dog.id);
    modal.dataset.version=String(doc.version);
    modal.dataset.documentHash=String(doc.document_hash||'');
    $('schoolTermsTitle').textContent=doc.title||'Podmienky škôlky';
    $('schoolTermsDog').textContent=(state.data?.dogs||[]).filter(d=>Number(d.owner_id)===Number(dog.owner_id)).map(d=>d.name).join(' a ')+' · Verzia '+termsVersionLabel(doc.version);
    const body=$('schoolTermsBody'),ack=$('schoolTermsAck'),confirm=$('schoolTermsConfirm');
    body.innerHTML=formatSchoolTermsV97(doc.body||'');
    ack.checked=false;
    ack.disabled=true;
    confirm.disabled=true;
    let hint=$('schoolTermsScrollHintV85');
    if(!hint){
      hint=document.createElement('div');
      hint.id='schoolTermsScrollHintV85';
      hint.className='terms-scroll-hint-v85';
      body.insertAdjacentElement('afterend',hint);
    }
    const checkBottom=()=>{
      const atBottom=body.scrollTop+body.clientHeight>=body.scrollHeight-6;
      if(atBottom){
        ack.disabled=false;
        hint.textContent='Teraz môžete potvrdiť, že ste si podmienky prečítali.';
        hint.classList.add('done');
        body.removeEventListener('scroll',checkBottom);
      }else{
        hint.textContent='Prečítajte si podmienky. Až potom sa sprístupní potvrdenie o prečítaní podmienok.';
        hint.classList.remove('done');
      }
    };
    body.scrollTop=0;
    body.removeEventListener('scroll',body.__termsScrollV85);
    body.__termsScrollV85=checkBottom;
    body.addEventListener('scroll',checkBottom,{passive:true});
    modal.classList.remove('hidden');
    requestAnimationFrame(checkBottom);
    return true
  }
  async function acceptSchoolTerms(){const modal=$('schoolTermsModal'),dogId=Number(modal?.dataset.dogId||0),version=String(modal?.dataset.version||'');if(!dogId||!version||!$('schoolTermsAck')?.checked||$('schoolTermsAck')?.disabled||$('schoolTermsConfirm')?.disabled)return;const btn=$('schoolTermsConfirm');if(btn)btn.disabled=true;try{const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_accept_owner_terms_v254',{method:'POST',headers:authHeaders(),body:JSON.stringify({p_dog_id:dogId,p_terms_version:version,p_document_hash:modal.dataset.documentHash,p_acceptance_text:TERMS_ACCEPTANCE_TEXT})});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok)throw new Error(data?.message||data?.error||'Podmienky sa nepodarilo potvrdiť.');modal.classList.add('hidden');toast('Podmienky škôlky boli potvrdené.');window.renderCustomerLegalStatusV103?.(true);runCustomerOnboardingV75()}catch(e){toast(e.message||'Podmienky sa nepodarilo potvrdiť.')}finally{if(btn)btn.disabled=false}}
  function visibilityDecided(dogId){if((state.data?.dogs||[]).find(d=>Number(d.id)===Number(dogId))?.share_name_photo_at)return true;return (state.data?.visibility_consents||[]).some(x=>Number(x.dog_id)===Number(dogId))}
  function detailsPromptAnswered(dogId){return (state.data?.dog_onboarding||[]).some(x=>Number(x.dog_id)===Number(dogId))}
  function detailsAlreadyComplete(dog){return window.customerVaccinationsCompleteV96?window.customerVaccinationsCompleteV96(dog):false}
  window.customerDogDetailsCompleteV95=detailsAlreadyComplete;
  function showPushPrompt(){hideFlow('pushOnboardingModalV75');const modal=ensurePushModal();modal.classList.remove('hidden');$('pushOnboardingEnableV75').onclick=async()=>{const yes=$('pushOnboardingEnableV75'),no=$('pushOnboardingSkipV75');yes.disabled=true;no.disabled=true;try{await enablePushForCurrentUserV75();modal.classList.add('hidden');toast('Upozornenia sú zapnuté.');runCustomerOnboardingV75()}catch(e){toast(e.message||'Upozornenia sa nepodarilo zapnúť.')}finally{yes.disabled=false;no.disabled=false}};$('pushOnboardingSkipV75').onclick=async()=>{const yes=$('pushOnboardingEnableV75'),no=$('pushOnboardingSkipV75');yes.disabled=true;no.disabled=true;try{await completePushPromptV75();modal.classList.add('hidden');runCustomerOnboardingV75()}catch(e){toast(e.message||'Nastavenie sa nepodarilo uložiť.')}finally{yes.disabled=false;no.disabled=false}}}
  function showSharePrompt(dog){hideFlow('shareOnboardingModalV75');const modal=ensureShareModal();modal.dataset.dogId=String(dog.id);$('shareOnboardingTitleV75').textContent='Chcete, aby ostatní používatelia videli meno a fotku '+(dog.name||'vášho psíka')+'?';const finish=async granted=>{const yes=$('shareOnboardingYesV75'),no=$('shareOnboardingNoV75');yes.disabled=true;no.disabled=true;try{await api({action:'set_photo_visibility',dog_id:Number(dog.id),granted});dog.share_name_photo=granted;state.data.visibility_consents=state.data.visibility_consents||[];state.data.visibility_consents.unshift({dog_id:Number(dog.id),granted,consent_version:'2026-09-09',created_at:new Date().toISOString()});modal.classList.add('hidden');renderDog();runCustomerOnboardingV75()}catch(e){toast(e.message||'Nastavenie sa nepodarilo uložiť.')}finally{yes.disabled=false;no.disabled=false}};$('shareOnboardingYesV75').onclick=()=>finish(true);$('shareOnboardingNoV75').onclick=()=>finish(false);modal.classList.remove('hidden')}
  function showDetailsPrompt(dog){
  hideFlow('dogDetailsOnboardingModalV75');
  const modal=ensureDetailsModal(),id=Number(dog.id);
  const hasVaccinationHistory=(state.data?.vaccinations||[]).some(v=>Number(v.dog_id)===id)&&
    (state.data?.vaccination_proofs||[]).some(p=>Number(p.dog_id)===id);
  const needsVaccineRenewal=hasVaccinationHistory&&!detailsAlreadyComplete(dog);
  modal.dataset.dogId=String(id);
  const title=$('dogDetailsOnboardingTitleV75'),body=modal.querySelector('.legal-body'),btn=$('dogDetailsOnboardingFillV75');
  title.textContent=needsVaccineRenewal?'Aktualizujte očkovania psíka':'Doplňte údaje o psíkovi';
  if(body)body.innerHTML=needsVaccineRenewal
    ?'<p>V evidencii je očkovanie, ktoré už nie je platné. Pred ďalšou rezerváciou aktualizujte dátum platnosti aj fotografiu očkovacieho preukazu.</p><p>Bez platných očkovaní nie je možné rezervovať miesto v škôlke.</p>'
    :'<p>Najprv doplňte pár základných údajov o psíkovi.</p><p>Potom doplníte povinné očkovania. Bez nich nie je možné využívať rezervačný systém ani vytvárať rezervácie do škôlky.</p>';
  btn.textContent=needsVaccineRenewal?'Aktualizovať očkovania':'Doplniť údaje';
  btn.onclick=()=>{modal.classList.add('hidden');state.selectedDogId=id;renderDogSelector();renderDog();switchTab('dog');setTimeout(()=>openDogDetails(needsVaccineRenewal?'vaccinations':'details',true),40)};
  modal.classList.remove('hidden');
}
  const photoPromptsAnsweredV162=new Set();
  function photoPromptKeyV162(dog){return 'customer-own-photo-'+state.session.user.id+'-'+dog.id}
  function readPhotoPromptV162(key){try{return localStorage.getItem(key)}catch(_){return null}}
  function needsOwnPhotoPromptV162(dog){const key=photoPromptKeyV162(dog);return (state.data?.other_owner_onboarded_dog_ids||[]).some(id=>Number(id)===Number(dog.id))&&!dog.personal_photo&&!photoPromptsAnsweredV162.has(key)&&readPhotoPromptV162(key)!=='done'}
  function showOwnPhotoPromptV162(dog){hideFlow('personalPhotoOnboardingV162');if(!$('personalPhotoOnboardingV162'))document.body.insertAdjacentHTML('beforeend','<div id="personalPhotoOnboardingV162" class="legal-modal onboarding-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="personalPhotoTitleV162"><div class="legal-card"><h2 id="personalPhotoTitleV162">Pridať fotku psíka?</h2><div class="legal-body"><p>Ak chcete, môžete si do svojho účtu pridať fotku psíka. Fotku môžete pridať alebo zmeniť aj neskôr v časti Môj psík.</p></div><button id="personalPhotoAddV162" class="btn full" type="button">Pridať fotku</button><button id="personalPhotoSkipV162" class="btn secondary full" type="button">Teraz nie</button></div></div>');const finish=add=>{const key=photoPromptKeyV162(dog);photoPromptsAnsweredV162.add(key);try{localStorage.setItem(key,'done')}catch(_){}$('personalPhotoOnboardingV162').classList.add('hidden');state.selectedDogId=Number(dog.id);runCustomerOnboardingV75();if(add)selectNewDogPhotoV89()};$('personalPhotoAddV162').onclick=()=>finish(true);$('personalPhotoSkipV162').onclick=()=>finish(false);$('personalPhotoOnboardingV162').classList.remove('hidden')}
async function evaluate(){if(!state.session||!state.data)return;window.__customerOnboardingCompleteV75=false;const dogs=state.data?.dogs||[];document.documentElement.classList.toggle('customer-awaiting-dog-v107',!dogs.length);try{await ensurePushState(true)}catch(_){}if(!state.data.profile?.privacy_notice_acknowledged_at){openPrivacyInfo(true);return}if(privacyMandatory){privacyMandatory=false;$('privacyInfoModal')?.classList.add('hidden')}if(!state.data.profile?.push_prompt_answered_at){showPushPrompt();return}if(!dogs.length){hideFlow('waitingDogAssignmentModalV75');ensureWaiting().classList.remove('hidden');return}ensureWaiting().classList.add('hidden');const doc=await activeTermsDocument();if(doc){const accepted=await acceptedTerms(doc.version),acceptedIds=new Set((accepted||[]).map(x=>Number(x.dog_id))),missing=dogs.find(d=>!acceptedIds.has(Number(d.id)));if(missing){showSchoolTerms(missing,doc);return}}$('schoolTermsModal')?.classList.add('hidden');const shareDog=dogs.find(d=>!visibilityDecided(d.id));if(shareDog){showSharePrompt(shareDog);return}if(dogSaveInFlightV145||!$('dogDetailsModal')?.classList.contains('hidden'))return;const detailsDog=(state.data?.dogs||[]).find(d=>!detailsPromptAnswered(d.id)&&!detailsAlreadyComplete(d));if(detailsDog){showDetailsPrompt(detailsDog);return}const photoDog=dogs.find(needsOwnPhotoPromptV162);if(photoDog){showOwnPhotoPromptV162(photoDog);return}hideFlow();window.__customerOnboardingCompleteV75=true;if(typeof loadAnnouncements==='function')await loadAnnouncements();renderNotifications()}
  async function runCustomerOnboardingV75(){if(running){rerun=true;return}running=true;try{await evaluate()}catch(e){console.warn('Customer onboarding',e)}finally{running=false;if(rerun){rerun=false;setTimeout(runCustomerOnboardingV75,20)}}}
  window.runCustomerOnboardingV75=runCustomerOnboardingV75;
  document.addEventListener('click',e=>{if(e.target.closest('#privacyInfoBtn')){e.preventDefault();openPrivacyInfo(false)}if(e.target.closest('#privacyInfoClose'))closePrivacyInfo();if(e.target.closest('#privacyInfoOk'))acknowledgePrivacy();if(e.target.closest('#schoolTermsConfirm'))acceptSchoolTerms();if(e.target.closest('#schoolTermsLogout'))$('logoutBtn')?.click()});
  document.addEventListener('change',e=>{if(e.target?.id==='schoolTermsAck'&&$('schoolTermsConfirm'))$('schoolTermsConfirm').disabled=e.target.disabled||!e.target.checked});
  addCustomerHook('afterBootstrap',()=>{setTimeout(runCustomerOnboardingV75,60)});
  setTimeout(()=>{if(state.session&&state.data)runCustomerOnboardingV75()},800);
})();
/* v20b: mount legal UI into stable Vercel shell */
(function mountLegalUiV20(){
  if(window.__chvostikovoLegalUiV20)return;window.__chvostikovoLegalUiV20=true;
  const signup=document.getElementById('signupForm');
  if(signup&&!document.getElementById('signupPrivacyAck')){
    const submit=signup.querySelector('button[type="submit"]');
    submit?.insertAdjacentHTML('beforebegin','<label class="privacy-ack-row"><input id="signupPrivacyAck" type="checkbox" required><span>Potvrdzujem, že som sa oboznámil/a s <button id="privacyInfoBtn" class="inline-link" type="button">informáciami o spracúvaní osobných údajov</button>.</span></label>');
  }
  if(!document.getElementById('privacyInfoModal')){
    document.body.insertAdjacentHTML('beforeend','<div id="privacyInfoModal" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="privacyInfoTitle"><div class="legal-card"><button id="privacyInfoClose" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="privacyInfoTitle">Informácie o spracúvaní osobných údajov</h2><div class="legal-body"><p><strong>Prevádzkovateľ:</strong> Marek Leder – Bellaris, IČO: 56447001, miesto podnikania: Miškovecká 1023/2, 040 11 Košice-Juh. Prevádzkareň Chvostíkovo: Poľská 2207/6, 040 01 Košice-Juh. Zapísaný v Živnostenskom registri Okresného úradu Košice, č. 820-106266. Kontakt: chvostikovo.psiaskolka@gmail.com, +421 951 069 395.</p><p>V zákazníckom portáli spracúvame údaje potrebné na poskytovanie služieb škôlky, najmä meno a priezvisko, e-mail, telefónne číslo, údaje o psíkovi, rezervácie, návštevy, permanentky, taxi službu, komunikáciu so škôlkou, údaje o očkovaniach, fotografie očkovacieho preukazu a fotografiu psíka, ak ju nahráte.</p><p>Údaje používame na správu účtu, organizáciu rezervácií a návštev, bezpečnú starostlivosť o psíka, komunikáciu a plnenie povinností súvisiacich s prevádzkou škôlky.</p><p><strong>Nepoužívame reklamné nástroje ani údaje nepredávame.</strong> Na technickú prevádzku portálu využívame poskytovateľov infraštruktúry potrebných na fungovanie aplikácie.</p><p>Údaje uchovávame počas trvania zákazníckeho vzťahu a následne po dobu potrebnú na splnenie zákonných povinností a ochranu právnych nárokov. V súvislosti so svojimi údajmi môžete požiadať o prístup, opravu, vymazanie alebo obmedzenie spracúvania, ak sú splnené zákonné podmienky.</p><p>Potvrdením pri registrácii neudeľujete marketingový súhlas. Potvrdzujete, že ste sa s týmito informáciami oboznámili.</p><p class="legal-version"></p></div><button id="privacyInfoOk" class="btn full" type="button">Rozumiem</button></div></div>');
  }
  if(!document.getElementById('schoolTermsModal')){
    document.body.insertAdjacentHTML('beforeend','<div id="schoolTermsModal" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="schoolTermsTitle"><div class="legal-card terms-card"><div class="legal-kicker">Chvostíkovo</div><h2 id="schoolTermsTitle">Podmienky škôlky</h2><div id="schoolTermsDog" class="legal-dog"></div><div id="schoolTermsBody" class="legal-body terms-body"></div><label class="terms-ack-row"><input id="schoolTermsAck" type="checkbox"><span>Potvrdzujem, že som si Podmienky psej škôlky Chvostíkovo prečítal/a, ich obsahu rozumiem a súhlasím s nimi.</span></label><button id="schoolTermsConfirm" class="btn full" type="button" disabled>Potvrdiť a prijať podmienky</button><button id="schoolTermsLogout" class="btn secondary full" type="button">Odhlásiť sa</button></div></div>');
  }
  document.getElementById('schoolTermsAck')?.addEventListener('change',e=>{const b=document.getElementById('schoolTermsConfirm');if(b)b.disabled=e.target.disabled||!e.target.checked});
})();

/* consolidated customer legal status: cached reads, explicit refresh only */
(function customerLegalStatusV21(){
  if(window.__chvostikovoCustomerLegalStatusV21)return;
  window.__chvostikovoCustomerLegalStatusV21=true;
  let renderSeq=0;
  const acceptanceCache=new Map(),acceptancePromises=new Map();
  const headers=()=>({apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'});
  const skDateTime=v=>{try{return new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(_){return String(v||'')}};
  async function activeDoc(force=false){
    try{return await readActiveCustomerTermsV146(force)}catch(_){return null}
  }
  async function acceptance(dogId,version,force=false){
    if(!state?.session||!dogId||!version)return null;
    const key=String(state.session.user?.id||'')+'|'+String(dogId)+'|'+String(version);
    if(acceptanceCache.has(key)&&!force)return acceptanceCache.get(key);
    if(acceptancePromises.has(key)&&!force)return acceptancePromises.get(key);
    const promise=(async()=>{
      const r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_acceptances?user_id=eq.'+encodeURIComponent(state.session.user.id)+'&dog_id=eq.'+dogId+'&terms_version=eq.'+encodeURIComponent(version)+'&select=dog_id,terms_version,accepted_at,acceptance_text,document_hash&order=accepted_at.desc&limit=1',{headers:headers(),cache:'no-store'});
      if(!r.ok)return null;const rows=await r.json();return rows?.[0]||null;
    })();
    acceptancePromises.set(key,promise);
    try{const row=await promise;acceptanceCache.set(key,row);return row}finally{acceptancePromises.delete(key)}
  }
  function invalidateAcceptance(dogId,version){if(dogId&&version)acceptanceCache.delete(String(state.session?.user?.id||'')+'|'+String(dogId)+'|'+String(version))}
  function ensureReadModal(){
    let modal=document.getElementById('schoolTermsReadModal');if(modal)return modal;
    document.body.insertAdjacentHTML('beforeend','<div id="schoolTermsReadModal" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="schoolTermsReadTitle"><div class="legal-card terms-card terms-read-card"><button id="schoolTermsReadClose" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="schoolTermsReadTitle">Podmienky psej škôlky Chvostíkovo</h2><div id="schoolTermsReadMeta" class="terms-read-meta"></div><div id="schoolTermsReadBody" class="legal-body terms-read-body"></div><button id="schoolTermsReadDone" class="btn secondary full" type="button">Zavrieť</button></div></div>');
    modal=document.getElementById('schoolTermsReadModal');
    const close=()=>modal.classList.add('hidden');
    document.getElementById('schoolTermsReadClose').onclick=close;document.getElementById('schoolTermsReadDone').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
    return modal;
  }
  function openRead(doc){
    if(!doc)return;
    const modal=ensureReadModal();
    document.getElementById('schoolTermsReadTitle').textContent=doc.title||'Podmienky psej škôlky Chvostíkovo';
    document.getElementById('schoolTermsReadMeta').textContent='Verzia: '+termsVersionLabel(doc.version);
    document.getElementById('schoolTermsReadBody').textContent=doc.body||'';
    modal.classList.remove('hidden');
  }
  async function renderTermsHistory(root,dogId){
    if(!root||!state.session||!dogId)return;
    const account=state.session.user?.id,request=String(Number(root.dataset.request||0)+1);root.dataset.request=request;
    root.replaceChildren();
    try{
      const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_owner_terms_history_v256',{method:'POST',headers:headers(),body:JSON.stringify({p_dog_id:dogId}),cache:'no-store'});
      if(!response.ok)throw new Error('Potvrdené verzie sa nepodarilo načítať.');
      const rows=await response.json();if(root.dataset.request!==request||state.session?.user?.id!==account)return;
      root.innerHTML=rows.length?'<details class="terms-history"><summary><span>Moje potvrdené verzie ('+rows.length+')</span><small>Otvoriť alebo stiahnuť PDF</small></summary>'+rows.map((row,i)=>'<div class="terms-history-row"><strong>Verzia '+esc(termsVersionLabel(row.terms_version))+'</strong><small>✓ Potvrdené dňa '+esc(skDateTime(row.accepted_at))+'</small><div class="terms-history-actions"><button type="button" class="btn secondary small" data-terms-pdf="'+i+'" data-open="true">Otvoriť PDF</button><button type="button" class="btn small" data-terms-pdf="'+i+'">Stiahnuť PDF</button></div></div>').join('')+'</details>':'<small>Zatiaľ nemáte potvrdenú verziu podmienok.</small>';
      root.querySelectorAll('[data-terms-pdf]').forEach(btn=>btn.onclick=async()=>{
        const row=rows[Number(btn.dataset.termsPdf)],open=btn.dataset.open==='true';
        const preview=open?window.open('about:blank','_blank'):null;
        if(preview)preview.document.body.textContent='Pripravujem PDF potvrdenej verzie…';
        btn.disabled=true;
        try{
          const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(row.body)))).map(x=>x.toString(16).padStart(2,'0')).join('');
          if(hash!==row.document_hash)throw new Error('Kontrola historického dokumentu zlyhala.');
          const blob=window.createCustomerTermsPdf(row),filename='Chvostikovo-podmienky-'+termsVersionLabel(row.terms_version)+'.pdf';
          const file=new File([blob],filename,{type:'application/pdf'});
          if(!open&&navigator.canShare?.({files:[file]})){
            await navigator.share({files:[file]});
          }else{
            const url=URL.createObjectURL(blob);
            if(preview){preview.location.replace(url)}else{
              const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
            }
            setTimeout(()=>URL.revokeObjectURL(url),300000);
          }
        }catch(error){preview?.close();if(error.name!=='AbortError')toast(error.message||'PDF sa nepodarilo vytvoriť.')}finally{btn.disabled=false}
      });
    }catch(error){if(root.dataset.request===request)root.textContent=error.message}
  }
  window.renderCustomerTermsHistory=renderTermsHistory;
  async function render(force=false){
    const seq=++renderSeq;
    const stats=document.getElementById('dogStats');
    const dogId=Number(state?.selectedDogId||0);
    if(!stats||!state?.session||!dogId){document.getElementById('customerLegalStatusCard')?.remove();return}
    const doc=await activeDoc(force);
    if(seq!==renderSeq)return;
    const accepted=doc?await acceptance(dogId,doc.version,force):null;
    if(seq!==renderSeq)return;
    const privacyAt=state.data?.profile?.privacy_notice_acknowledged_at||null;
    let card=document.getElementById('customerLegalStatusCard');
    if(!card){card=document.createElement('div');card.id='customerLegalStatusCard';card.className='card customer-legal-card'}
    const v23Target=document.querySelector('#customerLegalSectionV23 .details-content');
    if(v23Target){card.classList.remove('card');card.classList.add('v23-legal-inner');const controls=document.getElementById('customerLegalControlsV23');if(controls)v23Target.insertBefore(card,controls);else v23Target.appendChild(card)}
    else{const legalAnchor=stats.querySelector('.stats-grid.old-stats')||stats.querySelector('.visit-stats-card');if(legalAnchor)stats.insertBefore(card,legalAnchor);else stats.appendChild(card)}
    card.innerHTML=
      '<div class="customer-legal-doc-v105"><div class="customer-legal-row"><div class="customer-legal-main"><strong>Ochrana údajov</strong><small>'+(privacyAt?'Potvrdené '+skDateTime(privacyAt):'Informácie o spracúvaní osobných údajov')+'</small></div><span class="customer-legal-status '+(privacyAt?'ok':'warn')+'">'+(privacyAt?'Potvrdené':'Nepotvrdené')+'</span></div><button id="customerPrivacyReadBtn" class="btn secondary customer-legal-doc-action-v105" type="button">Otvoriť súhlas</button></div>'+
      '<div class="customer-legal-doc-v105"><div class="customer-legal-row"><div class="customer-legal-main"><strong>Pravidlá škôlky</strong><small>'+(accepted?'✓ Potvrdené dňa '+skDateTime(accepted.accepted_at)+' · Verzia '+termsVersionLabel(doc.version):(doc?'Čakajú na potvrdenie':'Dokument zatiaľ nie je aktívny'))+'</small></div><span class="customer-legal-status '+(accepted?'ok':'warn')+'">'+(accepted?'Odsúhlasené':'Nepotvrdené')+'</span></div>'+(doc?'<button id="customerTermsReadBtn" class="btn secondary customer-legal-doc-action-v105" type="button">Otvoriť pravidlá škôlky</button>':'')+'</div>';
    document.getElementById('customerPrivacyReadBtn')?.addEventListener('click',()=>document.getElementById('privacyInfoBtn')?.click());
    document.getElementById('customerTermsReadBtn')?.addEventListener('click',()=>openRead(doc));
  }
  window.renderCustomerLegalStatusV103=(force=false)=>render(force===true);
  function start(){
    document.addEventListener('change',e=>{if(e.target?.id==='dogSelector')setTimeout(()=>render(false),80)});
    document.addEventListener('click',e=>{
      if(e.target?.closest('#schoolTermsConfirm')){
        const modal=document.getElementById('schoolTermsModal'),dogId=Number(modal?.dataset.dogId||state?.selectedDogId||0),version=String(modal?.dataset.version||'');
        setTimeout(()=>{invalidateAcceptance(dogId,version);render(false)},900);
      }
      if(e.target?.closest('#privacyInfoOk'))setTimeout(()=>render(false),500);
    });
    setTimeout(()=>render(false),800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* v22: registration phone + legal modal sequencing */
(function legalPhoneV22(){
  if(window.__chvostikovoLegalPhoneV22)return;
  window.__chvostikovoLegalPhoneV22=true;

  function phonePrefixDigits(raw){
    return String(raw||'').replace(/\D/g,'').slice(0,4);
  }
  function phoneDigits(raw,prefixDigits='421'){
    let d=String(raw||'').replace(/\D/g,'');
    if(prefixDigits&&d.startsWith(prefixDigits))d=d.slice(prefixDigits.length);
    if(d.startsWith('0'))d=d.slice(1);
    return d.slice(0,14);
  }
  function phoneDisplay(d){
    d=String(d||'').slice(0,14);
    if(d.length<=9)return [d.slice(0,3),d.slice(3,6),d.slice(6,9)].filter(Boolean).join(' ');
    return d.replace(/(\d{3})(?=\d)/g,'$1 ').trim();
  }
  function mountSignupPhone(){
    const input=document.getElementById('signupPhone');
    const form=document.getElementById('signupForm');
    if(!input||!form)return;
    input.type='text';
    input.inputMode='tel';
    input.autocomplete='tel-national';
    input.placeholder='951 123 456';
    let prefix=document.getElementById('signupPhonePrefix');
    if(!input.closest('.signup-phone-field')){
      const wrap=document.createElement('div');wrap.className='signup-phone-field';
      prefix=document.createElement('input');
      prefix.id='signupPhonePrefix';
      prefix.className='signup-phone-prefix';
      prefix.type='text';
      prefix.inputMode='tel';
      prefix.autocomplete='tel-country-code';
      prefix.value='+421';
      prefix.setAttribute('aria-label','Medzinárodná telefónna predvoľba');
      prefix.setAttribute('maxlength','5');
      input.parentNode.insertBefore(wrap,input);wrap.append(prefix,input);
    }
    const cleanPrefix=()=>{
      const d=phonePrefixDigits(prefix.value);
      prefix.value='+'+(d||'421');
      prefix.setCustomValidity(d.length>=1&&d.length<=4?'':'Zadajte platnú telefónnu predvoľbu.');
    };
    const clean=()=>{
      const p=phonePrefixDigits(prefix.value)||'421';
      const d=phoneDigits(input.value,p);
      input.value=phoneDisplay(d);
      const valid=p==='421'?d.length===9:(d.length>=6&&p.length+d.length<=15);
      input.setCustomValidity(valid?'':p==='421'?'Zadajte 9 číslic telefónneho čísla.':'Skontrolujte dĺžku telefónneho čísla.');
    };
    prefix.addEventListener('focus',()=>prefix.select());
    prefix.addEventListener('input',()=>{const caret=prefix.selectionStart;const d=phonePrefixDigits(prefix.value);prefix.value='+'+d;try{prefix.setSelectionRange(Math.max(1,caret||1),Math.max(1,caret||1))}catch(_){}});
    prefix.addEventListener('blur',()=>{cleanPrefix();clean()});
    prefix.addEventListener('paste',()=>setTimeout(()=>{cleanPrefix();clean()},0));
    input.addEventListener('input',clean);
    input.addEventListener('paste',()=>setTimeout(clean,0));
    input.addEventListener('blur',clean);
    form.addEventListener('submit',e=>{
      cleanPrefix();
      const p=phonePrefixDigits(prefix.value)||'421';
      const d=phoneDigits(input.value,p);
      const valid=p==='421'?d.length===9:(d.length>=6&&p.length+d.length<=15);
      if(!valid){
        input.setCustomValidity(p==='421'?'Zadajte 9 číslic telefónneho čísla.':'Skontrolujte dĺžku telefónneho čísla.');
        input.reportValidity();
        e.preventDefault();e.stopImmediatePropagation();return;
      }
      input.setCustomValidity('');
      input.value='+'+p+d;
      queueMicrotask(()=>{input.value=phoneDisplay(d)});
    },true);
    cleanPrefix();clean();
  }

  function enforceLegalOrder(){
    const privacy=document.getElementById('privacyInfoModal');
    const terms=document.getElementById('schoolTermsModal');
    if(!privacy||!terms)return;
    if(!privacy.classList.contains('hidden')&&!terms.classList.contains('hidden')){
      terms.classList.add('hidden');
    }
  }
  function watchLegalOrder(){
    const privacy=document.getElementById('privacyInfoModal');
    const terms=document.getElementById('schoolTermsModal');
    if(!privacy||!terms){setTimeout(watchLegalOrder,100);return}
    const obs=new MutationObserver(enforceLegalOrder);
    obs.observe(privacy,{attributes:true,attributeFilter:['class']});
    obs.observe(terms,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{
      if(e.target.closest('#privacyInfoBtn')||e.target.closest('#privacyInfoOk'))setTimeout(enforceLegalOrder,0);
    },true);
    enforceLegalOrder();
  }

  const start=()=>{mountSignupPhone();watchLegalOrder()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* v101: all customer shell images are static assets; no Edge Function is used for branding. */
(function portalHomeIconV101(){
  const mount=()=>{
    document.querySelectorAll('img[src*="/chvostikovo-logo"],img[src*="/chvostikovo-brand-logo"]').forEach(img=>{img.src='/icon-192.png'});
    let apple=document.querySelector('link[rel="apple-touch-icon"]');
    if(!apple){apple=document.createElement('link');apple.rel='apple-touch-icon';document.head.appendChild(apple)}
    apple.href='/apple-touch-icon.png';apple.setAttribute('sizes','180x180');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

/* v79: press-and-hold password eye on all auth password fields */
(function authPasswordVisibilityV79(){
  if(window.__chvostikovoAuthPasswordVisibilityV79)return;
  window.__chvostikovoAuthPasswordVisibilityV79=true;
  const eyeSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>';
  function mountOne(inputId){
    const input=document.getElementById(inputId);
    if(!input)return;
    const eyeId=inputId+'EyeV79';
    if(document.getElementById(eyeId))return;
    if(inputId==='loginPassword')document.getElementById('loginPasswordEye')?.remove();
    let wrap=input.closest('.password-input-shell-v80');
    if(!wrap){
      const shell=document.createElement('div');
      shell.className='password-input-shell-v80 password-field-wrap';
      input.parentNode?.insertBefore(shell,input);
      shell.appendChild(input);
      wrap=shell;
    }else wrap.classList.add('password-field-wrap');
    const eye=document.createElement('button');
    eye.id=eyeId;
    eye.type='button';
    eye.className='password-eye-btn';
    eye.setAttribute('aria-label','Podržte pre zobrazenie hesla');
    eye.setAttribute('title','Podržte pre zobrazenie hesla');
    eye.innerHTML=eyeSvg;
    input.insertAdjacentElement('afterend',eye);
    const show=()=>{input.type='text';eye.classList.add('pressed')};
    const hide=()=>{input.type='password';eye.classList.remove('pressed')};
    eye.addEventListener('pointerdown',e=>{e.preventDefault();show()});
    ['pointerup','pointercancel','pointerleave'].forEach(type=>eye.addEventListener(type,hide));
    eye.addEventListener('contextmenu',e=>e.preventDefault());
    eye.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();show()}});
    eye.addEventListener('keyup',hide);
    eye.addEventListener('blur',hide);
    window.addEventListener('blur',hide);
  }
  function mount(){['loginPassword','signupPassword','newPassword','newPasswordAgain'].forEach(mountOne)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* preview consolidated: dog profile layout + app chrome */
(function customerDogProfilePreview(){
  if(window.__chvostikovoDogProfilePreview)return;
  window.__chvostikovoDogProfilePreview=true;

  const monthLabel=value=>{try{return new Intl.DateTimeFormat('sk-SK',{month:'long',year:'numeric'}).format(new Date(String(value).slice(0,10)+'T12:00:00'))}catch(_){return String(value||'')}};

  function detailsShell(id,title){
    let el=document.getElementById(id);
    if(el)return el;
    el=document.createElement('details');
    el.id=id;el.className='card profile-details v23-profile-section';
    el.innerHTML='<summary><span>'+title+'</span><span class="details-chevron">›</span></summary><div class="details-content"></div>';
    return el;
  }

  function renderConsentControls(){
    const root=$('customerLegalControlsV23');
    if(root)root.innerHTML='';
  }

  function settingsHomeV49(){
    const existing=$('dogSettingsContentV36');if(existing)return existing;
    let parking=$('customerSettingsParkingV49');
    if(!parking){parking=document.createElement('div');parking.id='customerSettingsParkingV49';parking.className='hidden';$('dogTab')?.appendChild(parking)}
    return parking;
  }

  function mountLegal(layout){
    const section=detailsShell('customerLegalSectionV23','Súhlasy a podmienky');
    const content=section.querySelector('.details-content');
    let controls=$('customerLegalControlsV23');if(!controls){controls=document.createElement('div');controls.id='customerLegalControlsV23';controls.className='v23-consent-controls';content.appendChild(controls)}
    const legal=$('customerLegalStatusCard');
    if(legal&&legal.parentElement!==content){legal.classList.remove('card');legal.classList.add('v23-legal-inner');content.insertBefore(legal,controls)}
    const home=settingsHomeV49();if(home&&section.parentElement!==home)home.appendChild(section);
    if(!section.dataset.defaultOpened){section.open=false;section.dataset.defaultOpened='1'}
    renderConsentControls();
    return section;
  }

  function ensureVisitsModalV99(){
    let modal=$('dogVisitsModalV99');if(modal)return modal;
    document.body.insertAdjacentHTML('beforeend','<div id="dogVisitsModalV99" class="dog-visits-modal-v99 hidden" role="dialog" aria-modal="true" aria-labelledby="dogVisitsTitleV99"><div class="dog-visits-card-v99"><div class="dog-visits-head-v99"><div><small>Chvostíkovo</small><h2 id="dogVisitsTitleV99">Návštevy v škôlke</h2></div><button id="dogVisitsCloseV99" class="dog-visits-close-v99" type="button" aria-label="Zavrieť">×</button></div><div id="dogVisitsBodyV99"></div></div></div>');
    modal=$('dogVisitsModalV99');const close=()=>{modal.classList.add('hidden');document.documentElement.classList.remove('dog-visits-open-v99')};
    $('dogVisitsCloseV99')?.addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});return modal;
  }
  function renderVisitStats(){
    const dog=selectedDog();if(!dog)return null;const modal=ensureVisitsModalV99(),body=$('dogVisitsBodyV99'),grouped=new Map(),visitCount=totalVisits(dog);
    (state.data?.monthly_totals||[]).filter(m=>Number(m.dog_id)===Number(dog.id)).forEach(m=>{const key=String(m.month||'').slice(0,7);if(key)grouped.set(key,(grouped.get(key)||0)+Number(m.visits||0))});
    const months=[...grouped.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
    body.innerHTML='<div class="dog-visits-total-v99"><span>Návštevy celkovo</span><strong>'+visitCount+'</strong></div><div class="dog-visits-month-title-v99">Mesačné návštevy</div><div class="dog-visits-months-v99">'+(months.length?months.map(([month,count])=>'<div class="v23-month-row"><span>'+esc(monthLabel(month+'-01'))+'</span><strong>'+count+' '+(count===1?'návšteva':count>1&&count<5?'návštevy':'návštev')+'</strong></div>').join(''):'<div class="hint v23-empty-months">Mesačné štatistiky zatiaľ nie sú k dispozícii.</div>')+'</div>';return modal;
  }
  window.openDogVisitsV99=()=>{const modal=renderVisitStats();if(!modal)return;modal.classList.remove('hidden');document.documentElement.classList.add('dog-visits-open-v99')};
  function apply(){
    const tab=$('dogTab'),dog=selectedDog();if(!tab||!dog)return;const head=tab.querySelector(':scope>.section-head');if(head)head.classList.add('dog-section-head-hidden-v99');
    $('dogProfileSettings')?.classList.add('v23-hidden-source');$('dogStats')?.classList.add('v23-hidden-source');
    const oldLayout=$('dogProfileLayoutV23');if(oldLayout)oldLayout.innerHTML='';
    mountLegal(oldLayout||tab);renderVisitStats();
    // The contact form lives in its dedicated Menu modal.
  }

  const calendarSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M7 3v4M17 3v4M3 10h18"></path></svg>';
  const messageSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"></path><path d="M7.5 10h9M7.5 13.5h6"></path></svg>';
  const gearSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>';

  function dogAvatarMarkup(dog,cls){
    const sex=dog?.sex==='male'?' dog-male-v100':dog?.sex==='female'?' dog-female-v100':' dog-neutral-v100';
    if(dog?.photo_url)return '<span class="'+cls+sex+'"><img src="'+esc(dog.photo_url)+'" alt=""></span>';
    return '<span class="'+cls+' fallback'+sex+'">🐾</span>';
  }

  function applyNav(){
    const booking=$('navBooking'),menu=$('navDog');
    if(!booking||!menu)return;
    booking.innerHTML='<span class="nav-icon-v36">'+calendarSvg+'</span><span>Rezervácie</span>';
    menu.innerHTML='<span class="nav-icon-v36">'+gearSvg+'</span><span>Menu</span>';
    booking.classList.add('nav-item-v36');menu.classList.add('nav-item-v36');
  }

  function applyHero(){
    const hero=$('bookingDogProfile'),dog=selectedDog();
    if(!hero||!dog)return;
    hero.classList.remove('dog-female-v100','dog-male-v100','dog-neutral-v100');
    hero.classList.add(dogSexClassV100(dog));
    const avatar=$('bookingDogAvatar');
    updateDogPhotoV260(avatar,dog,dog.name||'Fotka psíka');
    $('bookingDogName').textContent=dog.name||'Môj psík';
    const required=['rabies','infectious','kennel_cough'];
    const rows=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(dog.id));
    const complete=customerVaccinationsCompleteV96(dog);
    const watched=rows.some(v=>v.vaccination_type==='lepto_l4')?[...required,'lepto_l4']:required;
    const nearExpiry=complete&&watched.some(type=>{
      const latest=rows.filter(v=>v.vaccination_type===type&&v.valid_until).sort((a,b)=>String(b.valid_until).localeCompare(String(a.valid_until)))[0];
      return latest&&vaccinationValidityV96(latest.valid_until).kind==='warning';
    });
    const vaccination=$('bookingVaccinationStatus');
    vaccination.className='dog-overview-status '+(!complete?'invalid':nearExpiry?'warning':'valid');
    const vaccinationLabel=!complete?'Očkovania nie sú platné':nearExpiry?'Blížiaci sa koniec<br>platnosti očkovania':'Platné očkovania';
    vaccination.innerHTML='<span class="overview-icon vacc-icon"><svg aria-hidden="true"><use href="#ci-'+(complete&&!nearExpiry?'check':'alert')+'"/></svg></span><span>'+vaccinationLabel+'</span>';
    $('bookingVisitCount').querySelector('.overview-label').textContent='Návštevy v škôlke: '+totalVisits(dog);
  }

  function ensureSettings(){
    const tab=$('dogTab');if(!tab)return;
    $('dogSettingsBtnV36')?.remove();
    if(!$('dogSettingsModalV36')){
      document.body.insertAdjacentHTML('beforeend','<div id="dogSettingsModalV36" class="settings-modal-v36 hidden" role="dialog" aria-modal="true" aria-labelledby="dogSettingsTitleV36"><div class="settings-card-v36"><div class="settings-head-v36"><div><small>Chvostíkovo</small><h2 id="dogSettingsTitleV36">Nastavenia</h2><p>Účet, upozornenia a súhlasy</p></div><button id="dogSettingsCloseV36" class="settings-close-v36" type="button" aria-label="Zavrieť">×</button></div><div id="dogSettingsContentV36" class="settings-content-v36"></div></div></div>');
      $('dogSettingsCloseV36').addEventListener('click',closeSettings);
      $('dogSettingsModalV36').addEventListener('click',e=>{if(e.target===$('dogSettingsModalV36'))closeSettings()});
    }
  }

  function relocateSettings(){
    ensureSettings();
    const content=$('dogSettingsContentV36'),tab=$('dogTab');if(!content||!tab)return;
    const legal=$('customerLegalSectionV23');
    const logout=$('logoutBtn');
    // Contact details are presented separately from settings.
    if(legal&&legal.parentElement!==content){content.appendChild(legal);if(!legal.dataset.v36SettingsCollapsed){legal.open=false;legal.dataset.v36SettingsCollapsed='1'}}
    if(logout){logout.classList.remove('hidden','icon-btn');logout.classList.add('btn','secondary','full');if(logout.textContent!=='Odhlásiť sa')logout.textContent='Odhlásiť sa';logout.style.marginTop='14px';if(content.lastElementChild!==logout)content.appendChild(logout)}
  }

  function openSettings(section='notifications'){
    relocateSettings();
    if(typeof window.prepareCustomerSettingsV102==='function')window.prepareCustomerSettingsV102();
    const modal=$('dogSettingsModalV36'),legal=$('customerLegalSectionV23');
    modal.dataset.section=section;
    $('dogSettingsTitleV36').textContent=section==='legal'?'Súhlasy a podmienky':'Upozornenia';
    const settingsIntro=modal.querySelector('.settings-head-v36 p');
    if(settingsIntro)settingsIntro.textContent=section==='legal'?'Ochrana údajov a pravidlá škôlky.':'Rezervácie, správy a oznamy z Chvostíkova.';
    if(legal)legal.open=section==='legal';
    if(section==='legal')window.renderCustomerLegalStatusV103?.();
    $('dogSettingsModalV36')?.classList.remove('hidden');
    document.documentElement.classList.add('settings-open-v36');
  }
  window.openCustomerSettingsV102=openSettings;
  function closeSettings(){$('dogSettingsModalV36')?.classList.add('hidden');document.documentElement.classList.remove('settings-open-v36')}

  function applyAll(){applyNav();applyHero();ensureSettings();setTimeout(relocateSettings,0)}

  addCustomerHook('afterRenderPassSummary',()=>{setTimeout(()=>{applyHero();applyNav()},0)});
  addCustomerHook('afterRenderDog',()=>{requestAnimationFrame(()=>{apply();applyAll()})});

  const start=()=>{
    apply();
    applyAll();
    const tab=$('dogTab');
    if(tab)new MutationObserver(()=>{clearTimeout(window.__v36SettingsMoveTimer);window.__v36SettingsMoveTimer=setTimeout(relocateSettings,25)}).observe(tab,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target?.closest('#navBooking')||e.target?.closest('#navDog')||e.target?.closest('#navMessages'))setTimeout(()=>{applyNav();applyHero()},0)});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,120),{once:true});else setTimeout(start,120);
})();

/* v222: booking tile in navigation + a 20-second explanatory hint per page session.
   Acknowledgement is persisted ONLY after the first tap on the booking tile. */
(function customerBookingFabV222(){
  const hintVersion='booking-fab-hint-v222';
  const fab=()=>document.getElementById('navBookAddV220');
  const hint=()=>document.getElementById('navBookHintV220');
  const userKey=()=>state.session?.user?.id?hintVersion+':'+state.session.user.id:null;
  const shownForAccounts=new Set();
  let showTimer=0,hideTimer=0;
  function hideHint(){
    clearTimeout(hideTimer);hideTimer=0;
    hint()?.classList.remove('show-v220');
    hint()?.classList.add('hidden');
  }
  function acknowledgeHint(){
    const key=userKey();
    if(key){try{localStorage.setItem(key,'1')}catch(_){}}
    hideHint();
  }
  function maybeShowHint(retry=0){
    const key=userKey();
    if(!fab()||!hint())return;
    if(!key){
      if(retry<35)showTimer=setTimeout(()=>maybeShowHint(retry+1),800);
      return;
    }
    if(shownForAccounts.has(key))return;
    try{if(localStorage.getItem(key)==='1')return}catch(_){}
    if(window.__customerOnboardingCompleteV75!==true||state.activeTab!=='booking'||document.getElementById('appView')?.classList.contains('hidden')){
      if(retry<35)showTimer=setTimeout(()=>maybeShowHint(retry+1),800);
      return;
    }
    if(document.querySelector('.legal-modal:not(.hidden),.booking-picker-v37:not(.hidden)')){
      if(retry<35)showTimer=setTimeout(()=>maybeShowHint(retry+1),800);
      return;
    }
    shownForAccounts.add(key); // In-memory only: the hint may reappear on the NEXT app start unless + was used.
    hint().classList.remove('hidden');
    hint().classList.add('show-v220');
    clearTimeout(hideTimer);
    hideTimer=setTimeout(hideHint,20000);
  }
  function openFromFab(){
    acknowledgeHint();
    if(!state.session||!selectedDog()){toast('Najprv musí byť váš psík priradený k účtu.');return}
    if(state.activeTab!=='booking')switchTab('booking');
    if(typeof window.openBookingPickerV37==='function')window.openBookingPickerV37();
    else toast('Rezervácie ešte nie sú pripravené. Skúste to znova.');
  }
  function init(){
    const button=fab();if(!button||button.dataset.boundV222==='1')return;
    button.dataset.boundV222='1';
    button.addEventListener('click',openFromFab);
    document.getElementById('navDog')?.addEventListener('click',hideHint);
    document.getElementById('navBooking')?.addEventListener('click',()=>{hideHint();setTimeout(()=>maybeShowHint(),500)});
    showTimer=setTimeout(()=>maybeShowHint(),1300);
  }
  addCustomerHook('afterBootstrap',()=>{clearTimeout(showTimer);showTimer=setTimeout(()=>maybeShowHint(),1000)});
  addCustomerHook('afterRenderDog',()=>{if(state.session)setTimeout(()=>maybeShowHint(),450)});
  addCustomerHook('afterSwitchTab',()=>{if(state.activeTab==='booking')setTimeout(()=>maybeShowHint(),450);else hideHint()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>maybeShowHint(),500);else hideHint()});
  window.addEventListener('pageshow',()=>setTimeout(()=>maybeShowHint(),550));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

/* v37: direct settings notification + compact multi-day booking flow */
(function customerBookingAndSettingsV37(){
  if(window.__chvostikovoCustomerBookingAndSettingsV37)return;
  window.__chvostikovoCustomerBookingAndSettingsV37=true;

  let selectedDatesV37=new Set();
  let selectedTaxiByDateV91=new Map();
  let pairBookingV254=false;
  const pairTaxiV254=new Map();
  function pickerDogsV254(){return pairBookingV254?(state.data?.dogs||[]).slice(0,2):[selectedDog()].filter(Boolean)}
  function pickerTaxiV254(date,dogId){return pairBookingV254?pairTaxiV254.get(date+'|'+dogId)||'none':selectedTaxiByDateV91.get(date)||'none'}
  function taxiChoicesV254(date){return pickerDogsV254().map(d=>'<div class="booking-taxi-dog-v254">'+(pairBookingV254?'<strong>'+esc(d.name)+'</strong>':'')+'<div class="booking-taxi-inline-choices-v201">'+[['pickup','Vyzdvihnutie ráno','5 €'],['pickup_dropoff','Tam aj späť','10 €']].map(([id,label,price])=>'<button type="button" class="'+(pickerTaxiV254(date,d.id)===id?'active':'')+'" data-taxi-mode="'+id+'" data-taxi-date="'+date+'" data-taxi-dog="'+d.id+'">'+label+' · '+price+'</button>').join('')+'</div></div>').join('')}
  function sharedItemsV260(dates=[...selectedDatesV37].sort()){
    return dates.flatMap(date=>pickerDogsV254().map(d=>({dog_id:Number(d.id),date,taxi_mode:pickerTaxiV254(date,d.id),billing_choice:'auto'})));
  }
  /* v281: the server quote is an internal consistency guard, never a second confirmation step. */
  function postBookingChoicesV281(quote){
    const byDog=new Map();
    /* A shared pass may have one entry left for two dogs. The other dog is then
       quoted as single: offer a new pass only to that dog, not twice. */
    const dogs=pickerDogsV254();
    const lastSharedCoveredBySingle=new Set(),sharedRenewalBySingle=new Map();
    if(dogs.length===2){
      for(const q of quote||[]){
        if(q.mode!=='pass'||Number(q.total)<=0||Number(q.entry_number)!==Number(q.total)||!q.pass_id)continue;
        const shared=(state.data?.passes||[]).some(p=>Number(p.id)===Number(q.pass_id)&&p.is_shared&&dogs.every(d=>passAllowsDogV244(p,d.id)));
        const otherSingle=(quote||[]).find(x=>x.mode==='single'&&String(x.date)===String(q.date)&&Number(x.dog_id)!==Number(q.dog_id)&&dogs.some(d=>Number(d.id)===Number(x.dog_id)));
        if(shared&&otherSingle){
          lastSharedCoveredBySingle.add(Number(q.dog_id)+'|'+String(q.date));
          sharedRenewalBySingle.set(Number(otherSingle.dog_id)+'|'+String(q.date),{sharedDogIds:dogs.map(d=>Number(d.id)),lastDogId:Number(q.dog_id)});
        }
      }
    }
    for(const q of quote||[]){
      const id=Number(q.dog_id),total=Number(q.total)||0,number=Number(q.entry_number)||0;
      const reason=q.mode==='pass'&&total>0&&number===total?'last':q.mode==='single'?'single':null;
      if(!reason||!Number.isSafeInteger(id)||id<=0)continue;
      if(reason==='last'&&lastSharedCoveredBySingle.has(id+'|'+String(q.date)))continue;
      if(renewalAlreadyPreparedV299(id,reason==='last'?Number(q.pass_id)||0:0))continue;
      const shared=reason==='single'?sharedRenewalBySingle.get(id+'|'+String(q.date)):null;
      if(shared&&(state.data?.pass_requests||[]).some(p=>p.status==='pending'&&shared.sharedDogIds.some(dogId=>passAllowsDogV244(p,dogId))))continue;
      const existing=byDog.get(id);
      if(!existing||reason==='last'&&existing.reason!=='last'||shared&&!existing.sharedDogIds)byDog.set(id,{dogId:id,date:String(q.date),reason,total:reason==='last'&&Number(q.total)===20?20:legacyPassRenewalTotalV299(id),passId:Number(q.pass_id)||0,...shared});
    }
    return [...byDog.values()].sort((a,b)=>a.reason===b.reason?a.dogId-b.dogId:a.reason==='last'?-1:1);
  }
  async function submitSharedV260(dates){
    const items=sharedItemsV260(dates),payload=JSON.stringify(items),key='chvo-shared-submit-v260';let saved;
    for(const d of pickerDogsV254())if(window.customerVaccinationsCompleteV96&&!window.customerVaccinationsCompleteV96(d)){pickerErrorV95('Pred rezerváciou doplňte povinné očkovania pre '+d.name+'.');return}
    try{saved=JSON.parse(sessionStorage.getItem(key)||'null')}catch(_){}
    if(!saved||saved.user!==state.session.user.id||saved.payload!==payload)saved={user:state.session.user.id,payload,operation:crypto.randomUUID(),quote:null};
    const persist=()=>{try{sessionStorage.setItem(key,JSON.stringify(saved))}catch(_){}};
    submittingV37=true;pickerErrorV95('');renderPickerV37();
    try{
      if(!saved.quote){
        const preview=await api({action:'shared_booking_v257',items});
        saved.quote=preview?.data?.quote;
        if(!Array.isArray(saved.quote)||saved.quote.length!==items.length)throw Error('Rozdelenie vstupov sa nepodarilo overiť.');
        persist();
      }
      /* Commit atomically on the FIRST click; preserve the same UUID across explicit retries. */
      const response=await api({action:'shared_booking_v257',items,operation_id:saved.operation,expected:saved.quote});
      const rows=response?.data?.bookings||[];
      if(!response?.data?.committed||rows.length!==items.length)throw Error('Výsledok rezervácie nie je úplný. Skúste znova.');
      for(const row of rows)applyLocalBooking({data:row},{...row,can_manage:true});
      const intents=postBookingChoicesV281(response?.data?.quote||saved.quote);
      sessionStorage.removeItem(key);
      queueCustomerSync('bookings',80);submittingV37=false;closePickerV37();
      toast('Rezervácie boli odoslané na schválenie.');
      if(intents.length)setTimeout(()=>window.showPostBookingPassChoicesV281?.(intents),170);
    }catch(error){
      if(/zmenili/.test(error.message)){sessionStorage.removeItem(key);saved.quote=null}
      pickerErrorV95(error.message||'Rezervácia sa nepodarila. Skúste znova.');queueCustomerSync('bookings',0);
    }finally{submittingV37=false;if(!$('bookingPickerV37')?.classList.contains('hidden'))renderPickerV37()}
  }
  async function submitPairV254(dates){
    const dogs=pickerDogsV254();
    for(const d of dogs)if(window.customerVaccinationsCompleteV96&&!window.customerVaccinationsCompleteV96(d)){pickerErrorV95('Pred rezerváciou doplňte povinné očkovania pre '+d.name+'.');return}
    const payload={dog_ids:dogs.map(d=>Number(d.id)),bookings:dates.map(date=>({date,taxi_by_dog:Object.fromEntries(dogs.map(d=>[String(d.id),pickerTaxiV254(date,d.id)]))}))};
    const fingerprint=JSON.stringify(payload),storageKey='chvo-pair-submit-v254';let saved;
    try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'null')}catch(_){}
    if(!saved||saved.user!==state.session.user.id||saved.payload!==fingerprint)saved={user:state.session.user.id,payload:fingerprint,key:crypto.randomUUID()};
    try{sessionStorage.setItem(storageKey,JSON.stringify(saved))}catch(_){}
    submittingV37=true;pickerErrorV95('');renderPickerV37();
    try{
      const response=await api({action:'request_dogs_bookings',...payload,request_key:saved.key});
      const rows=response?.data?.bookings||[];
      if(rows.length!==dates.length*dogs.length)throw Error('Výsledok rezervácie nie je úplný. Obnovte prehľad a skúste znova.');
      for(const row of rows)applyLocalBooking({data:row},row);
      queueCustomerSync('bookings',80);submittingV37=false;closePickerV37();
      toast('Rezervácie pre '+dogs.map(d=>d.name).join(' a ')+' boli odoslané na schválenie.');
    }catch(error){pickerErrorV95(error.message||'Rezervácia oboch psíkov sa nepodarila. Skúste znova.');queueCustomerSync('bookings',0)}
    finally{submittingV37=false;if(!$('bookingPickerV37')?.classList.contains('hidden'))renderPickerV37()}
  }

  let submittingV37=false;
  let checkingRenewalV157=false;
  let renewalCheckedDogV157=null;
  let pickerEpochV157=0;
  let pendingPassRenewalV95=null;

  /* v199 – pattern from authenticated bootstrap records, without new requests. */
  let smartDaysDismissedV199=false;
  function smartShiftV199(iso,days){
    const d=new Date(String(iso||'')+'T12:00:00Z');
    if(!Number.isFinite(d.getTime()))return '';
    d.setUTCDate(d.getUTCDate()+days);
    return d.toISOString().slice(0,10);
  }
  function smartMondayV199(iso){
    const d=new Date(String(iso||'')+'T12:00:00Z');
    if(!Number.isFinite(d.getTime()))return '';
    const weekday=d.getUTCDay();
    return smartShiftV199(iso,-(weekday===0?6:weekday-1));
  }
  function smartProposalV199(dog,days){
    if(!dog||!Array.isArray(days))return null;
    const history=[
      ...(state.data?.requests||[]).filter(r=>['approved','pending'].includes(r.status)),
      ...(state.data?.booking_history||[]).filter(r=>['booked','attended'].includes(r.status))
    ].filter(r=>Number(r.dog_id)===Number(dog.id)&&typeof r.reservation_date==='string'&&r.reservation_date.length===10);
    if(!history.length)return null;
    const today=bratislavaClockV95().date;
    const eligible=days.filter(d=>typeof d.date==='string'&&d.date.length===10&&d.date>today
      &&d.bookings_open!==false&&Number(d.available)>0
      &&!bookingFor(dog.id,d.date)&&!bookingDeadlineClosedV95(d.date,dog));
    // Previous calendar week first; current week only if the previous has no bookings.
    const currentMonday=smartMondayV199(today),previousMonday=smartShiftV199(currentMonday,-7);
    const previous=history.filter(r=>smartMondayV199(r.reservation_date)===previousMonday);
    const matching=previous.length?previous:history.filter(r=>smartMondayV199(r.reservation_date)===currentMonday);
    if(!matching.length)return null;
    const sourceWeek=previous.length?'previous':'current';
    const weekdays=new Set(matching.map(r=>new Date(r.reservation_date+'T12:00:00Z').getUTCDay()));
    const weeks=[...new Set(eligible.map(d=>smartMondayV199(d.date)).filter(Boolean))].sort();
    for(const monday of weeks){
      // If a week has existing bookings, let the customer add days manually.
      const hasActiveBooking=(state.data?.requests||[]).some(r=>Number(r.dog_id)===Number(dog.id)
        &&['pending','approved'].includes(r.status)&&smartMondayV199(r.reservation_date)===monday)
        ||(state.data?.reservations||[]).some(r=>Number(r.dog_id)===Number(dog.id)
        &&['booked','attended'].includes(r.status)&&smartMondayV199(r.reservation_date)===monday);
      if(hasActiveBooking)return null;
      const target=eligible.filter(d=>smartMondayV199(d.date)===monday);
      const dates=target.filter(d=>weekdays.has(new Date(d.date+'T12:00:00Z').getUTCDay())).map(d=>d.date);
      if(dates.length)return {dates,sourceWeek};
    }
    return null;
  }
  function ensureSmartStyleV199(){
    if(document.getElementById('booking-smart-style-v199'))return;
    const style=document.createElement('style');
    style.id='booking-smart-style-v199';
    style.textContent="\n#bookingPickerSmartDaysV199.booking-smart-v199{margin:12px 0 14px;padding:13px;background:#fff9f3;border:1px solid #fed7aa;border-radius:15px;color:#254836}\n#bookingPickerSmartDaysV199 .smart-head-v199{display:flex;align-items:start;gap:8px}\n#bookingPickerSmartDaysV199 .smart-icon-v199{font-size:20px}\n#bookingPickerSmartDaysV199 strong{display:block;font-size:clamp(13px,3.35vw,15px);line-height:1.4;font-weight:800;white-space:normal;overflow-wrap:normal;letter-spacing:-.15px}\n#bookingPickerSmartDaysV199 p{margin:5px 0 0;color:#60766b;font-size:12px;line-height:1.45}\n#bookingPickerSmartDaysV199 .smart-chips-v199{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;justify-content:flex-start}#bookingPickerSmartDaysV199 .smart-chips-v199.smart-centered-v200{justify-content:center}\n#bookingPickerSmartDaysV199 .smart-chip-v199{padding:7px 11px;border:1px solid #cce3d4;background:#ecf8f0;color:#24553c;border-radius:9px;font-size:12px;font-weight:800}\n#bookingPickerSmartDaysV199 .smart-actions-v199{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}\n#bookingPickerSmartDaysV199 .smart-actions-v199 button{min-height:42px;padding:8px 6px;border-radius:10px;font-size:12px;font-weight:800;line-height:1.3;cursor:pointer}\n#bookingPickerSmartDaysV199 .smart-apply-v199{background:#ea743f;color:white;border:1px solid #de6434}\n#bookingPickerSmartDaysV199 .smart-manual-v199{background:#fff;color:#345044;border:1px solid #dcded6}\n#bookingPickerSmartDaysV199 .smart-actions-v199 button:focus-visible{outline:3px solid #24553c;outline-offset:2px}\n#bookingPickerSmartDaysV199 .smart-footer-v199{display:flex;align-items:center;gap:6px;font-size:10px;color:#64766a;margin-top:9px;white-space:nowrap}#bookingPickerSmartDaysV199 .smart-footer-v199:before{content:'';width:7px;height:7px;flex:none;background:#f97316;border-radius:50%}\n@media(max-width:360px){#bookingPickerSmartDaysV199 .smart-footer-v199{font-size:9px;white-space:normal}#bookingPickerSmartDaysV199.booking-smart-v199{padding:10px}#bookingPickerSmartDaysV199 .smart-actions-v199{gap:5px}#bookingPickerSmartDaysV199 .smart-actions-v199 button{font-size:11px}}\n";
    document.head.appendChild(style);
  }
  function renderSmartDaysV199(dog,days){
    const root=$('bookingPickerSmartDaysV199');
    if(!root)return;
    const suggestion=smartDaysDismissedV199?null:smartProposalV199(dog,days);
    root.classList.toggle('hidden',!suggestion);
    if(!suggestion){root.innerHTML='';return}
    const weekday=['Ne','Po','Ut','St','Št','Pia','So'];
    root.innerHTML='<div class="smart-head-v199"><div><strong>'+(suggestion.sourceWeek==='previous'?'Chcete rezervovať rovnaké dni ako minulý týždeň?':'Chcete rezervovať rovnaké dni ako tento týždeň?')+'</strong>'
      +'</div></div>'
      +'<div class="smart-chips-v199" aria-label="Navrhované dni">'
      +suggestion.dates.map(date=>'<span class="smart-chip-v199">'+weekday[new Date(date+'T12:00:00Z').getUTCDay()]+'</span>').join('')+'</div>'
      +'<div class="smart-actions-v199"><button type="button" class="smart-apply-v199" data-smart-action="apply">Vybrať dni</button>'
      +'<button type="button" class="smart-manual-v199" data-smart-action="manual">Vyberiem sám</button></div>'
      +'<p class="smart-footer-v199">Dni sa len označia, rezerváciu odošlete sami.</p>';
    root.querySelector('.smart-chips-v199')?.classList.toggle('smart-centered-v200',suggestion.dates.length<=2);
  }
  async function applySmartDaysV199(){
    if(submittingV37||checkingRenewalV157)return;
    const dog=selectedDog(),proposal=smartProposalV199(dog,state.data?.availability?.days||[]);
    if(!dog||!proposal)return;
    if(renewalCheckedDogV157!==Number(dog.id)){
      checkingRenewalV157=true;
      const epoch=pickerEpochV157;
      try{
        const isCurrent=()=>epoch===pickerEpochV157&&!$('bookingPickerV37')?.classList.contains('hidden');
        const accepted=sharedDogBillingV260(dog.id)?true:await offerRecentPassRenewalV157(Number(dog.id),isCurrent);
        if(!accepted||Number(state.selectedDogId)!==Number(dog.id)||!isCurrent())return;
        renewalCheckedDogV157=Number(dog.id);
      }catch(error){pickerErrorV95(error.message||'Nepodarilo sa overiť permanentku.');return}
      finally{checkingRenewalV157=false}
    }
    const fresh=smartProposalV199(dog,state.data?.availability?.days||[]);
    if(!fresh)return;
    for(const date of fresh.dates){
      selectedDatesV37.add(date);
      if(!selectedTaxiByDateV91.has(date))selectedTaxiByDateV91.set(date,'none');
    }
    smartDaysDismissedV199=true;
    renderPickerV37();
  }


  function bratislavaClockV95(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),m=Object.fromEntries(parts.map(x=>[x.type,x.value]));return{date:m.year+'-'+m.month+'-'+m.day,minutes:Number(m.hour)*60+Number(m.minute)}}
  function previousIsoDayV95(iso){const d=new Date(String(iso)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
  function bookingDeadlineClosedV95(date,dog){
    if(dog?.booking_late_exception===true)return false;
    const now=bratislavaClockV95(),weekday=new Date(date+'T12:00:00Z').getUTCDay();
    const sunday=new Date(date+'T12:00:00Z');sunday.setUTCDate(sunday.getUTCDate()-weekday);
    const cutoff=sunday.toISOString().slice(0,10);
    return now.date>cutoff||(now.date===cutoff&&now.minutes>=20*60);
  }
  function fitBookingDeadlineTitle(){
    const title=$('deadlineText')?.querySelector('strong');
    if(!title||!title.clientWidth)return;
    if(title.closest('.customer-bulletin-v229')){
      // v236: fit the exact reservation reminder to one line on mobile.
      title.style.setProperty('white-space','nowrap','important');
      title.style.setProperty('font-size','10px','important');
      const room=title.clientWidth,actual=title.scrollWidth;
      if(room>0&&actual>room)title.style.setProperty('font-size',Math.max(7,Math.floor((10*room/actual-0.1)*10)/10)+'px','important');
      return;
    }
    title.style.setProperty('font-size','13px','important');
    if(title.scrollWidth>title.clientWidth)title.style.setProperty('font-size',(13*title.clientWidth/title.scrollWidth).toFixed(2)+'px','important');
  }
  window.addEventListener('resize',()=>requestAnimationFrame(fitBookingDeadlineTitle));

  function updateBookingDeadlineNoticeV127(){
    const box=$('deadlineText');if(!box)return;
    const dog=selectedDog(),days=state.data?.availability?.days||[];
    const current=days[0],closed=current&&bookingDeadlineClosedV95(current.date,dog);
    const weekday=new Date(bratislavaClockV95().date+'T12:00:00Z').getUTCDay();
    const showClosed=closed&&(weekday===0||weekday===1);
    // v231: the board displays only the short advance reminder.
    // Closed-week guidance is already rendered under the week in the reservation picker.
    box.classList.toggle('hidden',!!showClosed);
    box.querySelector('strong').textContent=showClosed
      ? 'Prihlasovanie bolo na tento týždeň uzavreté v nedeľu o 20:00.'
      : 'Prosíme o rezerváciu na ďalší týždeň do nedele 20:00.';
    requestAnimationFrame(fitBookingDeadlineTitle);
    const detail=box.querySelector('span');
    if(detail){detail.textContent=showClosed?'Pre dodatočné prihlásenie kliknite na požadovaný deň a napíšte nám správu.':'';detail.classList.toggle('hidden',!showClosed)}
  }
  function pickerErrorV95(message,deadline=false){const box=$('bookingPickerErrorV95');if(!box)return;box.classList.toggle('hidden',!message);if(!message){box.innerHTML='';return}box.innerHTML='<strong>'+esc(message)+'</strong>'+(deadline?'<div>Pre dodatočné prihlásenie kliknite na požadovaný deň a napíšte nám správu.</div>':'')}

  const shortDayV37=date=>{try{return new Intl.DateTimeFormat('sk-SK',{weekday:'short'}).format(new Date(date+'T12:00:00')).replace('.','')}catch(_){return''}};
  const compactDateV37=date=>{const p=String(date||'').split('-').map(Number);return p.length===3?`${p[2]}.${p[1]}.`:skDate(date)};

  function pushOnV37(){
    return state.pushChecked?!!state.pushEnabled:(typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('chvostikovo_push_enabled')==='1');
  }

  function prepareSettingsV37(){
    const modal=$('dogSettingsModalV36'),content=$('dogSettingsContentV36');
    if(!modal||!content)return;
    document.querySelector('.settings-head-v36>div>small')?.remove();

    let quick=$('settingsNotificationsV37');
    if(!quick){
      quick=document.createElement('div');
      quick.id='settingsNotificationsV37';
      quick.className='settings-quick-v37';
      quick.innerHTML='<div class="settings-paired-v99"><div class="settings-paired-row-v99"><div><strong>Upozornenia</strong><small>Rezervácie, správy a oznamy z Chvostíkova.</small></div><button id="settingsPushToggleV37" class="push-switch" type="button" role="switch" aria-label="Upozornenia"><span></span></button></div><div class="settings-paired-row-v99"><div><strong>Zobraziť meno psa a fotku ostatným</strong><small>Súhlas môžete kedykoľvek vypnúť.</small></div><button id="settingsPrivacyToggleV99" class="push-switch" type="button" role="switch" aria-label="Zdieľanie mena psa a fotky"><span></span></button></div></div>';
      content.insertBefore(quick,content.firstChild||null);
      $('settingsPushToggleV37')?.addEventListener('click',()=>{
        const source=$('pushToggle');
        if(source&&!source.disabled)source.click();
        setTimeout(prepareSettingsV37,120);
        setTimeout(prepareSettingsV37,700);
      });
      $('settingsPrivacyToggleV99')?.addEventListener('click',()=>{const source=$('privacyToggle');if(source&&!source.disabled)source.click();setTimeout(prepareSettingsV37,120);setTimeout(prepareSettingsV37,700)});
    }else if(content.firstElementChild!==quick){content.insertBefore(quick,content.firstChild||null)}

    const direct=$('settingsPushToggleV37'),on=pushOnV37();
    if(direct){direct.classList.toggle('active',on);direct.setAttribute('aria-checked',on?'true':'false')}
    const dog=selectedDog(),privacy=$('settingsPrivacyToggleV99');if(privacy){const sharing=!!dog?.share_name_photo;privacy.classList.toggle('active',sharing);privacy.setAttribute('aria-checked',sharing?'true':'false')}
    const controls=$('customerLegalControlsV23');controls?.querySelectorAll('.v23-consent-row').forEach(row=>row.classList.add('v37-hide-notification'));

    const legal=$('customerLegalSectionV23');
    const privacyRow=$('settingsPrivacyToggleV99')?.closest('.settings-paired-row-v99');
    const legalContent=legal?.querySelector('.details-content');
    if(privacyRow&&legalContent&&privacyRow.parentElement!==legalContent)legalContent.insertBefore(privacyRow,legalContent.firstChild);
    if(legal&&!legal.dataset.v98MenuReady){legal.open=false;legal.dataset.v98MenuReady='1'}
    if(legal&&!legal.dataset.v103LegalBound){
      legal.dataset.v103LegalBound='1';
      legal.addEventListener('toggle',()=>{if(legal.open)window.renderCustomerLegalStatusV103?.()});
    }
  }
  window.prepareCustomerSettingsV102=prepareSettingsV37;


  // v201: In-week optional taxi editor; existing booking RPC and pass accounting remain unchanged.
  let expandedTaxiDateV201=null;
  let taxiEditRequestV201=0, taxiEditSelectionV201='',taxiEditBusyV201=false;
  function ensureTaxiStyleV201(){
    if(document.getElementById('booking-taxi-style-v201'))return;
    const style=document.createElement('style');
    style.id='booking-taxi-style-v201';
    style.textContent="\n#bookingPickerV37 .booking-day-wrap-v201{min-width:0;display:flex;flex-direction:column;gap:3px}\n#bookingPickerV37 .booking-day-wrap-v201>.booking-day-v37{width:100%;min-width:0}\n#bookingPickerV37 .booking-day-taxi-toggle-v201{width:100%;min-height:28px;display:flex;gap:3px;align-items:center;justify-content:center;border:1px solid #d9dee5;border-radius:9px;background:#fff;color:#64748b;font-size:13px;line-height:1;padding:4px 2px;cursor:pointer}\n#bookingPickerV37 .booking-day-taxi-toggle-v201[aria-expanded=\"true\"]{background:#fff;border-color:#d9dee5}\n#bookingPickerV37 .booking-day-taxi-toggle-v201 .taxi-indicator-v201{width:5px;height:5px;border-radius:50%;background:#ea580c}\n#bookingPickerV37 .booking-taxi-inline-v201{margin:8px 0 4px;padding:10px;background:#fff;border:1px solid #fbd2af;border-radius:12px}\n#bookingPickerV37 .booking-taxi-inline-title-v201{font-size:12px;font-weight:800;color:#9a3412;margin:0 0 7px}\n#bookingPickerV37 .booking-taxi-inline-choices-v201{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}\n#bookingPickerV37 .booking-taxi-inline-choices-v201 button{padding:10px 6px;min-height:40px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;color:#334155;font-size:11px;font-weight:700;white-space:nowrap}\n/* v203 two taxi choices */\n#bookingPickerV37 .booking-taxi-inline-choices-v201 button.active{border-color:#fdba74;background:#fff7ed;color:#9a3412}\n#bookingPickerV37 .booking-taxi-inline-choices-v201 button:focus-visible,\n.booking-taxi-pencil-v201:focus-visible{outline:2px solid #ea580c;outline-offset:2px}\n.booking-taxi-pencil-v201{position:relative;width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;border-radius:10px;border:1px solid #fbd2af;background:#fff7ed;color:#9a3412;padding:3px;font-size:17px}.booking-taxi-plus-v209{position:absolute;right:-3px;top:-4px;display:grid;place-items:center;width:14px;height:14px;border-radius:50%;border:1px solid #fff;background:#ea580c;color:#fff;font-size:11px;line-height:1;font-weight:900}\n#bookingTaxiEditV201 .booking-taxi-edit-card-v201{max-width:430px;margin:auto;width:min(100%,430px)}\n#bookingTaxiEditV201 .booking-taxi-edit-choices-v201{display:grid;gap:9px;margin:15px 0}\n#bookingTaxiEditV201 .booking-taxi-edit-choices-v201 button{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:49px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;padding:10px 13px;color:#334155;font-size:13px;font-weight:750;text-align:left}\n#bookingTaxiEditV201 .booking-taxi-edit-choices-v201 button.active{background:#fff7ed;border-color:#fb923c;color:#9a3412}\n#bookingTaxiEditV201 .booking-taxi-edit-actions-v201{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n#bookingTaxiEditV201 .booking-taxi-edit-actions-v201 button{min-height:44px;border-radius:11px;border:1px solid #e2e8f0;font-weight:800;font-size:12px}\n#bookingTaxiEditV201 .booking-taxi-edit-actions-v201 .taxi-send-v201{background:#ea743f;color:#fff;border-color:#ea743f}\n#bookingTaxiEditV201 .booking-taxi-edit-heading-v209{border:1px solid #e2e8f0;border-radius:15px;background:#fff;padding:12px 14px;margin-bottom:14px}#bookingTaxiEditV201 .taxi-title-line-v209{display:flex;align-items:flex-start;flex-direction:column;gap:8px;min-width:0}#bookingTaxiEditV201 .taxi-title-line-v209 h2{margin:0}#bookingTaxiEditV201 #taxiEditDateV201{display:inline-flex;align-items:center;max-width:100%;box-sizing:border-box;width:max-content;padding:6px 10px;border:1px solid #fdba74;border-radius:10px;background:#fff7ed;font-size:12px;line-height:1.35;color:#9a3412;font-weight:750;white-space:normal}\n@media(max-width:350px){#bookingPickerV37 .booking-taxi-inline-choices-v201{grid-template-columns:1fr}#bookingPickerV37 .booking-taxi-inline-choices-v201 button:last-child{grid-column:auto}}\n";
    style.textContent += '\n#bookingPickerV37 .booking-day-taxi-toggle-v201{min-height:35px;font-size:17px;transition:background-color .15s,border-color .15s,color .15s}#bookingPickerV37 .booking-day-taxi-toggle-v201[aria-expanded="true"],#bookingPickerV37 .booking-day-taxi-toggle-v201[data-taxi-selected="true"]{background:#fff0e6;border-color:#f97316;color:#c2410c;box-shadow:0 0 0 1px rgba(249,115,22,.1)}';
    document.head.appendChild(style);
  }
  function allowedTaxiEditV201(row){
    if(!row||row.can_manage===false||row.status!=='approved'
       ||(!row._legacy&&!Number(row.id))||!Number(row.reservation_id)||row.taxi_change_status==='pending')return false;
    if(!['none','pickup'].includes(String(row.taxi_mode||'none')))return false;
    return String(row.reservation_date||'')>bratislavaClockV95().date;
  }
  function ensureTaxiEditV201(){
    if($('bookingTaxiEditV201'))return;
    ensureTaxiStyleV201();
    document.body.insertAdjacentHTML('beforeend',
      '<div id="bookingTaxiEditV201" class="booking-picker-v37 hidden" role="dialog" aria-modal="true" aria-labelledby="taxiEditTitleV201">'
      +'<div class="booking-picker-card-v37 booking-taxi-edit-card-v201">'
      +'<div class="booking-picker-head-v37 booking-taxi-edit-heading-v209"><div class="taxi-title-line-v209"><h2 id="taxiEditTitleV201">Pridať taxi</h2><span id="taxiEditDateV201" aria-label="Dátum rezervácie"></span></div><button id="taxiEditCloseV201" class="booking-picker-close-v37" type="button" aria-label="Zavrieť">×</button></div>'
      +'<div class="booking-taxi-edit-choices-v201">'
      +'<button type="button" data-edit-taxi="pickup"><span>🚕 Vyzdvihnutie</span><b>5 €</b></button>'
      +'<button type="button" data-edit-taxi="pickup_dropoff"><span>🚕 Tam aj späť</span><b>10 €</b></button></div>'
      +'<p class="booking-picker-error-v95 hidden" id="taxiEditErrorV201"></p>'
      +'<div class="booking-taxi-edit-actions-v201"><button type="button" id="taxiEditLaterV201">Zrušiť</button>'
      +'<button type="button" class="taxi-send-v201" id="taxiEditSendV201" disabled>Požiadať o taxi</button></div></div></div>');
    const modal=$('bookingTaxiEditV201');
    const close=()=>{if(taxiEditBusyV201)return;modal.classList.add('hidden');taxiEditRequestV201=0;taxiEditSelectionV201='';document.documentElement.classList.remove('booking-picker-open-v37')};
    $('taxiEditCloseV201').addEventListener('click',close);
    $('taxiEditLaterV201').addEventListener('click',close);
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    modal.querySelectorAll('[data-edit-taxi]').forEach(b=>b.addEventListener('click',()=>{
      taxiEditSelectionV201=b.dataset.editTaxi;
      modal.querySelectorAll('[data-edit-taxi]').forEach(x=>x.classList.toggle('active',x===b));
      $('taxiEditSendV201').disabled=false;
    }));
    $('taxiEditSendV201').addEventListener('click',async()=>{
      if(taxiEditBusyV201||!taxiEditRequestV201||!['pickup','pickup_dropoff'].includes(taxiEditSelectionV201))return;
      const row=(state.data?.requests||[]).find(r=>Number(r.id)===taxiEditRequestV201);
      if(!allowedTaxiEditV201(row)){toast('Taxi sa už pri tejto rezervácii nedá zmeniť.');close();return}
      taxiEditBusyV201=true;$('taxiEditSendV201').disabled=true;
      try{
        const answer=await api({action:'request_taxi_change',request_id:taxiEditRequestV201,taxi_mode:taxiEditSelectionV201});
        const updated=answer?.data||answer?.request;
        if(updated&&row)Object.assign(row,updated);
        taxiEditBusyV201=false;close();renderDays();renderUpcoming();
        toast('Žiadosť o taxi sme odoslali. Po schválení vás upozorníme.');
        queueCustomerSync('bookings',80);
      }catch(error){
        const msg=$('taxiEditErrorV201');msg.textContent=error.message||'Taxi sa nepodarilo objednať.';msg.classList.remove('hidden');
        taxiEditBusyV201=false;$('taxiEditSendV201').disabled=false;
      }
    });
  }
  function openTaxiEditV201(requestId,reservationId){
    const row=Number(reservationId)>0
      ? futureItems().find(r=>r._legacy&&Number(r.reservation_id)===Number(reservationId))
      : (state.data?.requests||[]).find(r=>Number(r.id)===Number(requestId));
    if(!allowedTaxiEditV201(row)){toast('Taxi sa pri tejto rezervácii nedá doplniť.');return}
    const dog=(state.data?.dogs||[]).find(d=>Number(d.id)===Number(row.dog_id))||selectedDog();
    const clock=bratislavaClockV95(),dayBefore=smartShiftV199(row.reservation_date,-1);
    const taxiTimeExpired=clock.date>dayBefore||(clock.date===dayBefore&&clock.minutes>=21*60);
    if(row._legacy||taxiTimeExpired){
      const text='Dobrý deň, mám záujem o doplnenie taxi pre '+(dog?.name||'psíka')+' na '+skDay(row.reservation_date)+' '+skDate(row.reservation_date)+'. Prosím, dajte mi vedieť, či je to ešte možné.';
      if(typeof window.openCustomerLateBookingMessage==='function')window.openCustomerLateBookingMessage(Number(row.dog_id),row.reservation_date,text,true);
      else {openCustomerChat();toast('Požiadajte nás o doplnenie taxi v správe.');}
      return;
    }
    ensureTaxiEditV201();
    taxiEditRequestV201=Number(row.id);taxiEditSelectionV201='';
    $('taxiEditDateV201').textContent=skDay(row.reservation_date)+' '+skDate(row.reservation_date);
    $('taxiEditErrorV201').textContent='';$('taxiEditErrorV201').classList.add('hidden');
    $('taxiEditSendV201').disabled=true;
    $('bookingTaxiEditV201').querySelectorAll('[data-edit-taxi]').forEach(x=>{
      x.classList.remove('active');
      x.disabled=row.taxi_mode==='pickup'&&x.dataset.editTaxi==='pickup';
    });
    $('bookingTaxiEditV201').classList.remove('hidden');
    document.documentElement.classList.add('booking-picker-open-v37');
  }

  function ensurePickerV37(){
    if($('bookingPickerV37'))return;
    ensureSmartStyleV199();
    ensureTaxiStyleV201();
    document.body.insertAdjacentHTML('beforeend',`<div id="bookingPickerV37" class="booking-picker-v37 hidden" role="dialog" aria-modal="true" aria-labelledby="bookingPickerTitleV37"><div class="booking-picker-card-v37"><div class="booking-picker-head-v37"><div><small>Rezervácia škôlky</small><h2 id="bookingPickerTitleV37">Vyberte deň alebo dni</h2><p id="bookingPickerRangeV37"></p></div><button id="bookingPickerCloseV37" class="booking-picker-close-v37" type="button" aria-label="Zavrieť">×</button></div><div id="bookingPickerDogWrapV37" class="booking-picker-dog-v37 hidden"><label for="bookingPickerDogV37">Psík</label><select id="bookingPickerDogV37" class="input"></select></div><div id="bookingPickerSmartDaysV199" class="booking-smart-v199 hidden" role="group" aria-label="Opakované dni rezervácie"></div><div id="bookingPickerDaysV37" class="booking-picker-days-v37"></div><div id="bookingPickerTaxiSectionV91" class="booking-picker-taxi-section-v91 hidden"><div class="booking-picker-taxi-title-v37">Taxi podľa vybraného dňa</div><div id="bookingPickerTaxiByDayV91" class="booking-picker-taxi-by-day-v91"></div></div><div id="bookingPickerErrorV95" class="booking-picker-error-v95 hidden"></div><button id="bookingPickerSubmitV37" class="btn full booking-picker-submit-v37" type="button" disabled>Vyberte deň</button></div></div>`);
    $('bookingPickerCloseV37').addEventListener('click',closePickerV37);
    $('bookingPickerV37').addEventListener('click',e=>{if(e.target===$('bookingPickerV37'))closePickerV37()});
    $('bookingPickerDogV37').addEventListener('change',e=>{
      if(submittingV37)return;pairBookingV254=e.target.value==='both';e.target.blur();pairTaxiV254.clear();
      if(!pairBookingV254)state.selectedDogId=Number(e.target.value);
      selectedDatesV37.clear();
      selectedTaxiByDateV91.clear();
      expandedTaxiDateV201=null;
      smartDaysDismissedV199=false;
      renderDogSelector();
      renderPassSummary();
      renderDog();
      renderUpcoming();
      renderDays();
      renderPickerV37();
    });
    $('bookingPickerSmartDaysV199').addEventListener('click',e=>{const button=e.target.closest('[data-smart-action]');if(!button)return;if(button.dataset.smartAction==='manual'){smartDaysDismissedV199=true;renderPickerV37()}else if(button.dataset.smartAction==='apply')void applySmartDaysV199()});
    $('bookingPickerSubmitV37').addEventListener('click',submitPickerV37);
  }

  let futureWeekExpandedV235=false;
  function renderPickerV37(){
    ensurePickerV37();
    const dog=selectedDog(),dogs=state.data?.dogs||[],days=state.data?.availability?.days||[];
    if(!dog)return;
    const dogWrap=$('bookingPickerDogWrapV37'),dogSelect=$('bookingPickerDogV37');
    dogWrap.classList.toggle('hidden',dogs.length<=1);
    dogSelect.disabled=submittingV37;dogSelect.innerHTML=(dogs.length===2?'<option value="both" '+(pairBookingV254?'selected':'')+'>Obaja psíkovia</option>':'')+dogs.map(d=>`<option value="${d.id}" ${!pairBookingV254&&Number(d.id)===Number(dog.id)?'selected':''}>${esc(d.name)}</option>`).join('');
    $('bookingPickerRangeV37').textContent=$('weekTitle')?.textContent||'Najbližšie dva týždne';
    /* v281: renewal interest is offered only after a successful booking. */
    $('sharedPassChoiceV260')?.remove();

    updateBookingDeadlineNoticeV127();
    if(pairBookingV254)$('bookingPickerSmartDaysV199').classList.add('hidden');else renderSmartDaysV199(dog,days);
    const groups=[];
    for(let start=0;start<days.length;start+=5){
      const week=days.slice(start,start+5);
      // v232: show the week-specific status ABOVE its days, not beneath them.
      const weekNoticeClosed=week.some(d=>bookingDeadlineClosedV95(d.date,dog));
      const weekNoticeFull=!weekNoticeClosed&&week.some(d=>Number(d.available)<=0);
      const weekNotice=weekNoticeClosed
        ? '<div class="booking-week-closed-note-v127"><strong>Prihlasovanie sa uzavrelo v nedeľu o 20:00.</strong><span>Stále nám však môžete napísať kliknutím na požadovaný deň.</span></div>'
        : weekNoticeFull
        ? '<div class="booking-week-closed-note-v127"><strong>Niektoré dni sú plné.</strong><span>Kliknite na deň a napíšte nám záujem o miesto.</span></div>'
        : '';
      const futureWeek=start>=10;
      const futureOpen=!futureWeek||futureWeekExpandedV235||week.some(d=>selectedDatesV37.has(d.date));
      groups.push(`<div class="booking-picker-week-v127 ${futureWeek?'booking-picker-future-v235':''}"><div class="booking-picker-week-label-v127">${futureWeek?`<button type="button" class="booking-picker-future-toggle-v235" data-future-toggle="true" aria-expanded="${futureOpen?'true':'false'}">O dva týždne <span aria-hidden="true">${futureOpen?'⌃':'⌄'}</span></button>`:(['Tento týždeň','Budúci týždeň'][start/5]||'Ďalší týždeň')}</div><div class="booking-picker-future-body-v235 ${futureOpen?'':'hidden'}">${weekNotice}<div class="booking-picker-week-days-v127">${week.map(d=>{
        const existing=pickerDogsV254().some(x=>bookingFor(x.id,d.date)),deadlineClosed=pickerDogsV254().some(x=>bookingDeadlineClosedV95(d.date,x)),closed=d.bookings_open===false,full=Number(d.available)<pickerDogsV254().length;
        const past=d.date<=bratislavaClockV95().date;
        const lateContact=(deadlineClosed||full)&&!existing&&!past&&!closed;
        const disabled=!!existing||closed||past;
        const selected=selectedDatesV37.has(d.date);
        const stateText=existing?'Rezervované':past?'Uplynulo':closed?'Zatvorené':full?'Plno':deadlineClosed?'Uzavreté':`${Math.max(0,Number(d.available)||0)} voľné`;
        const taxiToggle=selected?`<button type="button" class="booking-day-taxi-toggle-v201" data-taxi-toggle="${d.date}" aria-expanded="${expandedTaxiDateV201===d.date?'true':'false'}" data-taxi-selected="${(selectedTaxiByDateV91.get(d.date)||'none')!=='none'?'true':'false'}" aria-pressed="${(selectedTaxiByDateV91.get(d.date)||'none')!=='none'?'true':'false'}" aria-label="Taxi na ${esc(skDay(d.date))} ${esc(skDate(d.date))}">🚕${(selectedTaxiByDateV91.get(d.date)||'none')!=='none'?'<span class="taxi-indicator-v201"></span>':''}</button>`:'';
        return `<div class="booking-day-wrap-v201"><button type="button" class="booking-day-v37 ${selected?'selected':''} ${existing?'booked':''} ${lateContact?'week-closed-v127':''} ${disabled?'disabled':''}" data-date="${d.date}" data-contact="${lateContact?'true':'false'}" data-full="${full?'true':'false'}" ${disabled?'disabled':''}><small>${closed?'❌':esc(shortDayV37(d.date))}</small><strong>${esc(compactDateV37(d.date))}</strong><span>${closed?'Zatvorené':esc(stateText)}</span></button>${taxiToggle}</div>`;
      }).join('')}</div>${expandedTaxiDateV201&&week.some(d=>d.date===expandedTaxiDateV201)&&selectedDatesV37.has(expandedTaxiDateV201)?`<div class="booking-taxi-inline-v201" data-taxi-date="${expandedTaxiDateV201}"><p class="booking-taxi-inline-title-v201">🚕 Taxi · ${esc(skDay(expandedTaxiDateV201))} ${esc(skDate(expandedTaxiDateV201))}</p>${taxiChoicesV254(expandedTaxiDateV201)}</div>`:' '}</div></div>`);
    }
    $('bookingPickerDaysV37').innerHTML=groups.join('');
    $('bookingPickerDaysV37').querySelectorAll('[data-future-toggle]').forEach(b=>b.addEventListener('click',()=>{futureWeekExpandedV235=b.getAttribute('aria-expanded')!=='true';renderPickerV37()}));
    $('bookingPickerDaysV37').querySelectorAll('.booking-day-v37:not(:disabled)').forEach(btn=>btn.addEventListener('click',async()=>{
      if(checkingRenewalV157||submittingV37)return;
      const date=btn.dataset.date;
      /* v281: selecting a date never opens a permanentka modal or makes an extra RPC. */
      if(btn.dataset.contact==='true'&&pairBookingV254){pickerErrorV95('Pre oboch psíkov nie sú dostupné dve miesta alebo sa prihlasovanie uzavrelo. Vyberte iný deň alebo nám napíšte.');return}
      if(btn.dataset.contact==='true'){
        closePickerV37();
        const message=`Dobrý deň, prosím o dodatočnú rezerváciu pre ${dog.name} na ${skDay(date)} ${skDate(date)}.`;
        window.openCustomerLateBookingMessage?.(Number(dog.id),date,message,btn.dataset.full==='true');
        return;
      }
      if(selectedDatesV37.has(date)){
        selectedDatesV37.delete(date);
        selectedTaxiByDateV91.delete(date);
        if(expandedTaxiDateV201===date)expandedTaxiDateV201=null;
      }else{
        selectedDatesV37.add(date);
        if(!selectedTaxiByDateV91.has(date))selectedTaxiByDateV91.set(date,'none');
      }
      renderPickerV37();
    }));

    // The prior always-visible taxi summary is retired; choices open only via the emoji for a selected day.
    $('bookingPickerTaxiSectionV91')?.classList.add('hidden');
    if($('bookingPickerTaxiByDayV91'))$('bookingPickerTaxiByDayV91').innerHTML='';
    $('bookingPickerDaysV37').querySelectorAll('[data-taxi-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const date=button.dataset.taxiToggle;
      expandedTaxiDateV201=expandedTaxiDateV201===date?null:date;
      renderPickerV37();
    }));
    $('bookingPickerDaysV37').querySelectorAll('[data-taxi-mode]').forEach(button=>button.addEventListener('click',()=>{
      const date=button.dataset.taxiDate;
      if(!selectedDatesV37.has(date))return;
      const dogId=Number(button.dataset.taxiDog||dog.id),previously=pickerTaxiV254(date,dogId);
      if(pairBookingV254)pairTaxiV254.set(date+'|'+dogId,previously===button.dataset.taxiMode?'none':button.dataset.taxiMode);
      else selectedTaxiByDateV91.set(date,previously===button.dataset.taxiMode?'none':button.dataset.taxiMode);
      expandedTaxiDateV201=null;
      renderPickerV37();
    }));
    const submit=$('bookingPickerSubmitV37'),count=selectedDatesV37.size;
    submit.disabled=!count||submittingV37;
    submit.textContent=count?`Rezervovať ${count===1?'1 deň':count<5?count+' dni':count+' dní'}`:'Vyberte deň';
    $('sharedBookingReviewV257')?.remove();
  }

  function openPickerV37(){
    $('sharedBookingReviewV257')?.remove();pairBookingV254=(state.data?.dogs||[]).length===2;pairTaxiV254.clear();pickerEpochV157++;
    const dog=selectedDog();if(dog&&window.customerVaccinationsCompleteV96&&!window.customerVaccinationsCompleteV96(dog)){switchTab('dog');setTimeout(()=>openDogDetails('vaccinations',false),40);toast('Pred rezerváciou doplňte povinné očkovania.');return}
    selectedDatesV37.clear();selectedTaxiByDateV91.clear();expandedTaxiDateV201=null;renewalCheckedDogV157=null;smartDaysDismissedV199=false;futureWeekExpandedV235=false;pickerErrorV95('');
    renderPickerV37();
    $('bookingPickerV37').classList.remove('hidden');
    document.documentElement.classList.add('booking-picker-open-v37');
    $('bookingPickerV37').scrollTop=0;
  }
  window.openBookingPickerV37=openPickerV37;
  function closePickerV37(){if(submittingV37)return;pickerEpochV157++;$('bookingPickerV37')?.classList.add('hidden');document.documentElement.classList.remove('booking-picker-open-v37');pickerErrorV95('');if(pendingPassRenewalV95){const renewal=pendingPassRenewalV95;pendingPassRenewalV95=null;setTimeout(()=>window.showPassRenewalAfterBookingV94?.(renewal.dogId,renewal.date),100)}}

  async function submitPickerV37(){
    const dog=selectedDog(),dates=[...selectedDatesV37].sort();
    if(!dog||!dates.length||submittingV37||checkingRenewalV157)return;
    if(state.data?.shared_passes_enabled&&pickerDogsV254().some(d=>sharedDogBillingV260(d.id)))return submitSharedV260(dates);
    if(pairBookingV254)return submitPairV254(dates);
    if(window.customerVaccinationsCompleteV96&&!window.customerVaccinationsCompleteV96(dog)){pickerErrorV95('Pred rezerváciou doplňte povinné očkovania.');return}
    const deadlineDates=dates.filter(date=>bookingDeadlineClosedV95(date,dog));
    if(deadlineDates.length){
      deadlineDates.forEach(date=>{selectedDatesV37.delete(date);selectedTaxiByDateV91.delete(date)});
      renderPickerV37();pickerErrorV95('Rezervácie na '+deadlineDates.map(skDate).join(', ')+' sa uzavreli v nedeľu o 20:00.',true);queueCustomerSync('bookings',0);return;
    }
    submittingV37=true;pickerErrorV95('');renderPickerV37();
    let ok=0,renewalDate=null;const failed=[],successDates=[];
    const acceptedBooking=(row,date)=>{
      const taxiMode=selectedTaxiByDateV91.get(date)||'none';
      if(row&&!row.planned_pass_request_id&&Number(row.projected_pass_total)>0&&Number(row.projected_entry_number)===Number(row.projected_pass_total))renewalDate=date;
      applyLocalBooking({data:row},{id:-(Date.now()+ok),dog_id:Number(dog.id),reservation_date:date,taxi_mode:taxiMode,status:'pending',can_manage:true});
      ok++;successDates.push(date);
    };
    if(dates.length>1){
      // One request; each day keeps the existing server validations and pass accounting.
      try{
        const response=await api({action:'request_bookings',dog_id:Number(dog.id),bookings:dates.map(date=>({date,taxi_mode:selectedTaxiByDateV91.get(date)||'none'}))});
        const data=response?.data||{},accepted=Array.isArray(data.bookings)?data.bookings:[],rejections=Array.isArray(data.failed)?data.failed:[];
        const acceptedByDate=new Map(accepted.filter(row=>row?.reservation_date).map(row=>[row.reservation_date,row]));
        const failedByDate=new Map(rejections.map(row=>[row?.date,String(row?.error||'Nepodarilo sa rezervovať.')]));
        for(const date of dates){
          if(acceptedByDate.has(date))acceptedBooking(acceptedByDate.get(date),date);
          else failed.push({date,error:failedByDate.get(date)||'Nepodarilo sa rezervovať.'});
        }
      }catch(e){for(const date of dates)failed.push({date,error:e.message||'Nepodarilo sa rezervovať.'})}
    }else{
      const date=dates[0];
      try{
        const response=await api({action:'request_booking',dog_id:Number(dog.id),reservation_date:date,taxi_mode:selectedTaxiByDateV91.get(date)||'none'});
        acceptedBooking(response?.data||response?.booking||response?.request||null,date);
      }catch(e){failed.push({date,error:e.message||'Nepodarilo sa rezervovať.'})}
    }
    try{if(ok)queueCustomerSync('bookings',80)}finally{submittingV37=false}
    if(failed.length){
      successDates.forEach(date=>{selectedDatesV37.delete(date);selectedTaxiByDateV91.delete(date)});
      if(renewalDate)pendingPassRenewalV95={dogId:Number(dog.id),date:renewalDate};
      renderPickerV37();
      const deadlineFailure=failed.some(x=>/20:00|uzavreli v nedeľu|zatvorené/i.test(x.error));
      const details=failed.map(x=>skDate(x.date)+' – '+x.error).join(' | ');
      pickerErrorV95((ok?`Odoslané ${ok} z ${dates.length}. `:'')+'Nepodarilo sa: '+details,deadlineFailure);
      queueCustomerSync('bookings',0);
      return;
    }
    closePickerV37();
    toast(ok===1?'Rezervácia bola odoslaná na schválenie.':`${ok} rezervácie boli odoslané na schválenie.`);
    if(renewalDate)setTimeout(()=>window.showPassRenewalAfterBookingV94?.(Number(dog.id),renewalDate),140);
  }

  function bookingRosterV37(day,ownDog,passState){
    const ownName=String(ownDog?.customer_name||ownDog?.name||'').trim();
    const ownPhoto=String(ownDog?.photo_url||'');
    const visible=day?.dogs||[];
    const ownIndex=visible.findIndex(x=>x.dog_id!=null?Number(x.dog_id)===Number(ownDog?.id):String(x.name||'').trim()===ownName);
    const own={name:ownName||'Váš psík',sex:ownDog?.sex,photo_url:ownPhoto};
    const otherVisible=visible.filter((_,index)=>index!==ownIndex);
    const anonymous=Math.max(0,Number(day?.anonymous_dogs||0)-(ownIndex<0?1:0));
    const row=(x,badge='')=>{const sex=x.sex==='male'?' dog-male-v100':x.sex==='female'?' dog-female-v100':' dog-neutral-v100';return `<span class="reserved-roster-row-v37">${x.photo_url?`<i class="reserved-roster-avatar-v37${sex}"><img src="${esc(x.photo_url)}" alt=""></i>`:`<i class="reserved-roster-avatar-v37${sex}">🐾</i>`}<b>${esc(x.name)}</b>${badge}</span>`};
    return `<details class="reserved-roster-v37"><summary>🐶 Pozrite si, s kým bude váš psík v škôlke...</summary><div>${row(own,passState)}${otherVisible.map(x=>row(x)).join('')}${Array.from({length:anonymous},()=>'<span class="reserved-roster-row-v37"><i class="reserved-roster-avatar-v37 dog-neutral-v100">🐾</i><b>Prihlásený škôlkar</b></span>').join('')}</div></details>`;
  }

  customerRenderers.upcoming=()=>{
    const root=$('upcomingBookings'),dog=selectedDog();if(!root)return;
    updateBookingDeadlineNoticeV127();
    if(!dog){root.innerHTML='';return}
    const ready=window.customerVaccinationsCompleteV96?window.customerVaccinationsCompleteV96(dog):true;
    if(!ready){
      root.innerHTML=`<div class="booking-gate-v96"><div class="booking-launch-v37 booking-launch-disabled-v96" aria-disabled="true"><span class="booking-launch-icon-v37"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M7 3v4M17 3v4M3 10h18M12 13v5M9.5 15.5h5"></path></svg></span><span><strong>Chcem prihlásiť psíka</strong><small>Rezervácie sa sprístupnia po doplnení očkovaní.</small></span><b>›</b></div><button id="bookingVaccinationsV96" class="btn secondary full booking-vaccinations-v96" type="button">Doplniť očkovania</button></div>`;
      $('bookingVaccinationsV96')?.addEventListener('click',()=>openDogDetails('vaccinations',false));
    }else{
      // v220: Booking action is now the thumb-reachable center + in the bottom navigation.
      root.innerHTML='';
    }
    const h=document.querySelector('#bookingTab .booking-section-head h2');if(h)h.textContent='Moje rezervácie';
  };

  customerRenderers.days=()=>{
    const root=$('weekDays'),dog=selectedDog();if(!root)return;
    const days=state.data?.availability?.days||[],byDate=new Map(days.map(d=>[d.date,d]));
    const clock=overviewClock(),multi=(state.data?.dogs||[]).length===2,items=futureItems().filter(r=>dog&&(multi||Number(r.dog_id)===Number(dog.id))&&overviewDayVisible(r.reservation_date,clock));
    if(!items.length){root.innerHTML='<div class="card reserved-empty-v37"><svg class="reserved-empty-icon" aria-hidden="true"><use href="#ci-calendar"/></svg><span>Zatiaľ nemáte rezervovaný žiadny deň.</span><small>Kliknite na tlačidlo vyššie a vyberte si termín<br>pre vášho psíka.</small></div>';return}
    // Maintain the open roster while realtime updates replace the day cards.
    const openRosterDatesV209=new Set([...root.querySelectorAll('.reserved-day-card-v37[data-date]')].filter(card=>card.querySelector('.reserved-roster-v37[open]')).map(card=>card.dataset.date));
    root.innerHTML=items.map(r=>{
      const dog=(state.data?.dogs||[]).find(d=>Number(d.id)===Number(r.dog_id))||selectedDog();
      const day=byDate.get(r.reservation_date)||{},taxi=taxiLabel(r.taxi_mode),pending=r.status==='pending';
      const reservation=(state.data?.reservations||[]).find(x=>Number(x.id)===Number(r.reservation_id));
      const planned=Number(reservation?.planned_entry_number||r.projected_entry_number||r.planned_entry_number)||0,plannedTotal=Number(reservation?.planned_pass_total||r.projected_pass_total||r.planned_pass_total)||0;
      const passId=Number(r.pass_id||reservation?.pass_id)||0;
      const upcomingPass=passId&&(state.data?.passes||[]).some(p=>Number(p.id)===passId&&p.status==='queued');
      const entryType=reservation?.entry_type||r.entry_type||dog?.default_entry_type;
      const pendingSingle=pending&&!planned&&!plannedTotal&&!reservation&&r.billing_choice==='auto'&&!r.projected_pass_id&&!r.planned_pass_request_id&&entryType!=='free';
      const passState=planned&&plannedTotal?`<span class="reserved-pass-v37${r.planned_pass_request_id||upcomingPass?' reserved-pass-new-v134':''}">${r.planned_pass_request_id||upcomingPass?`Plánovaný vstup ${planned} z ${plannedTotal}`:`Vstup z permanentky ${planned} z ${plannedTotal}`}</span>`:pendingSingle||entryType==='single'||entryType==='free'?`<span class="reserved-pass-v37">${entryType==='free'?'Bezplatný vstup':'Jednorazový vstup'}</span>`:'';
      const note=day.note&&!(day.bookings_open===false&&/^zatvorené$/i.test(String(day.note).trim()))?`<div class="reserved-note-v37">${esc(day.note)}</div>`:'';
      const sharedNote='';
      const linkedReservation=r.can_manage===false&&r.status==='approved'&&Number(r.reservation_id)>0;
      const cancel=(r.can_manage!==false||linkedReservation)?`<button class="cancel-booking-v37" type="button" aria-label="Zrušiť rezerváciu na ${esc(skDay(r.reservation_date))} ${esc(skDate(r.reservation_date))}" title="Zrušiť rezerváciu" data-request="${r._legacy||linkedReservation?'':r.id||''}" data-reservation="${r._legacy||linkedReservation?r.reservation_id||r.id:''}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M9 13l6 4M15 13l-6 4"/></svg></button>`:'';
      const taxiEdit=allowedTaxiEditV201(r)?`<button type="button" class="booking-taxi-pencil-v201" data-taxi-request="${r._legacy?'':Number(r.id)}" data-taxi-reservation="${r._legacy?Number(r.reservation_id):''}" title="Pridať taxi" aria-label="Pridať taxi na ${esc(skDay(r.reservation_date))} ${esc(skDate(r.reservation_date))}">🚕<span class="booking-taxi-plus-v209" aria-hidden="true">+</span></button>`:'';
      const taxiPending=r.taxi_change_status==='pending'?'<span class="reserved-taxi-v37">🚕 Taxi čaká na schválenie</span>':'';
      const detail=(pending&&passState)||taxi||taxiPending?`<div class="reserved-day-detail-v37${pending?' reserved-day-detail-pending-v37':''}">${pending?passState:''}${taxi?`<span class="reserved-taxi-v37">${esc(taxi)}</span>`:''}${taxiPending}</div>`:'';
      const approvedRoster=pending?'':`<div class="reserved-day-meta-v37">${bookingRosterV37(day,dog,passState)}</div>`;
      return `<div class="card reserved-day-card-v37" data-date="${esc(r.reservation_date)}"><div class="reserved-day-top-v37"><div class="reserved-day-date-v37"><strong>${multi?esc(dog.name)+' · ':''}${esc(skDay(r.reservation_date))}</strong><span>${esc(skDate(r.reservation_date))}</span></div><div class="reserved-day-controls-v37"><span class="pill ${pending?'pending':'approved'}">${pending?'Čaká na schválenie':'Schválená'}</span>${taxiEdit}${cancel}</div></div>${approvedRoster}${detail}${sharedNote}${note}</div>`;
    }).join('');
    root.querySelectorAll('.reserved-day-card-v37[data-date]').forEach(card=>{
      if(openRosterDatesV209.has(card.dataset.date))card.querySelector('.reserved-roster-v37')?.setAttribute('open','');
    });
    root.querySelectorAll('.cancel-booking-v37').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();cancelBooking(btn)}));
    root.querySelectorAll('[data-taxi-request]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();openTaxiEditV201(btn.dataset.taxiRequest,btn.dataset.taxiReservation)}));
  };

  function startV37(){
    ensurePickerV37();prepareSettingsV37();
    document.addEventListener('click',e=>{if(e.target?.closest('#dogSettingsBtnV36')){setTimeout(prepareSettingsV37,30);setTimeout(prepareSettingsV37,500)}});
    const settings=$('dogSettingsModalV36');if(settings)new MutationObserver(()=>{if(!settings.classList.contains('hidden'))setTimeout(prepareSettingsV37,20)}).observe(settings,{attributes:true,attributeFilter:['class']});
    renderUpcoming();renderDays();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(startV37,180));else setTimeout(startV37,180);
})();

/* preview consolidated: pass renewal + push lifecycle */
(function customerLifecyclePreview(){
  if(window.__chvostikovoCustomerLifecyclePreview)return;
  window.__chvostikovoCustomerLifecyclePreview=true;

  let bookingDogV38=0;

  function currentActivePassV38(dogId){
    const today=new Date().toISOString().slice(0,10);
    return (state.data?.passes||[]).find(p=>passAllowsDogV244(p,dogId)&&p.status==='active'&&Number(p.used_entries)<Number(p.total_entries)&&(!p.valid_until||p.valid_until>=today))||null;
  }
  function pendingPassV38(dogId){
    return (state.data?.pass_requests||[]).find(r=>passAllowsDogV244(r,dogId)&&r.status==='pending')||null;
  }
  function lastEntryReservedV38(dogId){
    const pass=currentActivePassV38(dogId);if(!pass)return false;
    const total=Number(pass.total_entries)||0;
    if(!total)return false;
    return futureItems().some(r=>{
      if(!passAllowsDogV244(pass,Number(r.dog_id)))return false;
      const projectedTotal=Number(r.projected_pass_total)||0,projectedEntry=Number(r.projected_entry_number)||0;
      const plannedTotal=Number(r.planned_pass_total)||0,plannedEntry=Number(r.planned_entry_number)||0;
      return (projectedTotal===total&&projectedEntry>=total)||(plannedTotal===total&&plannedEntry>=total);
    });
  }
  function ensureModalV38(){
    if(document.getElementById('passRenewalModalV38'))return;
    document.body.insertAdjacentHTML('beforeend','<div id="passRenewalModalV38" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="passRenewalTitleV38"><div class="legal-card"><button id="passRenewalCloseV38" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="passRenewalTitleV38">Posledný vstup z permanentky</h2><div class="legal-body"><p id="passRenewalDayV38"></p><p>Dajte nám vedieť tlačidlom nižšie.</p><p class="hint pass-renewal-validity-v38">Platnosť novej permanentky začne až jej prvým použitím.</p><p class="hint pass-interest-disclaimer-v44">Odoslaním záujmu nevzniká povinnosť platby ani automatický nákup permanentky. Ide iba o informáciu pre Chvostíkovo, že máte o novú permanentku záujem.</p></div><button id="passRenewalRequestV38" class="btn full" type="button">Mám záujem o novú permanentku</button><button id="passRenewalLaterV38" class="btn secondary full" type="button">Neskôr</button></div></div>');
    const close=()=>document.getElementById('passRenewalModalV38')?.classList.add('hidden');
    document.getElementById('passRenewalCloseV38').addEventListener('click',close);
    document.getElementById('passRenewalLaterV38').addEventListener('click',close);
    document.getElementById('passRenewalModalV38').addEventListener('click',e=>{if(e.target===document.getElementById('passRenewalModalV38'))close()});
  }
  function showPromptV38(dogId,reservationDate){
    if(!dogId||!lastEntryReservedV38(dogId)||renewalAlreadyPreparedV299(dogId,Number(currentActivePassV38(dogId)?.id)||0))return;
    const pass=currentActivePassV38(dogId),account=state.session?.user?.id;
    const lastDay=futureItems().find(r=>passAllowsDogV244(pass,Number(r.dog_id))&&r.reservation_date===reservationDate&&!r.planned_pass_request_id&&Number(r.projected_entry_number||r.planned_entry_number)===Number(r.projected_pass_total||r.planned_pass_total)&&Number(r.projected_pass_total||r.planned_pass_total)>0);
    if(!lastDay)return;
    state.selectedDogId=Number(dogId);ensureModalV38();
    const modal=document.getElementById('passRenewalModalV38'),button=document.getElementById('passRenewalRequestV38');
    $('passRenewalDayV38').textContent=`Rezervácia na ${skDay(reservationDate)} ${skDate(reservationDate)} využije posledný voľný vstup z aktuálnej permanentky. Máte záujem o novú?`;
    button.onclick=async()=>{if(button.disabled)return;if(state.session?.user?.id!==account){modal.classList.add('hidden');return}button.disabled=true;try{const row=await requestPass(legacyPassRenewalTotalV299(dogId),{dogId,renewal:true});if(row)modal.classList.add('hidden')}finally{button.disabled=false}};
    modal.classList.remove('hidden');
  }
  window.showPassRenewalAfterBookingV94=(dogId,date)=>{bookingDogV38=0;showPromptV38(Number(dogId)||0,date)};

  /* v281: reuse the existing one-dog renewal modal after confirmed booking. */
  async function requestPostBookingPassV293(dogIds,operationId,totalEntries=10){
    const account=state.session?.user?.id;
    if(!account)return null;
    if(totalEntries===20&&!dogIds.every(id=>legacyPassRenewalTotalV299(id)===20))throw new Error('20-vstupová permanentka nie je pre týchto psíkov dostupná.');
    const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_request_pass_v244',{
      method:'POST',
      headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({p_dog_ids:dogIds,p_total_entries:totalEntries,p_operation_id:operationId})
    });
    const txt=await response.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}
    if(!response.ok)throw new Error(data?.message||data?.error||'Záujem o permanentku sa nepodarilo odoslať.');
    if(state.session?.user?.id!==account)return null;
    const row=Array.isArray(data)?data[0]:data;
    if(!row||!Number(row.id))throw new Error('Záujem sa nepodarilo potvrdiť. Skúste znova.');
    state.data.pass_requests=state.data.pass_requests||[];
    if(!state.data.pass_requests.some(p=>Number(p.id)===Number(row.id)))state.data.pass_requests.unshift(row);
    renderPassSummary();renderDog();queueCustomerSync('bookings',0);
    return row;
  }
  window.showPostBookingPassChoicesV281=async function(choices){
    const account=state.session?.user?.id;
    if(!account||!Array.isArray(choices))return;
    for(const item of choices){
      if(state.session?.user?.id!==account)break;
      const dogId=Number(item.dogId);
      const dog=(state.data?.dogs||[]).find(d=>Number(d.id)===dogId);
      const wantsShared=Array.isArray(item.sharedDogIds)&&item.sharedDogIds.length===2&&item.reason==='single';
      const sharedDogs=wantsShared?item.sharedDogIds.map(id=>(state.data?.dogs||[]).find(d=>Number(d.id)===Number(id))).filter(Boolean):[];
      if(!dog||!['last','single'].includes(item.reason)||wantsShared&&sharedDogs.length!==2||
         (renewalAlreadyPreparedV299(dogId,Number(item.passId)||0)||wantsShared&&sharedDogs.some(d=>renewalAlreadyPreparedV299(d.id,Number(item.passId)||0))))continue;
      const isShared=wantsShared&&sharedDogs.length===2;
      const renewalTotal=Number(item.total)===20?20:10;
      const lastDog=isShared?sharedDogs.find(d=>Number(d.id)===Number(item.lastDogId)):null;
      if(isShared&&!lastDog)continue;
      const sharedNames=sharedDogs.map(d=>d.name).join(' a ');
      await new Promise(resolve=>{
        ensureModalV38();
        const modal=$('passRenewalModalV38'),yes=$('passRenewalRequestV38'),
          later=$('passRenewalLaterV38'),close=$('passRenewalCloseV38');
        const title=$('passRenewalTitleV38'),day=$('passRenewalDayV38');
        const description=modal.querySelector('.legal-body>p:nth-child(2)');
        const hint=modal.querySelector('.pass-renewal-validity-v38');
        const original={title:title.textContent,day:day.textContent,
          description:description?.textContent,hint:hint?.textContent,yes:yes.textContent};
        const isLast=item.reason==='last';
        title.textContent=isShared?'Nová spoločná permanentka: '+sharedNames+'?':isLast?'Posledný vstup z permanentky':'Nová permanentka pre '+dog.name+'?';
        day.textContent=isShared
          ?'Posledný vstup zo spoločnej permanentky na '+skDay(item.date)+' '+skDate(item.date)+' využije '+lastDog.name+'. '+dog.name+' má zatiaľ na tento deň jednorazový vstup.'
          :isLast?'Rezervácia pre '+dog.name+' na '+skDay(item.date)+' '+skDate(item.date)+' využije posledný voľný vstup z aktuálnej permanentky. Máte záujem o novú?'
          :dog.name+' má na '+skDay(item.date)+' '+skDate(item.date)+' odoslanú jednorazovú rezerváciu.';
        if(description)description.textContent=isShared
          ?'Máte záujem o novú spoločnú '+renewalTotal+'-vstupovú permanentku pre oboch psíkov – '+sharedNames+'?'
          :isLast?(renewalTotal===20?'Máte záujem o novú 20-vstupovú permanentku?':'Dajte nám vedieť tlačidlom nižšie.')
          :'Máte záujem o novú '+renewalTotal+'-vstupovú permanentku pre '+dog.name+'?';
        if(hint)hint.textContent=isShared
          ?'Ak zvolíte Neskôr, '+lastDog.name+' využije posledný vstup z aktuálnej permanentky a '+dog.name+' zostane na jednorazovom vstupe.'
          :isLast?'Ak zvolíte Neskôr, rezervácia zostane na aktuálnej permanentke.':'Ak zvolíte Neskôr, rezervácia pre '+dog.name+' zostane jednorazová.';
        yes.textContent='Mám záujem o permanentku';
        later.textContent='Neskôr';
        let done=false,busy=false;
        const operationId=crypto.randomUUID();
        const onBackdrop=e=>{if(e.target===modal)finish()};
        const finish=()=>{
          if(done||busy)return;
          done=true;modal.classList.add('hidden');
          modal.removeEventListener('click',onBackdrop);
          yes.onclick=later.onclick=close.onclick=null;
          title.textContent=original.title;day.textContent=original.day;
          if(description)description.textContent=original.description||'';
          if(hint)hint.textContent=original.hint||'';
          yes.textContent=original.yes;
          yes.disabled=later.disabled=close.disabled=false;
          resolve();
        };
        later.onclick=close.onclick=finish;
        modal.addEventListener('click',onBackdrop);
        yes.onclick=async()=>{
          if(busy||state.session?.user?.id!==account){finish();return}
          busy=true;yes.disabled=later.disabled=close.disabled=true;
          try{
            const row=isLast
              ?await requestPass(renewalTotal,{dogId,showConfirmation:false,renewal:true})
              :await requestPostBookingPassV293(isShared?sharedDogs.map(d=>Number(d.id)):[dogId],operationId,renewalTotal);
            if(row){busy=false;finish();toast(isShared?'Záujem o novú spoločnú permanentku ('+sharedNames+') sme odoslali škôlke.':'Záujem o permanentku pre '+dog.name+' sme odoslali škôlke.')}
          }catch(e){toast(e.message||'Záujem sa nepodarilo odoslať.')}
          finally{busy=false;yes.disabled=later.disabled=close.disabled=false}
        };
        modal.classList.remove('hidden');
      });
    }
  };


  async function healPushV71(){
    if(document.visibilityState==='hidden'||!state?.session||!('serviceWorker' in navigator)||typeof Notification==='undefined'||Notification.permission!=='granted')return false;
    try{
      const reg=await navigator.serviceWorker.ready;
      let sub=await reg.pushManager.getSubscription();
      const remembered=localStorage.getItem('chvostikovo_push_enabled')==='1';
      if(!sub&&remembered)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID)});
      if(!sub)return false;
      await syncPushSubscriptionV75(sub);
      state.pushChecked=true;state.pushEnabled=true;
      localStorage.setItem('chvostikovo_push_enabled','1');
      applyPushToggle();
      return true;
    }catch(error){
      console.warn('Push subscription recovery failed',error?.message||error);
      return false;
    }
  }

  addCustomerHook('afterApi',(body)=>{
    if(body?.action==='request_booking')bookingDogV38=Number(body.dog_id)||0;
  });
  addCustomerHook('afterBootstrap',()=>{
    const dogId=bookingDogV38;bookingDogV38=0;
    if(dogId)setTimeout(()=>showPromptV38(dogId),120);
    setTimeout(healPushV71,80);
  });

  window.addEventListener('pageshow',()=>setTimeout(healPushV71,250));
  window.addEventListener('focus',()=>setTimeout(healPushV71,350));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(healPushV71,350)});

  const start=()=>{
    setTimeout(healPushV71,900);
    setTimeout(healPushV71,2600);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* v40: Android settings cleanup, reliable push toggle and scroll recovery */
(function customerAndroidSettingsV40(){
  if(window.__chvostikovoCustomerAndroidSettingsV40)return;
  window.__chvostikovoCustomerAndroidSettingsV40=true;
  let pushBusy=false;

  function removeDuplicateNotificationRow(){
    const controls=document.getElementById('customerLegalControlsV23');
    if(!controls)return;
    const rows=[...controls.querySelectorAll(':scope > .v23-consent-row')];
    rows.filter(row=>/upozornenia/i.test(row.textContent||'')).forEach(row=>row.remove());
  }

  function syncPushButtons(on){
    state.pushChecked=true;
    state.pushEnabled=!!on;
    localStorage.setItem('chvostikovo_push_enabled',on?'1':'0');
    for(const id of ['settingsPushToggleV37','pushToggle','pushToggleV23']){
      const b=document.getElementById(id);if(!b)continue;
      b.classList.toggle('active',!!on);
      b.classList.remove('syncing');
      b.setAttribute('aria-checked',on?'true':'false');
    }
  }

  async function actualPushState(){
    if(!('serviceWorker' in navigator)||typeof Notification==='undefined')return false;
    if(Notification.permission!=='granted')return false;
    try{const reg=await navigator.serviceWorker.ready;return !!(await reg.pushManager.getSubscription())}catch(_){return false}
  }

  async function refreshPushState(){
    const on=await actualPushState();syncPushButtons(on);removeDuplicateNotificationRow();return on;
  }

async function togglePushDirect(btn){
  if(pushBusy)return;pushBusy=true;btn.disabled=true;
  try{
    if(!('serviceWorker'in navigator)||typeof Notification==='undefined')throw new Error('Tento telefón nepodporuje upozornenia v aplikácii.');
    const existing=await actualPushState();
    if(existing){
      const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
      if(sub){
        try{await fetch(PUSH_API,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({audience:'customer',action:'unsubscribe',endpoint:sub.endpoint})})}catch(_){}
        await sub.unsubscribe();
      }
      state.pushChecked=true;state.pushEnabled=false;if(state.data)state.data.push_subscription_active=false;
      localStorage.setItem('chvostikovo_push_enabled','0');syncPushButtons(false);toast('Upozornenia sú vypnuté.');return;
    }
    await enablePushForCurrentUserV75();syncPushButtons(true);toast('Upozornenia sú zapnuté.');
  }catch(e){const on=await actualPushState().catch(()=>false);state.pushChecked=true;state.pushEnabled=on;syncPushButtons(on);toast(e.message||'Upozornenia sa nepodarilo zmeniť.')}
  finally{pushBusy=false;btn.disabled=false;removeDuplicateNotificationRow()}
}
  function repairScrollLocks(){
    const settings=document.getElementById('dogSettingsModalV36');
    const picker=document.getElementById('bookingPickerV37');
    if(!settings||settings.classList.contains('hidden'))document.documentElement.classList.remove('settings-open-v36');
    if(!picker||picker.classList.contains('hidden'))document.documentElement.classList.remove('booking-picker-open-v37');
  }

  document.addEventListener('click',e=>{
    const pushBtn=e.target.closest?.('#settingsPushToggleV37');
    if(pushBtn){
      e.preventDefault();e.stopImmediatePropagation();
      togglePushDirect(pushBtn);
      return;
    }
    if(e.target.closest?.('#privacyToggleV23')||e.target.closest?.('#privacyToggle')){
      setTimeout(removeDuplicateNotificationRow,0);setTimeout(removeDuplicateNotificationRow,250);setTimeout(removeDuplicateNotificationRow,900);
    }
    if(e.target.closest?.('#dogSettingsCloseV36')||e.target.closest?.('#bookingPickerCloseV37')||e.target.closest?.('#navBooking')||e.target.closest?.('#navDog')||e.target.closest?.('#navMessages')){
      setTimeout(repairScrollLocks,0);setTimeout(repairScrollLocks,250);
    }
  },true);

  function observeSettings(){
    const content=document.getElementById('dogSettingsContentV36');
    if(!content){setTimeout(observeSettings,120);return}
    new MutationObserver(()=>{removeDuplicateNotificationRow();repairScrollLocks()}).observe(content,{childList:true,subtree:true});
    const modal=document.getElementById('dogSettingsModalV36');
    if(modal)new MutationObserver(()=>{if(!modal.classList.contains('hidden')){removeDuplicateNotificationRow();refreshPushState()}else repairScrollLocks()}).observe(modal,{attributes:true,attributeFilter:['class']});
    removeDuplicateNotificationRow();refreshPushState();repairScrollLocks();
  }

  window.addEventListener('focus',()=>{repairScrollLocks();refreshPushState()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){repairScrollLocks();refreshPushState()}});
  window.addEventListener('pageshow',()=>{repairScrollLocks();setTimeout(refreshPushState,50)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(observeSettings,180));else setTimeout(observeSettings,180);
})();

/* preview consolidated: profile support, hint and school rules */
(function customerProfileExperiencePreview(){
  if(window.__chvostikovoProfileExperiencePreview)return;
  window.__chvostikovoProfileExperiencePreview=true;

  let lateBookingContext=null;
  let supportReadInFlight=false;
  let supportLayout=null,supportSending=false;
  const chatSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7 18-4-7-7-4 18-7Z"/><path d="m10 14 11-11"/></svg>';

  function mount(){
    if(!$('supportChatBtnV52')){
      document.body.insertAdjacentHTML('beforeend',
        '<button id="supportChatBtnV52" class="support-chat-btn-v52 hidden" type="button" aria-label="Napíšte nám správu">'+chatSvg+'<span id="supportChatUnreadV52" class="support-chat-unread-v52 hidden"></span></button>'+
        '<div id="supportChatModalV52" class="legal-modal support-chat-modal-v52 hidden" role="dialog" aria-modal="true" aria-labelledby="supportChatTitleV52">'+
          '<div class="legal-card support-chat-card-v52">'+
            '<button id="supportChatCloseV52" class="legal-close" type="button" aria-label="Zavrieť">×</button>'+
            '<div class="support-chat-head-v180"><span id="supportChatStaffAvatarV180" class="support-chat-staff-avatar-v180" aria-hidden="true">🐾</span><div><h2 id="supportChatTitleV52">Chvostíkovo</h2></div><a id="supportChatCallV182" class="support-chat-call-v182 hidden" href="#" aria-label="Zavolať do Chvostíkova"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.3 3.8 8 3.2c.6-.1 1.1.2 1.4.7l1.2 2.8c.2.5.1 1-.3 1.4L8.8 9.5a15.7 15.7 0 0 0 5.7 5.7l1.4-1.5c.4-.4.9-.5 1.4-.3l2.8 1.2c.5.2.8.8.7 1.4l-.6 2.7c-.1.7-.7 1.2-1.4 1.2C10.7 19.9 4.1 13.3 4.1 5.2c0-.7.5-1.3 1.2-1.4Z"/></svg></a></div>'+
            '<div id="supportMessageThreadV52" class="message-thread support-message-thread-v52"></div>'+
            '<form id="supportMessageFormV52" class="form-stack support-message-form-v52">'+
              '<div><label for="supportMessageBodyV52">Správa</label><textarea id="supportMessageBodyV52" class="input" rows="1" maxlength="2000" placeholder="Napíšte správu pre Chvostíkovo…" required></textarea></div>'+
              '<button id="supportMessageSend" class="btn chat-send" type="submit" aria-label="Odoslať správu" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button>'+
            '</form>'+
          '</div>'+
        '</div>');
      $('supportChatBtnV52').addEventListener('click',open);
      $('supportChatCloseV52').addEventListener('click',close);
      $('supportChatModalV52').addEventListener('click',e=>{if(e.target===$('supportChatModalV52'))close()});
      $('supportMessageFormV52').addEventListener('submit',send);
      supportLayout=createCompactChatLayout($('supportChatModalV52'),$('supportChatModalV52').firstElementChild,$('supportMessageThreadV52'),$('supportMessageBodyV52'));
      $('supportMessageBodyV52').addEventListener('input',()=>{$('supportMessageSend').disabled=supportSending||!$('supportMessageBodyV52').value.trim()});
      $('supportMessageSend').addEventListener('pointerdown',e=>e.preventDefault());
    }
    renderSupportThread();
    updateButton();
  }

  function renderSupportStaffAvatarV180(){
    const avatar=$('supportChatStaffAvatarV180');if(!avatar)return;
    const url=String(state.data?.chat_staff_photo_url||'');
    avatar.innerHTML=url?'<img src="'+esc(url)+'" alt="Chvostíkovo">':'🐾';
    avatar.classList.toggle('has-photo',!!url);
    const call=$('supportChatCallV182');
    if(call){
      const phone=String(state.data?.chat_staff_phone||'').trim();
      const tel=phone.replace(/(?!^\+)\D/g,'');
      call.classList.toggle('hidden',!tel);
      if(tel)call.href='tel:'+tel;else call.removeAttribute('href');
    }
  }

  function renderSupportThread(){
    const root=$('supportMessageThreadV52');if(!root)return;
    renderSupportStaffAvatarV180();
    const rows=state.data?.messages||[];
    const previousTop=root.scrollTop,nearBottom=root.scrollHeight-root.scrollTop-root.clientHeight<90;
    root.classList.remove('hidden');
    root.innerHTML=rows.length?rows.map(m=>'<div class="message-bubble '+(m.sender_role==='customer'?'mine':'')+'"><p>'+esc(m.body)+'</p><small>'+skTime(m.created_at)+'</small></div>').join(''):'<div class="message-empty">Zatiaľ tu nemáte žiadne správy.</div>';
    requestAnimationFrame(()=>{root.scrollTop=nearBottom?root.scrollHeight:previousTop});
  }

  async function markRead(){
    if(supportReadInFlight||!state.data?.conversation_id)return;
    const unread=(state.data.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);
    if(!unread)return;
    const ids=new Set((state.data.messages||[]).filter(m=>m.sender_role==='staff'&&!m.read_at).map(m=>m.id));
    supportReadInFlight=true;
    try{
      await api({action:'mark_messages_read',conversation_id:Number(state.data.conversation_id)});
      const stamp=new Date().toISOString();
      (state.data.messages||[]).forEach(m=>{if(ids.has(m.id))m.read_at=stamp});
      updateUnread();
    }catch(_){}finally{supportReadInFlight=false}
  }

  let supportPageScrollY=0;
  function open(){
    if(!lateBookingContext)$('supportMessageBodyV52').value='';
    renderSupportThread();
    supportPageScrollY=window.scrollY||document.scrollingElement?.scrollTop||0;
    document.documentElement.style.setProperty('--support-chat-lock-top',(-supportPageScrollY)+'px');
    document.documentElement.classList.add('support-chat-open-v52');
    supportLayout.prepare();
    $('appView').inert=true;
    $('supportChatModalV52').classList.remove('hidden');
    supportLayout.open();
    $('supportMessageSend').disabled=supportSending||!$('supportMessageBodyV52').value.trim();
    requestAnimationFrame(()=>{const root=$('supportMessageThreadV52');root.scrollTop=root.scrollHeight});
    updateButton();markRead();
  }

  function close(){
    $('supportChatModalV52').classList.add('hidden');
    document.documentElement.classList.remove('support-chat-open-v52');
    document.documentElement.style.removeProperty('--support-chat-lock-top');
    supportLayout?.close();
    $('appView').inert=false;
    lateBookingContext=null;
    $('supportMessageBodyV52').value='';
    requestAnimationFrame(()=>window.scrollTo(0,supportPageScrollY));
    updateButton();
  }
  window.openCustomerSupportChatV176=open;
  window.openCustomerLateBookingMessage=(dogId,date,body,messageOnly=false)=>{
    mount();
    lateBookingContext={dogId,date,messageOnly};
    $('supportMessageBodyV52').value=body;
    open();
  };

  async function send(e){
    e.preventDefault();
    const message=$('supportMessageBodyV52').value.trim();
    if(!message||supportSending)return;
    const btn=$('supportMessageSend');supportSending=true;
    try{
      if(btn)btn.disabled=true;
      const late=lateBookingContext?.messageOnly?null:lateBookingContext;
      const result=late
        ? await api({action:'request_late_booking',dog_id:late.dogId,reservation_date:late.date,message})
        : await api({action:'send_message',message,booking_request_id:null});
      const row=late?result?.data?.message:(result?.data?.message||result?.message||{id:-Date.now(),body:message,sender_role:'customer',created_at:new Date().toISOString()});
      if(!row)throw new Error('Správa sa nepodarila priradiť k rezervácii.');
      if(result?.data?.conversation_id)state.data.conversation_id=result.data.conversation_id;
      (state.data.messages||(state.data.messages=[])).push(row);
      $('supportMessageBodyV52').value='';
      supportLayout.resizeInput();
      renderMessages();
      renderSupportThread();
      supportLayout.latest();
      updateUnread();
      lateBookingContext=null;
      if(late){close();toast('Žiadosť o rezerváciu a správa boli odoslané na schválenie.');queueCustomerSync('bookings',80)}
      else{toast('Správa bola odoslaná.');queueCustomerSync('messages',80)}
    }catch(error){toast(error.message)}
    finally{supportSending=false;if(btn)btn.disabled=!$('supportMessageBodyV52').value.trim()}
  }

  function updateButton(){
    const btn=$('supportChatBtnV52');if(!btn)return;
    const appVisible=!!state.session&&!$('appView')?.classList.contains('hidden');
    const unread=(state.data?.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);
    btn.classList.toggle('hidden',!appVisible||!unread||!$('supportChatModalV52')?.classList.contains('hidden'));
  }

  function refreshNav(){
    const nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    $('navMessages')?.setAttribute('aria-hidden','true');
    $('navMessages')?.setAttribute('tabindex','-1');
  }

  function authHeadersV55(){return {apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token}}
  async function activeTermsV55(force=false){
    return readActiveCustomerTermsV146(force);
  }

  function ensureRulesUiV55(){
    const card=$('schoolRulesCardV55');
    if(card&&!card.dataset.rulesBoundV98){
      card.dataset.rulesBoundV98='1';
      card.addEventListener('click',openRulesV55);
    }
    if(!$('schoolRulesModalV55')){
      document.body.insertAdjacentHTML('beforeend','<div id="schoolRulesModalV55" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="schoolRulesTitleV55"><div class="legal-card terms-card"><button id="schoolRulesCloseV55" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="schoolRulesTitleV55">Pravidlá škôlky</h2><div id="schoolRulesBodyV55" class="legal-body terms-body school-rules-body-v55"></div><p id="schoolRulesAcceptedV55" class="school-rules-accepted-v55 hidden"></p><div id="schoolRulesHistoryV141" class="terms-history-container"></div><button id="schoolRulesDoneV55" class="btn full" type="button">Zavrieť</button></div></div>');
      const close=()=>$('schoolRulesModalV55')?.classList.add('hidden');
      $('schoolRulesCloseV55').addEventListener('click',close);
      $('schoolRulesDoneV55').addEventListener('click',close);
      $('schoolRulesModalV55').addEventListener('click',e=>{if(e.target===$('schoolRulesModalV55'))close()});
    }
  }

  function formatSchoolTermsV102(text){
    const chunks=String(text||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
    let html='';
    for(let i=0;i<chunks.length;i++){
      const heading=chunks[i];
      if(/^\d+\.\s+/.test(heading)){
        let body='';
        while(i+1<chunks.length&&!/^\d+\.\s+/.test(chunks[i+1]))body+=(body?'\n\n':'')+chunks[++i];
        const paragraphs=(typeof termParagraphsV106==='function'?termParagraphsV106(body):[body]).filter(Boolean);
        html+='<section class="terms-point-v97"><strong>'+esc(heading)+'</strong>'+paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('')+'</section>';
      }else{
        html+='<p class="terms-loose-v97">'+esc(heading)+'</p>';
      }
    }
    return html;
  }

  async function openRulesV55(){
    ensureRulesUiV55();
    const modal=$('schoolRulesModalV55'),body=$('schoolRulesBodyV55'),title=$('schoolRulesTitleV55'),accepted=$('schoolRulesAcceptedV55');
    const dogId=Number(selectedDog()?.id||0),account=state.session?.user?.id;
    if(!dogId||!account||modal.dataset.loading==='true')return;
    modal.dataset.loading='true';
    const trigger=$('schoolRulesCardV55');trigger?.setAttribute('aria-busy','true');
    body.innerHTML='';accepted.textContent='';accepted.classList.add('hidden');
    const request=String(Number(modal.dataset.request||0)+1);modal.dataset.request=request;
    try{
      const [doc]=await Promise.all([
        activeTermsV55(),
        window.renderCustomerTermsHistory?.($('schoolRulesHistoryV141'),dogId)
      ]);
      if(modal.dataset.request!==request||state.session?.user?.id!==account||Number(selectedDog()?.id||0)!==dogId)return;
      title.textContent=doc?.title||'Pravidlá škôlky';
      body.innerHTML=formatSchoolTermsV102(doc?.body||'Pravidlá škôlky momentálne nie sú dostupné.');
      if(doc?.version){
        const url=SUPABASE_URL+'/rest/v1/portal_terms_acceptances?user_id=eq.'+encodeURIComponent(account)+'&dog_id=eq.'+dogId+'&terms_version=eq.'+encodeURIComponent(doc.version)+'&select=accepted_at&order=accepted_at.desc&limit=1';
        try{
          const response=await fetch(url,{headers:authHeadersV55(),cache:'no-store'});
          if(response.ok){
            const rows=await response.json();
            if(rows?.[0]?.accepted_at){accepted.textContent='Pravidlá potvrdené '+new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(rows[0].accepted_at))+' · Verzia '+termsVersionLabel(doc.version);accepted.classList.remove('hidden')}
          }
        }catch(_){}
      }
      if(modal.dataset.request===request&&state.session?.user?.id===account&&Number(selectedDog()?.id||0)===dogId)modal.classList.remove('hidden');
    }catch(e){
      if(modal.dataset.request===request&&state.session?.user?.id===account&&Number(selectedDog()?.id||0)===dogId){
        title.textContent='Pravidlá škôlky';body.innerHTML='<p class="terms-loose-v97">'+esc(e.message||'Pravidlá sa nepodarilo načítať.')+'</p>';
        modal.classList.remove('hidden');
      }
    }finally{modal.dataset.loading='false';trigger?.removeAttribute('aria-busy')}
  }
  window.openCustomerRulesV55=openRulesV55;

  function polishMenuV55(){
    const btn=$('dogSettingsBtnV36');
    if(btn){btn.setAttribute('aria-label','Nastavenia');btn.title='Nastavenia'}
    const title=$('dogSettingsTitleV36');if(title)title.textContent='Nastavenia';
  }

  addCustomerHook('afterRenderMessages',()=>{renderSupportThread();if(!$('supportChatModalV52')?.classList.contains('hidden')&&document.visibilityState==='visible')markRead()});
  addCustomerHook('afterUpdateUnread',()=>{
    const count=(state.data?.messages||[]).filter(m=>m.sender_role==='staff'&&!m.read_at).length;
    const badge=$('supportChatUnreadV52');
    if(badge){badge.textContent=count>99?'99+':String(count);badge.classList.toggle('hidden',!count)}
    $('supportChatBtnV52')?.setAttribute('aria-label',count?'Správy, neprečítané: '+count:'Správy');
    updateButton();
  });

  addCustomerHook('afterSwitchTab',()=>{updateButton();refreshNav()});

  addCustomerHook('afterRenderStaff',()=>{refreshNav()});
  addCustomerHook('afterRenderDog',()=>{
    updateButton();

    refreshNav();
    setTimeout(()=>{ensureRulesUiV55();polishMenuV55()},0);
  });

  const start=()=>{
    mount();
    updateUnread();
    updateButton();

    refreshNav();
    ensureRulesUiV55();
    polishMenuV55();
    activeTermsV55().catch(()=>{});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* v104: vaccination renewal reminder and proof-photo flow */
(function vaccinationRenewalV104(){
  function daysUntilV104(iso){
    if(!iso)return null;
    const todayIso=typeof bratislavaClockV95==='function'?bratislavaClockV95().date:new Date().toISOString().slice(0,10);
    return Math.round((new Date(String(iso).slice(0,10)+'T12:00:00')-new Date(todayIso+'T12:00:00'))/86400000);
  }
  function candidateV104(){
    const dogs=state.data?.dogs||[],rows=state.data?.vaccinations||[],onboarding=state.data?.dog_onboarding||[];
    for(const dog of dogs){
      if(!onboarding.some(x=>Number(x.dog_id)===Number(dog.id)))continue;
      const own=rows.filter(v=>Number(v.dog_id)===Number(dog.id)&&v.valid_until);
      const values=own.map(v=>({v,days:daysUntilV104(v.valid_until)})).filter(x=>Number.isFinite(x.days)).sort((a,b)=>a.days-b.days);
      if(values.length&&values[0].days<=14)return {dog,item:values[0]};
    }
    return null;
  }
  function ensureV104(){
    let modal=$('vaccRenewalModalV104');if(modal)return modal;
    document.body.insertAdjacentHTML('beforeend','<div id="vaccRenewalModalV104" class="legal-modal hidden" role="dialog" aria-modal="true"><div class="legal-card vacc-renewal-card-v104"><button id="vaccRenewalCloseV104" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="vacc-renewal-icon-v104">💉</div><h2 id="vaccRenewalTitleV104">Boli ste už preočkovať svojho psíka?</h2><div id="vaccRenewalTextV104" class="legal-body"></div><button id="vaccRenewalUpdateV104" class="btn full" type="button">Aktualizovať dátum a fotku</button><button id="vaccRenewalLaterV104" class="btn secondary full" type="button">Neskôr</button></div></div>');
    modal=$('vaccRenewalModalV104');const close=()=>modal.classList.add('hidden');$('vaccRenewalCloseV104').onclick=close;$('vaccRenewalLaterV104').onclick=close;return modal;
  }
  function showV104(){
    if(window.__customerOnboardingCompleteV75!==true)return;
    if(window.__vaccinationFlowTouchedV105===true)return;
    try{if(sessionStorage.getItem('chvostikovo_vacc_flow_touched_v105')==='1')return}catch(_){}
    if(!$('dogDetailsModal')?.classList.contains('hidden'))return;
    const found=candidateV104();if(!found||(found.item.days>=0&&found.item.days<=14))return;
    const key='chvostikovo_vacc_renewal_v104_'+found.dog.id+'_'+String(found.item.v.valid_until||'');
    try{if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1')}catch(_){}
    const modal=ensureV104(),days=found.item.days;
    $('vaccRenewalTitleV104').textContent='Boli ste už preočkovať svojho psíka?';
    $('vaccRenewalTextV104').innerHTML=days<0?'<p>Platnosť očkovania proti <strong>'+esc(found.item.v.vaccination_type==='lepto_l4'?'leptospiróze (L4)':found.item.v.vaccination_type==='rabies'?'besnote':found.item.v.vaccination_type==='kennel_cough'?'kotercovému kašľu':((state.data?.vaccinations||[]).some(v=>Number(v.dog_id)===Number(found.dog.id)&&v.vaccination_type==='lepto_l4')?'infekčným ochoreniam (DHPPi)':'infekčným ochoreniam (DHPPi+L)'))+'</strong> už skončila. Aktualizujte dátum „Platí do“ a vymeňte aspoň fotografiu príslušného očkovania.</p>':days===0?'<p>Platnosť jedného z očkovaní končí dnes. Po obnovení zadajte nový dátum a nahrajte aktualizovanú fotografiu očkovania.</p>':'<p>Jedno z očkovaní bude platné už len <strong>'+days+' '+vaccinationDaysWordV96(days)+'</strong>. Po preočkovaní zadajte nový dátum a vymeňte príslušnú fotografiu.</p>';
    $('vaccRenewalUpdateV104').onclick=()=>{modal.classList.add('hidden');state.selectedDogId=Number(found.dog.id);renderDogSelector();renderDog();switchTab('dog');setTimeout(()=>openDogDetails('vaccinations',false),60)};
    modal.classList.remove('hidden');
  }
  addCustomerHook('afterBootstrap',()=>setTimeout(showV104,700));
  window.showVaccinationRenewalV104=showV104;
})();

/* v105: iOS-safe vaccination proof selection and upload */
let vaccinationProofStageEpochV143=0;
let vaccinationProofUploadInFlightV143=null;
function clearVaccinationProofStageV104(){
  vaccinationProofStageEpochV143++;
  vaccinationProofFilesV104=[];
  vaccinationProofReplaceModeV104=false;
  window.__vaccinationProofProcessingV105=false;
}
function applyDogDetailsModeV96(mode='details',mandatory=false){
  dogDetailsModeV96=mode==='vaccinations'?'vaccinations':'details';
  dogDetailsMandatoryV96=!!mandatory;
  if(dogDetailsModeV96==='vaccinations'){
    window.__vaccinationFlowTouchedV105=true;
    try{sessionStorage.setItem('chvostikovo_vacc_flow_touched_v105','1')}catch(_){}
  }
  $('dogBasicFieldsV96')?.classList.toggle('hidden',dogDetailsModeV96!=='details');
  $('dogVaccinationFieldsV96')?.classList.toggle('hidden',dogDetailsModeV96!=='vaccinations');
  if($('dogDetailsTitle'))$('dogDetailsTitle').textContent=dogDetailsModeV96==='vaccinations'?'Očkovania':'Údaje psíka';
  $('dogDetailsClose')?.classList.toggle('hidden',dogDetailsMandatoryV96);
  $('dogDetailsModal')?.setAttribute('data-mode',dogDetailsModeV96);
  const modal=$('dogDetailsModal');
  if(modal?.contains(document.activeElement))document.activeElement.blur();
  const resetScroll=()=>{if(!modal)return;modal.scrollTop=0;const card=modal.querySelector('.dog-details-card');if(card)card.scrollTop=0;const form=$('dogForm');if(form)form.scrollTop=0};
  resetScroll();requestAnimationFrame(resetScroll);
}
function v105BlobToDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Fotografiu sa nepodarilo načítať.'));
    reader.readAsDataURL(blob);
  });
}
function v105CanvasBlob(canvas,quality){
  return new Promise((resolve,reject)=>canvas.toBlob(
    blob=>blob?resolve(blob):reject(new Error('Fotografiu sa nepodarilo skonvertovať.')),
    'image/jpeg',quality
  ));
}
async function v105DecodeImage(file){
  if(typeof createImageBitmap==='function'){
    try{
      const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
      if(bitmap?.width&&bitmap?.height)return {source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>{try{bitmap.close()}catch(_){}}};
    }catch(_){}
    try{
      const bitmap=await createImageBitmap(file);
      if(bitmap?.width&&bitmap?.height)return {source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>{try{bitmap.close()}catch(_){}}};
    }catch(_){}
  }
  const url=await v105BlobToDataUrl(file);
  const img=new Image();
  await new Promise((resolve,reject)=>{
    img.onload=resolve;
    img.onerror=()=>reject(new Error('Tento formát fotografie sa nepodarilo načítať. Skúste použiť Fotoaparát.'));
    img.src=url;
  });
  if(!img.naturalWidth||!img.naturalHeight)throw new Error('Fotografia nemá platné rozmery.');
  return {source:img,width:img.naturalWidth,height:img.naturalHeight,close:()=>{}};
}
async function v105PrepareProof(file){
  if(!file)throw new Error('Fotografia sa nenašla.');
  window.__customerPhotoDecodeV88=true;
  let decoded=null;
  try{
    decoded=await v105DecodeImage(file);
    const ratio=Math.min(1,1280/Math.max(decoded.width,decoded.height));
    const w=Math.max(1,Math.round(decoded.width*ratio)),h=Math.max(1,Math.round(decoded.height*ratio));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Fotografiu sa nepodarilo spracovať.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(decoded.source,0,0,w,h);
    let quality=.78,blob=await v105CanvasBlob(canvas,quality);
    while(blob.size>850000&&quality>.50){quality=Math.max(.50,quality-.08);blob=await v105CanvasBlob(canvas,quality)}
    if(blob.size>1150000)throw new Error('Fotografia je príliš veľká. Skúste ju odfotiť znova.');
    const dataUrl=await v105BlobToDataUrl(blob);
    if(!/^data:image\/jpeg;base64,/.test(dataUrl))throw new Error('Fotografiu sa nepodarilo pripraviť.');
    return {name:String(file.name||'fotografia.jpg'),dataUrl,size:blob.size};
  }finally{
    try{decoded?.close?.()}catch(_){}
    window.__customerPhotoDecodeV88=false;
  }
}
// Keep unchanged image nodes and signed-URL sources through upload/status renders.
function reconcileVaccProofNodesV259(root,dogId,entries,create){
  const scope=String(state.session?.user?.id||'')+'|'+String(dogId);
  if(root.dataset.proofScope!==scope){root.replaceChildren();root.dataset.proofScope=scope}
  const existing=new Map([...root.children].map(el=>[el.dataset.proofKey,el]));
  const wanted=entries.map(entry=>{
    const key=String(entry.key),el=existing.get(key)||create(entry);
    el.dataset.proofKey=key;entry.update(el);return el;
  });
  const keep=new Set(wanted);
  [...root.children].forEach(el=>{if(!keep.has(el))el.remove()});
  wanted.forEach((el,i)=>{if(root.children[i]!==el)root.insertBefore(el,root.children[i]||null)});
}
function updateVaccProofImageV259(img,proof){
  const url=String(proof?.image_url||''),identity=String(proof?.storage_path||url.split('?')[0]);
  if(img.dataset.proofImage!==identity){img.src=url;img.dataset.proofImage=identity}
}
function renderVaccinationProofsV104(dogId=Number(selectedDog()?.id||0)){
  const current=$('vaccProofCurrentV104'),staged=$('vaccProofStagedV104'),count=$('vaccProofCountV104'),msg=$('vaccProofMessageV104');
  if(!current||!staged||!count)return;
  const proofs=vaccinationProofsForDogV104(dogId);
  count.textContent=String(proofs.length);
  if(proofs.length){
    current.classList.remove('vacc-proof-empty-wrap-v105');
    reconcileVaccProofNodesV259(current,dogId,proofs.map((proof,i)=>({key:proof.id,update(button){
      button.dataset.proofIndex=String(i);
      const img=button.querySelector('img');updateVaccProofImageV259(img,proof);img.alt='Očkovací preukaz '+(i+1);
      button.querySelector('span').textContent='Foto '+(i+1);
      button.onclick=()=>openVaccinationProofViewerV104(vaccinationProofsForDogV104(dogId).find(p=>Number(p.id)===Number(proof.id))?.image_url);
    }})),()=>{
      const button=document.createElement('button');button.className='vacc-proof-thumb-v104';button.type='button';button.innerHTML='<img><span></span>';return button;
    });
  }else{
    current.classList.add('vacc-proof-empty-wrap-v105');
    current.innerHTML='<button id="vaccProofEmptyV105" class="vacc-proof-empty-v105" type="button"><span class="vacc-proof-plus-v105">+</span><span>Nahrať fotky</span><small>Kliknite a vyberte fotografie</small></button>';
  }
  const busy=window.__vaccinationProofProcessingV105===true||!!vaccinationProofUploadInFlightV143;
  const retry=vaccinationProofFilesV104.length>0&&!busy;
  const empty=$('vaccProofEmptyV105');if(empty){empty.disabled=busy;if(retry)empty.querySelector('span:not(.vacc-proof-plus-v105)').textContent='Skúsiť nahratie znova';empty.addEventListener('click',()=>{if(retry)uploadVaccinationProofsV104(false).catch(()=>{});else {empty.blur();$('vaccProofLibraryV104')?.click()}})}
  const replace=$('vaccProofReplaceV104');if(replace){replace.classList.toggle('hidden',!proofs.length);replace.disabled=busy;replace.textContent=retry?'Skúsiť nahratie znova':'Upraviť fotky'}
  staged.classList.toggle('hidden',!vaccinationProofFilesV104.length);
  staged.innerHTML=vaccinationProofFilesV104.length?'<div class="vacc-proof-stage-title-v104">Vybrané nové fotografie</div><div class="vacc-proof-grid-v104">'+vaccinationProofFilesV104.map((item,i)=>'<div class="vacc-proof-thumb-v104 staged"><img src="'+item.dataUrl+'" alt="Vybraná fotografia '+(i+1)+'"><button type="button" data-remove-proof="'+i+'" aria-label="Odstrániť">×</button></div>').join('')+'</div>':'';
  staged.querySelectorAll('[data-remove-proof]').forEach(button=>{button.disabled=busy;button.addEventListener('click',()=>{if(window.__vaccinationProofProcessingV105||vaccinationProofUploadInFlightV143)return;vaccinationProofFilesV104.splice(Number(button.dataset.removeProof),1);renderVaccinationProofsV104(dogId)})});
  if(msg&&!vaccinationProofFilesV104.length&&!busy)msg.textContent=vaccinationProofReplaceModeV104?'Vyberte 1 až 5 nových fotografií.':vaccinationPhotoNeededV244(dogId)?'Zmenili ste dátum očkovania. Pred uložením nahrajte aj aktuálnu fotografiu cez „Upraviť fotky“.':proofs.length?'Uložené '+proofs.length+' z 5 fotografií.':'Na dokončenie nahrajte fotografie očkovaní z očkovacieho preukazu.';
}
async function addVaccinationProofFilesV104(files){
  const incoming=[...(files||[])].filter(Boolean);
  if(!incoming.length||window.__vaccinationProofProcessingV105||vaccinationProofUploadInFlightV143)return;
  const epoch=vaccinationProofStageEpochV143,account=state.session?.user?.id,dogId=Number(selectedDog()?.id||0);
  const current=()=>epoch===vaccinationProofStageEpochV143&&account===state.session?.user?.id&&dogId===Number(selectedDog()?.id||0);
  const existing=vaccinationProofReplaceModeV104?0:vaccinationProofsForDogV104(Number(selectedDog()?.id||0)).length;
  const remaining=Math.max(0,5-existing-vaccinationProofFilesV104.length);
  if(!remaining){toast('Na jedného psíka možno uložiť najviac 5 fotografií.');return}
  window.__vaccinationProofProcessingV105=true;
  const msg=$('vaccProofMessageV104');if(msg)msg.textContent='Spracúvam vybrané fotografie…';
  renderVaccinationProofsV104();
  try{
    for(const file of incoming.slice(0,remaining)){
      try{const prepared=await v105PrepareProof(file);if(!current())return;vaccinationProofFilesV104.push(prepared)}
      catch(error){
        if(!current())return;
        const message=(String(file?.name||'Fotografia')+': '+String(error?.message||'Fotografiu sa nepodarilo spracovať.'));
        if(msg)msg.textContent=message;toast(message);
      }
    }
    if(current()&&incoming.length>remaining)toast('Na jedného psíka možno uložiť najviac 5 fotografií.');
  }finally{
    if(!current())return;
    window.__vaccinationProofProcessingV105=false;
    window.__customerPhotoPickerV88=false;
    renderVaccinationProofsV104();
  }
  if(current()&&vaccinationProofFilesV104.length)await uploadVaccinationProofsV104(false);
}
function v105PickerGuard(){
  window.__customerPhotoPickerV88=true;
  setTimeout(()=>{if(!window.__customerPhotoDecodeV88)window.__customerPhotoPickerV88=false},20000);
}
function bindVaccinationProofInputsV104(){
  const library=$('vaccProofLibraryV104'),replace=$('vaccProofReplaceV104');
  if(replace&&!replace.dataset.boundV104){replace.dataset.boundV104='1';replace.addEventListener('click',()=>{
    if(window.__vaccinationProofProcessingV105||vaccinationProofUploadInFlightV143)return;
    if(vaccinationProofFilesV104.length){uploadVaccinationProofsV104(false).catch(()=>{});return}
    openVaccProofEditorV244();
  })}
  if(library&&!library.dataset.boundV105){
    library.dataset.boundV105='1';library.addEventListener('click',v105PickerGuard);
    library.addEventListener('change',async()=>{try{await addVaccinationProofFilesV104(library.files)}catch(_){}finally{library.value='';setTimeout(()=>{window.__customerPhotoPickerV88=false},250)}});
  }
}
function uploadVaccinationProofsV104(silent=false){
  if(vaccinationProofUploadInFlightV143)return vaccinationProofUploadInFlightV143;
  const task=uploadVaccinationProofsCoreV143(silent);
  vaccinationProofUploadInFlightV143=task;
  renderVaccinationProofsV104();
  task.finally(()=>{if(vaccinationProofUploadInFlightV143===task){vaccinationProofUploadInFlightV143=null;renderVaccinationProofsV104()}}).catch(()=>{});
  return task;
}
async function uploadVaccinationProofsCoreV143(silent=false){
  const dog=selectedDog();if(!dog)throw new Error('Psík sa nenašiel.');
  if(!vaccinationProofFilesV104.length)return vaccinationProofsForDogV104(dog.id);
  const account=state.session?.user?.id,epoch=vaccinationProofStageEpochV143;
  const current=()=>account===state.session?.user?.id&&epoch===vaccinationProofStageEpochV143&&Number(dog.id)===Number(selectedDog()?.id||0);
  const msg=$('vaccProofMessageV104');
  if(msg)msg.textContent='Nahrávam fotografie…';
  try{
    const images=vaccinationProofFilesV104.map(item=>item.dataUrl);
    const result=await api({action:'upload_vaccination_proofs',dog_id:Number(dog.id),images,append:!vaccinationProofReplaceModeV104&&vaccinationProofsForDogV104(dog.id).length>0});
    const proofs=result?.data?.proofs||[];
    if(account!==state.session?.user?.id||!state.data)return proofs;
    if(proofs.length)vaccinationFreshUploadV234.add(vaccineKeyV287(dog.id));
    customerMutationRevisionV145++;
    state.data.vaccination_proofs=(state.data.vaccination_proofs||[]).filter(p=>Number(p.dog_id)!==Number(dog.id));
    state.data.vaccination_proofs.push(...proofs);
    if(current()){vaccineStagesV287.delete(vaccineKeyV287(dog.id));clearVaccinationProofStageV104();renderVaccinationProofsV104(dog.id);
    if(msg)msg.textContent='Fotografie sú bezpečne uložené.';}
    if(!silent)toast('Fotografie očkovacieho preukazu sú uložené.');
    return proofs;
  }catch(error){
    const message=String(error?.message||'Fotografie sa nepodarilo nahrať.');
    if(current()&&msg)msg.textContent=message;if(!silent)toast(message);throw error;
  }
}


/* v244: individual vaccination-photo editor; existing 1–5 proofs are preserved. */
let vaccProofEditOrderV244=[];
let vaccProofEditBusyV244=false;
function vaccinationPhotoNeededV244(dogId){
  if(Number($('dogId')?.value)!==Number(dogId))return false;
  if(!dogId||vaccinationFreshUploadV234.has(vaccineKeyV287(dogId))||dogDetailsModeV96!=='vaccinations')return false;
  const prior=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(dogId));
  if(!prior.length)return false;
  return [['rabies','rabiesUntil'],['infectious','infectiousUntil'],['kennel_cough','kennelUntil'],['lepto_l4','leptoL4UntilV211']]
    .some(([type,id])=>{
      const old=String(prior.find(row=>row.vaccination_type===type)?.valid_until||'');
      const next=$(id)?.value||'';
      return (old||type==='lepto_l4'&&prior.length>0&&next)&&old!==next;
    });
}
function ensureVaccProofEditorV244(){
  let modal=$('vaccProofEditorV244');if(modal)return modal;
  document.body.insertAdjacentHTML('beforeend',
    '<div id="vaccProofEditorV244" class="vacc-proof-edit-modal-v244 hidden" role="dialog" aria-modal="true" aria-labelledby="vaccProofEditTitleV244">'+
      '<section class="vacc-proof-edit-card-v244">'+
        '<div class="vacc-proof-edit-head-v244"><div><h2 id="vaccProofEditTitleV244">Upraviť fotky očkovania</h2><p>Kliknite na ceruzku pri fotografii, ktorú chcete vymeniť. Ostatné zostanú uložené.</p></div><button type="button" id="vaccProofEditCloseV244" aria-label="Zavrieť úpravu fotografií">×</button></div>'+
        '<div id="vaccProofEditGridV244" class="vacc-proof-edit-grid-v244"></div>'+
        '<p id="vaccProofEditMessageV244" class="vacc-proof-edit-message-v244" role="status" aria-live="polite">Vyberte fotografiu na výmenu.</p>'+
        '<input type="file" accept="image/*" id="vaccProofEditFileV244" hidden>'+
      '</section></div>');
  modal=$('vaccProofEditorV244');
  const close=()=>{if(vaccProofEditBusyV244)return;modal.classList.add('hidden')};
  $('vaccProofEditCloseV244').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden')){e.stopPropagation();close()}},true);
  const input=$('vaccProofEditFileV244');
  input.addEventListener('click',()=>v105PickerGuard());
  input.addEventListener('change',async()=>{
    const file=input.files?.[0],replaceId=Number(input.dataset.replaceId||0);
    input.value='';
    try{if(file)await uploadSingleVaccProofV244(file,replaceId)}
    finally{window.__customerPhotoPickerV88=false}
  });
  return modal;
}
function openVaccProofEditorV244(){
  if(window.__vaccinationProofProcessingV105||vaccinationProofUploadInFlightV143)return;
  const dogId=Number(selectedDog()?.id||0);if(!dogId)return;
  const modal=ensureVaccProofEditorV244();
  modal.dataset.dogId=String(dogId);
  vaccProofEditOrderV244=vaccinationProofsForDogV104(dogId).map(p=>Number(p.id));
  $('vaccProofEditMessageV244').textContent='Vymeňte len vybranú fotku alebo pridajte ďalšiu (maximálne 5).';
  renderVaccProofEditorV244();
  modal.classList.remove('hidden');
}
function renderVaccProofEditorV244(){
  const modal=$('vaccProofEditorV244'),grid=$('vaccProofEditGridV244');
  if(!modal||!grid||modal.classList.contains('hidden')&&Number(modal.dataset.dogId||0)!==Number(selectedDog()?.id||0))return;
  const dogId=Number(modal.dataset.dogId||0),proofs=vaccinationProofsForDogV104(dogId);
  const byId=new Map(proofs.map(p=>[Number(p.id),p]));
  vaccProofEditOrderV244=vaccProofEditOrderV244.filter(id=>byId.has(id));
  proofs.forEach(p=>{if(!vaccProofEditOrderV244.includes(Number(p.id)))vaccProofEditOrderV244.push(Number(p.id))});
  const entries=vaccProofEditOrderV244.map((id,i)=>({key:id,update(tile){
    const preview=tile.querySelector('[data-vacc-preview]'),p=byId.get(id),img=preview.querySelector('img');
    preview.dataset.vaccPreview=String(id);preview.setAttribute('aria-label','Zväčšiť fotografiu '+(i+1));
    updateVaccProofImageV259(img,p);img.alt='Fotografia očkovania '+(i+1);
    preview.onclick=()=>openVaccinationProofViewerV104(vaccinationProofsForDogV104(dogId).find(p=>Number(p.id)===id)?.image_url);
    const pencil=tile.querySelector('[data-vacc-replace]');pencil.dataset.vaccReplace=String(id);pencil.setAttribute('aria-label','Nahradiť fotografiu '+(i+1));
    tile.querySelector('span').textContent='Foto '+(i+1);
  }}));
  if(proofs.length<5)entries.push({key:'add',update(){}});
  reconcileVaccProofNodesV259(grid,dogId,entries,entry=>{
    if(entry.key==='add'){
      const add=document.createElement('button');add.type='button';add.className='vacc-proof-edit-add-v244';add.dataset.vaccReplace='0';add.innerHTML='<span>+</span>Pridať fotku';return add;
    }
    const tile=document.createElement('div');tile.className='vacc-proof-edit-tile-v244';
    tile.innerHTML='<button type="button" class="vacc-proof-edit-preview-v244" data-vacc-preview=""><img></button><button type="button" class="vacc-proof-edit-pencil-v244" data-vacc-replace=""><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5Z"/></svg></button><span></span>';return tile;
  });
  grid.querySelectorAll('[data-vacc-replace]').forEach(b=>{b.disabled=vaccProofEditBusyV244;b.onclick=()=>{
    if(vaccProofEditBusyV244)return;
    const input=$('vaccProofEditFileV244');input.dataset.replaceId=b.dataset.vaccReplace;b.blur();input.click();
  }});
}
async function uploadSingleVaccProofV244(file,replaceId){
  if(vaccProofEditBusyV244||vaccinationProofUploadInFlightV143)return;
  const modal=$('vaccProofEditorV244'),dogId=Number(modal?.dataset.dogId||0),userId=state.session?.user?.id,epoch=vaccinationProofStageEpochV143;
  if(!dogId||Number(selectedDog()?.id)!==dogId||!file)return;
  const current=()=>userId===state.session?.user?.id&&epoch===vaccinationProofStageEpochV143&&Number(selectedDog()?.id)===dogId;
  const oldIds=vaccinationProofsForDogV104(dogId).map(p=>Number(p.id));
  if(replaceId&&!oldIds.includes(replaceId)){toast('Fotografia už nie je aktuálna. Obnovte aplikáciu.');return}
  if(!replaceId&&oldIds.length>=5){toast('Možno uložiť maximálne 5 fotografií.');return}
  vaccProofEditBusyV244=true;window.__vaccinationProofProcessingV105=true;
  const msg=$('vaccProofEditMessageV244');
  msg.textContent='Spracúvam a nahrávam fotografiu…';
  renderVaccProofEditorV244();
  try{
    const prepared=await v105PrepareProof(file);
    if(!current())return;
    const result=await api({action:'upload_vaccination_proofs',dog_id:dogId,images:[prepared.dataUrl],replace_proof_id:replaceId||undefined,append:!replaceId});
    const proofs=result?.data?.proofs||[];
    if(!proofs.length)throw new Error('Nahratie nevrátilo aktualizované fotografie.');
    if(!current()||!state.data)return;
    const added=proofs.find(p=>!oldIds.includes(Number(p.id)));
    state.data.vaccination_proofs=(state.data.vaccination_proofs||[]).filter(p=>Number(p.dog_id)!==dogId);
    const byId=new Map(proofs.map(p=>[Number(p.id),p]));
    const ordered=oldIds.map(id=>byId.get(id===replaceId&&added?Number(added.id):id)).filter(Boolean);
    const orderedIds=new Set(ordered.map(p=>Number(p.id)));
    state.data.vaccination_proofs.push(...ordered,...proofs.filter(p=>!orderedIds.has(Number(p.id))));
    if(replaceId&&added){
      const slot=vaccProofEditOrderV244.indexOf(replaceId);
      if(slot>=0)vaccProofEditOrderV244[slot]=Number(added.id);
    }
    $('vaccineErrorV287')?.remove();$('vaccProofReplaceV104')?.removeAttribute('aria-invalid');vaccineRetriesV287.delete(vaccineKeyV287(dogId));
    vaccinationFreshUploadV234.add(vaccineKeyV287(dogId));
    customerMutationRevisionV145++;
    msg.textContent=replaceId?'Vybraná fotografia bola úspešne vymenená. Ostatné zostali zachované.':'Fotografia bola pridaná. Ostatné zostali zachované.';
    toast(replaceId?'Fotografia bola vymenená.':'Fotografia bola pridaná.');
  }catch(error){
    const message=String(error?.message||'Fotografiu sa nepodarilo nahrať.');
    if(current())vaccineRetriesV287.set(vaccineKeyV287(dogId),{file,replaceId});
    msg.textContent=message;toast(message);
  }finally{
    vaccProofEditBusyV244=false;window.__vaccinationProofProcessingV105=false;
    if(current()){renderVaccinationProofsV104(dogId);renderVaccProofEditorV244();
      $('vaccProofRetryV287')?.remove();const retry=vaccineRetriesV287.get(vaccineKeyV287(dogId));
      if(retry){const b=document.createElement('button');b.id='vaccProofRetryV287';b.type='button';b.className='btn full';b.textContent='Skúsiť nahratie znova';b.onclick=()=>{b.remove();void uploadSingleVaccProofV244(retry.file,retry.replaceId)};msg.after(b)}
    }
  }
}
function installVaccinationViewerZoomV244(modal){
  if(modal.dataset.zoomV244==='1')return;
  modal.dataset.zoomV244='1';
  const img=$('vaccProofViewerImgV104');
  let scale=1,startDist=0,startScale=1;
  const setScale=n=>{scale=Math.max(1,Math.min(4,n));img.style.transform='scale('+scale+')'};
  window.resetVaccViewerZoomV244=()=>{startDist=0;setScale(1)};
  const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  img.addEventListener('touchstart',e=>{if(e.touches.length===2){startDist=distance(e.touches);startScale=scale;e.preventDefault()}},{passive:false});
  img.addEventListener('touchmove',e=>{if(e.touches.length===2&&startDist){setScale(startScale*distance(e.touches)/startDist);e.preventDefault()}},{passive:false});
  img.addEventListener('touchend',e=>{if(e.touches.length<2)startDist=0});
  img.addEventListener('dblclick',e=>{e.preventDefault();setScale(scale>1?1:2)});
  modal.insertAdjacentHTML('beforeend','<div class="vacc-proof-zoom-actions-v244"><button type="button" id="vaccProofZoomOutV244" aria-label="Oddialiť fotografiu">−</button><button type="button" id="vaccProofZoomInV244" aria-label="Priblížiť fotografiu">+</button></div>');
  $('vaccProofZoomOutV244').onclick=()=>setScale(scale-.5);
  $('vaccProofZoomInV244').onclick=()=>setScale(scale+.5);
}

/* v105 runtime-only styles consolidated into styles.css; upload test boundary. */



/* Customer bulletin v229: published-only notices; no automatic modal, no push. */
(function installCustomerBulletinV229(){
  if(window.__customerBulletinV229)return;
  window.__customerBulletinV229=true;
  const $=id=>document.getElementById(id);
  const rowsState={items:[],read:new Set(),at:0,loading:null,session:null,error:false};
  const select='id,title,body,valid_from,valid_until,created_at,paper_style,image_path,cta_enabled,cta_title,cta_body,cta_button_label,cta_url';
  let historyReturn=false;
  let modalsReady=false;
  function loggedIn(){return !!(state.session?.access_token&&state.data?.dogs?.length)}
  function validDate(v){return !v||!Number.isNaN(new Date(v).getTime())}
  function current(row){const now=Date.now();return (!row.valid_from||new Date(row.valid_from).getTime()<=now)&&(!row.valid_until||new Date(row.valid_until).getTime()>now)}
  function safePhoto(path){
    if(typeof path!=='string'||!path||path.length>280||path.includes('..')||! /^[A-Za-z0-9_\-./]+$/.test(path))return '';
    return SUPABASE_URL+'/storage/v1/object/public/chvostikovo-bulletin-public/'+path.split('/').map(encodeURIComponent).join('/');
  }
  function safeLink(s){try{const u=new URL(String(s||''));return u.protocol==='https:'&&u.hostname&&!u.username&&!u.password?u.href:''}catch(_){return ''}}
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
  function modal(title,id){
    const overlay=el('div','customer-bulletin-modal-v229 hidden');overlay.id=id;
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    const dialog=el('div','customer-bulletin-dialog-v229');const header=el('div','customer-bulletin-head-v229');
    const h=el('h2','',title);const x=el('button','customer-bulletin-close-v229','×');x.type='button';x.setAttribute('aria-label','Zavrieť');
    const scroll=el('div','customer-bulletin-scroll-v229');
    header.append(h,x);dialog.append(header,scroll);overlay.append(dialog);document.body.append(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    x.addEventListener('click',()=>close());
    function close(){overlay.classList.add('hidden');if(id==='customerBulletinArticleV229'&&historyReturn){historyReturn=false;openHistory(false)}syncScrollLock()}
    return{overlay,dialog,h,scroll,x,close};
  }
  let archiveModal,articleModal,zoomModal;
  function ensureModals(){
    if(modalsReady)return;modalsReady=true;
    archiveModal=modal('Oznamy','customerBulletinHistoryV229');
    articleModal=modal('','customerBulletinArticleV229');
    zoomModal=modal('','customerBulletinZoomV229');
    zoomModal.overlay.setAttribute('aria-label','Zväčšená fotografia oznamu');
    zoomModal.overlay.classList.add('customer-bulletin-zoom-v229');
    zoomModal.dialog.style.background='#12151b';
    zoomModal.h.style.color='#fff';
    zoomModal.scroll.style.display='grid';zoomModal.scroll.style.placeItems='center';
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      if(!zoomModal.overlay.classList.contains('hidden'))zoomModal.close();
      else if(!articleModal.overlay.classList.contains('hidden'))articleModal.close();
      else if(!archiveModal.overlay.classList.contains('hidden'))archiveModal.close();
    });
  }
  function syncScrollLock(){
    const any=[archiveModal,articleModal,zoomModal].some(x=>x&&!x.overlay.classList.contains('hidden'));
    document.documentElement.classList.toggle('customer-bulletin-open-v229',any);
  }
  function rows(){return rowsState.items.slice().sort((a,b)=>String(b.valid_from||b.created_at||'').localeCompare(String(a.valid_from||a.created_at||'')))}
  function drawBoard(){
    const host=$('customerBulletinItemsV229');if(!host)return;host.replaceChildren();
    const live=rows().filter(current).slice(0,2);
    if(!live.length){host.append(el('div','customer-bulletin-empty-v229',!rowsState.at&&loggedIn()?'Načítavam oznamy…':rowsState.error?'Oznamy sa momentálne nepodarilo načítať.':'Zatiaľ žiadne oznamy.'));return}
    live.forEach(row=>{
      const b=el('button','customer-bulletin-note-v229');b.type='button';b.dataset.style=['rose','cream','mint'].includes(row.paper_style)?row.paper_style:'rose';
      if(!rowsState.read.has(Number(row.id)))b.dataset.unread='true';
      const title=el('strong','',row.title||'Oznam');
      const excerpt=el('span','customer-bulletin-excerpt-v229',row.body||'');
      const action=el('span','customer-bulletin-open-v229','Otvoriť oznam →');
      b.append(title,excerpt,action);b.addEventListener('click',()=>openArticle(row,false));host.append(b);
    });
  }
  function drawHistory(){
    if(!archiveModal)return;
    const host=archiveModal.scroll;host.replaceChildren();
    const saved=rows();
    if(!saved.length){host.append(el('div','customer-bulletin-history-empty-v229','Zatiaľ žiadne oznamy.'));return}
    saved.forEach(row=>{
      const b=el('button','customer-bulletin-history-row-v229');b.type='button';
      b.append(el('strong','',row.title||'Oznam'));
      const status=current(row)?'Aktuálny oznam':'Starší oznam';
      const s=el('small','',status);
      if(!rowsState.read.has(Number(row.id))){s.append(' · ');s.append(el('span','customer-bulletin-new-v229','Nové'))}
      b.append(s);b.addEventListener('click',()=>openArticle(row,true));host.append(b);
    });
  }
  async function markRead(row){
    if(!loggedIn()||rowsState.read.has(Number(row.id)))return;
    const currentToken=state.session?.access_token;
    try{
      const res=await fetch(SUPABASE_URL+'/rest/v1/portal_announcement_dismissals?on_conflict=announcement_id,user_id',{
        method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+currentToken,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},
        body:JSON.stringify({announcement_id:Number(row.id)})
      });
      if(!res.ok)throw Error('Nepodarilo sa označiť oznam ako prečítaný.');
      if(state.session?.access_token===currentToken){rowsState.read.add(Number(row.id));drawBoard();drawHistory()}
    }catch(err){console.warn('Customer bulletin: read receipt delayed',err)}
  }
  function showImage(url){
    ensureModals();zoomModal.scroll.replaceChildren();
    const img=el('img');img.src=url;img.alt='Zväčšená fotografia oznamu';
    // Zoom is centered on the image; one-finger panning is intentionally disabled.
    let scale=1,initialScale=1,initialDistance=0;
    img.style.touchAction='none';
    const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
    const render=()=>{img.style.transform='scale('+scale+')'};
    function resetZoom(){scale=1;initialScale=1;initialDistance=0;render()}
    img.addEventListener('touchstart',e=>{
      if(e.touches.length===2){initialDistance=distance(e.touches)||1;initialScale=scale;e.preventDefault()}
    },{passive:false});
    img.addEventListener('touchmove',e=>{
      if(e.touches.length===2&&initialDistance){
        scale=Math.max(1,Math.min(4,initialScale*distance(e.touches)/initialDistance));
        render();e.preventDefault();
      }else if(e.touches.length===1&&scale>1){e.preventDefault()}
    },{passive:false});
    img.addEventListener('touchend',e=>{
      if(e.touches.length<2)initialDistance=0;
      if(scale<=1)resetZoom();
    },{passive:true});
    img.addEventListener('touchcancel',resetZoom,{passive:true});
    img.addEventListener('dblclick',e=>{e.preventDefault();scale=scale>1?1:2;render()});
    zoomModal.scroll.append(img);zoomModal.overlay.classList.remove('hidden');syncScrollLock();
  }
  function openArticle(row,fromHistory){
    if(!row||!loggedIn())return;
    ensureModals();
    historyReturn=!!fromHistory;
    archiveModal.overlay.classList.add('hidden');
    articleModal.h.textContent=row.title||'Oznam';
    articleModal.scroll.replaceChildren();
    articleModal.scroll.append(el('div','customer-bulletin-article-v229',row.body||''));
    const photo=safePhoto(row.image_path);
    if(photo){
      const img=el('img','customer-bulletin-photo-v229');img.src=photo;img.alt='Obrázok k oznamu';img.loading='lazy';
      img.addEventListener('click',()=>showImage(photo));img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showImage(photo)}});
      img.setAttribute('role','button');img.tabIndex=0;img.setAttribute('aria-label','Zväčšiť fotografiu oznamu');
      img.onerror=()=>{img.hidden=true};
      articleModal.scroll.append(img);
    }

    if(row.cta_enabled&&(row.cta_title||row.cta_body||safeLink(row.cta_url))){
      const cta=el('section','customer-bulletin-cta-v229');
      cta.append(el('span','heart','♥'));
      const body=el('div','content');
      if(row.cta_title)body.append(el('strong','',row.cta_title));
      if(row.cta_body)body.append(el('p','',row.cta_body));
      const href=safeLink(row.cta_url);
      if(href){const a=el('a','',row.cta_button_label||'Zistiť viac');a.href=href;a.target='_blank';a.rel='noopener noreferrer';body.append(a)}
      cta.append(body);articleModal.scroll.append(cta);
    }
    articleModal.scroll.scrollTop=0;
    articleModal.overlay.classList.remove('hidden');syncScrollLock();
    void markRead(row);
  }
  function openHistory(refreshData=true){
    if(!loggedIn())return;
    ensureModals();historyReturn=false;
    archiveModal.overlay.classList.remove('hidden');drawHistory();syncScrollLock();
    if(refreshData)void refresh(false);
  }
  async function refresh(force=false){
    if(!loggedIn()){
      rowsState.items=[];rowsState.read.clear();rowsState.at=0;rowsState.session=null;drawBoard();drawHistory();return;
    }
    const token=state.session.access_token;
    if(rowsState.session!==token){rowsState.at=0;rowsState.session=token}
    if(rowsState.loading)return rowsState.loading;
    if(!force&&rowsState.at&&Date.now()-rowsState.at<60000){drawBoard();drawHistory();return}
    rowsState.loading=(async()=>{
      const headers={apikey:SUPABASE_KEY,Authorization:'Bearer '+token};
      const [pub,read]=await Promise.all([
        fetch(SUPABASE_URL+'/rest/v1/portal_announcements?select='+encodeURIComponent(select)+'&order=created_at.desc&limit=100',{headers,cache:'no-store'}),
        fetch(SUPABASE_URL+'/rest/v1/portal_announcement_dismissals?select=announcement_id',{headers,cache:'no-store'})
      ]);
      if(!pub.ok)throw Error('Oznamy sa nedajú načítať ('+pub.status+').');
      const json=await pub.json();
      if(state.session?.access_token!==token)return;
      rowsState.items=(Array.isArray(json)?json:[]).filter(r=>r.active!==false&&validDate(r.valid_from)&&validDate(r.valid_until));
      if(read.ok){
        const receipts=await read.json();
        if(state.session?.access_token===token)rowsState.read=new Set((Array.isArray(receipts)?receipts:[]).map(x=>Number(x.announcement_id)));
      }
      rowsState.at=Date.now();rowsState.error=false;drawBoard();drawHistory();
    })().catch(err=>{rowsState.error=true;console.warn('Customer bulletin load failed',err);drawBoard();drawHistory()})
       .finally(()=>{rowsState.loading=null});
    return rowsState.loading;
  }
  // Replace the historical auto-opening popup renderer: clicking a note is now required.
  customerRenderers.announcements=()=>refresh(false);
  addCustomerHook('afterSwitchTab',tab=>{if(tab==='booking'||tab==='menu')void refresh(false)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&loggedIn())void refresh(false)});
  window.addEventListener('pageshow',event=>{if(event.persisted&&loggedIn())void refresh(false)});
  function init(){
    $('menuBulletinV229')?.addEventListener('click',()=>openHistory(true));
    drawBoard();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


