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
  let lastTouchEnd=0;
  document.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<280)e.preventDefault();lastTouchEnd=now},{passive:false,capture:true});
})();
const APP_BUILD='20260926-customer-layout-v113';
const CUSTOMER_PUBLIC_URL='https://app.chvostikovo.sk/';
const SUPABASE_URL='https://tlhcqwsluyqpywymjoxn.supabase.co';
const SUPABASE_KEY='sb_publishable_43vD4AvQwchu1V2MwDbniA_j2tLiLi_';
const API=SUPABASE_URL+'/functions/v1/customer-portal-api';
const PUSH_API=SUPABASE_URL+'/functions/v1/admin-push';
const VAPID='BCFhf2kRc1P8blGDHKugmyBhCOfa-x8qbYSMo_qeO-650GSxg3I6naMHVqFTs7UOrTXotemfg9LhNElm56Zhv6k';
const SESSION_KEY='chvostikovo_customer_session';
const PASSWORD_MIN_MESSAGE='Minimálne 8 znakov, malé a veľké písmeno a aspoň 1 číslica.';
const PASSWORD_STRONG_RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
let state={data:null,session:null,storage:localStorage,selectedDogId:null,activeTab:'booking',pushChecked:false,pushEnabled:false};
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
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),3300)}
function loading(on){const el=$('loading');if(!el)return;const inApp=!!on&&!$('appView')?.classList.contains('hidden');el.classList.toggle('in-app',inApp);el.classList.toggle('hidden',!on);if(!on)el.classList.remove('in-app')}
function box(type,msg){return `<div class="${type}-box">${esc(msg)}</div>`}
function authMessage(type,msg){$('authMessage').innerHTML=box(type,msg)}
function currentSession(){for(const s of [localStorage,sessionStorage]){try{const x=JSON.parse(s.getItem(SESSION_KEY)||'null');if(x?.access_token){state.storage=s;return x}}catch(_){}}return null}
function saveSession(s,remember=true){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);state.storage=remember?localStorage:sessionStorage;state.storage.setItem(SESSION_KEY,JSON.stringify(s));state.session=s}
function clearSession(){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);state.session=null;state.data=null;stopCustomerLive();['waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75','announcementModalV75','betaVersionModal'].forEach(id=>$(id)?.classList.add('hidden'));window.__customerOnboardingCompleteV75=false}
async function authFetch(path,opts={}){const r=await fetch(SUPABASE_URL+path,{...opts,headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',...(opts.headers||{})}});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok)throw new Error(data?.msg||data?.error_description||data?.message||'Požiadavka sa nepodarila.');return data}
let sessionRefreshInFlight=null;
async function refreshSession(){
  if(sessionRefreshInFlight)return sessionRefreshInFlight;
  if(!state.session?.refresh_token)throw new Error('Prihlásenie vypršalo.');
  const token=state.session.refresh_token,remember=state.storage===localStorage;
  const run=(async()=>{const s=await authFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:token})});saveSession(s,remember);startCustomerLive(true);return s})();
  sessionRefreshInFlight=run;
  try{return await run}finally{sessionRefreshInFlight=null}
}
async function apiCore(body=null,retry=true){if(!state.session)throw new Error('Najprv sa prihláste.');const token=state.session.access_token,opts={method:body?'POST':'GET',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'}};if(body)opts.body=JSON.stringify(body);const r=await fetch(API,opts);const txt=await r.text();let data={};try{data=txt?JSON.parse(txt):{}}catch(_){data={error:txt}}if(r.status===401&&retry){if(state.session.access_token===token)await refreshSession();return apiCore(body,false)}if(!r.ok||data.error)throw new Error(data.error||'Požiadavka sa nepodarila.');return data}
async function api(body=null,retry=true){const result=await apiCore(body,retry);runCustomerHooks('afterApi',body,result);return result}
function showAuth(mode='login'){document.documentElement.classList.remove('customer-awaiting-dog-v107');$('appView').classList.add('hidden');$('authView').classList.remove('hidden');for(const id of ['loginForm','signupForm','forgotForm','newPasswordForm'])$(id).classList.add('hidden');$('showLogin').classList.toggle('active',mode==='login');$('showSignup').classList.toggle('active',mode==='signup');$(mode==='signup'?'signupForm':mode==='forgot'?'forgotForm':mode==='newPassword'?'newPasswordForm':'loginForm').classList.remove('hidden')}
function showApp(){$('authView').classList.add('hidden');$('appView').classList.remove('hidden')}
function pluralDogs(n){return n===1?'1 prihlásený psík':n+' prihlásených psíkov'}
function taxiLabel(mode){if(mode==='pickup')return'🚕 vyzdvihnutie/odvoz';if(mode==='pickup_dropoff')return'🚕 vyzdvihnutie aj dovoz';return''}
function selectedDog(){const dogs=state.data?.dogs||[];return dogs.find(d=>Number(d.id)===Number(state.selectedDogId))||dogs[0]||null}
function dogName(id){return (state.data?.dogs||[]).find(d=>Number(d.id)===Number(id))?.name||'Psík'}

async function preloadDogVisualV56(data=state.data){
  const dogs=data?.dogs||[];
  const dog=dogs.find(d=>Number(d.id)===Number(state.selectedDogId))||dogs[0]||null;
  const url=dog?.photo_url;
  if(!url)return;
  try{
    const img=new Image();
    img.src=url;
    const ready=typeof img.decode==='function'?img.decode():new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
    await Promise.race([ready,new Promise(resolve=>setTimeout(resolve,700))]);
  }catch(_){}
}
let bootstrapInFlight=null,lastResumeRefresh=0;
function bootstrapCore(showSpinner=true){
  if(bootstrapInFlight)return bootstrapInFlight;
  if(showSpinner)loading(true);
  const run=(async()=>{try{
    const d=await api();state.data=d;
    const hasAssignedDog=!!d.dogs?.length;
    document.documentElement.classList.toggle('customer-awaiting-dog-v107',!hasAssignedDog);
    if(!state.selectedDogId&&hasAssignedDog)state.selectedDogId=Number(d.dogs[0].id);
    await preloadDogVisualV56(d);showApp();renderAll();registerSW();startCustomerLive();
    const secondary=[loadAnnouncements()];if(typeof ensurePushState==='function')secondary.push(ensurePushState());
    Promise.allSettled(secondary).then(()=>{if(state.data&&typeof applyPushToggle==='function')applyPushToggle()});
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
    }else toast(message||'Aplikáciu sa nepodarilo načítať.');
  }})();
  bootstrapInFlight=run.finally(()=>{if(showSpinner)loading(false);bootstrapInFlight=null});
  return bootstrapInFlight;
}
async function bootstrap(showSpinner=true){const result=await bootstrapCore(showSpinner);runCustomerHooks('afterBootstrap',result);return result}
function renderUpcoming(){return typeof customerRenderers.upcoming==='function'?customerRenderers.upcoming():undefined}
function renderDays(){return typeof customerRenderers.days==='function'?customerRenderers.days():undefined}
function renderAll(){renderWeekHeader();renderNotifications();renderPassSummary();renderUpcoming();renderDays();renderMessages();renderDogSelector();renderDog();renderProfile();renderStaff();updateUnread()}

/* consolidated stability: unchanged resume data does not touch the DOM */
function customerDataFingerprintV18(data){
  try{
    return JSON.stringify(data??null,(key,value)=>{
      if(key==='photo_url'||key==='signed_url'||key==='signedUrl')return undefined;
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
    const previousData=state.data;
    const previousFingerprint=customerDataFingerprintV18(previousData);
    const previousDogs=new Map((previousData?.dogs||[]).map(d=>[Number(d.id),d]));
    const next=await api();

    for(const dog of (next.dogs||[])){
      const previous=previousDogs.get(Number(dog.id));
      const samePhoto=previous&&String(previous.photo_path||'')===String(dog.photo_path||'')&&String(previous.photo_updated_at||'')===String(dog.photo_updated_at||'');
      if(samePhoto&&previous?.photo_url)dog.photo_url=previous.photo_url;
      else if(!dog.photo_url&&previous?.photo_url)dog.photo_url=previous.photo_url;
    }

    const nextFingerprint=customerDataFingerprintV18(next);
    state.data=next;
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
        renderMessages();
      }
      if(all||scopes.has('messages')){
        renderMessages();
        updateUnread();
      }
      if(all||scopes.has('passes'))renderPassSummary();
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
  const url=SUPABASE_URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SUPABASE_KEY)+'&vsn=1.0.0';
  let socket;try{socket=new WebSocket(url)}catch(error){console.warn('Realtime spojenie sa nepodarilo otvoriť',error);scheduleCustomerReconnect();return}customerLiveSocket=socket;
  socket.onopen=()=>{if(socket!==customerLiveSocket)return;customerLiveAttempt=0;const changes=['customer_booking_requests','customer_pass_requests','portal_notifications','portal_announcements','portal_day_settings','portal_live_events','customer_dog_submissions','customer_owner_links','dogs','vaccinations'].map(table=>({event:'*',schema:'public',table}));socket.send(JSON.stringify({topic:'realtime:customer-portal',event:'phx_join',payload:{config:{broadcast:{ack:false,self:false},presence:{enabled:false},postgres_changes:changes,private:false},access_token:state.session.access_token},ref:'1',join_ref:'1'}));customerLiveHeartbeat=setInterval(()=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(Date.now()),join_ref:null}))},20000);scheduleWaitingDogFallbackV101()};
  socket.onmessage=event=>{try{const message=JSON.parse(event.data);if(message.event==='postgres_changes')queueCustomerSync(customerScopeForMessage(message))}catch(_){}};
  socket.onerror=()=>{};socket.onclose=()=>{if(socket!==customerLiveSocket)return;customerLiveSocket=null;clearInterval(customerLiveHeartbeat);customerLiveHeartbeat=0;scheduleCustomerReconnect()};
}
function renderWeekHeader(){const days=state.data?.availability?.days||[];const el=$('weekTitle');if(!el)return;if(!days.length){el.textContent='Nasledujúce dni';return}const a=String(days[0].date||''),b=String(days[days.length-1].date||'');const pa=a.split('-').map(Number),pb=b.split('-').map(Number);if(pa.length<3||pb.length<3){el.textContent='Nasledujúce dni';return}el.textContent=pa[0]===pb[0]?`${pa[2]}. ${pa[1]}. – ${pb[2]}. ${pb[1]}. ${pb[0]}`:`${pa[2]}. ${pa[1]}. ${pa[0]} – ${pb[2]}. ${pb[1]}. ${pb[0]}`}
function careNotificationIsCurrent(n,today=bratislavaToday()){if(n.visible_from&&n.visible_from>today)return false;if(n.visible_until&&n.visible_until<today)return false;if(n.notification_type==='vaccination_expiry'){const vaccination=(state.data?.vaccinations||[]).find(v=>Number(v.id)===Number(n.entity_id));return !!vaccination?.valid_until&&vaccination.valid_until>=today&&n.event_key===`vaccination:${vaccination.dog_id}:${vaccination.vaccination_type}:${vaccination.valid_until}`}if(n.notification_type==='dog_birthday'){const dog=(state.data?.dogs||[]).find(d=>Number(d.id)===Number(n.entity_id));return !!dog?.birth_date&&String(dog.birth_date).slice(5)===today.slice(5)}return true}
const customerClosedNotificationIdsV59=new Set();
function renderNotifications(){
  if(window.__customerOnboardingCompleteV75!==true){$('notificationPopup')?.classList.add('hidden');return}
  const rows=(state.data?.notifications||[]).filter(n=>!n.read_at&&!customerClosedNotificationIdsV59.has(Number(n.id))&&n.notification_type!=='pass_interest_registered'&&n.notification_type!=='dog_approved'&&careNotificationIsCurrent(n)).slice(0,5);
  $('notificationList').innerHTML='';
  let modal=$('notificationPopup');
  if(!rows.length){modal?.classList.add('hidden');return}
  if(!modal){
    document.body.insertAdjacentHTML('beforeend','<div id="notificationPopup" class="notification-popup hidden" role="dialog" aria-modal="true" aria-labelledby="notificationPopupTitle"><div class="notification-popup-card"><button id="notificationPopupClose" class="notification-popup-close" type="button" aria-label="Zavrieť">×</button><div class="notification-popup-kicker">Chvostíkovo</div><h2 id="notificationPopupTitle">Upozornenia</h2><div id="notificationPopupList" class="notification-popup-list"></div></div></div>');
    modal=$('notificationPopup');
  }
  const visibleIds=rows.map(n=>Number(n.id)).filter(Boolean);
  const list=$('notificationPopupList');
  list.innerHTML=rows.map(n=>`<div class="notification-popup-item"><strong>${esc(n.title||'Upozornenie')}</strong><div>${esc(n.body||'')}</div></div>`).join('');
  const close=async()=>{
    visibleIds.forEach(id=>customerClosedNotificationIdsV59.add(id));
    modal.classList.add('hidden');
    const stamp=new Date().toISOString();
    (state.data?.notifications||[]).forEach(n=>{if(visibleIds.includes(Number(n.id)))n.read_at=stamp});
    try{await api({action:'mark_notifications_read'})}catch(_){}
  };
  $('notificationPopupClose').onclick=close;
  modal.classList.remove('hidden');
}
function activePassFor(dogId){const today=new Date().toISOString().slice(0,10);return (state.data?.passes||[]).find(p=>Number(p.dog_id)===Number(dogId)&&p.status==='active'&&Number(p.used_entries)<Number(p.total_entries)&&(!p.valid_until||p.valid_until>=today))||(state.data?.passes||[]).find(p=>Number(p.dog_id)===Number(dogId)&&p.status==='queued')||null}
function renderPassSummaryCore(){
  const d=selectedDog(),p=d?activePassFor(d.id):null;
  if(p){
    $('passSummary').innerHTML=`<span>Permanentka</span><strong>${Number(p.used_entries)||0}/${Number(p.total_entries)||0}</strong>${p.valid_until?`<small>Platí do ${skDate(p.valid_until)}</small>`:''}`;
    return;
  }
  if(d?.default_entry_type==='free'){
    $('passSummary').innerHTML='<span>Vstup</span><strong class="free-entry-label-v96">Bezplatne</strong>';
    return;
  }
  $('passSummary').innerHTML='<span>Vstup</span><strong class="single-entry-label-v75">Jednorazový</strong>';
}
function renderPassSummary(){const out=renderPassSummaryCore();runCustomerHooks('afterRenderPassSummary',out);return out}
function futureItems(){const today=new Date().toISOString().slice(0,10);const requests=(state.data?.requests||[]).filter(r=>r.reservation_date>=today&&['pending','approved'].includes(r.status));const covered=new Set(requests.map(r=>Number(r.reservation_id)).filter(Boolean));const legacy=(state.data?.reservations||[]).filter(r=>r.reservation_date>=today&&!covered.has(Number(r.id))).map(r=>({...r,status:'approved',_legacy:true,reservation_id:r.id}));return [...requests,...legacy].sort((a,b)=>String(a.reservation_date).localeCompare(String(b.reservation_date)))}
async function cancelBooking(btn){if(!confirm('Naozaj chcete zrušiť túto rezerváciu?'))return;try{loading(true);const requestId=Number(btn.dataset.request)||0,reservationId=Number(btn.dataset.reservation)||0;await api({action:'cancel_booking',request_id:requestId,reservation_id:reservationId,reason:null});const request=(state.data?.requests||[]).find(r=>Number(r.id)===requestId),reservation=(state.data?.reservations||[]).find(r=>Number(r.id)===reservationId);if(request)request.status='cancelled';if(reservation)reservation.status='cancelled';renderUpcoming();renderDays();renderMessages();toast('Rezervácia bola zrušená.');queueCustomerSync('bookings',80)}catch(e){toast(e.message)}finally{loading(false)}}
function bookingFor(dogId,date){return (state.data?.requests||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.reservation_date===date&&['pending','approved'].includes(r.status))||(state.data?.reservations||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.reservation_date===date)}
function applyLocalBooking(result,fallback){const row=result?.data||result?.booking||result?.request||fallback;if(!row)return;const rows=state.data?.requests||(state.data.requests=[]),index=rows.findIndex(r=>Number(r.id)===Number(row.id));if(index>=0)rows[index]={...rows[index],...row};else rows.push({...fallback,...row});renderUpcoming();renderDays();renderMessages()}
async function loadAnnouncements(){return customerRenderers.announcements?customerRenderers.announcements():undefined}
function renderMessagesCore(){const rows=state.data?.messages||[];$('messageThread').innerHTML=rows.length?rows.map(m=>`<div class="message-bubble ${m.sender_role==='customer'?'mine':''}"><p>${esc(m.body)}</p><small>${skTime(m.created_at)}</small></div>`).join(''):'<div class="message-empty">Zatiaľ tu nemáte žiadne správy.</div>';setTimeout(()=>{$('messageThread').scrollTop=$('messageThread').scrollHeight},0);const opts=futureItems();$('messageBooking').innerHTML='<option value="">Bez konkrétnej rezervácie</option>'+opts.map(r=>`<option value="${r.id||''}">${esc(dogName(r.dog_id))} · ${skDate(r.reservation_date)}</option>`).join('')}
function renderMessages(){const out=renderMessagesCore();runCustomerHooks('afterRenderMessages',out);return out}
function updateUnreadCore(){const unread=(state.data?.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);$('messageUnread').classList.toggle('hidden',!unread);$('menuMessageUnread')?.classList.toggle('hidden',!unread)}
function updateUnread(){const out=updateUnreadCore();runCustomerHooks('afterUpdateUnread',out);return out}
function renderDogSelector(){const dogs=state.data?.dogs||[];$('dogSelectorWrap').classList.toggle('hidden',dogs.length<=1);const options=dogs.map(d=>`<option value="${d.id}" ${Number(d.id)===Number(state.selectedDogId)?'selected':''}>${esc(d.name)}</option>`).join('');$('dogSelector').innerHTML=options;const booking=$('bookingDogSelector');if(booking){booking.classList.toggle('hidden',dogs.length<=1);booking.innerHTML=options}}
function totalVisits(dog){const visits=(state.data?.visits||[]).filter(v=>Number(v.dog_id)===Number(dog.id)).length;const monthly=(state.data?.monthly_totals||[]).filter(m=>Number(m.dog_id)===Number(dog.id)).reduce((s,m)=>s+Number(m.visits||0),0);return Math.max(Number(dog.legacy_total_visits)||0,visits,monthly)}
function ensureDogFormInModalV51(){
  const modal=$('dogDetailsModal'),form=$('dogForm'),card=modal?.querySelector('.dog-details-card');
  if(form&&card&&form.parentElement!==card)card.appendChild(form);
}
let dogDetailsModeV96='details',dogDetailsMandatoryV96=false,dogDetailsSnapshotV96='';
function customerVaccinationsCompleteV96(dog){
  if(!dog)return false;
  const required=['rabies','infectious','kennel_cough'];
  const rows=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(dog.id));
  const proofs=(state.data?.vaccination_proofs||[]).filter(p=>Number(p.dog_id)===Number(dog.id));
  const today=typeof bratislavaClockV95==='function'?bratislavaClockV95().date:new Date().toISOString().slice(0,10);
  return proofs.length>0&&required.every(type=>rows.some(v=>v.vaccination_type===type&&v.valid_until&&String(v.valid_until)>=today));
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
  for(const [inputId,statusId] of [['rabiesUntil','rabiesStatusV96'],['infectiousUntil','infectiousStatusV96'],['kennelUntil','kennelStatusV96']]){
    const box=$(statusId);if(!box)continue;
    const value=vaccinationValidityV96($(inputId)?.value||'');
    box.className='vaccine-validity-v96 '+value.kind;
    box.textContent=value.text;
  }
}
function applyDogDetailsModeV96(mode='details',mandatory=false){
  dogDetailsModeV96=mode==='vaccinations'?'vaccinations':'details';
  dogDetailsMandatoryV96=!!mandatory;
  $('dogBasicFieldsV96')?.classList.toggle('hidden',dogDetailsModeV96!=='details');
  $('dogVaccinationFieldsV96')?.classList.toggle('hidden',dogDetailsModeV96!=='vaccinations');
  if($('dogDetailsTitle'))$('dogDetailsTitle').textContent=dogDetailsModeV96==='vaccinations'?'Očkovania':'Údaje psíka';
  $('dogDetailsClose')?.classList.toggle('hidden',dogDetailsMandatoryV96);
  $('dogDetailsModal')?.setAttribute('data-mode',dogDetailsModeV96);
}
function openDogDetails(mode='details',mandatory=false){
  ensureDogFormInModalV51();const dog=selectedDog();if(!dog)return;
  if(mode!=='vaccinations')clearVaccinationProofStageV104();
  fillDogForm(dog);applyDogDetailsModeV96(mode,mandatory);updateVaccinationStatusesV96();bindVaccinationProofInputsV104();renderVaccinationProofsV104(dog.id);
  renderDetailsPhoto(dog);
  dogDetailsSnapshotV96=dogFormSnapshotV96();
  $('dogDetailsModal').classList.remove('hidden');document.documentElement.classList.add('dog-details-open');
}
function closeDogDetails(force=false){
  if(!force&&dogDetailsMandatoryV96)return false;
  if(!force&&dogFormSnapshotV96()!==dogDetailsSnapshotV96&&!confirm('Máte neuložené zmeny. Zavrieť bez uloženia?'))return false;
  $('dogDetailsModal').classList.add('hidden');document.documentElement.classList.remove('dog-details-open');
  dogDetailsMandatoryV96=false;dogDetailsModeV96='details';return true;
}
function renderDogProfilePrompt(){for(const id of ['bookingNotice','dogStatus']){const root=$(id);if(root)root.innerHTML=''}}
function renderDetailsPhoto(dog=selectedDog()){
  const preview=$('dogDetailsPhotoPreview'),button=$('dogDetailsPhotoButton');
  if(!preview||!button)return;
  preview.innerHTML=dog?.photo_url?`<img src="${esc(dog.photo_url)}" alt="Fotka psíka">`:'🐾';
  preview.className='dog-details-photo-preview '+dogSexClassV100(dog);
  $('dogDetailsPhotoControl').className='dog-details-photo-control '+dogSexClassV100(dog);
  button.setAttribute('aria-label',dog?.photo_url?'Upraviť, zmeniť alebo zmazať fotku':'Pridať fotku');
  button.title=button.getAttribute('aria-label');
}
function dogSexClassV100(dog){return dog?.sex==='male'?'dog-male-v100':dog?.sex==='female'?'dog-female-v100':'dog-neutral-v100'}
function renderDogHeaderV56(dog){
  const root=$('dogProfilePhoto');if(!root)return;
  const sexClass=dogSexClassV100(dog);
  const key=String(dog.id||'')+'|'+String(dog.photo_path||'')+'|'+String(dog.photo_updated_at||'')+'|'+String(dog.name||'')+'|'+String(dog.sex||'');
  if(!root.querySelector('.dog-hub-v99')||root.dataset.dogVisualKey!==key){
    root.innerHTML=`<div class="card dog-photo-feature-v99 ${sexClass}"><div class="dog-photo-paws-v99" aria-hidden="true"></div><div class="dog-photo-feature-inner-v99"><div class="profile-photo-wrap"><span class="dog-avatar profile">${dog.photo_url?`<img src="${esc(dog.photo_url)}" alt="${esc(dog.name)}">`:'🐾'}</span><button id="dogPhotoActionBtnV89" class="photo-pencil" type="button" title="${dog.photo_url?'Upraviť fotku':'Pridať fotku'}" aria-label="${dog.photo_url?'Upraviť fotku':'Pridať fotku'}">✎</button></div><h2 class="dog-photo-name">${esc(dog.name)}</h2></div></div>
    <div class="card dog-hub-v99"><div class="dog-hub-grid-v99">
      <button id="dogDataOpenV96" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">📝</span><strong>Údaje psíka</strong></button>
      <button id="dogVaccinationsOpenV96" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">💉</span><strong>Očkovania</strong></button>
      <button id="schoolRulesCardV55" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">📄</span><strong>Pravidlá škôlky</strong></button>
      <button id="dogVisitsOpenV99" class="dog-hub-tile-v99 dog-hub-visits-v100" type="button"><span class="dog-hub-emoji-v99">🐾</span><strong>Návštevy psíka v škôlke</strong></button>
      <button class="dog-hub-tile-v99 dog-hub-gradebook-v99" type="button" disabled><span class="dog-hub-emoji-v99">📚</span><span><strong>Žiacka knižka</strong><small>Pripravujeme</small></span></button>
      <button id="dogMenuOpenV99" class="dog-hub-tile-v99" type="button"><span class="dog-hub-emoji-v99">⚙️</span><strong>Nastavenia</strong></button>
    </div></div>`;
    root.dataset.dogVisualKey=key;
    $('dogPhotoActionBtnV89')?.addEventListener('click',()=>{dog.photo_url?showPhotoActionsV89(dog):selectNewDogPhotoV89()});
    $('dogDataOpenV96')?.addEventListener('click',()=>openDogDetails('details',false));
    $('dogVaccinationsOpenV96')?.addEventListener('click',()=>openDogDetails('vaccinations',false));
    $('dogVisitsOpenV99')?.addEventListener('click',()=>window.openDogVisitsV99?.());
    $('dogMenuOpenV99')?.addEventListener('click',()=>window.openCustomerSettingsV102?.());
  }
}
function renderDogCore(){ensureDogFormInModalV51();const dog=selectedDog();if(!dog){$('dogProfilePhoto').innerHTML='';$('dogProfilePhoto').removeAttribute('data-dog-visual-key');$('dogProfileSettings').innerHTML='';$('dogStats').innerHTML=box('info','Psíka najprv priradí Chvostíkovo k vášmu účtu.');$('dogForm').classList.add('hidden');renderDogProfilePrompt();return}$('dogForm').classList.remove('hidden');state.selectedDogId=Number(dog.id);renderDogHeaderV56(dog);renderDetailsPhoto(dog);const cachedPush=state.pushChecked?!!state.pushEnabled:(typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('chvostikovo_push_enabled')==='1');$('dogProfileSettings').innerHTML=`<div class="card profile-settings"><div class="privacy-row"><div><strong>Upozornenia</strong><small>Rezervácie, správy a oznamy z Chvostíkova.</small></div><button id="pushToggle" class="push-switch syncing ${cachedPush?'active':''}" type="button" aria-label="Upozornenia"><span></span></button></div><div class="privacy-row"><div><strong>Zobraziť meno psa a fotku ostatným</strong><small>Súhlas môžete kedykoľvek vypnúť.</small></div><button id="privacyToggle" class="push-switch ${dog.share_name_photo?'active':''}" type="button" aria-label="Zdieľanie"><span></span></button></div></div>`;$('pushToggle').addEventListener('click',togglePush);$('privacyToggle').addEventListener('click',togglePrivacy);applyPushToggle();$('dogStats').innerHTML='';fillDogForm(dog);renderDogProfilePrompt()}
function renderDog(){const out=renderDogCore();runCustomerHooks('afterRenderDog',out);return out}
function combinedDogInfoV81(d){const parts=[d?.allergies,d?.temperament].map(v=>String(v||'').trim()).filter(Boolean),out=[];for(const part of parts){if(out.some(existing=>existing===part||existing.includes(part)))continue;out.push(part)}return out.join('\n\n')}
function syncDogAgeField(){const birth=$('dogBirthDate').value,age=$('dogAge'),automatic=dogAgeText(birth);age.value=automatic||'';age.readOnly=true;age.setAttribute('aria-readonly','true');age.placeholder=automatic?'Vypočítané z dátumu narodenia':'Vyplní sa po zadaní dátumu narodenia';age.title='Vek sa automaticky počíta z dátumu narodenia.'}
function fillDogForm(d){
  $('dogId').value=d.id;$('dogName').value=d.name||'';$('dogBirthDate').value=d.birth_date||'';syncDogAgeField();$('dogBreed').value=d.breed||'';$('dogSex').value=d.sex||'';$('dogNeutered').value=d.neutered===true?'true':d.neutered===false?'false':'';
  if($('dogAllergies'))$('dogAllergies').value=combinedDogInfoV81(d);
  const vs=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(d.id));
  for(const [type,inputId] of [['rabies','rabiesUntil'],['infectious','infectiousUntil'],['kennel_cough','kennelUntil']]){
    const v=vs.find(x=>x.vaccination_type===type)||{};$(inputId).value=v.valid_until||'';
  }
  updateVaccinationStatusesV96();
  renderVaccinationProofsV104(d.id);
}
let vaccinationProofFilesV104=[];
let vaccinationProofPreviewUrlsV104=[];

