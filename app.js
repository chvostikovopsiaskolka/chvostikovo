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
const SUPABASE_URL='https://tlhcqwsluyqpywymjoxn.supabase.co';
const SUPABASE_KEY='sb_publishable_43vD4AvQwchu1V2MwDbniA_j2tLiLi_';
const API=SUPABASE_URL+'/functions/v1/customer-portal-api';
const PUSH_API=SUPABASE_URL+'/functions/v1/admin-push';
const VAPID='BCFhf2kRc1P8blGDHKugmyBhCOfa-x8qbYSMo_qeO-650GSxg3I6naMHVqFTs7UOrTXotemfg9LhNElm56Zhv6k';
const SESSION_KEY='chvostikovo_customer_session';
const PASSWORD_MIN_MESSAGE='Minimálne 8 znakov, malé a veľké písmeno a aspoň 1 číslica.';
const PASSWORD_STRONG_RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
let state={data:null,session:null,storage:localStorage,selectedDogId:null,activeTab:'booking',pushChecked:false,pushEnabled:false};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skDate=v=>{if(!v)return'';try{return new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',year:'numeric'}).format(new Date(String(v).slice(0,10)+'T12:00:00'))}catch(_){return String(v)}};
const skDay=v=>{try{return new Intl.DateTimeFormat('sk-SK',{weekday:'long'}).format(new Date(v+'T12:00:00'))}catch(_){return''}};
const skTime=v=>{try{return new Intl.DateTimeFormat('sk-SK',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(_){return''}};
function bratislavaToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),map=Object.fromEntries(parts.map(x=>[x.type,x.value]));return map.year+'-'+map.month+'-'+map.day}
function dogAgeParts(birthDate,today=bratislavaToday()){if(!birthDate)return null;const b=String(birthDate).slice(0,10).split('-').map(Number),t=String(today).slice(0,10).split('-').map(Number);if(b.length!==3||t.length!==3||b.some(Number.isNaN)||t.some(Number.isNaN))return null;let months=(t[0]-b[0])*12+t[1]-b[1]-(t[2]<b[2]?1:0);if(months<0)return null;return{months,years:Math.floor(months/12)}}
function dogAgeText(birthDate,today){const age=dogAgeParts(birthDate,today);if(!age)return'';if(age.months<12){if(age.months===0)return'menej ako mesiac';if(age.months===1)return'1 mesiac';if(age.months>=2&&age.months<=4)return age.months+' mesiace';return age.months+' mesiacov'}if(age.years===1)return'1 rok';if(age.years>=2&&age.years<=4)return age.years+' roky';return age.years+' rokov'}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),3300)}
function loading(on){$('loading')?.classList.toggle('hidden',!on)}
function box(type,msg){return `<div class="${type}-box">${esc(msg)}</div>`}
function authMessage(type,msg){$('authMessage').innerHTML=box(type,msg)}
function currentSession(){for(const s of [localStorage,sessionStorage]){try{const x=JSON.parse(s.getItem(SESSION_KEY)||'null');if(x?.access_token){state.storage=s;return x}}catch(_){}}return null}
function saveSession(s,remember=true){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);state.storage=remember?localStorage:sessionStorage;state.storage.setItem(SESSION_KEY,JSON.stringify(s));state.session=s}
function clearSession(){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);state.session=null;state.data=null;stopCustomerLive();['waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75','announcementModalV75','betaVersionModal'].forEach(id=>$(id)?.classList.add('hidden'));window.__customerOnboardingCompleteV75=false}
async function authFetch(path,opts={}){const r=await fetch(SUPABASE_URL+path,{...opts,headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',...(opts.headers||{})}});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok)throw new Error(data?.msg||data?.error_description||data?.message||'Požiadavka sa nepodarila.');return data}
async function refreshSession(){if(!state.session?.refresh_token)throw new Error('Prihlásenie vypršalo.');const s=await authFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:state.session.refresh_token})});saveSession(s,state.storage===localStorage);startCustomerLive(true);return s}
async function api(body=null,retry=true){if(!state.session)throw new Error('Najprv sa prihláste.');const opts={method:body?'POST':'GET',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'}};if(body)opts.body=JSON.stringify(body);const r=await fetch(API,opts);const txt=await r.text();let data={};try{data=txt?JSON.parse(txt):{}}catch(_){data={error:txt}}if(r.status===401&&retry){await refreshSession();return api(body,false)}if(!r.ok||data.error)throw new Error(data.error||'Požiadavka sa nepodarila.');return data}
function showAuth(mode='login'){$('appView').classList.add('hidden');$('authView').classList.remove('hidden');for(const id of ['loginForm','signupForm','forgotForm','newPasswordForm'])$(id).classList.add('hidden');$('showLogin').classList.toggle('active',mode==='login');$('showSignup').classList.toggle('active',mode==='signup');$(mode==='signup'?'signupForm':mode==='forgot'?'forgotForm':mode==='newPassword'?'newPasswordForm':'loginForm').classList.remove('hidden')}
function showApp(){$('authView').classList.add('hidden');$('appView').classList.remove('hidden')}
function pluralDogs(n){return n===1?'1 prihlásený psík':n+' prihlásených psíkov'}
function freePlaces(n){n=Number(n)||0;if(n===1)return'1 voľné miesto';if(n>=2&&n<=4)return n+' voľné miesta';return n+' voľných miest'}
function taxiLabel(mode){if(mode==='pickup')return'🚕 vyzdvihnutie';if(mode==='pickup_dropoff')return'🚕 vyzdvihnutie aj dovoz';return''}
function statusLabel(s){return {pending:'Čaká na schválenie',approved:'Schválené',cancelled:'Zrušené',rejected:'Zamietnuté'}[s]||s||''}
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
function bootstrap(showSpinner=true){
  if(bootstrapInFlight)return bootstrapInFlight;
  if(showSpinner)loading(true);
  const run=(async()=>{try{
    const d=await api();state.data=d;if(!state.selectedDogId&&d.dogs?.length)state.selectedDogId=Number(d.dogs[0].id);
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
function renderAll(){renderWeekHeader();renderNotifications();renderPassSummary();renderUpcoming();renderDays();renderMessages();renderDogSelector();renderDog();renderProfile();renderStaff();updateUnread()}

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
    const previousDogs=new Map((state.data?.dogs||[]).map(d=>[Number(d.id),d]));
    const next=await api();
    for(const dog of (next.dogs||[])){const previous=previousDogs.get(Number(dog.id));const samePhoto=previous&&String(previous.photo_path||'')===String(dog.photo_path||'')&&String(previous.photo_updated_at||'')===String(dog.photo_updated_at||'');if(samePhoto&&previous?.photo_url)dog.photo_url=previous.photo_url;else if(!dog.photo_url&&previous?.photo_url)dog.photo_url=previous.photo_url}
    state.data=next;if(!state.selectedDogId&&next.dogs?.length)state.selectedDogId=Number(next.dogs[0].id);renderNotifications();
    const all=scopes.has('all'),renderDogNeeded=all||scopes.has('passes')||scopes.has('dog');
    if(all||scopes.has('bookings')){renderWeekHeader();renderUpcoming();renderDays();renderMessages()}
    if(all||scopes.has('messages')){renderMessages();updateUnread()}
    if(all||scopes.has('passes'))renderPassSummary();
    if(all||scopes.has('dog')){renderDogSelector();renderProfile()}
    if(renderDogNeeded){await preloadDogVisualV56(next);renderDog();}
    if(all||scopes.has('notifications'))renderNotifications();
    if(all||scopes.has('announcements'))await loadAnnouncements();
    renderStaff();if(typeof window.runCustomerOnboardingV75==='function')window.runCustomerOnboardingV75();
  }catch(error){if(navigator.onLine)console.warn('Live resync zlyhal',error)}finally{customerSyncInFlight=null;if(customerPendingScopes.size)queueCustomerSync('all',80)}})();
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
    if(type.includes('message'))return 'messages';if(type.includes('pass'))return 'passes';if(type.includes('announcement'))return 'announcements';return 'bookings';
  }
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
  socket.onopen=()=>{if(socket!==customerLiveSocket)return;customerLiveAttempt=0;const changes=['customer_booking_requests','customer_pass_requests','portal_notifications','portal_announcements','portal_day_settings','portal_live_events'].map(table=>({event:'*',schema:'public',table}));socket.send(JSON.stringify({topic:'realtime:customer-portal',event:'phx_join',payload:{config:{broadcast:{ack:false,self:false},presence:{enabled:false},postgres_changes:changes,private:false},access_token:state.session.access_token},ref:'1',join_ref:'1'}));customerLiveHeartbeat=setInterval(()=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(Date.now()),join_ref:null}))},20000);queueCustomerSync('all',40)};
  socket.onmessage=event=>{try{const message=JSON.parse(event.data);if(message.event==='postgres_changes')queueCustomerSync(customerScopeForMessage(message))}catch(_){}};
  socket.onerror=()=>{};socket.onclose=()=>{if(socket!==customerLiveSocket)return;customerLiveSocket=null;clearInterval(customerLiveHeartbeat);customerLiveHeartbeat=0;scheduleCustomerReconnect()};
}
function renderWeekHeader(){const days=state.data?.availability?.days||[];const el=$('weekTitle');if(!el)return;if(!days.length){el.textContent='Nasledujúce dni';return}const a=String(days[0].date||''),b=String(days[days.length-1].date||'');const pa=a.split('-').map(Number),pb=b.split('-').map(Number);if(pa.length<3||pb.length<3){el.textContent='Nasledujúce dni';return}el.textContent=pa[0]===pb[0]?`${pa[2]}. ${pa[1]}. – ${pb[2]}. ${pb[1]}. ${pb[0]}`:`${pa[2]}. ${pa[1]}. ${pa[0]} – ${pb[2]}. ${pb[1]}. ${pb[0]}`}
function careNotificationIsCurrent(n,today=bratislavaToday()){if(n.visible_from&&n.visible_from>today)return false;if(n.visible_until&&n.visible_until<today)return false;if(n.notification_type==='vaccination_expiry'){const vaccination=(state.data?.vaccinations||[]).find(v=>Number(v.id)===Number(n.entity_id));return !!vaccination?.valid_until&&vaccination.valid_until>=today&&n.event_key===`vaccination:${vaccination.dog_id}:${vaccination.vaccination_type}:${vaccination.valid_until}`}if(n.notification_type==='dog_birthday'){const dog=(state.data?.dogs||[]).find(d=>Number(d.id)===Number(n.entity_id));return !!dog?.birth_date&&String(dog.birth_date).slice(5)===today.slice(5)}return true}
const customerClosedNotificationIdsV59=new Set();
function renderNotifications(){
  const rows=(state.data?.notifications||[]).filter(n=>!n.read_at&&!customerClosedNotificationIdsV59.has(Number(n.id))&&n.notification_type!=='pass_interest_registered'&&careNotificationIsCurrent(n)).slice(0,5);
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
function renderPassSummary(){const d=selectedDog(),p=d?activePassFor(d.id):null;$('passSummary').innerHTML=p?`<span>Permanentka</span><strong>${Number(p.used_entries)||0}/${Number(p.total_entries)||0}</strong>${p.valid_until?`<small>Platí do ${skDate(p.valid_until)}</small>`:''}`:'<span>Vstup</span><strong class="single-entry-label-v75">Jednorazový</strong>'}
function futureItems(){const today=new Date().toISOString().slice(0,10);const requests=(state.data?.requests||[]).filter(r=>r.reservation_date>=today&&['pending','approved'].includes(r.status));const covered=new Set(requests.map(r=>Number(r.reservation_id)).filter(Boolean));const legacy=(state.data?.reservations||[]).filter(r=>r.reservation_date>=today&&!covered.has(Number(r.id))).map(r=>({...r,status:'approved',_legacy:true,reservation_id:r.id}));return [...requests,...legacy].sort((a,b)=>String(a.reservation_date).localeCompare(String(b.reservation_date)))}
function renderUpcoming(){const items=futureItems();$('upcomingBookings').innerHTML=`<details class="card my-bookings-card"><summary><strong>Moje rezervácie</strong><span class="my-bookings-count">${items.length}</span></summary>${items.length?`<div class="upcoming-list">${items.map(r=>{const taxi=taxiLabel(r.taxi_mode);return `<div class="upcoming-row"><div><strong>${esc(dogName(r.dog_id))} · ${skDate(r.reservation_date)}</strong><small>${esc(statusLabel(r.status))}${taxi?' · '+esc(taxi):''}</small></div><div class="upcoming-actions">${['pending','approved'].includes(r.status)&&r.can_manage!==false?`<button class="text-btn cancel-booking" data-request="${r._legacy?'':r.id||''}" data-reservation="${r._legacy?r.reservation_id||r.id:''}">Zrušiť</button>`:''}</div></div>`}).join('')}</div>`:'<div class="hint empty-bookings">Zatiaľ nemáte ďalšiu rezerváciu.</div>'}</details>`;$('upcomingBookings').querySelectorAll('.cancel-booking').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();cancelBooking(b)}));if(typeof placeDeadlineV59==='function')placeDeadlineV59()}
async function cancelBooking(btn){if(!confirm('Naozaj chcete zrušiť túto rezerváciu?'))return;try{loading(true);const requestId=Number(btn.dataset.request)||0,reservationId=Number(btn.dataset.reservation)||0;await api({action:'cancel_booking',request_id:requestId,reservation_id:reservationId,reason:null});const request=(state.data?.requests||[]).find(r=>Number(r.id)===requestId),reservation=(state.data?.reservations||[]).find(r=>Number(r.id)===reservationId);if(request)request.status='cancelled';if(reservation)reservation.status='cancelled';renderUpcoming();renderDays();renderMessages();toast('Rezervácia bola zrušená.');queueCustomerSync('bookings',80)}catch(e){toast(e.message)}finally{loading(false)}}
function bookingFor(dogId,date){return (state.data?.requests||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.reservation_date===date&&['pending','approved'].includes(r.status))||(state.data?.reservations||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.reservation_date===date)}
function renderDays(){const days=state.data?.availability?.days||[],dogs=state.data?.dogs||[];$('weekDays').innerHTML=days.map(d=>{const full=Number(d.available)<=0,closed=d.bookings_open===false;const bookedDogs=dogs.filter(x=>bookingFor(x.id,d.date));const bookableDogs=dogs.filter(x=>!bookingFor(x.id,d.date));const rosterCount=(d.dogs?.length||0)+(Number(d.anonymous_dogs)||0);const reserveLabel=bookableDogs.length===1?`Rezervovať • ${esc(bookableDogs[0].name)}`:'Rezervovať miesto';const roster=d.roster_visible&&rosterCount?`<details class="day-dog-roster"><summary>${pluralDogs(rosterCount)}</summary><div class="day-dog-list">${(d.dogs||[]).map(x=>`<div class="day-dog-item"><span class="dog-avatar small">${x.photo_url?`<img src="${esc(x.photo_url)}" alt="">`:'🐾'}</span><strong>${esc(x.name)}</strong></div>`).join('')}${Array.from({length:Number(d.anonymous_dogs)||0},()=>`<div class="day-dog-item"><span class="dog-avatar small anonymous">🐾</span><strong>Prihlásený škôlkar</strong></div>`).join('')}</div></details>`:'';const ownRows=bookedDogs.map(x=>{const r=bookingFor(x.id,d.date)||{};const taxi=taxiLabel(r.taxi_mode);return `<div class="own-booking-row"><div><strong>${esc(x.name)}</strong>${taxi?`<small>${esc(taxi)}</small>`:''}</div><span class="pill approved">${r.status==='pending'?'Čaká na schválenie':'Schválená'}</span></div>`}).join('');const reserve=!closed&&!full&&bookableDogs.length?`<div class="reserve-block"><button class="btn full reserve-open-btn" type="button">${reserveLabel}</button><div class="reserve-options hidden"><div class="reserve-options-title">${bookableDogs.length>1?'<strong>Vyberte psíka</strong>':''}${bookableDogs.length>1?`<select class="input day-dog-select">${bookableDogs.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`:`<input class="day-dog-select" type="hidden" value="${bookableDogs[0].id}">`}<strong>Potrebujete taxi?</strong></div><div class="taxi-choice-grid"><button class="taxi-choice" type="button" data-taxi="none">Bez taxi</button><button class="taxi-choice" type="button" data-taxi="pickup">Vyzdvihnúť · 5 €</button><button class="taxi-choice" type="button" data-taxi="pickup_dropoff">Vyzdvihnúť aj doviezť · 10 €</button></div></div></div>`:'';return `<div class="card day-card" data-date="${d.date}"><div class="day-main"><div><div class="day-name">${esc(skDay(d.date))},</div><div class="day-date">${skDate(d.date)}</div></div><span class="availability ${closed?'closed':full?'full':''}">${closed?'Zatvorené':full?'Plno':freePlaces(d.available)}</span></div><div class="day-actions">${d.note && !(closed && /^zatvorené$/i.test(String(d.note).trim()))?`<div class="warning-box">${esc(d.note)}</div>`:''}${roster}${ownRows}${reserve}</div></div>`}).join('');$('weekDays').querySelectorAll('.reserve-open-btn').forEach(btn=>btn.addEventListener('click',()=>{const opts=btn.parentElement.querySelector('.reserve-options');opts.classList.toggle('hidden');btn.classList.toggle('secondary',!opts.classList.contains('hidden'))}));$('weekDays').querySelectorAll('.taxi-choice').forEach(btn=>btn.addEventListener('click',()=>reserveDay(btn)))}
function applyLocalBooking(result,fallback){const row=result?.data||result?.booking||result?.request||fallback;if(!row)return;const rows=state.data?.requests||(state.data.requests=[]),index=rows.findIndex(r=>Number(r.id)===Number(row.id));if(index>=0)rows[index]={...rows[index],...row};else rows.push({...fallback,...row});renderUpcoming();renderDays();renderMessages()}
async function reserveDay(btn){const card=btn.closest('.day-card'),dog=Number(card.querySelector('.day-dog-select').value),taxi=btn.dataset.taxi||'none';const date=card?.dataset?.date;if(!date)return toast('Deň rezervácie sa nepodarilo načítať.');try{card.querySelectorAll('button').forEach(b=>b.disabled=true);const result=await api({action:'request_booking',dog_id:dog,reservation_date:date,taxi_mode:taxi});applyLocalBooking(result,{id:-Date.now(),dog_id:dog,reservation_date:date,taxi_mode:taxi,status:'pending',can_manage:true});toast('Rezervácia bola odoslaná na schválenie.');queueCustomerSync('bookings',80)}catch(e){toast(e.message)}finally{card.querySelectorAll('button').forEach(b=>b.disabled=false)}}
async function loadAnnouncements(){if(!state.session)return;try{const r=await fetch(SUPABASE_URL+'/rest/v1/portal_announcements?active=eq.true&select=id,title,body,valid_until,created_at&order=created_at.desc&limit=5',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token},cache:'no-store'});if(!r.ok)return;const rows=await r.json();$('announcementNotice').innerHTML=rows.length?`<div class="portal-announcements">${rows.map(a=>`<div class="portal-announcement"><div class="portal-announcement-head">📣 <strong>${esc(a.title)}</strong></div><div class="portal-announcement-body">${esc(a.body)}</div>${a.valid_until?`<div class="portal-announcement-until">Platí do ${skDate(a.valid_until)}</div>`:''}</div>`).join('')}</div>`:''}catch(_){}}
function renderMessages(){const rows=state.data?.messages||[];$('messageThread').innerHTML=rows.length?rows.map(m=>`<div class="message-bubble ${m.sender_role==='customer'?'mine':''}"><p>${esc(m.body)}</p><small>${skTime(m.created_at)}</small></div>`).join(''):'<div class="message-empty">Zatiaľ tu nemáte žiadne správy.</div>';setTimeout(()=>{$('messageThread').scrollTop=$('messageThread').scrollHeight},0);const opts=futureItems();$('messageBooking').innerHTML='<option value="">Bez konkrétnej rezervácie</option>'+opts.map(r=>`<option value="${r.id||''}">${esc(dogName(r.dog_id))} · ${skDate(r.reservation_date)}</option>`).join('')}
function updateUnread(){const unread=(state.data?.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);$('messageUnread').classList.toggle('hidden',!unread)}
function renderDogSelector(){const dogs=state.data?.dogs||[];$('dogSelectorWrap').classList.toggle('hidden',dogs.length<=1);$('dogSelector').innerHTML=dogs.map(d=>`<option value="${d.id}" ${Number(d.id)===Number(state.selectedDogId)?'selected':''}>${esc(d.name)}</option>`).join('')}
function totalVisits(dog){const visits=(state.data?.visits||[]).filter(v=>Number(v.dog_id)===Number(dog.id)).length;const monthly=(state.data?.monthly_totals||[]).filter(m=>Number(m.dog_id)===Number(dog.id)).reduce((s,m)=>s+Number(m.visits||0),0);return Math.max(Number(dog.legacy_total_visits)||0,visits,monthly)}
function ensureDogFormInModalV51(){
  const modal=$('dogDetailsModal'),form=$('dogForm'),card=modal?.querySelector('.dog-details-card');
  if(form&&card&&form.parentElement!==card)card.appendChild(form);
}
function dogProfileComplete(dog){return !!dog?.birth_date&&['male','female'].includes(dog?.sex)&&typeof dog?.neutered==='boolean'}
function openDogDetails(){ensureDogFormInModalV51();const dog=selectedDog();if(!dog)return;fillDogForm(dog);$('dogDetailsModal').classList.remove('hidden');document.documentElement.classList.add('dog-details-open')}
function closeDogDetails(){$('dogDetailsModal').classList.add('hidden');document.documentElement.classList.remove('dog-details-open')}
function renderDogProfilePrompt(){for(const id of ['bookingNotice','dogStatus']){const root=$(id);if(root)root.innerHTML=''}}
function renderDogHeaderV56(dog){
  const root=$('dogProfilePhoto');if(!root)return;
  const key=String(dog.id||'')+'|'+String(dog.photo_path||'')+'|'+String(dog.photo_updated_at||'')+'|'+String(dog.name||'');
  let header=root.querySelector('.dog-profile-header');
  if(!header||root.dataset.dogVisualKey!==key){
    root.innerHTML=`<div class="card dog-profile-header"><div class="dog-profile-identity"><div class="profile-photo-wrap"><span class="dog-avatar profile">${dog.photo_url?`<img src="${esc(dog.photo_url)}" alt="${esc(dog.name)}">`:'🐾'}</span><label class="photo-pencil" title="Zmeniť fotku" aria-label="Zmeniť fotku">✎<input id="dogPhotoInput" type="file" accept="image/*"></label></div><h2 class="dog-photo-name">${esc(dog.name)}</h2></div><button id="dogDetailsOpen" class="btn secondary dog-details-open" type="button"><span aria-hidden="true">✎</span> Údaje psíka</button></div>`;
    root.dataset.dogVisualKey=key;
    $('dogPhotoInput')?.addEventListener('change',openPhotoEditor);
    $('dogDetailsOpen')?.addEventListener('click',openDogDetails);
  }
}
function renderDog(){ensureDogFormInModalV51();const dog=selectedDog();if(!dog){$('dogProfilePhoto').innerHTML='';$('dogProfilePhoto').removeAttribute('data-dog-visual-key');$('dogProfileSettings').innerHTML='';$('dogStats').innerHTML=box('info','Psíka najprv priradí Chvostíkovo k vášmu účtu.');$('dogForm').classList.add('hidden');renderDogProfilePrompt();return}$('dogForm').classList.remove('hidden');state.selectedDogId=Number(dog.id);renderDogHeaderV56(dog);const cachedPush=state.pushChecked?!!state.pushEnabled:(typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('chvostikovo_push_enabled')==='1');$('dogProfileSettings').innerHTML=`<div class="card profile-settings"><div class="privacy-row"><div><strong>Upozornenia</strong><small>Rezervácie, správy a oznamy z Chvostíkova.</small></div><button id="pushToggle" class="push-switch syncing ${cachedPush?'active':''}" type="button" aria-label="Upozornenia"><span></span></button></div><div class="privacy-row"><div><strong>Zobraziť meno psa a fotku ostatným</strong><small>Súhlas môžete kedykoľvek vypnúť.</small></div><button id="privacyToggle" class="push-switch ${dog.share_name_photo?'active':''}" type="button" aria-label="Zdieľanie"><span></span></button></div></div>`;$('pushToggle').addEventListener('click',togglePush);$('privacyToggle').addEventListener('click',togglePrivacy);applyPushToggle();$('dogStats').innerHTML='';fillDogForm(dog);renderDogProfilePrompt()}
function combinedDogInfoV81(d){const parts=[d?.allergies,d?.temperament].map(v=>String(v||'').trim()).filter(Boolean),out=[];for(const part of parts){if(out.some(existing=>existing===part||existing.includes(part)))continue;out.push(part)}return out.join('\n\n')}
function syncDogAgeField(){const birth=$('dogBirthDate').value,age=$('dogAge'),automatic=dogAgeText(birth);age.value=automatic||'';age.readOnly=true;age.setAttribute('aria-readonly','true');age.placeholder=automatic?'Vypočítané z dátumu narodenia':'Vyplní sa po zadaní dátumu narodenia';age.title='Vek sa automaticky počíta z dátumu narodenia.'}
function fillDogForm(d){
  $('dogId').value=d.id;$('dogName').value=d.name||'';$('dogBirthDate').value=d.birth_date||'';syncDogAgeField();$('dogBreed').value=d.breed||'';$('dogSex').value=d.sex||'';$('dogNeutered').value=d.neutered===true?'true':d.neutered===false?'false':'';
  if($('dogAllergies'))$('dogAllergies').value=combinedDogInfoV81(d);
  const vs=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(d.id));for(const [type,a,b] of [['rabies','rabiesOn','rabiesUntil'],['infectious','infectiousOn','infectiousUntil'],['kennel_cough','kennelOn','kennelUntil']]){const v=vs.find(x=>x.vaccination_type===type)||{};$(a).value=v.vaccinated_on||'';$(b).value=v.valid_until||''}
}
async function saveDog(e){
  e.preventDefault();const neut=$('dogNeutered').value,birthDate=$('dogBirthDate').value,sex=$('dogSex').value,ageText=dogAgeText(birthDate)||'';
  const body={action:'save_dog',dog_id:Number($('dogId').value),dog_name:$('dogName').value,age_text:ageText,birth_date:birthDate,breed:$('dogBreed').value,sex,neutered:neut===''?null:neut==='true',allergies:$('dogAllergies')?.value||'',temperament:'',vaccinations:[{type:'rabies',vaccinated_on:$('rabiesOn').value,valid_until:$('rabiesUntil').value},{type:'infectious',vaccinated_on:$('infectiousOn').value,valid_until:$('infectiousUntil').value},{type:'kennel_cough',vaccinated_on:$('kennelOn').value,valid_until:$('kennelUntil').value}]};
  try{loading(true);await api(body);const dog=selectedDog();if(dog)Object.assign(dog,{name:body.dog_name,age_text:body.age_text,birth_date:body.birth_date||null,breed:body.breed||null,sex:body.sex||null,neutered:body.neutered,allergies:body.allergies||null,temperament:null});if(state.data){state.data.dog_onboarding=state.data.dog_onboarding||[];const row=state.data.dog_onboarding.find(x=>Number(x.dog_id)===Number(body.dog_id));if(row){row.details_prompt_answered_at=new Date().toISOString();row.details_prompt_skipped=false}else state.data.dog_onboarding.push({dog_id:Number(body.dog_id),details_prompt_answered_at:new Date().toISOString(),details_prompt_skipped:false})}closeDogDetails();renderDog();renderPassSummary();toast('Údaje psíka sú uložené.');queueCustomerSync('dog',80);window.runCustomerOnboardingV75?.()}catch(e){toast(e.message)}finally{loading(false)}
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
function ensurePhotoEditor(){if($('photoCropModal'))return;document.body.insertAdjacentHTML('beforeend',`<div id="photoCropModal" class="photo-modal hidden"><div class="photo-modal-card"><div class="photo-modal-head"><div><strong>Upraviť fotku</strong><small>Posuňte fotku prstom a nastavte priblíženie.</small></div><button id="photoCropClose" class="icon-btn" type="button">✕</button></div><div class="crop-shell"><canvas id="photoCropCanvas" width="640" height="640"></canvas></div><label class="zoom-label">Priblíženie<input id="photoZoom" type="range" min="1" max="3" step="0.01" value="1"></label><div class="photo-modal-actions"><button id="photoCropCancel" class="btn secondary" type="button">Zrušiť</button><button id="photoCropSave" class="btn" type="button">Použiť fotku</button></div></div></div>`);$('photoCropClose').onclick=$('photoCropCancel').onclick=closePhotoEditor;$('photoCropSave').onclick=saveCroppedPhoto;$('photoZoom').addEventListener('input',e=>{if(!state.photoEdit)return;state.photoEdit.zoom=Number(e.target.value);clampPhotoOffset();drawPhotoCrop()});const c=$('photoCropCanvas');let dragging=false,lastX=0,lastY=0;c.addEventListener('pointerdown',e=>{if(!state.photoEdit)return;dragging=true;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture(e.pointerId)});c.addEventListener('pointermove',e=>{if(!dragging||!state.photoEdit)return;const rect=c.getBoundingClientRect(),ratio=640/rect.width;state.photoEdit.ox+=(e.clientX-lastX)*ratio;state.photoEdit.oy+=(e.clientY-lastY)*ratio;lastX=e.clientX;lastY=e.clientY;clampPhotoOffset();drawPhotoCrop()});c.addEventListener('pointerup',()=>dragging=false);c.addEventListener('pointercancel',()=>dragging=false)}
async function openPhotoEditor(e){const file=e.target.files?.[0];if(!file)return;ensurePhotoEditor();try{const url=URL.createObjectURL(file),img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url});state.photoEdit={img,url,zoom:1,ox:0,oy:0};$('photoZoom').value='1';clampPhotoOffset(true);drawPhotoCrop();$('photoCropModal').classList.remove('hidden')}catch(_){toast('Fotku sa nepodarilo načítať.')}finally{e.target.value=''}}
function clampPhotoOffset(reset=false){const e=state.photoEdit;if(!e)return;const base=Math.max(640/e.img.width,640/e.img.height),scale=base*e.zoom,w=e.img.width*scale,h=e.img.height*scale;if(reset){e.ox=(640-w)/2;e.oy=(640-h)/2}e.ox=Math.min(0,Math.max(640-w,e.ox));e.oy=Math.min(0,Math.max(640-h,e.oy))}
function drawPhotoCrop(){const e=state.photoEdit;if(!e)return;const c=$('photoCropCanvas'),ctx=c.getContext('2d'),base=Math.max(640/e.img.width,640/e.img.height),scale=base*e.zoom;ctx.clearRect(0,0,640,640);ctx.drawImage(e.img,e.ox,e.oy,e.img.width*scale,e.img.height*scale)}
function closePhotoEditor(){if(state.photoEdit?.url)URL.revokeObjectURL(state.photoEdit.url);state.photoEdit=null;$('photoCropModal')?.classList.add('hidden')}
function photoJpegData(){const c=$('photoCropCanvas');for(const q of [.9,.84,.78,.72]){const data=c.toDataURL('image/jpeg',q),bytes=Math.ceil((data.length-data.indexOf(',')-1)*3/4);if(bytes<900000)return data}return c.toDataURL('image/jpeg',.68)}
async function saveCroppedPhoto(){if(!state.photoEdit)return;try{loading(true);await api({action:'upload_dog_photo',dog_id:Number(state.selectedDogId),image_data:photoJpegData()});closePhotoEditor();toast('Fotka je uložená.');await bootstrap(false)}catch(e){toast(e.message)}finally{loading(false)}}
async function uploadPhoto(e){return openPhotoEditor(e)}
function imageToJpeg(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{try{const size=512,scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale,c=document.createElement('canvas');c.width=c.height=size;c.getContext('2d').drawImage(img,(size-w)/2,(size-h)/2,w,h);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.82))}catch(e){reject(e)}};img.onerror=()=>reject(new Error('Fotku sa nepodarilo načítať.'));img.src=url})}
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
function renderStaff(){const is=!!state.data?.is_staff;$('navStaff').classList.toggle('hidden',!is);if(!is)return;const s=state.data?.staff||{};$('staffSummary').innerHTML=`<div class="stats-grid"><div class="stat-card"><span>Nové účty</span><strong>${(s.profiles||[]).filter(x=>x.status==='pending').length}</strong></div><div class="stat-card"><span>Rezervácie</span><strong>${(s.bookings||[]).length}</strong></div></div><div class="card"><strong>Správa žiadostí</strong><p class="hint">Kompletné schvaľovanie zostáva v internej Chvostíkovo aplikácii.</p></div>`}
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
function switchTab(tab){repairCustomerScrollV60();state.activeTab=tab;for(const t of ['booking','messages','dog','staff'])$(t+'Tab').classList.toggle('hidden',t!==tab);for(const t of ['Booking','Messages','Dog','Staff'])$('nav'+t)?.classList.toggle('active',t.toLowerCase()===tab);if(tab==='messages'&&state.data?.conversation_id){api({action:'mark_messages_read',conversation_id:Number(state.data.conversation_id)}).then(()=>{(state.data.messages||[]).forEach(m=>{if(m.sender_role==='staff')m.read_at=new Date().toISOString()});updateUnread()}).catch(()=>{})}}
async function sendMessage(e){e.preventDefault();const body=$('messageBody').value.trim();if(!body)return;try{const btn=e.submitter;btn.disabled=true;const result=await api({action:'send_message',message:body,booking_request_id:Number($('messageBooking').value)||null}),row=result?.data||result?.message||{id:-Date.now(),body,sender_role:'customer',created_at:new Date().toISOString()};(state.data.messages||(state.data.messages=[])).push(row);$('messageBody').value='';renderMessages();updateUnread();switchTab('messages');toast('Správa bola odoslaná.');queueCustomerSync('messages',80)}catch(e){toast(e.message)}finally{e.submitter&&(e.submitter.disabled=false)}}
function handleRecoveryHash(){const hash=new URLSearchParams(location.hash.replace(/^#/,''));const access=hash.get('access_token'),refresh=hash.get('refresh_token'),type=hash.get('type');if(access&&refresh){saveSession({access_token:access,refresh_token:refresh,expires_in:Number(hash.get('expires_in'))||3600,token_type:'bearer'},true);history.replaceState(null,'',location.pathname+location.search);if(type==='recovery'){showAuth('newPassword');return true}}return false}
async function init(){registerSW();if(handleRecoveryHash()){loading(false);return}state.session=currentSession();if(state.session)await bootstrap();else{showAuth('login');loading(false)}}
$('showLogin').addEventListener('click',()=>showAuth('login'));$('showSignup').addEventListener('click',()=>showAuth('signup'));$('forgotPasswordBtn').addEventListener('click',()=>showAuth('forgot'));$('backToLogin').addEventListener('click',()=>showAuth('login'));
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();try{loading(true);const s=await authFetch('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('loginEmail').value.trim(),password:$('loginPassword').value})});saveSession(s,$('rememberLogin').checked);await bootstrap(false)}catch(e){authMessage('error',e.message)}finally{loading(false)}});
$('signupForm').addEventListener('submit',async e=>{e.preventDefault();const password=$('signupPassword').value;if(!PASSWORD_STRONG_RE.test(password)){authMessage('error',PASSWORD_MIN_MESSAGE);$('signupPassword').focus();return}try{loading(true);const data=await authFetch('/auth/v1/signup',{method:'POST',body:JSON.stringify({email:$('signupEmail').value.trim(),password,data:{full_name:$('signupName').value.trim(),phone:$('signupPhone').value.trim(),dog_name:$('signupDogName').value.trim(),privacy_notice_version:'privacy-v1',privacy_notice_acknowledged_at:new Date().toISOString()}})});if(data?.access_token){saveSession(data,true);await bootstrap(false)}else{showAuth('login');authMessage('success','Účet je vytvorený. Ak vám prišiel potvrdzovací e-mail, potvrďte ho a prihláste sa.')}}catch(e){authMessage('error',e.message)}finally{loading(false)}});
$('forgotForm').addEventListener('submit',async e=>{e.preventDefault();try{await authFetch('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/' ),{method:'POST',body:JSON.stringify({email:$('forgotEmail').value.trim()})});authMessage('success','Odkaz na obnovu hesla sme poslali na váš e-mail.')}catch(e){authMessage('error',e.message)}});
$('newPasswordForm').addEventListener('submit',async e=>{e.preventDefault();const password=$('newPassword').value;if(!PASSWORD_STRONG_RE.test(password)){authMessage('error',PASSWORD_MIN_MESSAGE);$('newPassword').focus();return}if(password!==$('newPasswordAgain').value){authMessage('error','Heslá sa nezhodujú.');return}try{await authFetch('/auth/v1/user',{method:'PUT',headers:{Authorization:'Bearer '+state.session.access_token},body:JSON.stringify({password})});authMessage('success','Heslo je zmenené.');await bootstrap()}catch(e){authMessage('error',e.message)}});
$('logoutBtn').addEventListener('click',async()=>{
  ['dogSettingsModalV36','privacyInfoModal','schoolTermsModal','dogDetailsModal','waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75','announcementModalV75','betaVersionModal'].forEach(id=>$(id)?.classList.add('hidden'));
  document.documentElement.classList.remove('settings-open-v36');
  try{if(state.session)await authFetch('/auth/v1/logout',{method:'POST',headers:{Authorization:'Bearer '+state.session.access_token}})}catch(_){}
  clearSession();showAuth('login');
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(!standalone){
    sessionStorage.removeItem('chvostikovo_install_guide_seen_v1');
    setTimeout(()=>document.getElementById('installHelpLink')?.click(),180);
  }
});
$('navBooking').addEventListener('click',()=>switchTab('booking'));$('navDog').addEventListener('click',()=>switchTab('dog'));$('navMessages').addEventListener('click',()=>switchTab('messages'));$('navStaff').addEventListener('click',()=>switchTab('staff'));
$('dogSelector').addEventListener('change',e=>{state.selectedDogId=Number(e.target.value);renderPassSummary();renderDog()});$('dogBirthDate').addEventListener('change',()=>syncDogAgeField());$('dogForm').addEventListener('submit',saveDog);$('dogDetailsClose').addEventListener('click',closeDogDetails);$('dogDetailsModal').addEventListener('click',e=>{if(e.target===$('dogDetailsModal'))closeDogDetails()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('dogDetailsModal').classList.contains('hidden'))closeDogDetails()});$('profileForm').addEventListener('submit',saveProfile);$('accountToggle').addEventListener('click',()=>$('profileForm').classList.toggle('hidden'));$('messageForm').addEventListener('submit',sendMessage);
window.addEventListener('pageshow',()=>setTimeout(repairCustomerScrollV60,0));
window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(repairCustomerScrollV60));
function refreshOnResume(){const now=Date.now();if(!state.session||document.visibilityState==='hidden'||now-lastResumeRefresh<1500)return;lastResumeRefresh=now;startCustomerLive(true);queueCustomerSync('all',40)}
window.addEventListener('focus',refreshOnResume);window.addEventListener('online',refreshOnResume);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshOnResume();else stopCustomerLive()});
(function betaUiV75Runtime(){
  const badge=$('betaVersionBadge'),modal=$('betaVersionModal'),close=$('betaVersionClose'),messages=$('betaVersionMessages');if(!badge||!modal)return;
  badge.addEventListener('click',()=>modal.classList.remove('hidden'));close?.addEventListener('click',()=>modal.classList.add('hidden'));modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});messages?.addEventListener('click',()=>{modal.classList.add('hidden');switchTab('messages')});
})();
init();
/* v18 runtime patch: compact calendar UI + quick date search */
taxiLabel=function(mode){if(mode==='pickup')return'🚕 vyzdvihnutie/odvoz';if(mode==='pickup_dropoff')return'🚕 vyzdvihnutie aj dovoz';return''};
renderDays=function(){
  const days=state.data?.availability?.days||[],dogs=state.data?.dogs||[];
  $('weekDays').innerHTML=days.map(d=>{
    const full=Number(d.available)<=0,closed=d.bookings_open===false;
    const bookedDogs=dogs.filter(x=>bookingFor(x.id,d.date));
    const bookableDogs=dogs.filter(x=>!bookingFor(x.id,d.date));
    const rosterCount=(d.dogs?.length||0)+(Number(d.anonymous_dogs)||0);
    const reserveLabel=bookableDogs.length===1?`Rezervovať • ${esc(bookableDogs[0].name)}`:'Rezervovať miesto';
    const roster=d.roster_visible&&rosterCount?`<details class="day-dog-roster"><summary>${pluralDogs(rosterCount)}</summary><div class="day-dog-list">${(d.dogs||[]).map(x=>`<div class="day-dog-item"><span class="dog-avatar small">${x.photo_url?`<img src="${esc(x.photo_url)}" alt="">`:'🐾'}</span><strong>${esc(x.name)}</strong></div>`).join('')}${Array.from({length:Number(d.anonymous_dogs)||0},()=>`<div class="day-dog-item"><span class="dog-avatar small anonymous">🐾</span><strong>Prihlásený škôlkar</strong></div>`).join('')}</div></details>`:'';
    const ownRows=bookedDogs.map(x=>{const r=bookingFor(x.id,d.date)||{};const taxi=taxiLabel(r.taxi_mode);return `<div class="own-booking-row"><div><strong>${esc(x.name)}</strong>${taxi?`<small>${esc(taxi)}</small>`:''}</div><span class="pill approved">${r.status==='pending'?'Čaká na schválenie':'Schválená'}</span></div>`}).join('');
    const reserve=!closed&&!full&&bookableDogs.length?`<div class="reserve-block"><button class="btn full reserve-open-btn" type="button">${reserveLabel}</button><div class="reserve-options hidden"><div class="reserve-options-title">${bookableDogs.length>1?'<strong>Vyberte psíka</strong>':''}${bookableDogs.length>1?`<select class="input day-dog-select">${bookableDogs.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`:`<input class="day-dog-select" type="hidden" value="${bookableDogs[0].id}">`}<strong>Potrebujete taxi?</strong></div><div class="taxi-choice-grid"><button class="taxi-choice" type="button" data-taxi="none">Bez taxi</button><button class="taxi-choice" type="button" data-taxi="pickup">Vyzdvihnúť/odvoz · 5 €</button><button class="taxi-choice" type="button" data-taxi="pickup_dropoff">Vyzdvihnúť aj doviezť · 10 €</button></div></div></div>`:'';
    return `<div class="card day-card" data-date="${d.date}"><div class="day-main"><div><div class="day-name">${esc(skDay(d.date))},</div><div class="day-date">${skDate(d.date)}</div></div><span class="availability ${closed?'closed':full?'full':''}">${closed?'Zatvorené':full?'Plno':freePlaces(d.available)}</span></div><div class="day-actions">${d.note && !(closed && /^zatvorené$/i.test(String(d.note).trim()))?`<div class="warning-box">${esc(d.note)}</div>`:''}${ownRows}${roster}${reserve}</div></div>`
  }).join('');
  bindDayCardActions($('weekDays'));
  renderDateSearchCalendar();
};
function bindDayCardActions(root){if(!root)return;root.querySelectorAll('.reserve-open-btn').forEach(btn=>btn.addEventListener('click',()=>{const opts=btn.parentElement.querySelector('.reserve-options');opts.classList.toggle('hidden');btn.classList.toggle('secondary',!opts.classList.contains('hidden'))}));root.querySelectorAll('.taxi-choice').forEach(btn=>btn.addEventListener('click',()=>reserveDay(btn)))}
function dateSearchDayLabel(date){try{return new Intl.DateTimeFormat('sk-SK',{weekday:'short'}).format(new Date(date+'T12:00:00')).replace('.','')}catch(_){return''}}
function renderDateSearchCalendar(){const root=$('dateSearchGrid');if(!root)return;const days=(state.data?.availability?.days||[]).slice(0,10);root.innerHTML=days.map(d=>{const parts=String(d.date).split('-');return `<button class="date-search-day" type="button" data-date="${d.date}"><small>${esc(dateSearchDayLabel(d.date))}</small><strong>${Number(parts[2])}</strong><span>${Number(parts[1])}.</span></button>`}).join('');root.querySelectorAll('.date-search-day').forEach(b=>b.addEventListener('click',()=>showSearchedDay(b.dataset.date)))}
function openDateSearch(){renderDateSearchCalendar();$('dateSearchResult').innerHTML='';$('dateSearchModal').classList.remove('hidden')}
function closeDateSearch(){$('dateSearchModal').classList.add('hidden');$('dateSearchResult').innerHTML=''}
function showSearchedDay(date){const source=$('weekDays')?.querySelector(`.day-card[data-date="${date}"]`),target=$('dateSearchResult');if(!source||!target){toast('Tento deň nie je dostupný na rezerváciu.');return}const clone=source.cloneNode(true);target.innerHTML='<div class="date-search-selected-label">Vybraný deň</div>';target.appendChild(clone);bindDayCardActions(target);target.scrollIntoView({behavior:'smooth',block:'nearest'})}
function upgradeBookingLayoutV18(){const booking=$('bookingTab'),week=$('weekDays');if(!booking||!week)return;const oldHead=[...booking.querySelectorAll('.section-head')].find(x=>x.querySelector('h2')?.textContent?.trim()==='Vyberte deň');if(oldHead)oldHead.remove();if(!booking.querySelector('.booking-section-head'))week.insertAdjacentHTML('beforebegin','<div class="section-head booking-section-head"><div><h2>Vyberte deň</h2></div><button id="dateSearchBtn" class="date-search-btn" type="button" aria-label="Vyhľadať konkrétny deň" title="Vyhľadať deň"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l4.2 4.2"></path></svg></button></div><div id="deadlineText" class="deadline-card"><strong>Prosíme o rezerváciu na nasledujúci týždeň do nedele 20:00.</strong><span>Ak potrebujete individuálny termín, kontaktujte nás.</span></div>');if(!$('dateSearchModal'))document.body.insertAdjacentHTML('beforeend','<div id="dateSearchModal" class="date-search-modal hidden" role="dialog" aria-modal="true" aria-labelledby="dateSearchTitle"><div class="date-search-card"><div class="date-search-head"><div><strong id="dateSearchTitle">Vyberte konkrétny deň</strong><small>Najbližšie dva týždne</small></div><button id="dateSearchClose" class="icon-btn" type="button" aria-label="Zavrieť">✕</button></div><div id="dateSearchGrid" class="date-search-grid"></div><div id="dateSearchResult"></div></div></div>');$('dateSearchBtn')?.addEventListener('click',openDateSearch);$('dateSearchClose')?.addEventListener('click',closeDateSearch);$('dateSearchModal')?.addEventListener('click',e=>{if(e.target===$('dateSearchModal'))closeDateSearch()})}
upgradeBookingLayoutV18();
function placeDeadlineV59(){
  const deadline=$('deadlineText'),upcoming=$('upcomingBookings');
  if(deadline&&upcoming&&deadline.nextElementSibling!==upcoming)upcoming.parentElement?.insertBefore(deadline,upcoming);
}
placeDeadlineV59();

/* v19: dismissible announcements + first-open install guide */
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
  loadAnnouncements=async function(){
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
  const start=()=>{mountHelpLink();if(standalone())installedUi();else if(sessionStorage.getItem(KEY)!=='1')setTimeout(openGuide,180)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
/* v75: Supabase-backed customer onboarding state machine */
(function customerOnboardingV75Runtime(){
  const PRIVACY_VERSION='privacy-v1';let privacyMandatory=false,running=false,rerun=false;window.__customerOnboardingCompleteV75=false;
  function authHeaders(){return {apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'}}
  function flowIds(){return ['waitingDogAssignmentModalV75','pushOnboardingModalV75','shareOnboardingModalV75','dogDetailsOnboardingModalV75']}
  function hideFlow(except=''){for(const id of flowIds())if(id!==except)$(id)?.classList.add('hidden');if(except!=='schoolTermsModal')$('schoolTermsModal')?.classList.add('hidden');$('notificationPopup')?.classList.add('hidden')}
  function ensureWaiting(){if(!$('waitingDogAssignmentModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="waitingDogAssignmentModalV75" class="legal-modal onboarding-modal-v75 waiting-dog-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="waitingDogAssignmentTitleV75"><div class="legal-card waiting-dog-card-v75"><div class="legal-kicker">Chvostíkovo</div><h2 id="waitingDogAssignmentTitleV75">Registrácia je úspešná</h2><div class="legal-body"><p>Počkajte, prosím, na pridelenie psíka k vášmu profilu.</p><p class="hint">Po pridelení vám pošleme upozornenie a aplikácia sa aktualizuje automaticky.</p></div></div></div>');return $('waitingDogAssignmentModalV75')}
  function ensurePushModal(){if(!$('pushOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="pushOnboardingModalV75" class="legal-modal onboarding-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="pushOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Upozornenia</div><h2 id="pushOnboardingTitleV75">Zapnúť upozornenia?</h2><div class="legal-body"><p>Upozorníme vás napríklad na schválenie alebo zmenu rezervácie, dôležité oznamy, nové správy a blížiaci sa koniec platnosti očkovania.</p></div><button id="pushOnboardingEnableV75" class="btn full" type="button">Zapnúť upozornenia</button><button id="pushOnboardingSkipV75" class="btn secondary full onboarding-secondary-v75" type="button">Teraz nie</button></div></div>');return $('pushOnboardingModalV75')}
  function ensureShareModal(){if(!$('shareOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="shareOnboardingModalV75" class="legal-modal onboarding-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="shareOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Súkromie psíka</div><h2 id="shareOnboardingTitleV75">Zobraziť meno a fotku psíka?</h2><div class="legal-body"><p>Ak to povolíte, ostatní majitelia psíkov prihlásených v rovnaký deň uvidia meno a fotku vášho psíka. Nastavenie môžete neskôr zmeniť.</p></div><button id="shareOnboardingYesV75" class="btn full" type="button">Áno, zobrazovať</button><button id="shareOnboardingNoV75" class="btn secondary full onboarding-secondary-v75" type="button">Nie, ponechať anonymne</button></div></div>');return $('shareOnboardingModalV75')}
  function ensureDetailsModal(){if(!$('dogDetailsOnboardingModalV75'))document.body.insertAdjacentHTML('beforeend','<div id="dogDetailsOnboardingModalV75" class="legal-modal onboarding-modal-v75 hidden" role="dialog" aria-modal="true" aria-labelledby="dogDetailsOnboardingTitleV75"><div class="legal-card"><div class="legal-kicker">Údaje psíka</div><h2 id="dogDetailsOnboardingTitleV75">Doplňte údaje o psíkovi</h2><div class="legal-body"><p>Údaje nám pomôžu správne sa o psíka postarať. Dôležité sú najmä aktuálne údaje o očkovaní.</p><p>Môžete doplniť dátum narodenia, plemeno, pohlavie, kastráciu, alergie, povahu a očkovania.</p></div><button id="dogDetailsOnboardingFillV75" class="btn full" type="button">Doplniť údaje</button><button id="dogDetailsOnboardingSkipV75" class="btn secondary full onboarding-secondary-v75" type="button">Preskočiť</button></div></div>');return $('dogDetailsOnboardingModalV75')}
  function openPrivacyInfo(mandatory=false){privacyMandatory=!!mandatory;const modal=$('privacyInfoModal');if(!modal)return;hideFlow();$('privacyInfoClose')?.classList.toggle('hidden',privacyMandatory);if($('privacyInfoOk'))$('privacyInfoOk').textContent=privacyMandatory?'Potvrdiť a pokračovať':'Rozumiem';modal.classList.remove('hidden')}
  function closePrivacyInfo(){if(privacyMandatory)return;$('privacyInfoModal')?.classList.add('hidden')}
  async function acknowledgePrivacy(){if(!privacyMandatory){closePrivacyInfo();return}const btn=$('privacyInfoOk');if(btn)btn.disabled=true;try{const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_acknowledge_privacy_notice',{method:'POST',headers:authHeaders(),body:JSON.stringify({p_version:PRIVACY_VERSION})});const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(_){data=txt}if(!r.ok)throw new Error(data?.message||data?.error||'Potvrdenie sa nepodarilo uložiť.');if(state.data?.profile){state.data.profile.privacy_notice_version=PRIVACY_VERSION;state.data.profile.privacy_notice_acknowledged_at=new Date().toISOString()}privacyMandatory=false;$('privacyInfoModal')?.classList.add('hidden');runCustomerOnboardingV75()}catch(e){toast(e.message||'Potvrdenie sa nepodarilo uložiť.')}finally{if(btn)btn.disabled=false}}
  async function activeTermsDocument(){const now=new Date().toISOString(),r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_documents?active=eq.true&effective_from=lte.'+encodeURIComponent(now)+'&select=id,version,title,body,document_hash,effective_from&order=effective_from.desc&limit=1',{headers:authHeaders(),cache:'no-store'});if(!r.ok)return null;const rows=await r.json();return rows?.[0]||null}
  async function acceptedTerms(version){const r=await fetch(SUPABASE_URL+'/rest/v1/portal_terms_acceptances?terms_version=eq.'+encodeURIComponent(version)+'&select=dog_id,terms_version,accepted_at',{headers:authHeaders(),cache:'no-store'});if(!r.ok)return[];return await r.json()}
  function showSchoolTerms(dog,doc){
    const modal=$('schoolTermsModal');if(!modal)return false;
    hideFlow('schoolTermsModal');
    modal.dataset.dogId=String(dog.id);
    modal.dataset.version=String(doc.version);
    $('schoolTermsTitle').textContent=doc.title||'Podmienky škôlky';
    $('schoolTermsDog').textContent='Psík: '+(dog.name||'');
    const body=$('schoolTermsBody'),ack=$('schoolTermsAck'),confirm=$('schoolTermsConfirm');
    body.textContent=doc.body||'';
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
        hint.textContent='Podmienky ste prešli až na koniec. Teraz ich môžete potvrdiť.';
        hint.classList.add('done');
        body.removeEventListener('scroll',checkBottom);
      }else{
        hint.textContent='Prejdite podmienky až na koniec, aby sa sprístupnilo potvrdenie.';
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
  function detailsAlreadyComplete(dog){const profile=!!dog?.birth_date&&['male','female'].includes(dog?.sex)&&typeof dog?.neutered==='boolean',required=['rabies','infectious','kennel_cough'],rows=(state.data?.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(dog.id));return profile&&required.every(type=>rows.some(v=>v.vaccination_type===type&&v.valid_until))}
  function showPushPrompt(){hideFlow('pushOnboardingModalV75');const modal=ensurePushModal();modal.classList.remove('hidden');$('pushOnboardingEnableV75').onclick=async()=>{const yes=$('pushOnboardingEnableV75'),no=$('pushOnboardingSkipV75');yes.disabled=true;no.disabled=true;try{await enablePushForCurrentUserV75();modal.classList.add('hidden');toast('Upozornenia sú zapnuté.');runCustomerOnboardingV75()}catch(e){toast(e.message||'Upozornenia sa nepodarilo zapnúť.')}finally{yes.disabled=false;no.disabled=false}};$('pushOnboardingSkipV75').onclick=async()=>{const yes=$('pushOnboardingEnableV75'),no=$('pushOnboardingSkipV75');yes.disabled=true;no.disabled=true;try{await completePushPromptV75();modal.classList.add('hidden');runCustomerOnboardingV75()}catch(e){toast(e.message||'Nastavenie sa nepodarilo uložiť.')}finally{yes.disabled=false;no.disabled=false}}}
  function showSharePrompt(dog){hideFlow('shareOnboardingModalV75');const modal=ensureShareModal();modal.dataset.dogId=String(dog.id);$('shareOnboardingTitleV75').textContent='Chcete, aby ostatní používatelia videli meno a fotku '+(dog.name||'vášho psíka')+'?';const finish=async granted=>{const yes=$('shareOnboardingYesV75'),no=$('shareOnboardingNoV75');yes.disabled=true;no.disabled=true;try{await api({action:'set_photo_visibility',dog_id:Number(dog.id),granted});dog.share_name_photo=granted;state.data.visibility_consents=state.data.visibility_consents||[];state.data.visibility_consents.unshift({dog_id:Number(dog.id),granted,consent_version:'2026-09-09',created_at:new Date().toISOString()});modal.classList.add('hidden');renderDog();runCustomerOnboardingV75()}catch(e){toast(e.message||'Nastavenie sa nepodarilo uložiť.')}finally{yes.disabled=false;no.disabled=false}};$('shareOnboardingYesV75').onclick=()=>finish(true);$('shareOnboardingNoV75').onclick=()=>finish(false);modal.classList.remove('hidden')}
  function showDetailsPrompt(dog){hideFlow('dogDetailsOnboardingModalV75');const modal=ensureDetailsModal();modal.dataset.dogId=String(dog.id);$('dogDetailsOnboardingFillV75').onclick=()=>{modal.classList.add('hidden');state.selectedDogId=Number(dog.id);renderDogSelector();renderDog();switchTab('dog');openDogDetails()};$('dogDetailsOnboardingSkipV75').onclick=async()=>{const fill=$('dogDetailsOnboardingFillV75'),skip=$('dogDetailsOnboardingSkipV75');fill.disabled=true;skip.disabled=true;try{const result=await api({action:'set_dog_details_prompt',dog_id:Number(dog.id),skipped:true});state.data.dog_onboarding=state.data.dog_onboarding||[];state.data.dog_onboarding.push({dog_id:Number(dog.id),details_prompt_answered_at:result?.data?.answered_at||new Date().toISOString(),details_prompt_skipped:true});modal.classList.add('hidden');runCustomerOnboardingV75()}catch(e){toast(e.message||'Nastavenie sa nepodarilo uložiť.')}finally{fill.disabled=false;skip.disabled=false}};modal.classList.remove('hidden')}
  async function evaluate(){if(!state.session||!state.data)return;window.__customerOnboardingCompleteV75=false;try{await ensurePushState(true)}catch(_){}if(!state.data.profile?.privacy_notice_acknowledged_at){openPrivacyInfo(true);return}if(privacyMandatory){privacyMandatory=false;$('privacyInfoModal')?.classList.add('hidden')}if(!state.data.profile?.push_prompt_answered_at){showPushPrompt();return}const dogs=state.data?.dogs||[];if(!dogs.length){hideFlow('waitingDogAssignmentModalV75');ensureWaiting().classList.remove('hidden');return}ensureWaiting().classList.add('hidden');const doc=await activeTermsDocument();if(doc){const accepted=await acceptedTerms(doc.version),acceptedIds=new Set((accepted||[]).map(x=>Number(x.dog_id))),missing=dogs.find(d=>!acceptedIds.has(Number(d.id)));if(missing){showSchoolTerms(missing,doc);return}}$('schoolTermsModal')?.classList.add('hidden');const shareDog=dogs.find(d=>!visibilityDecided(d.id));if(shareDog){showSharePrompt(shareDog);return}const detailsDog=dogs.find(d=>!detailsPromptAnswered(d.id)&&!detailsAlreadyComplete(d));if(detailsDog){showDetailsPrompt(detailsDog);return}hideFlow();window.__customerOnboardingCompleteV75=true;if(typeof loadAnnouncements==='function')loadAnnouncements()}
  async function runCustomerOnboardingV75(){if(running){rerun=true;return}running=true;try{await evaluate()}catch(e){console.warn('Customer onboarding',e)}finally{running=false;if(rerun){rerun=false;setTimeout(runCustomerOnboardingV75,20)}}}
  window.runCustomerOnboardingV75=runCustomerOnboardingV75;
  document.addEventListener('click',e=>{if(e.target.closest('#privacyInfoBtn')){e.preventDefault();openPrivacyInfo(false)}if(e.target.closest('#privacyInfoClose'))closePrivacyInfo();if(e.target.closest('#privacyInfoOk'))acknowledgePrivacy();if(e.target.closest('#schoolTermsConfirm'))acceptSchoolTerms();if(e.target.closest('#schoolTermsLogout'))$('logoutBtn')?.click()});
  document.addEventListener('change',e=>{if(e.target?.id==='schoolTermsAck'&&$('schoolTermsConfirm'))$('schoolTermsConfirm').disabled=!e.target.checked});
  const originalBootstrapV75=bootstrap;bootstrap=async function(...args){const result=await originalBootstrapV75.apply(this,args);setTimeout(runCustomerOnboardingV75,60);return result};
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
    document.body.insertAdjacentHTML('beforeend','<div id="privacyInfoModal" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="privacyInfoTitle"><div class="legal-card"><button id="privacyInfoClose" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="privacyInfoTitle">Informácie o spracúvaní osobných údajov</h2><div class="legal-body"><p><strong>Prevádzkovateľ:</strong> Marek Leder – Bellaris, IČO: 56447001, miesto podnikania: Miškovecká 1023/2, 040 11 Košice-Juh. Prevádzkareň Chvostíkovo: Poľská 2207/6, 040 01 Košice-Juh. Zapísaný v Živnostenskom registri Okresného úradu Košice, č. 820-106266. Kontakt: chvostikovo.psiaskolka@gmail.com, +421 951 069 395.</p><p>V zákazníckom portáli spracúvame údaje potrebné na poskytovanie služieb škôlky, najmä meno a priezvisko, e-mail, telefónne číslo, údaje o psíkovi, rezervácie, návštevy, permanentky, taxi službu, komunikáciu so škôlkou, údaje o očkovaniach a fotografiu psíka, ak ju nahráte.</p><p>Údaje používame na správu účtu, organizáciu rezervácií a návštev, bezpečnú starostlivosť o psíka, komunikáciu a plnenie povinností súvisiacich s prevádzkou škôlky.</p><p><strong>Nepoužívame reklamné nástroje ani údaje nepredávame.</strong> Na technickú prevádzku portálu využívame poskytovateľov infraštruktúry potrebných na fungovanie aplikácie.</p><p>Údaje uchovávame počas trvania zákazníckeho vzťahu a následne po dobu potrebnú na splnenie zákonných povinností a ochranu právnych nárokov. V súvislosti so svojimi údajmi môžete požiadať o prístup, opravu, vymazanie alebo obmedzenie spracúvania, ak sú splnené zákonné podmienky.</p><p>Potvrdením pri registrácii neudeľujete marketingový súhlas. Potvrdzujete, že ste sa s týmito informáciami oboznámili.</p><p class="legal-version"></p></div><button id="privacyInfoOk" class="btn full" type="button">Rozumiem</button></div></div>');
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
    card.innerHTML='<strong style="display:block;margin-bottom:4px">Súhlasy a podmienky</strong>'+
      '<div class="customer-legal-row"><div class="customer-legal-main"><strong>Ochrana osobných údajov</strong><small>Informácie o spracúvaní osobných údajov</small></div><span class="customer-legal-status '+(privacyAt?'ok':'warn')+'">'+(privacyAt?'Potvrdené':'Nepotvrdené')+'</span></div>'+
      '<div class="customer-legal-row"><div class="customer-legal-main"><strong>Podmienky škôlky</strong><small>'+(accepted?'Odsúhlasené '+skDateTime(accepted.accepted_at):(doc?'Čakajú na potvrdenie':'Dokument zatiaľ nie je aktívny'))+'</small></div><span class="customer-legal-status '+(accepted?'ok':'warn')+'">'+(accepted?'Odsúhlasené':'Nepotvrdené')+'</span></div>'+
      '<div class="customer-legal-actions"><button id="customerPrivacyReadBtn" class="btn secondary" type="button">Ochrana údajov</button>'+(doc?'<button id="customerTermsReadBtn" class="btn secondary" type="button">Prečítať podmienky</button>':'')+'</div>';
    document.getElementById('customerPrivacyReadBtn')?.addEventListener('click',()=>document.getElementById('privacyInfoBtn')?.click());
    document.getElementById('customerTermsReadBtn')?.addEventListener('click',()=>openRead(doc));
  }
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





/* v23: compact My dog layout */
(function dogProfileLayoutV23(){
  if(window.__chvostikovoDogProfileLayoutV23)return;
  window.__chvostikovoDogProfileLayoutV23=true;

  const monthLabel=value=>{try{return new Intl.DateTimeFormat('sk-SK',{month:'long',year:'numeric'}).format(new Date(String(value).slice(0,10)+'T12:00:00'))}catch(_){return String(value||'')}};

  function detailsShell(id,title){
    let el=document.getElementById(id);
    if(el)return el;
    el=document.createElement('details');
    el.id=id;el.className='card profile-details v23-profile-section';
    el.innerHTML='<summary><span>'+title+'</span><span class="details-chevron">›</span></summary><div class="details-content"></div>';
    return el;
  }

  function mergeVaccinations(){
    const form=$('dogForm');if(!form||form.dataset.v23Merged==='1')return;
    const sections=[...form.querySelectorAll(':scope > details.profile-details')];
    if(sections.length<2)return;
    const info=sections[0],vacc=sections[1],infoBody=info.querySelector('.details-content'),vaccBody=vacc.querySelector('.details-content');
    if(!infoBody||!vaccBody)return;
    const save=infoBody.querySelector('button[type="submit"]');if(save)save.remove();
    const title=document.createElement('div');title.className='v23-subsection-title';title.textContent='Očkovania';infoBody.appendChild(title);
    [...vaccBody.children].forEach(node=>{if(node.matches?.('button[type="submit"]'))return;infoBody.appendChild(node)});
    if(save){save.textContent='Uložiť údaje psíka';infoBody.appendChild(save)}
    vacc.remove();form.dataset.v23Merged='1';
  }

  function renderConsentControls(){
    const dog=selectedDog();if(!dog)return;
    const root=$('customerLegalControlsV23');if(!root)return;
    const pushOn=state.pushChecked?!!state.pushEnabled:(typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('chvostikovo_push_enabled')==='1');
    root.innerHTML='<div class="v23-consent-row"><strong>Upozornenia</strong><button id="pushToggleV23" class="push-switch '+(pushOn?'active':'')+'" type="button" role="switch" aria-checked="'+(pushOn?'true':'false')+'"><span></span></button></div>'+ 
      '<div class="v23-consent-row"><strong>Zobraziť meno psa a fotku ostatným</strong><button id="privacyToggleV23" class="push-switch '+(dog.share_name_photo?'active':'')+'" type="button" role="switch" aria-checked="'+(dog.share_name_photo?'true':'false')+'"><span></span></button></div>';
    $('pushToggleV23')?.addEventListener('click',()=>{const b=$('pushToggle');if(b)b.click();setTimeout(apply,350)});
    $('privacyToggleV23')?.addEventListener('click',()=>{const b=$('privacyToggle');if(b)b.click();setTimeout(apply,350)});
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
    if(!section.dataset.defaultOpened){section.open=true;section.dataset.defaultOpened='1'}
    renderConsentControls();
    return section;
  }

  function renderEntry(layout){
    const dog=selectedDog();if(!dog)return null;
    const section=detailsShell('customerEntrySectionV23','Vstup a permanentka'),content=section.querySelector('.details-content');
    const pass=activePassFor(dog.id),pendingPass=(state.data?.pass_requests||[]).find(r=>Number(r.dog_id)===Number(dog.id)&&r.status==='pending');
    if(pass){
      const total=Number(pass.total_entries)||10,used=Number(pass.used_entries)||0,remaining=Math.max(0,total-used),price=Number(pass.purchase_price)||(total===20?320:200),purchased=pass.purchased_on?skDate(pass.purchased_on):'';
      const validity=pass.valid_until?'Platí do '+skDate(pass.valid_until):'Platnosť začne prvým použitím';
      content.innerHTML='<div class="v23-pass-box active"><div class="pass-top"><div><strong>Permanentka</strong><small>'+total+' vstupov'+(purchased?' · kúpená '+purchased:'')+'</small><small class="v24-pass-validity">'+validity+'</small><small class="v24-pass-remaining">Zostáva '+remaining+' vstupov</small></div><div class="v24-pass-count"><b>'+used+'/'+total+'</b><small>použité</small></div></div></div>';
    }else{
      content.innerHTML='<div class="v23-pass-box"><div class="pass-top"><div><strong>Jednorazový vstup</strong><small>Cena za jednu návštevu</small></div><b>25 €</b></div>'+
        (pendingPass?'<div class="pass-divider"></div><div class="pending-pass"><strong>Záujem o novú permanentku sme zaregistrovali.</strong><small>Nákup novej permanentky dokončíme pri najbližšej návšteve v škôlke.</small></div>':'<div class="pass-divider"></div><div class="buy-pass"><strong>Záujem o permanentku</strong><small>10 vstupov · platnosť začne prvým použitím.</small><button class="btn full request-pass-v23" type="button">10 vstupov · 200 €</button></div>')+'</div>';
      content.querySelector('.request-pass-v23')?.addEventListener('click',()=>requestPass(10));
    }
    if(section.parentElement!==layout)layout.appendChild(section);
    return section;
  }

  function renderVisitStats(layout){
    const dog=selectedDog();if(!dog)return null;
    let section=$('customerVisitStatsV23');
    if(!section||section.tagName==='DETAILS'){section?.remove();section=document.createElement('div');section.id='customerVisitStatsV23';section.className='card visit-summary-card'}
    const visitCount=totalVisits(dog);
    const grouped=new Map();
    (state.data?.monthly_totals||[]).filter(m=>Number(m.dog_id)===Number(dog.id)).forEach(m=>{const key=String(m.month||'').slice(0,7);if(key)grouped.set(key,(grouped.get(key)||0)+Number(m.visits||0))});
    const months=[...grouped.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
    section.innerHTML='<div class="visit-summary-total"><span>Návštevy celkovo</span><strong>'+visitCount+'</strong></div><details class="monthly-visits"><summary>Mesačné návštevy <span class="details-chevron">›</span></summary><div class="monthly-visits-list">'+
      (months.length?months.map(([month,count])=>'<div class="v23-month-row"><span>'+esc(monthLabel(month+'-01'))+'</span><strong>'+count+' '+(count===1?'návšteva':count>1&&count<5?'návštevy':'návštev')+'</strong></div>').join(''):'<div class="hint v23-empty-months">Mesačné štatistiky zatiaľ nie sú k dispozícii.</div>')+'</div></details>';
    if(section.parentElement!==layout)layout.appendChild(section);
    return section;
  }

  function ensureOrder(layout,nodes){
    nodes.filter(Boolean).forEach((node,index)=>{if(layout.children[index]!==node)layout.insertBefore(node,layout.children[index]||null)});
  }

  function apply(){
    const tab=$('dogTab'),dog=selectedDog();if(!tab||!dog)return;
    tab.querySelector('.section-head p')?.remove();
    $('dogProfileSettings')?.classList.add('v23-hidden-source');
    $('dogStats')?.classList.add('v23-hidden-source');
    let layout=$('dogProfileLayoutV23');
    if(!layout){layout=document.createElement('div');layout.id='dogProfileLayoutV23';layout.className='v23-profile-layout';($('dogSelectorWrap')||$('dogProfilePhoto')).insertAdjacentElement('afterend',layout)}
    const legal=mountLegal(layout),stats=renderVisitStats(layout),account=document.querySelector('.account-card');
    const settingsHome=settingsHomeV49();if(account&&settingsHome&&account.parentElement!==settingsHome)settingsHome.appendChild(account);
    ensureOrder(layout,[stats]);
  }

  const originalRenderDogV23=renderDog;
  renderDog=function(...args){const result=originalRenderDogV23.apply(this,args);requestAnimationFrame(apply);return result};
  const stats=$('dogStats');if(stats)new MutationObserver(()=>setTimeout(apply,20)).observe(stats,{childList:true});
  const settings=$('dogProfileSettings');if(settings)new MutationObserver(()=>setTimeout(apply,20)).observe(settings,{childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,100));else setTimeout(apply,100);
})();



/* v32 cleanup: static home icon; service worker is registered only by init() */
(function portalHomeIconV32(){
  const brand='https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/chvostikovo-brand-logo?v=20260914-v31';
  const applyBrand=()=>document.querySelectorAll('img[src*="/chvostikovo-logo"]').forEach(img=>{img.src=brand});
  const applyIcon=()=>{
    let apple=document.querySelector('link[rel="apple-touch-icon"]');
    if(!apple){apple=document.createElement('link');apple.rel='apple-touch-icon';document.head.appendChild(apple)}
    apple.href='/apple-touch-icon.png';
    apple.setAttribute('sizes','180x180');
  };
  const mount=()=>{applyBrand();applyIcon()};
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


/* v36: app-style navigation, dog reservation hero and settings */
(function customerAppChromeV36(){
  if(window.__chvostikovoCustomerAppChromeV36)return;
  window.__chvostikovoCustomerAppChromeV36=true;

  const calendarSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M7 3v4M17 3v4M3 10h18"></path></svg>';
  const messageSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"></path><path d="M7.5 10h9M7.5 13.5h6"></path></svg>';
  const gearSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>';

  function dogAvatarMarkup(dog,cls){
    if(dog?.photo_url)return '<span class="'+cls+'"><img src="'+esc(dog.photo_url)+'" alt=""></span>';
    return '<span class="'+cls+' fallback">🐾</span>';
  }

  function applyNav(){
    const booking=$('navBooking'),dogBtn=$('navDog'),messages=$('navMessages');
    if(!booking||!dogBtn||!messages)return;
    const dog=selectedDog();
    const unreadEl=$('messageUnread'),hasUnread=unreadEl&&!unreadEl.classList.contains('hidden');
    booking.innerHTML='<span class="nav-icon-v36">'+calendarSvg+'</span><span>Rezervácie</span>';
    const dogNavKey=String(dog?.id||'')+'|'+String(dog?.photo_path||'')+'|'+String(dog?.photo_updated_at||'')+'|'+String(dog?.name||'');if(dogBtn.dataset.dogNavKey!==dogNavKey){dogBtn.innerHTML=dogAvatarMarkup(dog,'nav-dog-avatar-v36')+'<span>Môj psík</span>';dogBtn.dataset.dogNavKey=dogNavKey}
    messages.innerHTML='<span class="nav-icon-v36">'+messageSvg+'</span><span>Správy</span><i id="messageUnread" class="nav-badge '+(hasUnread?'':'hidden')+'"></i>';
    booking.classList.add('nav-item-v36');dogBtn.classList.add('nav-item-v36');messages.classList.add('nav-item-v36');
    if(typeof updateUnread==='function')updateUnread();
  }

  function applyHero(){
    const hero=document.querySelector('#bookingTab .hero'),head=document.querySelector('#bookingTab .booking-section-head>div'),dog=selectedDog();
    if(!hero||!head||!dog)return;
    const range=$('weekTitle');
    if(range&&range.parentElement!==head){head.appendChild(range);range.classList.add('week-range-v36')}
    let info=hero.querySelector('.hero-dog-v36');
    if(!info){
      info=document.createElement('div');info.className='hero-dog-v36';
      const first=hero.firstElementChild;
      if(first)hero.replaceChild(info,first);else hero.prepend(info);
    }
    const heroDogKey=String(dog.id||'')+'|'+String(dog.photo_path||'')+'|'+String(dog.photo_updated_at||'')+'|'+String(dog.name||'');if(info.dataset.dogKey!==heroDogKey){info.innerHTML=dogAvatarMarkup(dog,'hero-dog-avatar-v36')+'<div class="hero-dog-copy-v36"><span>Rezervácie</span><strong>'+esc(dog.name||'Psík')+'</strong></div>';info.dataset.dogKey=heroDogKey}
    const summary=$('passSummary');
    if(summary){
      const text=summary.querySelector('strong')?.textContent||'';
      summary.classList.toggle('single-v36',/Jednoraz/i.test(text));
    }
  }

  function ensureSettings(){
    const tab=$('dogTab');if(!tab)return;
    const head=tab.querySelector(':scope>.section-head');
    if(head&&!$('dogSettingsBtnV36')){
      const btn=document.createElement('button');btn.id='dogSettingsBtnV36';btn.className='dog-settings-btn-v36';btn.type='button';btn.setAttribute('aria-label','Menu');btn.title='Menu';btn.innerHTML=gearSvg+'<span>Menu</span>';
      head.appendChild(btn);
      btn.addEventListener('click',openSettings);
    }
    if(!$('dogSettingsModalV36')){
      document.body.insertAdjacentHTML('beforeend','<div id="dogSettingsModalV36" class="settings-modal-v36 hidden" role="dialog" aria-modal="true" aria-labelledby="dogSettingsTitleV36"><div class="settings-card-v36"><div class="settings-head-v36"><div><small>Chvostíkovo</small><h2 id="dogSettingsTitleV36">Menu</h2><p>Účet, upozornenia a súhlasy</p></div><button id="dogSettingsCloseV36" class="settings-close-v36" type="button" aria-label="Zavrieť">×</button></div><div id="dogSettingsContentV36" class="settings-content-v36"></div></div></div>');
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
    if(account&&account.parentElement!==content)content.appendChild(account);
    if(legal&&legal.parentElement!==content){content.appendChild(legal);if(!legal.dataset.v36SettingsCollapsed){legal.open=false;legal.dataset.v36SettingsCollapsed='1'}}
    if(logout){logout.classList.remove('hidden','icon-btn');logout.classList.add('btn','secondary','full');logout.textContent='Odhlásiť sa';logout.style.marginTop='14px';content.appendChild(logout)}
  }

  function openSettings(){relocateSettings();$('dogSettingsModalV36')?.classList.remove('hidden');document.documentElement.classList.add('settings-open-v36')}
  function closeSettings(){$('dogSettingsModalV36')?.classList.add('hidden');document.documentElement.classList.remove('settings-open-v36')}

  function applyAll(){applyNav();applyHero();ensureSettings();setTimeout(relocateSettings,0)}

  const oldPass=renderPassSummary;
  renderPassSummary=function(...args){const out=oldPass.apply(this,args);setTimeout(()=>{applyHero();applyNav()},0);return out};
  const oldDog=renderDog;
  renderDog=function(...args){const out=oldDog.apply(this,args);requestAnimationFrame(applyAll);return out};

  const start=()=>{
    applyAll();
    const tab=$('dogTab');
    if(tab)new MutationObserver(()=>{clearTimeout(window.__v36SettingsMoveTimer);window.__v36SettingsMoveTimer=setTimeout(relocateSettings,25)}).observe(tab,{childList:true,subtree:true});
    document.addEventListener('change',e=>{if(e.target?.id==='dogSelector')setTimeout(applyAll,50)});
    document.addEventListener('click',e=>{if(e.target?.closest('#navBooking')||e.target?.closest('#navDog')||e.target?.closest('#navMessages'))setTimeout(()=>{applyNav();applyHero()},0)});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,120));else setTimeout(start,120);
})();


/* v37: direct settings notification + compact multi-day booking flow */
(function customerBookingAndSettingsV37(){
  if(window.__chvostikovoCustomerBookingAndSettingsV37)return;
  window.__chvostikovoCustomerBookingAndSettingsV37=true;

  let selectedDatesV37=new Set();
  let selectedTaxiV37='none';
  let submittingV37=false;

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
      quick.innerHTML='<div><strong>Upozornenia</strong><small>Rezervácie, správy a oznamy z Chvostíkova.</small></div><button id="settingsPushToggleV37" class="push-switch" type="button" role="switch" aria-label="Upozornenia"><span></span></button>';
      content.insertBefore(quick,content.firstChild||null);
      $('settingsPushToggleV37')?.addEventListener('click',()=>{
        const source=$('pushToggle');
        if(source&&!source.disabled)source.click();
        setTimeout(prepareSettingsV37,120);
        setTimeout(prepareSettingsV37,700);
      });
    }else if(content.firstElementChild!==quick){content.insertBefore(quick,content.firstChild||null)}

    const direct=$('settingsPushToggleV37');
    const on=pushOnV37();
    if(direct){direct.classList.toggle('active',on);direct.setAttribute('aria-checked',on?'true':'false')}

    const controls=$('customerLegalControlsV23');
    const notificationRow=controls?.querySelector('.v23-consent-row:first-child');
    notificationRow?.classList.add('v37-hide-notification');

    const legal=$('customerLegalSectionV23');
    if(legal)legal.open=true;
  }

  function ensurePickerV37(){
    if($('bookingPickerV37'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="bookingPickerV37" class="booking-picker-v37 hidden" role="dialog" aria-modal="true" aria-labelledby="bookingPickerTitleV37"><div class="booking-picker-card-v37"><div class="booking-picker-head-v37"><div><small>Rezervácia škôlky</small><h2 id="bookingPickerTitleV37">Vyberte deň alebo dni</h2><p id="bookingPickerRangeV37"></p></div><button id="bookingPickerCloseV37" class="booking-picker-close-v37" type="button" aria-label="Zavrieť">×</button></div><div id="bookingPickerDogWrapV37" class="booking-picker-dog-v37 hidden"><label for="bookingPickerDogV37">Psík</label><select id="bookingPickerDogV37" class="input"></select></div><div id="bookingPickerDaysV37" class="booking-picker-days-v37"></div><div class="booking-picker-taxi-title-v37">Taxi pre vybrané dni</div><div id="bookingPickerTaxiV37" class="booking-picker-taxi-v37"><button type="button" data-taxi="none" class="active">Bez taxi</button><button type="button" data-taxi="pickup">Vyzdvihnúť · 5 €</button><button type="button" data-taxi="pickup_dropoff">Tam aj späť · 10 €</button></div><button id="bookingPickerSubmitV37" class="btn full booking-picker-submit-v37" type="button" disabled>Vyberte deň</button></div></div>`);
    $('bookingPickerCloseV37').addEventListener('click',closePickerV37);
    $('bookingPickerV37').addEventListener('click',e=>{if(e.target===$('bookingPickerV37'))closePickerV37()});
    $('bookingPickerDogV37').addEventListener('change',e=>{
      state.selectedDogId=Number(e.target.value);
      selectedDatesV37.clear();
      renderPassSummary();
      renderDog();
      renderUpcoming();
      renderDays();
      renderPickerV37();
    });
    $('bookingPickerTaxiV37').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      selectedTaxiV37=btn.dataset.taxi||'none';
      $('bookingPickerTaxiV37').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));
    }));
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
      const existing=bookingFor(dog.id,d.date),closed=d.bookings_open===false,full=Number(d.available)<=0;
      const disabled=!!existing||closed||full;
      const selected=selectedDatesV37.has(d.date);
      const stateText=existing?'Rezervované':closed?'Zatvorené':full?'Plno':`${Math.max(0,Number(d.available)||0)} voľné`;
      return `<button type="button" class="booking-day-v37 ${selected?'selected':''} ${existing?'booked':''} ${disabled?'disabled':''}" data-date="${d.date}" ${disabled?'disabled':''}><small>${esc(shortDayV37(d.date))}</small><strong>${esc(compactDateV37(d.date))}</strong><span>${esc(stateText)}</span></button>`;
    }).join('');
    $('bookingPickerDaysV37').querySelectorAll('.booking-day-v37:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>{
      const date=btn.dataset.date;
      if(selectedDatesV37.has(date))selectedDatesV37.delete(date);else selectedDatesV37.add(date);
      renderPickerV37();
    }));

    $('bookingPickerTaxiV37').querySelectorAll('button').forEach(x=>x.classList.toggle('active',(x.dataset.taxi||'none')===selectedTaxiV37));
    const submit=$('bookingPickerSubmitV37'),count=selectedDatesV37.size;
    submit.disabled=!count||submittingV37;
    submit.textContent=count?`Rezervovať ${count===1?'1 deň':count<5?count+' dni':count+' dní'}`:'Vyberte deň';
  }

  function openPickerV37(){
    selectedDatesV37.clear();selectedTaxiV37='none';
    renderPickerV37();
    $('bookingPickerV37').classList.remove('hidden');
    document.documentElement.classList.add('booking-picker-open-v37');
  }
  function closePickerV37(){if(submittingV37)return;$('bookingPickerV37')?.classList.add('hidden');document.documentElement.classList.remove('booking-picker-open-v37')}

  async function submitPickerV37(){
    const dog=selectedDog(),dates=[...selectedDatesV37].sort();
    if(!dog||!dates.length||submittingV37)return;
    submittingV37=true;renderPickerV37();
    let ok=0;const failed=[];
    for(const date of dates){
      try{const result=await api({action:'request_booking',dog_id:Number(dog.id),reservation_date:date,taxi_mode:selectedTaxiV37});applyLocalBooking(result,{id:-(Date.now()+ok),dog_id:Number(dog.id),reservation_date:date,taxi_mode:selectedTaxiV37,status:'pending',can_manage:true});ok++}
      catch(e){failed.push({date,error:e.message||'Nepodarilo sa rezervovať.'})}
    }
    try{if(ok)queueCustomerSync('bookings',80)}finally{submittingV37=false}
    if(ok){closePickerV37();toast(ok===dates.length?(ok===1?'Rezervácia bola odoslaná na schválenie.':`${ok} rezervácie boli odoslané na schválenie.`):`Odoslané ${ok} z ${dates.length} rezervácií.`)}
    else{renderPickerV37();toast(failed[0]?.error||'Rezerváciu sa nepodarilo odoslať.')}
  }

  function bookingRosterV37(day){
    const count=(day?.dogs?.length||0)+(Number(day?.anonymous_dogs)||0);
    if(!count)return '<span class="reserved-roster-count-v37">Zatiaľ bez ďalších psíkov</span>';
    if(!day?.roster_visible)return `<span class="reserved-roster-count-v37">${esc(pluralDogs(count))}</span>`;
    return `<details class="reserved-roster-v37"><summary>${esc(pluralDogs(count))}</summary><div>${(day.dogs||[]).map(x=>`<span>${x.photo_url?`<i class="reserved-roster-avatar-v37"><img src="${esc(x.photo_url)}" alt=""></i>`:'<i class="reserved-roster-avatar-v37">🐾</i>'}<b>${esc(x.name)}</b></span>`).join('')}${Array.from({length:Number(day.anonymous_dogs)||0},()=>'<span><i class="reserved-roster-avatar-v37">🐾</i><b>Prihlásený škôlkar</b></span>').join('')}</div></details>`;
  }

  renderUpcoming=function(){
    const root=$('upcomingBookings'),dog=selectedDog();if(!root)return;
    const own=futureItems().filter(r=>!dog||Number(r.dog_id)===Number(dog.id));
    root.innerHTML=`<button id="openBookingPickerV37" class="booking-launch-v37" type="button"><span class="booking-launch-icon-v37"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M7 3v4M17 3v4M3 10h18M12 13v5M9.5 15.5h5"></path></svg></span><span><strong>Chcem prihlásiť psíka</strong><small>Vyberte jeden alebo viac dní naraz</small></span><b>›</b></button>`;
    $('openBookingPickerV37')?.addEventListener('click',openPickerV37);
    const h=document.querySelector('#bookingTab .booking-section-head h2');if(h)h.textContent='Moje rezervácie';
  };

  renderDays=function(){
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


/* v38: offer a new 10-entry pass when the last current entry is reserved */
(function customerPassRenewalV38(){
  if(window.__chvostikovoCustomerPassRenewalV38)return;
  window.__chvostikovoCustomerPassRenewalV38=true;
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
  function requestCopyV38(dogId){
    if(pendingPassV38(dogId))return '<div class="pending-pass pass-interest-copy"><strong>Záujem o novú permanentku sme zaregistrovali.</strong><small>Nákup novej permanentky dokončíme pri najbližšej návšteve v škôlke.</small></div>';
    return '<div class="buy-pass pass-renewal-v38"><strong>Posledný vstup z permanentky je už rezervovaný</strong><small>Môžete si pripraviť ďalšiu 10-vstupovú permanentku za 200 €.</small><small><b>Platnosť novej permanentky začne až jej prvým použitím.</b></small><button class="btn full request-pass-renewal-v38" type="button">Mám záujem o novú permanentku</button></div>';
  }
  function renderInlineV38(){
    const dog=selectedDog(),content=document.querySelector('#customerEntrySectionV23 .details-content');
    document.getElementById('passRenewalInlineV38')?.remove();
    if(!dog||!content||!lastEntryReservedV38(dog.id))return;
    const box=document.createElement('div');box.id='passRenewalInlineV38';box.className='pass-interest-block';box.innerHTML=requestCopyV38(dog.id);content.appendChild(box);
    box.querySelector('.request-pass-renewal-v38')?.addEventListener('click',async()=>{state.selectedDogId=Number(dog.id);await requestPass(10)});
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
    button.onclick=async()=>{button.disabled=true;try{await requestPass(10);modal.classList.add('hidden');renderInlineV38()}finally{button.disabled=false}};
    modal.classList.remove('hidden');
  }

  const oldApiV38=api;
  api=async function(body=null,...rest){
    const result=await oldApiV38.call(this,body,...rest);
    if(body?.action==='request_booking')bookingDogV38=Number(body.dog_id)||0;
    return result;
  };
  const oldBootstrapV38=bootstrap;
  bootstrap=async function(...args){
    const result=await oldBootstrapV38.apply(this,args);
    setTimeout(renderInlineV38,0);
    const dogId=bookingDogV38;bookingDogV38=0;
    if(dogId)setTimeout(()=>showPromptV38(dogId),120);
    return result;
  };
  const oldRenderDogV38=renderDog;
  renderDog=function(...args){const result=oldRenderDogV38.apply(this,args);requestAnimationFrame(renderInlineV38);return result};
  document.addEventListener('change',e=>{if(e.target?.id==='dogSelector')setTimeout(renderInlineV38,120)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(renderInlineV38,500));else setTimeout(renderInlineV38,500);
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


/* v52: compact profile stats + floating support chat modal */
(function customerSupportChatV52(){
  if(window.__chvostikovoSupportChatV52)return;
  window.__chvostikovoSupportChatV52=true;

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
            '<div class="legal-kicker">Chvostíkovo</div>'+
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

  const originalRenderMessagesV52=renderMessages;
  renderMessages=function(...args){
    const result=originalRenderMessagesV52.apply(this,args);
    refreshSubjectOptions();
    renderSupportThread();
    return result;
  };

  const originalUpdateUnreadV52=updateUnread;
  updateUnread=function(...args){
    const result=originalUpdateUnreadV52.apply(this,args);
    const unread=(state.data?.messages||[]).some(m=>m.sender_role==='staff'&&!m.read_at);
    $('supportChatUnreadV52')?.classList.toggle('hidden',!unread);
    return result;
  };

  const originalSwitchTabV52=switchTab;
  switchTab=function(tab){
    if(tab==='messages')tab='dog';
    const result=originalSwitchTabV52(tab);
    updateButton();
    return result;
  };

  const originalRenderDogV52=renderDog;
  renderDog=function(...args){
    const result=originalRenderDogV52.apply(this,args);
    updateButton();
    return result;
  };

  const start=()=>{mount();updateUnread();updateButton()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* v53: polish My dog onboarding, two-item nav and discoverable support chat */
(function customerProfilePolishV53(){
  if(window.__chvostikovoCustomerProfilePolishV53)return;
  window.__chvostikovoCustomerProfilePolishV53=true;

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

  const prevSwitchTabV53=switchTab;
  switchTab=function(tab){
    const result=prevSwitchTabV53(tab);
    refreshNav();
    if(state.activeTab==='dog'){
      setTimeout(()=>{
        const btn=$('supportChatBtnV52');
        if(btn&&!btn.classList.contains('hidden'))showHint();
      },220);
    }else hideHint();
    return result;
  };

  const prevRenderStaffV53=renderStaff;
  renderStaff=function(...args){
    const result=prevRenderStaffV53.apply(this,args);
    refreshNav();
    return result;
  };

  const prevRenderDogV53=renderDog;
  renderDog=function(...args){
    const result=prevRenderDogV53.apply(this,args);
    ensureHint();
    refreshNav();
    return result;
  };

  const start=()=>{ensureHint();refreshNav()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* v55: school rules card, terms sharing choice and menu polish */
(function customerRulesAndMenuV55(){
  if(window.__chvostikovoRulesMenuV55)return;window.__chvostikovoRulesMenuV55=true;

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
    const profile=$('dogProfilePhoto');if(!profile)return;
    let card=$('schoolRulesCardV55');
    if(!card){
      card=document.createElement('button');
      card.id='schoolRulesCardV55';
      card.className='card school-rules-card-v55';
      card.type='button';
      card.innerHTML='<span class="school-rules-icon-v55"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h8l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path><path d="M14.5 3.5V7H18M9 11h6M9 14h6M9 17h4"></path></svg></span><span class="school-rules-copy-v55"><strong>Pravidlá škôlky</strong><small>Prečítajte si pravidlá Chvostíkova</small></span><span class="school-rules-chevron-v55">›</span>';
      card.addEventListener('click',openRulesV55);
    }
    if(profile.nextElementSibling!==card)profile.insertAdjacentElement('afterend',card);

    if(!$('schoolRulesModalV55')){
      document.body.insertAdjacentHTML('beforeend','<div id="schoolRulesModalV55" class="legal-modal hidden" role="dialog" aria-modal="true" aria-labelledby="schoolRulesTitleV55"><div class="legal-card terms-card"><button id="schoolRulesCloseV55" class="legal-close" type="button" aria-label="Zavrieť">×</button><div class="legal-kicker">Chvostíkovo</div><h2 id="schoolRulesTitleV55">Pravidlá škôlky</h2><div id="schoolRulesBodyV55" class="legal-body terms-body school-rules-body-v55"></div><button id="schoolRulesDoneV55" class="btn full" type="button">Zavrieť</button></div></div>');
      const close=()=>$('schoolRulesModalV55')?.classList.add('hidden');
      $('schoolRulesCloseV55').addEventListener('click',close);
      $('schoolRulesDoneV55').addEventListener('click',close);
      $('schoolRulesModalV55').addEventListener('click',e=>{if(e.target===$('schoolRulesModalV55'))close()});
    }
  }

  async function openRulesV55(){
    ensureRulesUiV55();
    const modal=$('schoolRulesModalV55'),body=$('schoolRulesBodyV55'),title=$('schoolRulesTitleV55');
    try{
      const doc=await activeTermsV55();
      title.textContent=doc?.title||'Pravidlá škôlky';
      body.textContent=doc?.body||'Pravidlá škôlky momentálne nie sú dostupné.';
    }catch(e){
      title.textContent='Pravidlá škôlky';
      body.textContent=e.message||'Pravidlá sa nepodarilo načítať.';
    }
    modal.classList.remove('hidden');
  }

  function polishMenuV55(){
    const btn=$('dogSettingsBtnV36');
    if(btn){btn.setAttribute('aria-label','Menu');btn.title='Menu'}
    const title=$('dogSettingsTitleV36');if(title)title.textContent='Menu';
  }

  const oldRenderDogV55=renderDog;
  renderDog=function(...args){
    const result=oldRenderDogV55.apply(this,args);
    setTimeout(()=>{ensureRulesUiV55();polishMenuV55()},0);
    return result;
  };

  const start=()=>{ensureRulesUiV55();polishMenuV55();activeTermsV55().catch(()=>{})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* v71: push subscription self-heal; duplicate legal-document layer removed */
(function customerPushHealV71(){
  if(window.__chvostikovoCustomerPushHealV71)return;
  window.__chvostikovoCustomerPushHealV71=true;

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

  const previousBootstrapV71=bootstrap;
  bootstrap=async function(...args){
    const result=await previousBootstrapV71.apply(this,args);
    setTimeout(healPushV71,80);
    return result;
  };

  function startV71(){
    setTimeout(healPushV71,900);
    setTimeout(healPushV71,2600);
  }

  window.addEventListener('pageshow',()=>setTimeout(healPushV71,250));
  window.addEventListener('focus',()=>setTimeout(healPushV71,350));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')setTimeout(healPushV71,350);
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startV71,{once:true});
  else startV71();
})();