function vaccinationProofsForDogV104(dogId){
  return (state.data?.vaccination_proofs||[]).filter(p=>Number(p.dog_id)===Number(dogId));
}
function clearVaccinationProofStageV104(){
  vaccinationProofPreviewUrlsV104.forEach(url=>{try{URL.revokeObjectURL(url)}catch(_){}});
  vaccinationProofPreviewUrlsV104=[];vaccinationProofFilesV104=[];
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
  if(!url)return;const modal=ensureVaccinationProofViewerV104();$('vaccProofViewerImgV104').src=url;modal.classList.remove('hidden');
}
function renderVaccinationProofsV104(dogId=Number(selectedDog()?.id||0)){
  const current=$('vaccProofCurrentV104'),staged=$('vaccProofStagedV104'),count=$('vaccProofCountV104'),upload=$('vaccProofUploadV104'),msg=$('vaccProofMessageV104');
  if(!current||!staged||!count||!upload)return;
  const proofs=vaccinationProofsForDogV104(dogId);
  count.textContent=String(proofs.length);
  current.innerHTML=proofs.length?proofs.map((p,i)=>'<button class="vacc-proof-thumb-v104" type="button" data-proof-index="'+i+'"><img src="'+esc(p.image_url||'')+'" alt="Očkovací preukaz '+(i+1)+'"><span>Foto '+(i+1)+'</span></button>').join(''):'<div class="vacc-proof-empty-v104">Zatiaľ nie je nahratá žiadna fotografia.</div>';
  current.querySelectorAll('[data-proof-index]').forEach(button=>button.addEventListener('click',()=>openVaccinationProofViewerV104(proofs[Number(button.dataset.proofIndex)]?.image_url)));
  vaccinationProofPreviewUrlsV104.forEach(url=>{try{URL.revokeObjectURL(url)}catch(_){}});
  vaccinationProofPreviewUrlsV104=vaccinationProofFilesV104.map(file=>URL.createObjectURL(file));
  staged.classList.toggle('hidden',!vaccinationProofFilesV104.length);
  staged.innerHTML=vaccinationProofFilesV104.length?'<div class="vacc-proof-stage-title-v104">Vybrané nové fotografie</div><div class="vacc-proof-grid-v104">'+vaccinationProofPreviewUrlsV104.map((url,i)=>'<div class="vacc-proof-thumb-v104 staged"><img src="'+url+'" alt="Vybraná fotografia '+(i+1)+'"><button type="button" data-remove-proof="'+i+'" aria-label="Odstrániť">×</button></div>').join('')+'</div>':'';
  staged.querySelectorAll('[data-remove-proof]').forEach(button=>button.addEventListener('click',()=>{vaccinationProofFilesV104.splice(Number(button.dataset.removeProof),1);renderVaccinationProofsV104(dogId)}));
  upload.classList.toggle('hidden',!vaccinationProofFilesV104.length);
  upload.textContent=proofs.length?'Nahradiť fotografiami ('+vaccinationProofFilesV104.length+')':'Nahrať fotografie ('+vaccinationProofFilesV104.length+')';
  if(msg&&!vaccinationProofFilesV104.length)msg.textContent=proofs.length?'Fotografie sú bezpečne uložené. Pri ďalšom očkovaní ich môžete nahradiť novými.':'Na dokončenie očkovaní nahrajte aspoň jednu fotografiu.';
}
function addVaccinationProofFilesV104(files){
  const incoming=[...(files||[])].filter(file=>file&&String(file.type||'').startsWith('image/'));
  for(const file of incoming){
    if(vaccinationProofFilesV104.length>=3)break;
    vaccinationProofFilesV104.push(file);
  }
  if(incoming.length&&vaccinationProofFilesV104.length>=3&&incoming.length>3)toast('Naraz môžete nahrať najviac 3 fotografie.');
  renderVaccinationProofsV104();
}
function bindVaccinationProofInputsV104(){
  const library=$('vaccProofLibraryV104'),camera=$('vaccProofCameraV104'),upload=$('vaccProofUploadV104');
  if(library&&!library.dataset.boundV104){library.dataset.boundV104='1';library.addEventListener('change',()=>{addVaccinationProofFilesV104(library.files);library.value=''})}
  if(camera&&!camera.dataset.boundV104){camera.dataset.boundV104='1';camera.addEventListener('change',()=>{addVaccinationProofFilesV104(camera.files);camera.value=''})}
  if(upload&&!upload.dataset.boundV104){upload.dataset.boundV104='1';upload.addEventListener('click',()=>uploadVaccinationProofsV104(false))}
}
async function vaccinationProofFileToJpegV104(file){
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});
    const maxSide=1500,ratio=Math.min(1,maxSide/Math.max(img.naturalWidth||1,img.naturalHeight||1));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
    let quality=.82,data=canvas.toDataURL('image/jpeg',quality);
    while(data.length>1050000&&quality>.52){quality-=.08;data=canvas.toDataURL('image/jpeg',quality)}
    if(data.length>1700000)throw new Error('Fotografia je príliš veľká. Skúste ju odfotiť znova.');
    return data;
  }finally{URL.revokeObjectURL(url)}
}
async function uploadVaccinationProofsV104(silent=false){
  const dog=selectedDog();if(!dog)throw new Error('Psík sa nenašiel.');
  if(!vaccinationProofFilesV104.length)return vaccinationProofsForDogV104(dog.id);
  const button=$('vaccProofUploadV104'),msg=$('vaccProofMessageV104');
  if(button)button.disabled=true;if(msg)msg.textContent='Pripravujem fotografie…';
  try{
    const images=[];for(const file of vaccinationProofFilesV104)images.push(await vaccinationProofFileToJpegV104(file));
    if(msg)msg.textContent='Nahrávam fotografie…';
    const result=await api({action:'upload_vaccination_proofs',dog_id:Number(dog.id),images});
    const proofs=result?.data?.proofs||[];
    state.data.vaccination_proofs=(state.data.vaccination_proofs||[]).filter(p=>Number(p.dog_id)!==Number(dog.id));
    state.data.vaccination_proofs.push(...proofs);
    clearVaccinationProofStageV104();renderVaccinationProofsV104(dog.id);
    if(!silent)toast('Fotografie očkovacieho preukazu sú uložené.');
    return proofs;
  }catch(error){if(msg)msg.textContent=error.message||'Fotografie sa nepodarilo nahrať.';throw error}
  finally{if(button)button.disabled=false}
}

async function saveDog(e){
  e.preventDefault();
  const savedMode=dogDetailsModeV96,mandatoryFlow=dogDetailsMandatoryV96,neut=$('dogNeutered').value,birthDate=$('dogBirthDate').value,sex=$('dogSex').value,ageText=dogAgeText(birthDate)||'',dogId=Number($('dogId').value);
  const vaccinations=[
    {type:'rabies',valid_until:$('rabiesUntil').value},
    {type:'infectious',valid_until:$('infectiousUntil').value},
    {type:'kennel_cough',valid_until:$('kennelUntil').value}
  ];
  if(savedMode==='vaccinations'){
    const missingVacc=vaccinations.find(v=>!v.valid_until);
    if(missingVacc){
      toast('Doplňte platnosť všetkých troch očkovaní.');
      const id=missingVacc.type==='rabies'?'rabiesUntil':missingVacc.type==='infectious'?'infectiousUntil':'kennelUntil';$(id)?.focus();return;
    }
    const today=typeof bratislavaClockV95==='function'?bratislavaClockV95().date:new Date().toISOString().slice(0,10);
    const expiredVacc=vaccinations.find(v=>String(v.valid_until||'')<today);
    if(expiredVacc){
      toast('Očkovanie je po platnosti. Aktualizujte dátum „Platí do“.');
      const id=expiredVacc.type==='rabies'?'rabiesUntil':expiredVacc.type==='infectious'?'infectiousUntil':'kennelUntil';$(id)?.focus();return;
    }
  }
  const body={action:'save_dog',dog_id:dogId,dog_name:$('dogName').value,age_text:ageText,birth_date:birthDate||null,breed:$('dogBreed').value,sex,neutered:neut===''?null:neut==='true',allergies:$('dogAllergies')?.value||'',temperament:''};
  if(savedMode==='vaccinations'){body.vaccinations=vaccinations;body.require_vaccination_proof=true}
  try{
    loading(true);
    if(savedMode==='vaccinations'&&vaccinationProofFilesV104.length)await uploadVaccinationProofsV104(true);
    if(savedMode==='vaccinations'&&!vaccinationProofsForDogV104(dogId).length){
      toast('Nahrajte aspoň jednu fotografiu očkovacieho preukazu.');return;
    }
    const result=await api(body);
    const dog=selectedDog();
    if(dog)Object.assign(dog,{name:body.dog_name,age_text:body.age_text,birth_date:body.birth_date||null,breed:body.breed||null,sex:body.sex||null,neutered:body.neutered,allergies:body.allergies||null,temperament:null});
    if(state.data&&savedMode==='vaccinations'){
      const other=(state.data.vaccinations||[]).filter(v=>Number(v.dog_id)!==dogId||!['rabies','infectious','kennel_cough'].includes(v.vaccination_type));
      state.data.vaccinations=[...other,...vaccinations.map(v=>({dog_id:dogId,vaccination_type:v.type,vaccinated_on:null,valid_until:v.valid_until}))];
      if(result?.data?.onboarding_complete){
        state.data.dog_onboarding=state.data.dog_onboarding||[];
        const row=state.data.dog_onboarding.find(x=>Number(x.dog_id)===dogId);
        if(row){row.details_prompt_answered_at=new Date().toISOString();row.details_prompt_skipped=false}
        else state.data.dog_onboarding.push({dog_id:dogId,details_prompt_answered_at:new Date().toISOString(),details_prompt_skipped:false});
      }
    }
    dogDetailsSnapshotV96=dogFormSnapshotV96();
    if(savedMode==='details'&&mandatoryFlow){
      applyDogDetailsModeV96('vaccinations',true);fillDogForm(dog);bindVaccinationProofInputsV104();dogDetailsSnapshotV96=dogFormSnapshotV96();toast('Údaje sú uložené. Teraz doplňte platnosť očkovaní a fotografie preukazu.');return;
    }
    closeDogDetails(true);renderDog();renderPassSummary();renderUpcoming();renderDays();
    toast(savedMode==='vaccinations'?'Očkovania sú uložené.':'Údaje psíka sú uložené.');
    queueCustomerSync('all',80);window.runCustomerOnboardingV75?.();
  }catch(e){toast(e.message)}finally{loading(false)}
}
function ensurePassInterestConfirmation(){
  if($('passInterestConfirmationV44'))return;
  document.body.insertAdjacentHTML('beforeend','<div id="passInterestConfirmationV44" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="passInterestConfirmationTitleV44"><div class="legal-card"><div class="legal-kicker">Chvostíkovo</div><h2 id="passInterestConfirmationTitleV44">Záujem sme zaregistrovali</h2><div class="legal-body"><p>Ďakujeme, záujem o novú permanentku sme zaregistrovali. Nákup novej permanentky dokončíme pri najbližšej návšteve v škôlke – platbou v hotovosti alebo kartou.</p></div><button id="passInterestConfirmationCloseV44" class="btn full" type="button">Ďakujem</button></div></div>');
  $('passInterestConfirmationCloseV44').onclick=()=>$('passInterestConfirmationV44').classList.add('hidden');
}
function showPassInterestConfirmation(){ensurePassInterestConfirmation();$('passInterestConfirmationV44').classList.remove('hidden')}
async function requestPass(totalEntries){
  const total=Number(totalEntries)||10;if(total!==10)return;
  try{
    loading(true);
    const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_request_pass',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_dog_id:Number(state.selectedDogId),p_total_entries:total})});
    const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}
    if(!r.ok)throw new Error(data?.message||data?.error||'Záujem sa nepodarilo odoslať.');
    const row=Array.isArray(data)?data[0]:data;
    if(row&&typeof row==='object'){state.data.pass_requests=state.data.pass_requests||[];if(!state.data.pass_requests.some(x=>Number(x.id)===Number(row.id)))state.data.pass_requests.unshift(row)}
    renderDog();showPassInterestConfirmation();
  }catch(e){toast(e.message)}finally{loading(false)}
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
  document.body.insertAdjacentHTML('beforeend',`<div id="photoCropModal" class="photo-modal hidden"><div class="photo-modal-card"><div class="photo-modal-head"><div><strong>Upraviť fotku</strong><small>Jedným prstom fotku posuňte, dvoma prstami ju priblížte alebo oddiaľte.</small></div><button id="photoCropClose" class="icon-btn" type="button">✕</button></div><div class="crop-shell"><canvas id="photoCropCanvas" width="640" height="640"></canvas></div><div class="photo-gesture-hint-v89">Posun: 1 prst · Priblíženie: 2 prsty</div><div class="photo-modal-actions"><button id="photoCropCancel" class="btn secondary" type="button">Zrušiť</button><button id="photoCropSave" class="btn" type="button">Použiť fotku</button></div></div></div>`);
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
  document.body.insertAdjacentHTML('beforeend',`<div id="photoActionsModalV89" class="photo-modal photo-actions-modal-v89 hidden"><div class="photo-actions-card-v89"><div class="photo-modal-head"><div><strong>Fotka psíka</strong><small>Vyberte, čo chcete s fotkou urobiť.</small></div><button id="photoActionsCloseV89" class="icon-btn" type="button">✕</button></div><div class="photo-actions-list-v89"><button id="photoEditCurrentV89" class="btn secondary" type="button">Upraviť aktuálnu fotku</button><button id="photoReplaceV89" class="btn secondary" type="button">Nahrať novú fotku</button><button id="photoDeleteV89" class="btn danger" type="button">Zmazať fotku</button></div></div></div>`);
  $('photoActionsCloseV89').onclick=closePhotoActionsV89;
  $('photoActionsModalV89').addEventListener('click',e=>{if(e.target===$('photoActionsModalV89'))closePhotoActionsV89()});
}
function closePhotoActionsV89(){$('photoActionsModalV89')?.classList.add('hidden')}
function selectNewDogPhotoV89(){closePhotoActionsV89();$('dogPhotoInput')?.click()}
function showPhotoActionsV89(dog){
  ensurePhotoActionsV89();
  $('photoActionsModalV89').dataset.dogId=String(dog.id);
  $('photoEditCurrentV89').onclick=()=>{closePhotoActionsV89();openExistingPhotoEditorV89(dog)};
  $('photoReplaceV89').onclick=selectNewDogPhotoV89;
  $('photoDeleteV89').onclick=()=>deleteCurrentDogPhotoV89(dog);
  $('photoActionsModalV89').classList.remove('hidden');
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
  if(!file)return;
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
    await api({action:'delete_dog_photo',dog_id:Number(dog.id)});
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
async function saveCroppedPhoto(){if(!state.photoEdit)return;try{loading(true);await api({action:'upload_dog_photo',dog_id:Number(state.selectedDogId),image_data:photoJpegData()});closePhotoEditor();toast('Fotka je uložená.');await bootstrap(false)}catch(e){toast(e.message)}finally{loading(false)}}
function urlBase64ToUint8Array(s){const p='='.repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function registerSW(){if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('/sw.js')}catch(e){console.warn(e)}}
async function pushSubscription(){if(!('serviceWorker'in navigator))return null;const reg=await navigator.serviceWorker.ready;return reg.pushManager.getSubscription()}
function applyPushToggle(){const b=$('pushToggle');if(!b)return;b.classList.toggle('active',!!state.pushEnabled);b.classList.remove('syncing');b.setAttribute('aria-checked',state.pushEnabled?'true':'false')}
async function syncPushSubscriptionV75(sub){
  const r=await fetch(PUSH_API,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({audience:'customer',action:'subscribe',subscription:sub.toJSON()})});
  if(!r.ok)throw new Error('Upozornenia sa nepodarilo synchronizovať.');
  if(state.data)state.data.push_subscription_active=true;
  return true;
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
function openCustomerChat(){$('supportChatBtnV52')?.click()}
async function sendMessage(e){e.preventDefault();const body=$('messageBody').value.trim();if(!body)return;try{const btn=e.submitter;btn.disabled=true;const result=await api({action:'send_message',message:body,booking_request_id:Number($('messageBooking').value)||null}),row=result?.data||result?.message||{id:-Date.now(),body,sender_role:'customer',created_at:new Date().toISOString()};(state.data.messages||(state.data.messages=[])).push(row);$('messageBody').value='';renderMessages();updateUnread();switchTab('messages');toast('Správa bola odoslaná.');queueCustomerSync('messages',80)}catch(e){toast(e.message)}finally{e.submitter&&(e.submitter.disabled=false)}}
function showEmailConfirmedV109(){
  sessionStorage.setItem('chvostikovo_install_guide_seen_v1','1');
  document.documentElement.classList.add('email-confirmed-v106');
  showAuth('login');
  document.querySelector('.auth-switch')?.classList.add('hidden');
  ['loginForm','signupForm','forgotForm','newPasswordForm'].forEach(id=>$(id)?.classList.add('hidden'));
  document.getElementById('installHelpLink')?.classList.add('hidden');
  authMessage('success','E-mail je potvrdený. Vráťte sa do nainštalovanej aplikácie Chvostíkovo a prihláste sa.');
}
function handleRecoveryHash(){
  const hash=new URLSearchParams(location.hash.replace(/^#/,'')),access=hash.get('access_token'),refresh=hash.get('refresh_token'),type=hash.get('type');
  if(access&&refresh){
    if(type==='signup'){
      history.replaceState(null,'',location.pathname);
      showEmailConfirmedV109();
      return true;
    }
    saveSession({access_token:access,refresh_token:refresh,expires_in:Number(hash.get('expires_in'))||3600,token_type:'bearer'},true);
    history.replaceState(null,'',location.pathname+location.search);
    if(type==='recovery'){showAuth('newPassword');return true}
  }
  return false
}
async function init(){registerSW();if(handleRecoveryHash()){loading(false);return}state.session=currentSession();if(state.session)await bootstrap();else{showAuth('login');loading(false)}}
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
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();try{loading(true);const s=await authFetch('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('loginEmail').value.trim(),password:$('loginPassword').value})});saveSession(s,$('rememberLogin').checked);localStorage.removeItem('chvostikovo_pending_login_email');await bootstrap(false)}catch(e){authMessage('error',e.message)}finally{loading(false)}});
$('signupForm').addEventListener('submit',async e=>{e.preventDefault();const password=$('signupPassword').value,passwordAgain=$('signupPasswordAgain')?.value||'',signupEmail=$('signupEmail').value.trim();if(!PASSWORD_STRONG_RE.test(password)){authMessage('error',PASSWORD_MIN_MESSAGE);$('signupPassword').focus();return}if(password!==passwordAgain){authMessage('error','Heslá sa nezhodujú.');$('signupPasswordAgain')?.focus();return}try{loading(true);localStorage.setItem('chvostikovo_pending_login_email',signupEmail);const data=await authFetch('/auth/v1/signup?redirect_to='+encodeURIComponent(CUSTOMER_PUBLIC_URL),{method:'POST',body:JSON.stringify({email:signupEmail,password,data:{full_name:$('signupName').value.trim(),phone:$('signupPhone').value.trim(),dog_name:$('signupDogName').value.trim(),privacy_notice_version:'privacy-v1',privacy_notice_acknowledged_at:new Date().toISOString()}})});if(data?.access_token){saveSession(data,true);localStorage.removeItem('chvostikovo_pending_login_email');await bootstrap(false)}else{showAuth('login');$('loginEmail').value=signupEmail;authMessage('success','Účet je vytvorený. Na e-mail sme poslali potvrdzovací odkaz. E-mail zatiaľ nie je potvrdený. Po potvrdení sa vráťte do nainštalovanej aplikácie Chvostíkovo a prihláste sa.')}}catch(e){authMessage('error',e.message)}finally{loading(false)}});
$('forgotForm').addEventListener('submit',async e=>{e.preventDefault();try{await authFetch('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/' ),{method:'POST',body:JSON.stringify({email:$('forgotEmail').value.trim()})});authMessage('success','Odkaz na obnovu hesla sme poslali na váš e-mail.')}catch(e){authMessage('error',e.message)}});
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
$('dogSelector').addEventListener('change',e=>{state.selectedDogId=Number(e.target.value);renderPassSummary();renderDog()});$('dogBirthDate').addEventListener('change',()=>syncDogAgeField());['rabiesUntil','infectiousUntil','kennelUntil'].forEach(id=>$(id)?.addEventListener('input',updateVaccinationStatusesV96));$('dogForm').addEventListener('submit',saveDog);$('dogDetailsClose').addEventListener('click',()=>closeDogDetails(false));$('dogDetailsModal').addEventListener('click',e=>{if(e.target===$('dogDetailsModal'))e.preventDefault()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('dogDetailsModal').classList.contains('hidden'))closeDogDetails(false)});$('profileForm').addEventListener('submit',saveProfile);$('accountToggle').addEventListener('click',()=>$('profileForm').classList.toggle('hidden'));$('messageForm').addEventListener('submit',sendMessage);
$('bookingDogSelector').addEventListener('change',e=>{state.selectedDogId=Number(e.target.value);renderDogSelector();renderPassSummary();renderDog();renderUpcoming();renderDays()});
$('dogDetailsPhotoButton').addEventListener('click',()=>{const dog=selectedDog();if(dog?.photo_url)showPhotoActionsV89(dog);else selectNewDogPhotoV89()});
$('dogPhotoInput').addEventListener('click',()=>{window.__customerPhotoPickerV88=true;setTimeout(()=>{if(!window.__customerPhotoDecodeV88)window.__customerPhotoPickerV88=false},15000)});
$('dogPhotoInput').addEventListener('change',openPhotoEditor);
$('bookingVaccinationStatus').addEventListener('click',()=>openDogDetails('vaccinations'));
$('bookingVisitCount').addEventListener('click',()=>window.openDogVisitsV99?.());
function openCustomerRules(){if(window.openCustomerRulesV55)window.openCustomerRulesV55();else $('schoolRulesCardV55')?.click()}
function closeCustomerSmallModal(id){$(id).classList.add('hidden');document.documentElement.classList.remove('customer-modal-open')}
function openCustomerGradebook(){$('customerGradebookModal').classList.remove('hidden');document.documentElement.classList.add('customer-modal-open')}
$('bookingRules').addEventListener('click',openCustomerRules);
$('menuRules').addEventListener('click',openCustomerRules);
$('bookingGradebook').addEventListener('click',openCustomerGradebook);
$('menuGradebook').addEventListener('click',openCustomerGradebook);
$('customerGradebookClose').addEventListener('click',()=>closeCustomerSmallModal('customerGradebookModal'));
$('customerGradebookModal').addEventListener('click',e=>{if(e.target===$('customerGradebookModal'))closeCustomerSmallModal('customerGradebookModal')});
$('menuDogDetails').addEventListener('click',()=>openDogDetails('details'));
$('menuVaccinations').addEventListener('click',()=>openDogDetails('vaccinations'));
$('menuMessage').addEventListener('click',openCustomerChat);
$('menuContact').addEventListener('click',()=>{const card=document.querySelector('.account-card');if(card)$('customerContactContent').appendChild(card);$('profileForm').classList.remove('hidden');$('customerContactModal').classList.remove('hidden');document.documentElement.classList.add('customer-modal-open')});
$('customerContactClose').addEventListener('click',()=>closeCustomerSmallModal('customerContactModal'));
$('customerContactModal').addEventListener('click',e=>{if(e.target===$('customerContactModal'))closeCustomerSmallModal('customerContactModal')});
function openMenuSettings(section){window.openCustomerSettingsV102?.(section)}
$('menuNotifications').addEventListener('click',()=>openMenuSettings('notifications'));
$('menuLegal').addEventListener('click',()=>openMenuSettings('legal'));
$('menuLogout').addEventListener('click',()=>$('logoutBtn').click());
$('menuBuildVersion').textContent='Verzia appky v.'+APP_BUILD;
window.addEventListener('pageshow',()=>setTimeout(repairCustomerScrollV60,0));
window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(repairCustomerScrollV60));
async function refreshOnResume(){
  const now=Date.now();
  if(window.__customerPhotoPickerV88===true||window.__customerPhotoDecodeV88===true)return;
  if(!state.session||document.visibilityState==='hidden'||now-lastResumeRefresh<5000)return;
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
init();
/* consolidated booking layout: section heading + reservation deadline */
function ensureBookingLayout(){
  const booking=$('bookingTab'),week=$('weekDays');if(!booking||!week)return;
  const oldHead=[...booking.querySelectorAll('.section-head')].find(x=>x.querySelector('h2')?.textContent?.trim()==='Vyberte deň');
  if(oldHead)oldHead.remove();
  if(!booking.querySelector('.booking-section-head')){
    week.insertAdjacentHTML('beforebegin','<div class="section-head booking-section-head"><div><h2>Vyberte deň</h2><span id="weekTitle" class="week-range-v36">Nasledujúce dni</span></div></div><div id="deadlineText" class="deadline-card"><strong>Rezervácie na ďalší týždeň do nedele 20:00.</strong><span>Ak potrebujete individuálny termín, kontaktujte nás.</span></div>');
  }
}
ensureBookingLayout();
function placeDeadlineV59(){
  const deadline=$('deadlineText'),upcoming=$('upcomingBookings');
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
      if(target)target.innerHTML='<div class="install-step"><b>!</b><span><strong>Android zatiaľ nepotvrdil dokončenie inštalácie.</strong><br>Skontrolujte zoznam aplikácií v telefóne. Ak tam Chvostíkovo nie je, zavrite Chrome, znovu ho otvorte a skúste menu <strong>⋮ → Nainštalovať aplikáciu</strong>. Ak telefón ponúka <strong>Pridať na plochu</strong>, môžete použiť aj túto možnosť.</span></div>';
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
    const b=document.getElementById('installGuideInstallBtn');
    if(b){b.classList.remove('hidden');b.disabled=false;b.textContent='Nainštalovať aplikáciu'}
    if(!standalone())setTimeout(openGuide,0);
  });

  function ensureGuide(){
    if(document.getElementById('installGuideModal'))return;
    const p=platform();
    const steps=p==='ios'
      ?'<div class="install-step"><b>1</b><span>Kliknite na <strong>tri bodky ⋯</strong> v menu prehliadača.</span></div><div class="install-step"><b>2</b><span>Kliknite na <strong>Zdieľať</strong> – štvorec so šípkou nahor.</span></div><div class="install-step"><b>3</b><span>Kliknite na <strong>Zobraziť viac</strong>.</span></div><div class="install-step"><b>4</b><span>Vyberte <strong>Pridať na plochu</strong>.</span></div><div class="install-step"><b>5</b><span>Zapnite <strong>Otvoriť ako webovú apku</strong> a kliknite na <strong>Pridať</strong>.</span></div><div class="install-step"><b>6</b><span>Zavrite aktuálne okno a otvorte <strong>Chvostíkovo cez ikonu na ploche</strong>. Tam pokračujte prihlásením.</span></div>'
      :p==='android'
      ?'<div class="install-step"><b>1</b><span>Kliknite na <strong>Nainštalovať aplikáciu</strong> nižšie alebo cez menu <strong>⋮</strong> vpravo hore.</span></div><div class="install-step"><b>2</b><span>Potvrďte inštaláciu.</span></div><div class="install-step"><b>3</b><span>Počkajte na potvrdenie dokončenia a potom otvorte <strong>Chvostíkovo zo zoznamu aplikácií alebo z plochy</strong>.</span></div>'
      :'<div class="install-step"><b>1</b><span>Otvorte menu prehliadača.</span></div><div class="install-step"><b>2</b><span>Vyberte možnosť <strong>Inštalovať aplikáciu</strong> alebo <strong>Pridať na plochu</strong>.</span></div>';
    document.body.insertAdjacentHTML('beforeend','<div id="installGuideModal" class="install-guide-modal hidden" role="dialog" aria-modal="true" aria-labelledby="installGuideTitle"><div class="install-guide-card"><button id="installGuideClose" class="install-guide-close" type="button" aria-label="Zavrieť">×</button><div class="install-guide-logo">Chvostíkovo</div><h2 id="installGuideTitle">Pridajte si Chvostíkovo ako aplikáciu</h2><p>Je to najjednoduchší spôsob, ako mať rezervácie, správy a upozornenia vždy poruke.</p><div class="install-steps">'+steps+'</div><button id="installGuideInstallBtn" class="btn full hidden" type="button">Nainštalovať aplikáciu</button><button id="installGuideContinue" class="btn secondary full" type="button">Zavrieť</button></div></div>');
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
        const b=document.getElementById('installGuideInstallBtn');
        if(b){b.classList.add('hidden');b.disabled=false;b.textContent='Nainštalovať aplikáciu'}
      }
    });
  }
  function openGuide(){ensureGuide();document.getElementById('installGuideModal')?.classList.remove('hidden')}
  function mountHelpLink(){const card=document.querySelector('.auth-card');if(!card||document.getElementById('installHelpLink'))return;const b=document.createElement('button');b.id='installHelpLink';b.type='button';b.className='install-help-link';b.textContent='Ako si nainštalovať aplikáciu?';b.addEventListener('click',openGuide);card.appendChild(b)}
  const start=()=>{mountHelpLink();const emailReturn=/type=signup/i.test(location.hash);if(standalone())installedUi();else if(!emailReturn&&sessionStorage.getItem(KEY)!=='1')setTimeout(()=>{if(sessionStorage.getItem(KEY)!=='1')openGuide()},180)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
/* v75: Supabase-backed customer onboarding state machine */
(function customerOnboardingV75Runtime(){
  const PRIVACY_VERSION='privacy-v1';let privacyMandatory=false,running=false,rerun=false;window.__customerOnboardingCompleteV75=false;
  function authHeaders(){return {apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'}}
  function flowIds(){return ['waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75']}
  function hideFlow(except=''){for(const id of flowIds())if(id!==except)$(id)?.classList.add('hidden');if(except!=='schoolTermsModal')$('schoolTermsModal')?.classList.add('hidden');$('notificationPopup')?.classList.add('hidden')}
  function ensureWaiting(){if(!$('waitingDogAssignmentModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="waitingDogAssignmentModalV75" class="legal-modal onboarding-modal-v75 waiting-dog-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="waitingDogAssignmentTitleV75"><div class="legal-card waiting-dog-card-v75"><div class="legal-kicker">Chvostíkovo</div><h2 id="waitingDogAssignmentTitleV75">Registrácia je úspešná</h2><div class="legal-body"><p>Účet je pripravený. Teraz čakáme na priradenie vášho psíka k profilu.</p><p class="hint">Po priradení vám pošleme upozornenie a aplikácia sa automaticky sprístupní.</p></div></div></div>');return $('waitingDogAssignmentModalV75')}
  function ensurePushModal(){if(!$('pushOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="pushOnboardingModalV75" class="legal-modal onboarding-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="pushOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Upozornenia</div><h2 id="pushOnboardingTitleV75">Zapnúť upozornenia?</h2><div class="legal-body"><p>Upozorníme vás napríklad na schválenie alebo zmenu rezervácie, dôležité oznamy, nové správy a blížiaci sa koniec platnosti očkovania.</p></div><button id="pushOnboardingEnableV75" class="btn full" type="button">Zapnúť upozornenia</button><button id="pushOnboardingSkipV75" class="btn secondary full onboarding-secondary-v75" type="button">Teraz nie</button></div></div>');return $('pushOnboardingModalV75')}
  function ensureShareModal(){if(!$('shareOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="shareOnboardingModalV75" class="legal-modal onboarding-modal-v75 centered-onboarding-v97 hidden" role="dialog" aria-modal="true" aria-labelledby="shareOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Súkromie psíka</div><h2 id="shareOnboardingTitleV75">Zobraziť meno a fotku psíka?</h2><div class="legal-body"><p>Ak to povolíte, meno a fotku vášho psíka uvidia ostatní majitelia, ktorí majú psíka prihláseného v rovnaký deň. Toto nastavenie môžete kedykoľvek neskôr zmeniť.</p></div><button id="shareOnboardingYesV75" class="btn full" type="button">Áno, zobrazovať</button><button id="shareOnboardingNoV75" class="btn secondary full onboarding-secondary-v75" type="button">Nie, ponechať anonymne</button></div></div>');return $('shareOnboardingModalV75')}
  function ensureDetailsModal(){if(!$('dogDetailsOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="dogDetailsOnboardingModalV75" class="legal-modal onboarding-modal-v75 centered-onboarding-v97 hidden" role="dialog" aria-modal="true" aria-labelledby="dogDetailsOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Môj psík</div><h2 id="dogDetailsOnboardingTitleV75">Doplňte údaje o psíkovi</h2><div class="legal-body"><p>Najprv doplňte pár základných údajov o psíkovi.</p><p>Potom doplníte povinné očkovania. Bez nich nie je možné používať rezervácie.</p></div><button id="dogDetailsOnboardingFillV75" class="btn full" type="button">Doplniť údaje</button></div></div>');return $('dogDetailsOnboardingModalV75')}
  function openPrivacyInfo(mandatory=false){privacyMandatory=!!mandatory;const modal=$('privacyInfoModal');if(!modal)return;hideFlow();$('privacyInfoClose')?.classList.toggle('hidden',privacyMandatory);if($('privacyInfoOk'))$('privacyInfoOk').textContent=privacyMandatory?'Potvrdiť a pokračovať':'Rozumiem';modal.classList.remove('hidden')}
  function closePrivacyInfo(){if(privacyMandatory)return;$('privacyInfoModal')?.classList.add('hidden')}
  async function acknowledgePrivacy(){if(!privacyMandatory){closePrivacyInfo();return}const btn=$('privacyInfoOk');if(btn)btn.disabled=true;try{const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_acknowledge_privacy_notice',{method:'POST',headers:authHeaders(),body:JSON.stringify({p_version:PRIVACY_VERSION})});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok)throw new Error(data?.message||data?.error||'Potvrdenie sa nepodarilo uložiť.');if(state.data?.profile){state.data.profile.privacy_notice_version=PRIVACY_VERSION;state.data.profile.privacy_notice_acknowledged_at=new Date().toISOString()}privacyMandatory=false;$('privacyInfoModal')?.classList.add('hidden');runCustomerOnboardingV75()}catch(e){toast(e.message||'Potvrdenie sa nepodarilo uložiť.')}finally{if(btn)btn.disabled=false}}
  async function activeTermsDocument(){const now=new Date().toISOString(),r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_documents?active=eq.true&effective_from=lte.'+encodeURIComponent(now)+'&select=id,version,title,body,document_hash,effective_from&order=effective_from.desc&limit=1',{headers:authHeaders(),cache:'no-store'});if(!r.ok)return null;const rows=await r.json();return rows?.[0]||null}
  async function acceptedTerms(version){const r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_acceptances?terms_version=eq.'+encodeURIComponent(version)+'&select=dog_id,terms_version,accepted_at',{headers:authHeaders(),cache:'no-store'});if(!r.ok)return[];return await r.json()}
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
        if(i+1<chunks.length&&!/^\d+\.\s+/.test(chunks[i+1]))body=chunks[++i];
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
    $('schoolTermsTitle').textContent=doc.title||'Podmienky škôlky';
    $('schoolTermsDog').textContent='Psík: '+(dog.name||'');
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
  async function acceptSchoolTerms(){const modal=$('schoolTermsModal'),dogId=Number(modal?.dataset.dogId||0),version=String(modal?.dataset.version||'');if(!dogId||!version||!$('schoolTermsAck')?.checked)return;const btn=$('schoolTermsConfirm');if(btn)btn.disabled=true;try{const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_accept_school_terms',{method:'POST',headers:authHeaders(),body:JSON.stringify({p_dog_id:dogId,p_terms_version:version})});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok)throw new Error(data?.message||data?.error||'Podmienky sa nepodarilo potvrdiť.');modal.classList.add('hidden');toast('Podmienky škôlky boli potvrdené.');runCustomerOnboardingV75()}catch(e){toast(e.message||'Podmienky sa nepodarilo potvrdiť.')}finally{if(btn)btn.disabled=false}}
  function visibilityDecided(dogId){return (state.data?.visibility_consents||[]).some(x=>Number(x.dog_id)===Number(dogId))}
  function detailsPromptAnswered(dogId){return (state.data?.dog_onboarding||[]).some(x=>Number(x.dog_id)===Number(dogId))}
  function detailsAlreadyComplete(dog){return window.customerVaccinationsCompleteV96?window.customerVaccinationsCompleteV96(dog):false}
  window.customerDogDetailsCompleteV95=detailsAlreadyComplete;
  function showPushPrompt(){hideFlow('pushOnboardingModalV75');const modal=ensurePushModal();modal.classList.remove('hidden');$('pushOnboardingEnableV75').onclick=async()=>{const yes=$('pushOnboardingEnableV75'),no=$('pushOnboardingSkipV75');yes.disabled=true;no.disabled=true;try{await enablePushForCurrentUserV75();modal.classList.add('hidden');toast('Upozornenia sú zapnuté.');runCustomerOnboardingV75()}catch(e){toast(e.message||'Upozornenia sa nepodarilo zapnúť.')}finally{yes.disabled=false;no.disabled=false}};$('pushOnboardingSkipV75').onclick=async()=>{const yes=$('pushOnboardingEnableV75'),no=$('pushOnboardingSkipV75');yes.disabled=true;no.disabled=true;try{await completePushPromptV75();modal.classList.add('hidden');runCustomerOnboardingV75()}catch(e){toast(e.message||'Nastavenie sa nepodarilo uložiť.')}finally{yes.disabled=false;no.disabled=false}}}
  function showSharePrompt(dog){hideFlow('shareOnboardingModalV75');const modal=ensureShareModal();modal.dataset.dogId=String(dog.id);$('shareOnboardingTitleV75').textContent='Chcete, aby ostatní používatelia videli meno a fotku '+(dog.name||'vášho psíka')+'?';const finish=async granted=>{const yes=$('shareOnboardingYesV75'),no=$('shareOnboardingNoV75');yes.disabled=true;no.disabled=true;try{await api({action:'set_photo_visibility',dog_id:Number(dog.id),granted});dog.share_name_photo=granted;state.data.visibility_consents=state.data.visibility_consents||[];state.data.visibility_consents.unshift({dog_id:Number(dog.id),granted,consent_version:'2026-09-09',created_at:new Date().toISOString()});modal.classList.add('hidden');renderDog();runCustomerOnboardingV75()}catch(e){toast(e.message||'Nastavenie sa nepodarilo uložiť.')}finally{yes.disabled=false;no.disabled=false}};$('shareOnboardingYesV75').onclick=()=>finish(true);$('shareOnboardingNoV75').onclick=()=>finish(false);modal.classList.remove('hidden')}
  function showDetailsPrompt(dog){hideFlow('dogDetailsOnboardingModalV75');const modal=ensureDetailsModal();modal.dataset.dogId=String(dog.id);$('dogDetailsOnboardingFillV75').onclick=()=>{modal.classList.add('hidden');state.selectedDogId=Number(dog.id);renderDogSelector();renderDog();switchTab('dog');setTimeout(()=>openDogDetails('details',true),40)};modal.classList.remove('hidden')}
  async function evaluate(){if(!state.session||!state.data)return;window.__customerOnboardingCompleteV75=false;const dogs=state.data?.dogs||[];document.documentElement.classList.toggle('customer-awaiting-dog-v107',!dogs.length);try{await ensurePushState(true)}catch(_){}if(!state.data.profile?.privacy_notice_acknowledged_at){openPrivacyInfo(true);return}if(privacyMandatory){privacyMandatory=false;$('privacyInfoModal')?.classList.add('hidden')}if(!state.data.profile?.push_prompt_answered_at){showPushPrompt();return}if(!dogs.length){hideFlow('waitingDogAssignmentModalV75');ensureWaiting().classList.remove('hidden');return}ensureWaiting().classList.add('hidden');const doc=await activeTermsDocument();if(doc){const accepted=await acceptedTerms(doc.version),acceptedIds=new Set((accepted||[]).map(x=>Number(x.dog_id))),missing=dogs.find(d=>!acceptedIds.has(Number(d.id)));if(missing){showSchoolTerms(missing,doc);return}}$('schoolTermsModal')?.classList.add('hidden');const shareDog=dogs.find(d=>!visibilityDecided(d.id));if(shareDog){showSharePrompt(shareDog);return}const detailsDog=dogs.find(d=>!detailsPromptAnswered(d.id)&&!detailsAlreadyComplete(d));if(detailsDog){showDetailsPrompt(detailsDog);return}hideFlow();window.__customerOnboardingCompleteV75=true;renderNotifications();if(typeof loadAnnouncements==='function')loadAnnouncements()}
  async function runCustomerOnboardingV75(){if(running){rerun=true;return}running=true;try{await evaluate()}catch(e){console.warn('Customer onboarding',e)}finally{running=false;if(rerun){rerun=false;setTimeout(runCustomerOnboardingV75,20)}}}
  window.runCustomerOnboardingV75=runCustomerOnboardingV75;
  document.addEventListener('click',e=>{if(e.target.closest('#privacyInfoBtn')){e.preventDefault();openPrivacyInfo(false)}if(e.target.closest('#privacyInfoClose'))closePrivacyInfo();if(e.target.closest('#privacyInfoOk'))acknowledgePrivacy();if(e.target.closest('#schoolTermsConfirm'))acceptSchoolTerms();if(e.target.closest('#schoolTermsLogout'))$('logoutBtn')?.click()});
  document.addEventListener('change',e=>{if(e.target?.id==='schoolTermsAck'&&$('schoolTermsConfirm'))$('schoolTermsConfirm').disabled=!e.target.checked});
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
    document.body.insertAdjacentHTML('beforeend','<div id="schoolTermsModal" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="schoolTermsTitle"><div class="legal-card terms-card"><div class="legal-kicker">Chvostíkovo</div><h2 id="schoolTermsTitle">Podmienky škôlky</h2><div id="schoolTermsDog" class="legal-dog"></div><div id="schoolTermsBody" class="legal-body terms-body"></div><label class="terms-ack-row"><input id="schoolTermsAck" type="checkbox"><span>Prečítal/a som si podmienky škôlky a súhlasím s nimi.</span></label><button id="schoolTermsConfirm" class="btn full" type="button" disabled>Potvrdiť podmienky</button><button id="schoolTermsLogout" class="btn secondary full" type="button">Odhlásiť sa</button></div></div>');
  }
  document.getElementById('schoolTermsAck')?.addEventListener('change',e=>{const b=document.getElementById('schoolTermsConfirm');if(b)b.disabled=e.target.disabled||!e.target.checked});
})();


/* v21: customer legal status + readable terms */
(function customerLegalStatusV21(){
  if(window.__chvostikovoCustomerLegalStatusV21)return;
  window.__chvostikovoCustomerLegalStatusV21=true;
  let renderSeq=0;
  const headers=()=>({apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'});
  const skDateTime=v=>{try{return new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(_){return String(v||'')}};
  async function activeDoc(){
    if(!state?.session)return null;
    const now=new Date().toISOString();
    const r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_documents?active=eq.true&effective_from=lte.'+encodeURIComponent(now)+'&select=id,version,title,body,document_hash,effective_from&order=effective_from.desc&limit=1',{headers:headers(),cache:'no-store'});
    if(!r.ok)return null;const rows=await r.json();return rows?.[0]||null;
  }
  async function acceptance(dogId,version){
    if(!state?.session||!dogId||!version)return null;
    const r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_acceptances?dog_id=eq.'+dogId+'&terms_version=eq.'+encodeURIComponent(version)+'&select=dog_id,terms_version,accepted_at,acceptance_text,document_hash&order=accepted_at.desc&limit=1',{headers:headers(),cache:'no-store'});
    if(!r.ok)return null;const rows=await r.json();return rows?.[0]||null;
  }
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
    document.getElementById('schoolTermsReadMeta').textContent='Verzia: '+String(doc.version||'');
    document.getElementById('schoolTermsReadBody').textContent=doc.body||'';
    modal.classList.remove('hidden');
  }
  async function render(){
    const seq=++renderSeq;
    const stats=document.getElementById('dogStats');
    const dogId=Number(state?.selectedDogId||0);
    if(!stats||!state?.session||!dogId){document.getElementById('customerLegalStatusCard')?.remove();return}
    const [doc]=await Promise.all([activeDoc()]);
    if(seq!==renderSeq)return;
    const accepted=doc?await acceptance(dogId,doc.version):null;
    if(seq!==renderSeq)return;
    const privacyAt=state.data?.profile?.privacy_notice_acknowledged_at||null;
    let card=document.getElementById('customerLegalStatusCard');
    if(!card){card=document.createElement('div');card.id='customerLegalStatusCard';card.className='card customer-legal-card'}const v23Target=document.querySelector('#customerLegalSectionV23 .details-content');if(v23Target){card.classList.remove('card');card.classList.add('v23-legal-inner');const controls=document.getElementById('customerLegalControlsV23');if(controls)v23Target.insertBefore(card,controls);else v23Target.appendChild(card)}else{const legalAnchor=stats.querySelector('.stats-grid.old-stats')||stats.querySelector('.visit-stats-card');if(legalAnchor)stats.insertBefore(card,legalAnchor);else stats.appendChild(card)}
    card.innerHTML=
      '<div class="customer-legal-doc-v105"><div class="customer-legal-row"><div class="customer-legal-main"><strong>Ochrana osobných údajov</strong><small>'+(privacyAt?'Potvrdené '+skDateTime(privacyAt):'Informácie o spracúvaní osobných údajov')+'</small></div><span class="customer-legal-status '+(privacyAt?'ok':'warn')+'">'+(privacyAt?'Potvrdené':'Nepotvrdené')+'</span></div><button id="customerPrivacyReadBtn" class="btn secondary customer-legal-doc-action-v105" type="button">Otvoriť súhlas</button></div>'+
      '<div class="customer-legal-doc-v105"><div class="customer-legal-row"><div class="customer-legal-main"><strong>Pravidlá škôlky</strong><small>'+(accepted?'Odsúhlasené '+skDateTime(accepted.accepted_at):(doc?'Čakajú na potvrdenie':'Dokument zatiaľ nie je aktívny'))+'</small></div><span class="customer-legal-status '+(accepted?'ok':'warn')+'">'+(accepted?'Odsúhlasené':'Nepotvrdené')+'</span></div>'+(doc?'<button id="customerTermsReadBtn" class="btn secondary customer-legal-doc-action-v105" type="button">Otvoriť pravidlá škôlky</button>':'')+'</div>';
    document.getElementById('customerPrivacyReadBtn')?.addEventListener('click',()=>document.getElementById('privacyInfoBtn')?.click());
    document.getElementById('customerTermsReadBtn')?.addEventListener('click',()=>openRead(doc));
  }
  window.renderCustomerLegalStatusV103=render;
  function start(){
    const stats=document.getElementById('dogStats');if(stats)new MutationObserver(()=>setTimeout(render,0)).observe(stats,{childList:true,subtree:false});
    document.addEventListener('change',e=>{if(e.target?.id==='dogSelector')setTimeout(render,100)});
    document.addEventListener('click',e=>{if(e.target?.closest('#schoolTermsConfirm')||e.target?.closest('#privacyInfoOk')||e.target?.closest('[data-tab="dog"]')){setTimeout(render,700);setTimeout(render,1500)}});
    setTimeout(render,800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.addEventListener('focus',()=>setTimeout(render,100));
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
  function renderGradebookV92(){return null}
  function ensureOrder(){return}
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
    const photoKey=[dog.id,dog.photo_path,dog.photo_updated_at,dog.name].join('|');
    if(avatar&&avatar.dataset.photoKey!==photoKey){
      avatar.innerHTML=dog.photo_url?'<img src="'+esc(dog.photo_url)+'" alt="">':'🐾';
      avatar.dataset.photoKey=photoKey;
    }
    $('bookingDogName').textContent=dog.name||'Môj psík';
    const required=['rabies','infectious','kennel_cough'];
    const rows=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(dog.id));
    const complete=customerVaccinationsCompleteV96(dog);
    const nearExpiry=complete&&required.some(type=>{
      const latest=rows.filter(v=>v.vaccination_type===type&&v.valid_until).sort((a,b)=>String(b.valid_until).localeCompare(String(a.valid_until)))[0];
      return latest&&vaccinationValidityV96(latest.valid_until).kind==='warning';
    });
    const vaccination=$('bookingVaccinationStatus');
    vaccination.className='dog-overview-status '+(!complete?'invalid':nearExpiry?'warning':'valid');
    const vaccinationLabel=!complete?'Očkovania nie sú platné':nearExpiry?'Blížiaci sa koniec<br>platnosti očkovania':'Platné očkovania';
    vaccination.innerHTML='<span class="overview-icon vacc-icon"><svg aria-hidden="true"><use href="#ci-'+(complete&&!nearExpiry?'check':'alert')+'"/></svg></span><span>'+vaccinationLabel+'</span>';
    $('bookingVisitCount').querySelector('.overview-label').textContent='Celkové návštevy: '+totalVisits(dog);
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
    const account=document.querySelector('.account-card');
    const legal=$('customerLegalSectionV23');
    const logout=$('logoutBtn');
    // Contact details are presented separately from settings.
    if(legal&&legal.parentElement!==content){content.appendChild(legal);if(!legal.dataset.v36SettingsCollapsed){legal.open=false;legal.dataset.v36SettingsCollapsed='1'}}
    if(logout){logout.classList.remove('hidden','icon-btn');logout.classList.add('btn','secondary','full');logout.textContent='Odhlásiť sa';logout.style.marginTop='14px';content.appendChild(logout)}
  }

  function openSettings(section='notifications'){
    relocateSettings();
    if(typeof window.prepareCustomerSettingsV102==='function')window.prepareCustomerSettingsV102();
    const modal=$('dogSettingsModalV36'),legal=$('customerLegalSectionV23');
    modal.dataset.section=section;
    $('dogSettingsTitleV36').textContent=section==='legal'?'Súhlasy a podmienky':'Upozornenia';
    const settingsIntro=modal.querySelector('.settings-head-v36 p');
    if(settingsIntro)settingsIntro.textContent=section==='legal'?'Fotka a meno psíka, ochrana údajov a pravidlá škôlky.':'Rezervácie, správy a oznamy z Chvostíkova.';
    const legalWasOpen=legal?.open;
    if(legal)legal.open=section==='legal';
    if(section==='legal'&&legalWasOpen)window.renderCustomerLegalStatusV103?.();
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


/* v37: direct settings notification + compact multi-day booking flow */
(function customerBookingAndSettingsV37(){
  if(window.__chvostikovoCustomerBookingAndSettingsV37)return;
  window.__chvostikovoCustomerBookingAndSettingsV37=true;

  let selectedDatesV37=new Set();
  let selectedTaxiByDateV91=new Map();
  let submittingV37=false;
  let pendingPassRenewalV95=0;

  function bratislavaClockV95(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),m=Object.fromEntries(parts.map(x=>[x.type,x.value]));return{date:m.year+'-'+m.month+'-'+m.day,minutes:Number(m.hour)*60+Number(m.minute)}}
  function previousIsoDayV95(iso){const d=new Date(String(iso)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
  function bookingDeadlineClosedV95(date){const now=bratislavaClockV95(),previous=previousIsoDayV95(date);return now.date>previous||(now.date===previous&&now.minutes>=21*60)}
  function pickerErrorV95(message,deadline=false){const box=$('bookingPickerErrorV95');if(!box)return;box.classList.toggle('hidden',!message);if(!message){box.innerHTML='';return}box.innerHTML='<strong>'+esc(message)+'</strong>'+(deadline?'<div>Ak chcete psíka prihlásiť aj po uzávierke, napíšte nám cez aplikáciu.</div><button id="bookingPickerMessageV95" class="btn secondary full" type="button">Napísať správu</button>':'');$('bookingPickerMessageV95')?.addEventListener('click',()=>{closePickerV37();switchTab('dog');setTimeout(()=>$('supportChatBtnV52')?.click(),80)})}

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

  function ensurePickerV37(){
    if($('bookingPickerV37'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="bookingPickerV37" class="booking-picker-v37 hidden" role="dialog" aria-modal="true" aria-labelledby="bookingPickerTitleV37"><div class="booking-picker-card-v37"><div class="booking-picker-head-v37"><div><small>Rezervácia škôlky</small><h2 id="bookingPickerTitleV37">Vyberte deň alebo dni</h2><p id="bookingPickerRangeV37"></p></div><button id="bookingPickerCloseV37" class="booking-picker-close-v37" type="button" aria-label="Zavrieť">×</button></div><div id="bookingPickerDogWrapV37" class="booking-picker-dog-v37 hidden"><label for="bookingPickerDogV37">Psík</label><select id="bookingPickerDogV37" class="input"></select></div><div id="bookingPickerDaysV37" class="booking-picker-days-v37"></div><div id="bookingPickerTaxiSectionV91" class="booking-picker-taxi-section-v91 hidden"><div class="booking-picker-taxi-title-v37">Taxi podľa vybraného dňa</div><div id="bookingPickerTaxiByDayV91" class="booking-picker-taxi-by-day-v91"></div></div><div id="bookingPickerErrorV95" class="booking-picker-error-v95 hidden"></div><button id="bookingPickerSubmitV37" class="btn full booking-picker-submit-v37" type="button" disabled>Vyberte deň</button></div></div>`);
    $('bookingPickerCloseV37').addEventListener('click',closePickerV37);
    $('bookingPickerV37').addEventListener('click',e=>{if(e.target===$('bookingPickerV37'))closePickerV37()});
    $('bookingPickerDogV37').addEventListener('change',e=>{
      state.selectedDogId=Number(e.target.value);
      selectedDatesV37.clear();
      selectedTaxiByDateV91.clear();
      renderDogSelector();
      renderPassSummary();
      renderDog();
      renderUpcoming();
      renderDays();
      renderPickerV37();
    });
    $('bookingPickerSubmitV37').addEventListener('click',submitPickerV37);
  }

  function renderPickerV37(){
    ensurePickerV37();
    const dog=selectedDog(),dogs=state.data?.dogs||[],days=state.data?.availability?.days||[];
    if(!dog)return;
    const dogWrap=$('bookingPickerDogWrapV37'),dogSelect=$('bookingPickerDogV37');
    dogWrap.classList.toggle('hidden',dogs.length<=1);
    dogSelect.innerHTML=dogs.map(d=>`<option value="${d.id}" ${Number(d.id)===Number(dog.id)?'selected':''}>${esc(d.name)}</option>`).join('');
    $('bookingPickerRangeV37').textContent=$('weekTitle')?.textContent||'Najbližšie dva týždne';

    $('bookingPickerDaysV37').innerHTML=days.map(d=>{
      const existing=bookingFor(dog.id,d.date),deadlineClosed=bookingDeadlineClosedV95(d.date),closed=d.bookings_open===false||deadlineClosed,full=Number(d.available)<=0;
      const disabled=!!existing||closed||full;
      const selected=selectedDatesV37.has(d.date);
      const stateText=existing?'Rezervované':deadlineClosed?'Uzavreté o 21:00':closed?'Zatvorené':full?'Plno':`${Math.max(0,Number(d.available)||0)} voľné`;
      return `<button type="button" class="booking-day-v37 ${selected?'selected':''} ${existing?'booked':''} ${disabled?'disabled':''}" data-date="${d.date}" ${disabled?'disabled':''}><small>${esc(shortDayV37(d.date))}</small><strong>${esc(compactDateV37(d.date))}</strong><span>${esc(stateText)}</span></button>`;
    }).join('');
    $('bookingPickerDaysV37').querySelectorAll('.booking-day-v37:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>{
      const date=btn.dataset.date;
      if(selectedDatesV37.has(date)){
        selectedDatesV37.delete(date);
        selectedTaxiByDateV91.delete(date);
      }else{
        selectedDatesV37.add(date);
        if(!selectedTaxiByDateV91.has(date))selectedTaxiByDateV91.set(date,'none');
      }
      renderPickerV37();
    }));

    const taxiSection=$('bookingPickerTaxiSectionV91'),taxiRoot=$('bookingPickerTaxiByDayV91');
    const selected=[...selectedDatesV37].sort();
    taxiSection?.classList.toggle('hidden',selected.length===0);
    if(taxiRoot){
      taxiRoot.innerHTML=selected.map(date=>{
        const mode=selectedTaxiByDateV91.get(date)||'none';
        return `<div class="booking-taxi-day-v91" data-date="${esc(date)}"><div class="booking-taxi-day-head-v91"><strong>${esc(skDay(date))}</strong><span>${esc(skDate(date))}</span></div><div class="booking-picker-taxi-v37 booking-taxi-buttons-v91"><button type="button" data-taxi="none" class="${mode==='none'?'active':''}">Bez taxi</button><button type="button" data-taxi="pickup" class="${mode==='pickup'?'active':''}">Vyzdvihnúť · 5 €</button><button type="button" data-taxi="pickup_dropoff" class="${mode==='pickup_dropoff'?'active':''}">Tam aj späť · 10 €</button></div></div>`;
      }).join('');
      taxiRoot.querySelectorAll('.booking-taxi-day-v91 button').forEach(button=>button.addEventListener('click',()=>{
        const row=button.closest('.booking-taxi-day-v91'),date=row?.dataset?.date;
        if(!date)return;
        selectedTaxiByDateV91.set(date,button.dataset.taxi||'none');
        row.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));
      }));
    }
    const submit=$('bookingPickerSubmitV37'),count=selectedDatesV37.size;
    submit.disabled=!count||submittingV37;
    submit.textContent=count?`Rezervovať ${count===1?'1 deň':count<5?count+' dni':count+' dní'}`:'Vyberte deň';
  }

  function openPickerV37(){
    const dog=selectedDog();if(dog&&window.customerVaccinationsCompleteV96&&!window.customerVaccinationsCompleteV96(dog)){switchTab('dog');setTimeout(()=>openDogDetails('vaccinations',false),40);toast('Pred rezerváciou doplňte povinné očkovania.');return}
    selectedDatesV37.clear();selectedTaxiByDateV91.clear();pickerErrorV95('');
    renderPickerV37();
    $('bookingPickerV37').classList.remove('hidden');
    document.documentElement.classList.add('booking-picker-open-v37');
  }
  function closePickerV37(){if(submittingV37)return;$('bookingPickerV37')?.classList.add('hidden');document.documentElement.classList.remove('booking-picker-open-v37');pickerErrorV95('');if(pendingPassRenewalV95){const dogId=pendingPassRenewalV95;pendingPassRenewalV95=0;setTimeout(()=>window.showPassRenewalAfterBookingV94?.(dogId),100)}}

  async function submitPickerV37(){
    const dog=selectedDog(),dates=[...selectedDatesV37].sort();
    if(!dog||!dates.length||submittingV37)return;
    if(window.customerVaccinationsCompleteV96&&!window.customerVaccinationsCompleteV96(dog)){pickerErrorV95('Pred rezerváciou doplňte povinné očkovania.');return}
    const deadlineDates=dates.filter(bookingDeadlineClosedV95);
    if(deadlineDates.length){
      deadlineDates.forEach(date=>{selectedDatesV37.delete(date);selectedTaxiByDateV91.delete(date)});
      renderPickerV37();pickerErrorV95('Rezervácie na '+deadlineDates.map(skDate).join(', ')+' sa uzavreli deň vopred o 21:00.',true);queueCustomerSync('bookings',0);return;
    }
    submittingV37=true;pickerErrorV95('');renderPickerV37();
    let ok=0,shouldPromptPassRenewalV94=false;const failed=[],successDates=[];
    for(const date of dates){
      const taxiMode=selectedTaxiByDateV91.get(date)||'none';
      try{
        const result=await api({action:'request_booking',dog_id:Number(dog.id),reservation_date:date,taxi_mode:taxiMode});
        const bookingRow=result?.data||result?.booking||result?.request||null;
        if(bookingRow&&Number(bookingRow.projected_pass_total)>0&&Number(bookingRow.projected_entry_number)>=Number(bookingRow.projected_pass_total))shouldPromptPassRenewalV94=true;
        applyLocalBooking(result,{id:-(Date.now()+ok),dog_id:Number(dog.id),reservation_date:date,taxi_mode:taxiMode,status:'pending',can_manage:true});ok++;successDates.push(date);
      }catch(e){failed.push({date,error:e.message||'Nepodarilo sa rezervovať.'})}
    }
    try{if(ok)queueCustomerSync('bookings',80)}finally{submittingV37=false}
    if(failed.length){
      successDates.forEach(date=>{selectedDatesV37.delete(date);selectedTaxiByDateV91.delete(date)});
      if(shouldPromptPassRenewalV94)pendingPassRenewalV95=Number(dog.id);
      renderPickerV37();
      const deadlineFailure=failed.some(x=>/21:00|uzavrela deň vopred|zatvorené/i.test(x.error));
      const details=failed.map(x=>skDate(x.date)+' – '+x.error).join(' | ');
      pickerErrorV95((ok?`Odoslané ${ok} z ${dates.length}. `:'')+'Nepodarilo sa: '+details,deadlineFailure);
      queueCustomerSync('bookings',0);
      return;
    }
    closePickerV37();
    toast(ok===1?'Rezervácia bola odoslaná na schválenie.':`${ok} rezervácie boli odoslané na schválenie.`);
    if(shouldPromptPassRenewalV94)setTimeout(()=>window.showPassRenewalAfterBookingV94?.(Number(dog.id)),140);
  }

  function bookingRosterV37(day){
    const count=(day?.dogs?.length||0)+(Number(day?.anonymous_dogs)||0);
    if(!count)return '<span class="reserved-roster-count-v37">Zatiaľ bez ďalších psíkov</span>';
    if(!day?.roster_visible)return `<span class="reserved-roster-count-v37">${esc(pluralDogs(count))}</span>`;
    return `<details class="reserved-roster-v37"><summary>${esc(pluralDogs(count))}</summary><div>${(day.dogs||[]).map(x=>{const sex=x.sex==='male'?' dog-male-v100':x.sex==='female'?' dog-female-v100':' dog-neutral-v100';return `<span>${x.photo_url?`<i class="reserved-roster-avatar-v37${sex}"><img src="${esc(x.photo_url)}" alt=""></i>`:`<i class="reserved-roster-avatar-v37${sex}">🐾</i>`}<b>${esc(x.name)}</b></span>`}).join('')}${Array.from({length:Number(day.anonymous_dogs)||0},()=>'<span><i class="reserved-roster-avatar-v37 dog-neutral-v100">🐾</i><b>Prihlásený škôlkar</b></span>').join('')}</div></details>`;
  }

  customerRenderers.upcoming=()=>{
    const root=$('upcomingBookings'),dog=selectedDog();if(!root)return;
    if(!dog){root.innerHTML='';return}
    const ready=window.customerVaccinationsCompleteV96?window.customerVaccinationsCompleteV96(dog):true;
    if(!ready){
      root.innerHTML=`<div class="booking-gate-v96"><div class="booking-launch-v37 booking-launch-disabled-v96" aria-disabled="true"><span class="booking-launch-icon-v37"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M7 3v4M17 3v4M3 10h18M12 13v5M9.5 15.5h5"></path></svg></span><span><strong>Chcem prihlásiť psíka</strong><small>Rezervácie sa sprístupnia po doplnení očkovaní.</small></span><b>›</b></div><button id="bookingVaccinationsV96" class="btn secondary full booking-vaccinations-v96" type="button">Doplniť očkovania</button></div>`;
      $('bookingVaccinationsV96')?.addEventListener('click',()=>openDogDetails('vaccinations',false));
    }else{
      root.innerHTML=`<button id="openBookingPickerV37" class="booking-launch-v37" type="button"><span class="booking-launch-icon-v37"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M7 3v4M17 3v4M3 10h18M12 13v5M9.5 15.5h5"></path></svg></span><span><strong>Chcem prihlásiť psíka</strong><small>Vyberte jeden alebo viac dní naraz</small></span><b>›</b></button>`;
      $('openBookingPickerV37')?.addEventListener('click',openPickerV37);
    }
    const h=document.querySelector('#bookingTab .booking-section-head h2');if(h)h.textContent='Moje rezervácie';
  };

  customerRenderers.days=()=>{
    const root=$('weekDays'),dog=selectedDog();if(!root)return;
    const days=state.data?.availability?.days||[],byDate=new Map(days.map(d=>[d.date,d]));
    const items=futureItems().filter(r=>dog&&Number(r.dog_id)===Number(dog.id));
    if(!items.length){root.innerHTML='<div class="card reserved-empty-v37">Zatiaľ nemáte rezervovaný žiadny deň.</div>';return}
    root.innerHTML=items.map(r=>{
      const day=byDate.get(r.reservation_date)||{},taxi=taxiLabel(r.taxi_mode),pending=r.status==='pending';
      const note=day.note&&!(day.bookings_open===false&&/^zatvorené$/i.test(String(day.note).trim()))?`<div class="reserved-note-v37">${esc(day.note)}</div>`:'';
      const sharedNote=r.can_manage===false?`<div class="hint">${esc(dog.name)} už má na tento deň rezerváciu alebo žiadosť čakajúcu na potvrdenie.</div>`:'';
      const cancel=r.can_manage!==false?`<button class="text-btn cancel-booking-v37" type="button" data-request="${r._legacy?'':r.id||''}" data-reservation="${r._legacy?r.reservation_id||r.id:''}">Zrušiť rezerváciu</button>`:'';
      return `<div class="card reserved-day-card-v37" data-date="${esc(r.reservation_date)}"><div class="reserved-day-top-v37"><div><strong>${esc(skDay(r.reservation_date))}</strong><span>${esc(skDate(r.reservation_date))}</span></div><span class="pill ${pending?'pending':'approved'}">${pending?'Čaká na schválenie':'Schválená'}</span></div><div class="reserved-day-meta-v37">${bookingRosterV37(day)}${taxi?`<span class="reserved-taxi-v37">${esc(taxi)}</span>`:''}</div>${sharedNote}${note}${cancel}</div>`;
    }).join('');
    root.querySelectorAll('.cancel-booking-v37').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();cancelBooking(btn)}));
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
    return (state.data?.passes||[]).find(p=>Number(p.dog_id)===Number(dogId)&&p.status==='active'&&Number(p.used_entries)<Number(p.total_entries)&&(!p.valid_until||p.valid_until>=today))||null;
  }
  function pendingPassV38(dogId){
    return (state.data?.pass_requests||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.status==='pending')||null;
  }
  function lastEntryReservedV38(dogId){
    const pass=currentActivePassV38(dogId);if(!pass)return false;
    const total=Number(pass.total_entries)||0;
    if(!total)return false;
    return futureItems().some(r=>{
      if(Number(r.dog_id)!==Number(dogId))return false;
      const projectedTotal=Number(r.projected_pass_total)||0,projectedEntry=Number(r.projected_entry_number)||0;
      const plannedTotal=Number(r.planned_pass_total)||0,plannedEntry=Number(r.planned_entry_number)||0;
      return (projectedTotal===total&&projectedEntry>=total)||(plannedTotal===total&&plannedEntry>=total);
    });
  }
  function ensureModalV38(){
    if(document.getElementById('passRenewalModalV38'))return;
    document.body.insertAdjacentHTML('beforeend','<div id="passRenewalModalV38" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="passRenewalTitleV38"><div class="legal-card"><button id="passRenewalCloseV38" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="passRenewalTitleV38">Posledný vstup z permanentky</h2><div class="legal-body"><p>Práve rezervovaný deň využije posledný voľný vstup z aktuálnej permanentky.</p><p><strong>Nová 10-vstupová permanentka stojí 200 €.</strong></p><p class="hint">Platnosť novej permanentky začne až jej prvým použitím.</p><p class="hint pass-interest-disclaimer-v44">Odoslaním záujmu nevzniká povinnosť platby ani automatický nákup permanentky. Ide iba o informáciu pre Chvostíkovo, že máte o novú permanentku záujem.</p></div><button id="passRenewalRequestV38" class="btn full" type="button">Mám záujem o novú permanentku</button><button id="passRenewalLaterV38" class="btn secondary full" type="button">Neskôr</button></div></div>');
    const close=()=>document.getElementById('passRenewalModalV38')?.classList.add('hidden');
    document.getElementById('passRenewalCloseV38').addEventListener('click',close);
    document.getElementById('passRenewalLaterV38').addEventListener('click',close);
    document.getElementById('passRenewalModalV38').addEventListener('click',e=>{if(e.target===document.getElementById('passRenewalModalV38'))close()});
  }
  function showPromptV38(dogId){
    if(!dogId||!lastEntryReservedV38(dogId)||pendingPassV38(dogId))return;
    state.selectedDogId=Number(dogId);ensureModalV38();
    const modal=document.getElementById('passRenewalModalV38'),button=document.getElementById('passRenewalRequestV38');
    button.onclick=async()=>{button.disabled=true;try{await requestPass(10);modal.classList.add('hidden')}finally{button.disabled=false}};
    modal.classList.remove('hidden');
  }
  window.showPassRenewalAfterBookingV94=(dogId)=>{bookingDogV38=0;showPromptV38(Number(dogId)||0)};




  async function healPushV71(){
    if(!state?.session||!('serviceWorker' in navigator)||typeof Notification==='undefined'||Notification.permission!=='granted')return false;
    try{
      const reg=await navigator.serviceWorker.ready;
      try{await reg.update()}catch(_){}
      let sub=await reg.pushManager.getSubscription();
      const remembered=localStorage.getItem('chvostikovo_push_enabled')==='1';
      if(!sub&&remembered){
        sub=await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlBase64ToUint8Array(VAPID)
        });
      }
      if(!sub)return false;
      const r=await fetch(PUSH_API,{
        method:'POST',
        headers:{
          apikey:SUPABASE_KEY,
          Authorization:'Bearer '+state.session.access_token,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          audience:'customer',
          action:'subscribe',
          subscription:sub.toJSON()
        }),
        cache:'no-store'
      });
      if(!r.ok)return false;
      state.pushChecked=true;
      state.pushEnabled=true;
      localStorage.setItem('chvostikovo_push_enabled','1');
      applyPushToggle();
      return true;
    }catch(error){
      console.warn('Push subscription refresh failed',error);
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


  const chatSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"></path><path d="M7.5 10h9M7.5 13.5h6"></path></svg>';

  function supportBookingOptions(){
    const rows=futureItems();
    return rows.map(r=>{
      const id=Number(r.id)||0;
      const label='Rezervácia · '+dogName(r.dog_id)+' · '+skDate(r.reservation_date);
      return '<option value="booking:'+id+'">'+esc(label)+'</option>';
    }).join('');
  }

  function mount(){
    if(!$('supportChatBtnV52')){
      document.body.insertAdjacentHTML('beforeend',
        '<button id="supportChatBtnV52" class="support-chat-btn-v52 hidden" type="button" aria-label="Napíšte nám správu">'+chatSvg+'<span id="supportChatUnreadV52" class="support-chat-unread-v52 hidden"></span></button>'+
        '<div id="supportChatModalV52" class="legal-modal support-chat-modal-v52 hidden" role="dialog" aria-modal="true" aria-labelledby="supportChatTitleV52">'+
          '<div class="legal-card support-chat-card-v52">'+
            '<button id="supportChatCloseV52" class="legal-close" type="button" aria-label="Zavrieť">×</button>'+
            '<h2 id="supportChatTitleV52">Napíšte nám správu</h2>'+
            '<div id="supportMessageThreadV52" class="message-thread support-message-thread-v52"></div>'+
            '<form id="supportMessageFormV52" class="form-stack support-message-form-v52">'+
              '<div><label for="supportSubjectV52">Predmet</label><select id="supportSubjectV52" class="input"><option value="">Bez predmetu</option></select></div>'+
              '<div id="supportCustomSubjectWrapV52" class="hidden"><label for="supportCustomSubjectV52">Vlastný predmet</label><input id="supportCustomSubjectV52" class="input" maxlength="120" placeholder="Napíšte predmet"></div>'+
              '<div><label for="supportMessageBodyV52">Správa</label><textarea id="supportMessageBodyV52" class="input" rows="4" maxlength="2000" placeholder="Napíšte správu pre Chvostíkovo…" required></textarea></div>'+
              '<button class="btn full" type="submit">Odoslať správu</button>'+
            '</form>'+
          '</div>'+
        '</div>');
      $('supportChatBtnV52').addEventListener('click',open);
      $('supportChatCloseV52').addEventListener('click',close);
      $('supportChatModalV52').addEventListener('click',e=>{if(e.target===$('supportChatModalV52'))close()});
      $('supportSubjectV52').addEventListener('change',()=>{
        $('supportCustomSubjectWrapV52').classList.toggle('hidden',$('supportSubjectV52').value!=='custom');
        if($('supportSubjectV52').value==='custom')$('supportCustomSubjectV52').focus();
      });
      $('supportMessageFormV52').addEventListener('submit',send);
    }
    refreshSubjectOptions();
    renderSupportThread();
    updateButton();
  }

  function refreshSubjectOptions(){
    const select=$('supportSubjectV52');if(!select)return;
    const current=select.value;
    select.innerHTML='<option value="">Bez predmetu</option>'+supportBookingOptions()+'<option value="custom">Iný predmet</option>';
    if([...select.options].some(o=>o.value===current))select.value=current;
    $('supportCustomSubjectWrapV52')?.classList.toggle('hidden',select.value!=='custom');
  }

  function renderSupportThread(){
    const root=$('supportMessageThreadV52');if(!root)return;
    const rows=state.data?.messages||[];
    root.innerHTML=rows.length?rows.map(m=>'<div class="message-bubble '+(m.sender_role==='customer'?'mine':'')+'"><p>'+esc(m.body)+'</p><small>'+skTime(m.created_at)+'</small></div>').join(''):'<div class="message-empty">Zatiaľ tu nemáte žiadne správy.</div>';
    requestAnimationFrame(()=>{root.scrollTop=root.scrollHeight});
  }

  async function markRead(){
    if(!state.data?.conversation_id)return;
    const unread=(state.data.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);
    if(!unread)return;
    try{
      await api({action:'mark_messages_read',conversation_id:Number(state.data.conversation_id)});
      const stamp=new Date().toISOString();
      (state.data.messages||[]).forEach(m=>{if(m.sender_role==='staff'&&!m.read_at)m.read_at=stamp});
      updateUnread();
    }catch(_){}
  }

  function open(){
    refreshSubjectOptions();
    renderSupportThread();
    $('supportChatModalV52').classList.remove('hidden');
    document.documentElement.classList.add('support-chat-open-v52');
    markRead();
  }

  function close(){
    $('supportChatModalV52').classList.add('hidden');
    document.documentElement.classList.remove('support-chat-open-v52');
  }

  async function send(e){
    e.preventDefault();
    const select=$('supportSubjectV52'),value=select.value,body=$('supportMessageBodyV52').value.trim();
    if(!body)return;
    let bookingId=null,message=body;
    if(value.startsWith('booking:'))bookingId=Number(value.slice(8))||null;
    if(value==='custom'){
      const subject=$('supportCustomSubjectV52').value.trim();
      if(subject)message='Predmet: '+subject+'\n\n'+body;
    }
    const btn=e.submitter;
    try{
      if(btn)btn.disabled=true;
      const result=await api({action:'send_message',message,booking_request_id:bookingId});
      const row=result?.data||result?.message||{id:-Date.now(),body:message,sender_role:'customer',created_at:new Date().toISOString()};
      (state.data.messages||(state.data.messages=[])).push(row);
      $('supportMessageBodyV52').value='';
      $('supportCustomSubjectV52').value='';
      select.value='';
      $('supportCustomSubjectWrapV52').classList.add('hidden');
      renderMessages();
      renderSupportThread();
      updateUnread();
      toast('Správa bola odoslaná.');
      queueCustomerSync('messages',80);
    }catch(error){toast(error.message)}
    finally{if(btn)btn.disabled=false}
  }

  function updateButton(){
    const btn=$('supportChatBtnV52');if(!btn)return;
    const appVisible=$('appShell')?!$('appShell').classList.contains('hidden'):true;
    btn.classList.toggle('hidden',!appVisible||state.activeTab!=='dog');
  }




  function ensureHint(){
    if($('supportChatHintV53'))return;
    const btn=$('supportChatBtnV52');if(!btn)return;
    btn.insertAdjacentHTML('beforebegin','<button id="supportChatHintV53" class="support-chat-hint-v53 hidden" type="button"><span>Máte otázku?</span><strong>Napíšte nám správu</strong></button>');
    $('supportChatHintV53').addEventListener('click',()=>{
      hideHint();
      $('supportChatBtnV52')?.click();
    });
  }

  function hintSeen(){
    try{return sessionStorage.getItem('chvostikovo_support_hint_v53')==='1'}catch(_){return false}
  }
  function markHintSeen(){try{sessionStorage.setItem('chvostikovo_support_hint_v53','1')}catch(_){}}
  function hideHint(){
    clearTimeout(window.__supportChatHintTimerV53);
    $('supportChatHintV53')?.classList.add('hidden');
  }
  function showHint(){
    ensureHint();
    const hint=$('supportChatHintV53');
    if(!hint||hintSeen())return;
    markHintSeen();
    hint.classList.remove('hidden');
    clearTimeout(window.__supportChatHintTimerV53);
    window.__supportChatHintTimerV53=setTimeout(hideHint,6000);
  }

  function refreshNav(){
    const nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    $('navMessages')?.setAttribute('aria-hidden','true');
    $('navMessages')?.setAttribute('tabindex','-1');
  }




  function authHeadersV55(){return {apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token}}
  let activeTermsCacheV56=null,activeTermsPromiseV56=null;
  async function activeTermsV55(force=false){
    if(!state.session)return null;
    if(activeTermsCacheV56&&!force)return activeTermsCacheV56;
    if(activeTermsPromiseV56&&!force)return activeTermsPromiseV56;
    activeTermsPromiseV56=(async()=>{
      const now=new Date().toISOString();
      const r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_documents?active=eq.true&effective_from=lte.'+encodeURIComponent(now)+'&select=id,version,title,body,effective_from&order=effective_from.desc&limit=1',{headers:authHeadersV55(),cache:'no-store'});
      if(!r.ok)throw new Error('Pravidlá sa nepodarilo načítať.');
      const rows=await r.json();return rows?.[0]||null;
    })();
    try{activeTermsCacheV56=await activeTermsPromiseV56;return activeTermsCacheV56}
    finally{activeTermsPromiseV56=null}
  }

  function ensureRulesUiV55(){
    const card=$('schoolRulesCardV55');
    if(card&&!card.dataset.rulesBoundV98){
      card.dataset.rulesBoundV98='1';
      card.addEventListener('click',openRulesV55);
    }
    if(!$('schoolRulesModalV55')){
      document.body.insertAdjacentHTML('beforeend','<div id="schoolRulesModalV55" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="schoolRulesTitleV55"><div class="legal-card terms-card"><button id="schoolRulesCloseV55" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="schoolRulesTitleV55">Pravidlá škôlky</h2><div id="schoolRulesBodyV55" class="legal-body terms-body school-rules-body-v55"></div><p id="schoolRulesAcceptedV55" class="school-rules-accepted-v55 hidden"></p><button id="schoolRulesDoneV55" class="btn full" type="button">Zavrieť</button></div></div>');
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
        if(i+1<chunks.length&&!/^\d+\.\s+/.test(chunks[i+1]))body=chunks[++i];
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
    body.innerHTML='';accepted.textContent='';accepted.classList.add('hidden');
    const request=String(Number(modal.dataset.request||0)+1);modal.dataset.request=request;
    try{
      const doc=await activeTermsV55();
      title.textContent=doc?.title||'Pravidlá škôlky';
      body.innerHTML=formatSchoolTermsV102(doc?.body||'Pravidlá škôlky momentálne nie sú dostupné.');
      modal.classList.remove('hidden');
      const dogId=Number(selectedDog()?.id||0);
      if(doc?.version&&dogId&&state.session){
        const url=SUPABASE_URL+'/rest/v1/portal_terms_acceptances?dog_id=eq.'+dogId+'&terms_version=eq.'+encodeURIComponent(doc.version)+'&select=accepted_at&order=accepted_at.desc&limit=1';
        const response=await fetch(url,{headers:authHeadersV55(),cache:'no-store'});
        if(response.ok&&modal.dataset.request===request){
          const rows=await response.json();
          if(rows?.[0]?.accepted_at){accepted.textContent='Pravidlá potvrdené '+new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(rows[0].accepted_at));accepted.classList.remove('hidden')}
        }
      }
    }catch(e){
      if(!body.innerHTML){title.textContent='Pravidlá škôlky';body.innerHTML='<p class="terms-loose-v97">'+esc(e.message||'Pravidlá sa nepodarilo načítať.')+'</p>'}
    }
    modal.classList.remove('hidden');
  }
  window.openCustomerRulesV55=openRulesV55;

  function polishMenuV55(){
    const btn=$('dogSettingsBtnV36');
    if(btn){btn.setAttribute('aria-label','Nastavenia');btn.title='Nastavenia'}
    const title=$('dogSettingsTitleV36');if(title)title.textContent='Nastavenia';
  }


  addCustomerHook('afterRenderMessages',()=>{refreshSubjectOptions();renderSupportThread()});
  addCustomerHook('afterUpdateUnread',()=>{
    const unread=(state.data?.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);
    $('supportChatUnreadV52')?.classList.toggle('hidden',!unread);
  });

  addCustomerHook('afterSwitchTab',()=>{
    updateButton();
    refreshNav();
    if(state.activeTab==='dog'){
      setTimeout(()=>{
        const btn=$('supportChatBtnV52');
        if(btn&&!btn.classList.contains('hidden'))showHint();
      },220);
    }else hideHint();
  });

  addCustomerHook('afterRenderStaff',()=>{refreshNav()});
  addCustomerHook('afterRenderDog',()=>{
    updateButton();
    ensureHint();
    refreshNav();
    setTimeout(()=>{ensureRulesUiV55();polishMenuV55()},0);
  });

  const start=()=>{
    mount();
    updateUnread();
    updateButton();
    ensureHint();
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
    document.body.insertAdjacentHTML('beforeend','<div id="vaccRenewalModalV104" class="legal-modal hidden" role="dialog" aria-modal="true"><div class="legal-card vacc-renewal-card-v104"><button id="vaccRenewalCloseV104" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="vacc-renewal-icon-v104">💉</div><h2 id="vaccRenewalTitleV104">Boli ste už preočkovať svojho psíka?</h2><div id="vaccRenewalTextV104" class="legal-body"></div><button id="vaccRenewalUpdateV104" class="btn full" type="button">Nahrať fotky a platnosť</button><button id="vaccRenewalLaterV104" class="btn secondary full" type="button">Neskôr</button></div></div>');
    modal=$('vaccRenewalModalV104');const close=()=>modal.classList.add('hidden');$('vaccRenewalCloseV104').onclick=close;$('vaccRenewalLaterV104').onclick=close;return modal;
  }
  function showV104(){
    if(window.__customerOnboardingCompleteV75!==true)return;
    if(window.__vaccinationFlowTouchedV105===true)return;
    try{if(sessionStorage.getItem('chvostikovo_vacc_flow_touched_v105')==='1')return}catch(_){}
    if(!$('dogDetailsModal')?.classList.contains('hidden'))return;
    const found=candidateV104();if(!found)return;
    const key='chvostikovo_vacc_renewal_v104_'+found.dog.id+'_'+String(found.item.v.valid_until||'');
    try{if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1')}catch(_){}
    const modal=ensureV104(),days=found.item.days;
    $('vaccRenewalTitleV104').textContent='Boli ste už preočkovať svojho psíka?';
    $('vaccRenewalTextV104').innerHTML=days<0?'<p>Platnosť jedného z očkovaní už skončila. Nahrajte nové fotografie očkovacieho preukazu a zadajte novú platnosť.</p>':days===0?'<p>Platnosť jedného z očkovaní končí dnes. Nahrajte nové fotografie očkovacieho preukazu a zadajte novú platnosť.</p>':'<p>Jedno z očkovaní bude platné už len <strong>'+days+' '+vaccinationDaysWordV96(days)+'</strong>. Po preočkovaní nahrajte nové fotografie a novú platnosť.</p>';
    $('vaccRenewalUpdateV104').onclick=()=>{modal.classList.add('hidden');state.selectedDogId=Number(found.dog.id);renderDogSelector();renderDog();switchTab('dog');setTimeout(()=>openDogDetails('vaccinations',false),60)};
    modal.classList.remove('hidden');
  }
  addCustomerHook('afterBootstrap',()=>setTimeout(showV104,700));
  window.showVaccinationRenewalV104=showV104;
})();

/* v105: iOS-safe vaccination proof selection and upload */
function clearVaccinationProofStageV104(){
  vaccinationProofPreviewUrlsV104=[];
  vaccinationProofFilesV104=[];
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
function renderVaccinationProofsV104(dogId=Number(selectedDog()?.id||0)){
  const current=$('vaccProofCurrentV104'),staged=$('vaccProofStagedV104'),count=$('vaccProofCountV104'),upload=$('vaccProofUploadV104'),msg=$('vaccProofMessageV104');
  if(!current||!staged||!count||!upload)return;
  const proofs=vaccinationProofsForDogV104(dogId);
  count.textContent=String(proofs.length);
  if(proofs.length){
    current.classList.remove('vacc-proof-empty-wrap-v105');
    current.innerHTML=proofs.map((p,i)=>'<button class="vacc-proof-thumb-v104" type="button" data-proof-index="'+i+'"><img src="'+esc(p.image_url||'')+'" alt="Očkovací preukaz '+(i+1)+'"><span>Foto '+(i+1)+'</span></button>').join('');
  }else{
    current.classList.add('vacc-proof-empty-wrap-v105');
    current.innerHTML='<button id="vaccProofEmptyV105" class="vacc-proof-empty-v105" type="button"><span class="vacc-proof-plus-v105">+</span><span>Zatiaľ nie je nahratá žiadna fotografia.</span><small>Kliknite a vyberte fotografie</small></button>';
  }
  current.querySelectorAll('[data-proof-index]').forEach(button=>button.addEventListener('click',()=>openVaccinationProofViewerV104(proofs[Number(button.dataset.proofIndex)]?.image_url)));
  $('vaccProofEmptyV105')?.addEventListener('click',()=>$('vaccProofLibraryV104')?.click());
  staged.classList.toggle('hidden',!vaccinationProofFilesV104.length);
  staged.innerHTML=vaccinationProofFilesV104.length?'<div class="vacc-proof-stage-title-v104">Vybrané nové fotografie</div><div class="vacc-proof-grid-v104">'+vaccinationProofFilesV104.map((item,i)=>'<div class="vacc-proof-thumb-v104 staged"><img src="'+item.dataUrl+'" alt="Vybraná fotografia '+(i+1)+'"><button type="button" data-remove-proof="'+i+'" aria-label="Odstrániť">×</button></div>').join('')+'</div>':'';
  staged.querySelectorAll('[data-remove-proof]').forEach(button=>button.addEventListener('click',()=>{vaccinationProofFilesV104.splice(Number(button.dataset.removeProof),1);renderVaccinationProofsV104(dogId)}));
  const busy=window.__vaccinationProofProcessingV105===true;
  upload.classList.toggle('hidden',!vaccinationProofFilesV104.length);
  upload.disabled=busy;
  upload.textContent=busy?'Spracúvam fotografie…':(proofs.length?'Nahradiť fotografiami ('+vaccinationProofFilesV104.length+')':'Nahrať fotografie ('+vaccinationProofFilesV104.length+')');
  if(msg&&!vaccinationProofFilesV104.length&&!busy)msg.textContent=proofs.length?'Fotografie sú bezpečne uložené. Pri ďalšom očkovaní ich môžete nahradiť novými.':'Na dokončenie očkovaní nahrajte aspoň jednu fotografiu.';
}
async function addVaccinationProofFilesV104(files){
  const incoming=[...(files||[])].filter(Boolean);
  if(!incoming.length)return;
  const remaining=Math.max(0,3-vaccinationProofFilesV104.length);
  if(!remaining){toast('Naraz môžete nahrať najviac 3 fotografie.');return}
  window.__vaccinationProofProcessingV105=true;
  const msg=$('vaccProofMessageV104');if(msg)msg.textContent='Spracúvam vybrané fotografie…';
  renderVaccinationProofsV104();
  try{
    for(const file of incoming.slice(0,remaining)){
      try{vaccinationProofFilesV104.push(await v105PrepareProof(file))}
      catch(error){
        const message=(String(file?.name||'Fotografia')+': '+String(error?.message||'Fotografiu sa nepodarilo spracovať.'));
        if(msg)msg.textContent=message;toast(message);
      }
    }
    if(incoming.length>remaining)toast('Naraz môžete nahrať najviac 3 fotografie.');
  }finally{
    window.__vaccinationProofProcessingV105=false;
    window.__customerPhotoPickerV88=false;
    renderVaccinationProofsV104();
  }
}
function v105PickerGuard(){
  window.__customerPhotoPickerV88=true;
  setTimeout(()=>{if(!window.__customerPhotoDecodeV88)window.__customerPhotoPickerV88=false},20000);
}
function bindVaccinationProofInputsV104(){
  const library=$('vaccProofLibraryV104'),camera=$('vaccProofCameraV104'),upload=$('vaccProofUploadV104');
  if(library&&!library.dataset.boundV105){
    library.dataset.boundV105='1';library.addEventListener('click',v105PickerGuard);
    library.addEventListener('change',async()=>{try{await addVaccinationProofFilesV104(library.files)}finally{library.value='';setTimeout(()=>{window.__customerPhotoPickerV88=false},250)}});
  }
  if(camera&&!camera.dataset.boundV105){
    camera.dataset.boundV105='1';camera.addEventListener('click',v105PickerGuard);
    camera.addEventListener('change',async()=>{try{await addVaccinationProofFilesV104(camera.files)}finally{camera.value='';setTimeout(()=>{window.__customerPhotoPickerV88=false},250)}});
  }
  if(upload&&!upload.dataset.boundV105){upload.dataset.boundV105='1';upload.addEventListener('click',()=>uploadVaccinationProofsV104(false))}
}
async function vaccinationProofFileToJpegV104(item){
  if(item?.dataUrl&&/^data:image\/jpeg;base64,/.test(item.dataUrl))return item.dataUrl;
  throw new Error('Fotografiu sa nepodarilo pripraviť. Vyberte ju znova.');
}
async function uploadVaccinationProofsV104(silent=false){
  const dog=selectedDog();if(!dog)throw new Error('Psík sa nenašiel.');
  if(!vaccinationProofFilesV104.length)return vaccinationProofsForDogV104(dog.id);
  const button=$('vaccProofUploadV104'),msg=$('vaccProofMessageV104');
  if(button)button.disabled=true;if(msg)msg.textContent='Nahrávam fotografie…';
  try{
    const images=vaccinationProofFilesV104.map(item=>item.dataUrl);
    const result=await api({action:'upload_vaccination_proofs',dog_id:Number(dog.id),images});
    const proofs=result?.data?.proofs||[];
    state.data.vaccination_proofs=(state.data.vaccination_proofs||[]).filter(p=>Number(p.dog_id)!==Number(dog.id));
    state.data.vaccination_proofs.push(...proofs);
    clearVaccinationProofStageV104();renderVaccinationProofsV104(dog.id);
    if(msg)msg.textContent='Fotografie sú bezpečne uložené.';
    if(!silent)toast('Fotografie očkovacieho preukazu sú uložené.');
    return proofs;
  }catch(error){
    const message=String(error?.message||'Fotografie sa nepodarilo nahrať.');
    if(msg)msg.textContent=message;if(!silent)toast(message);throw error;
  }finally{if(button)button.disabled=false}
}

/* v105 runtime-only visual/text patch to keep existing HTML/CSS architecture untouched */
(function customerVisualV105(){
  const pinkPaw="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 60'%3E%3Cg fill='%23f472b6'%3E%3Cellipse cx='40' cy='38' rx='15' ry='12'/%3E%3Ccircle cx='20' cy='22' r='6'/%3E%3Ccircle cx='34' cy='15' r='6'/%3E%3Ccircle cx='49' cy='16' r='6'/%3E%3Ccircle cx='61' cy='27' r='6'/%3E%3C/g%3E%3C/svg%3E\")";
  const style=document.createElement('style');
  style.id='customer-v105-runtime-style';
  style.textContent=`
  .vacc-proof-empty-wrap-v105{grid-template-columns:1fr!important}
  .vacc-proof-empty-v105{position:relative;width:100%;min-height:76px;border:1.5px dashed #fb923c;border-radius:14px;background:rgba(255,255,255,.45);color:#9a3412;padding:16px 52px 14px 14px;display:grid;gap:3px;align-content:center;text-align:left;cursor:pointer}
  .vacc-proof-empty-v105>span:not(.vacc-proof-plus-v105){font-size:12px;font-weight:750}
  .vacc-proof-empty-v105 small{font-size:10px;color:#9a3412;opacity:.72}
  .vacc-proof-plus-v105{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#ffedd5;color:#ea580c;font-size:25px;line-height:1}
  .vacc-proof-thumb-v104 img{background:#f3f4f6}.vacc-proof-thumb-v104.staged img{object-fit:cover!important}.vacc-proof-message-v104{min-height:16px}
  #customerLegalStatusCard .customer-legal-doc-v105{padding:2px 0 12px;border-bottom:1px solid var(--line)}
  #customerLegalStatusCard .customer-legal-doc-v105:last-child{border-bottom:0;padding-bottom:2px}
  #customerLegalStatusCard .customer-legal-doc-v105 .customer-legal-row{border-top:0!important;padding:10px 0 7px!important}
  #customerLegalStatusCard .customer-legal-doc-action-v105{width:100%!important;min-height:36px!important;margin:0!important;padding:8px 10px!important;justify-content:center!important;text-align:center!important;border-radius:11px!important;font-size:12px!important}
  .dog-hub-tile-v99 .dog-hub-emoji-v99{opacity:.23!important;font-size:54px!important;filter:saturate(.95) contrast(.98)!important;transform:scale(1.06);transform-origin:bottom right}
  #bookingTab::after{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background-image:${pinkPaw},${pinkPaw},${pinkPaw},${pinkPaw},${pinkPaw},${pinkPaw},${pinkPaw},${pinkPaw};background-repeat:no-repeat;background-size:108px 81px,54px 41px,82px 62px,46px 35px,96px 72px,60px 45px,74px 56px,42px 32px;background-position:-18px 24%,94% 36%,8% 52%,78% 58%,96% 69%,18% 76%,72% 88%,5% 94%;opacity:.055}
  #bookingTab>*{position:relative;z-index:1}
  @media(max-width:520px){.dog-hub-tile-v99 .dog-hub-emoji-v99{opacity:.22!important;font-size:52px!important}#bookingTab::after{background-size:94px 71px,48px 36px,72px 54px,40px 30px,84px 63px,52px 39px,66px 50px,38px 29px;background-position:-15px 23%,96% 35%,6% 51%,80% 59%,97% 69%,16% 77%,74% 88%,3% 95%;opacity:.052}}
  `;
  const mount=()=>{
    if(!document.getElementById(style.id))document.head.appendChild(style);
    const hint=document.querySelector('.vacc-proof-head-v104 small');
    if(hint)hint.textContent='Nahrajte alebo odfoťte 1 až 3 fotografie strán s platnosťou očkovaní.';
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
