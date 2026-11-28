/* V-039: presentation layer over the current customer runtime. */
(() => {
  'use strict';
  if(/Android/i.test(navigator.userAgent))document.documentElement.classList.add('customer-android');
  const byId = id => document.getElementById(id);
  const icon = name => `<svg aria-hidden="true"><use href="#ci-${name}"/></svg>`;
  let modalReturn = null;
  let rosterDate = null;
  let cancellationResolveV326 = null;
  function ensureModal() {
    let root = byId('customerDesignModal');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'customerDesignModal'; root.className = 'design-modal hidden';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'customerDesignModalTitle');
    root.innerHTML = '<section class="design-modal-card"><header><div><h2 id="customerDesignModalTitle"></h2><p id="customerDesignModalSubtitle"></p></div><button type="button" class="design-modal-close" aria-label="Zavrieť">×</button></header><div id="customerDesignModalBody"></div></section>';
    root.querySelector('button').addEventListener('click', closeModal);
    root.addEventListener('click', e => { if (e.target === root) closeModal(); });
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
      if (e.key !== 'Tab') return;
      const nodes = [...root.querySelectorAll('button,a[href],input,[tabindex="0"]')].filter(n => !n.disabled);
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0]?.focus(); }
    });
    document.body.append(root); return root;
  }
  function closeModal() {
    const resolve=cancellationResolveV326;cancellationResolveV326=null;resolve?.(null);
    byId('customerDesignModal')?.classList.add('hidden'); rosterDate = null;
    document.documentElement.classList.remove('design-modal-open');
    if (modalReturn?.isConnected) modalReturn.focus({preventScroll:true});
  }
  function showModal(title, subtitle, female = true) {
    const root = ensureModal(); modalReturn = document.activeElement;
    root.classList.toggle('design-male', !female);
    byId('customerDesignModalTitle').textContent = title;
    byId('customerDesignModalSubtitle').textContent = subtitle;
    root.classList.remove('hidden'); document.documentElement.classList.add('design-modal-open');
    root.querySelector('button').focus({preventScroll:true});
  }
  window.customerChooseCancelReasonV326=row=>new Promise(resolve=>{
    closeModal();
    const dog=state.data?.dogs?.find(d=>Number(d.id)===Number(row.dog_id));
    showModal('Zrušiť rezerváciu',`${dog?.name||'Psík'} · ${skDay(row.reservation_date)} ${skDate(row.reservation_date)}`,dog?.sex!=='male');
    cancellationResolveV326=resolve;
    byId('customerDesignModalBody').innerHTML='<div class="design-cancel-reasons"><button type="button" data-cancel-reason="none">Bez udania dôvodu</button><button type="button" data-cancel-reason="illness">Psík ochorel</button><button type="button" data-cancel-reason="reschedule">Chcem zmeniť termín</button></div>'+(customerManagementClosedV314(row.reservation_date)?'<p class="design-cancel-deadline">Po uzávierke odošlite žiadosť o zrušenie v správe škôlke.</p>':'');
    byId('customerDesignModalBody').querySelectorAll('[data-cancel-reason]').forEach(button=>button.addEventListener('click',()=>{cancellationResolveV326=null;closeModal();resolve(button.dataset.cancelReason);}));
  });
  function selectDog(id) {
    if (!state.data?.dogs?.some(d => Number(d.id) === Number(id))) return false;
    if (Number(state.selectedDogId) !== Number(id)) {
      rememberVaccineDraftV287(); clearVaccinationProofStageV104(); state.selectedDogId = Number(id);
      renderDogSelector(); renderPassSummary(); renderDog(); renderUpcoming(); renderDays();
    }
    return true;
  }
  function openVaccineSummary(id) {
    const dog = state.data?.dogs?.find(d => Number(d.id) === Number(id)); if (!dog) return;
    const rows = (state.data.vaccinations || []).filter(v => Number(v.dog_id) === Number(id));
    const types = [['rabies','Besnota'],['infectious','Infekčné ochorenia'],['kennel_cough','Kotercový kašeľ']];
    if (rows.some(v => v.vaccination_type === 'lepto_l4')) types.push(['lepto_l4','Leptospiróza L4']);
    const statuses = types.map(([type,label]) => {
      const row = rows.filter(v => v.vaccination_type === type).sort((a,b) => String(b.valid_until || '').localeCompare(String(a.valid_until || '')))[0];
      const status=vaccinationValidityV96(row?.valid_until);
      return {label,row,status:{...status,text:status.kind==='valid'?status.text.replace('Platnosť: ešte','Platné ešte'):status.text.replace(/^Platnosť:\s*ešte/, 'Platnosť ešte').replace(/^Platnosť:\s*/, '')}};
    });
    const expired = statuses.some(v => v.status.kind === 'expired');
    const warning = statuses.some(v => v.status.kind === 'warning');
    const missing = statuses.some(v => v.status.kind === 'neutral');
    showModal('Očkovania', dog.name, dog.sex !== 'male');
    const body = byId('customerDesignModalBody');
    body.innerHTML = `${expired || warning || missing ? `<p class="design-vaccine-notice ${expired?'expired':'warning'}">${expired?'Niektoré očkovania už nie sú platné.':missing?'Doplňte chýbajúce očkovania alebo doklad.':'Blíži sa koniec platnosti očkovania.'} ${warning || expired?'Nezabudnite preočkovať svojho psíka a aktualizovať doklad, aby ste predišli zablokovaniu ďalších rezervácií.':''}</p>`:''}<div class="design-vaccine-list">${statuses.map(v => `<div class="design-vaccine-row"><span>${esc(v.label)}${v.row?.valid_until?`<small>Platí do ${esc(skDate(v.row.valid_until))}</small>`:''}</span><strong class="${v.status.kind}">${esc(v.status.text.replace(/^Platnosť:\s*ešte/, 'Platnosť ešte').replace(/^Platnosť:\s*/, '').replace(/^Platné očkovanie/,'Platné'))}</strong></div>`).join('')}</div><button type="button" id="designOpenVaccines" class="btn full">Otvoriť očkovania ${icon('chevron-right')}</button>`;
    byId('designOpenVaccines').addEventListener('click', () => { closeModal(); if (selectDog(id)) openDogDetails('vaccinations', false); });
  }
  function approvedForDate(date) {
    return futureItems().some(r => r.reservation_date === date && r.status === 'approved' && state.data.dogs.some(d => Number(d.id) === Number(r.dog_id)));
  }
  function friends(date) {
    if (!approvedForDate(date)) return [];
    const day = state.data?.availability?.days?.find(d => d.date === date);
    const own = state.data?.dogs || [];
    const visible = (day?.dogs || []).filter(d => !own.some(o => d.dog_id != null ? Number(o.id) === Number(d.dog_id) : String(o.customer_name || o.name).trim() === String(d.name).trim()));
    const ownNotListed = own.filter(o => futureItems().some(r => Number(r.dog_id)===Number(o.id) && r.reservation_date===date && r.status==='approved') && !(day?.dogs || []).some(d => d.dog_id != null ? Number(d.dog_id)===Number(o.id) : d.name===(o.customer_name||o.name))).length;
    const anonymous = Math.max(0, Number(day?.anonymous_dogs || 0) - ownNotListed);
    visible.sort((a,b)=>Number(!!b.photo_url)-Number(!!a.photo_url));
    return [...visible, ...Array.from({length:anonymous},(_,i) => ({name:'Prihlásený škôlkar',anonymous:true,key:'anonymous-'+i}))];
  }
  function photoNode(dog, className) {
    const el = document.createElement('span'); el.className = className + (dog.sex==='male'?' male':dog.sex==='female'?' female':'');
    el.dataset.friendKey = String(dog.dog_id || dog.key || dog.name);
    // Keep the tile dimensions stable without a paw over real photo uploads.
    // Non-photo / consent-hidden friends retain the pre-existing paw marker.
    if (dog.photo_url) {
      const img = document.createElement('img');
      img.alt = dog.name || 'Psík'; img.decoding='async'; img.loading='eager';
      const reveal = async () => {
        try { if (typeof img.decode === 'function') await img.decode(); } catch (_) {}
        if (el.contains(img) && img.naturalWidth > 0) el.classList.add('design-photo-ready-v404');
      };
      img.addEventListener('load', () => { void reveal(); }, {once:true});
      img.addEventListener('error', () => el.classList.add('design-photo-failed-v404'), {once:true});
      el.append(img); img.src = dog.photo_url;
      if (img.complete && img.naturalWidth > 0) void reveal();
    } else el.innerHTML = icon('paw');
    el.dataset.photoVersion = String(dog.photo_updated_at || dog.photo_path || dog.photo_url?.split('?')[0] || '');
    return el;
  }
  function reconcilePhotos(root, dogs) {
    const wanted = new Set(dogs.map(d => String(d.dog_id || d.key || d.name)));
    [...root.children].forEach(n => { if (!wanted.has(n.dataset.friendKey)) n.remove(); });
    dogs.forEach((dog,i) => {
      const key=String(dog.dog_id || dog.key || dog.name),version=String(dog.photo_updated_at || dog.photo_path || dog.photo_url?.split('?')[0] || '');
      let node=[...root.children].find(n=>n.dataset.friendKey===key);
      if (!node || node.dataset.photoVersion!==version) { const next=photoNode(dog,'design-friend-photo'); if(node)node.replaceWith(next); node=next; }
      if(root.children[i]!==node)root.insertBefore(node,root.children[i]||null);
    });
  }
  let friendOpenGenerationV404=0;
  async function openFriendsPreparedV404(date,button) {
    if(!approvedForDate(date))return;
    const generation=++friendOpenGenerationV404,owner=state.session?.user?.id;
    const urls=[...new Set(friends(date).map(d=>d.photo_url).filter(Boolean))].slice(0,12);
    if(!urls.length){openFriends(date);return;}
    const original=button?.innerHTML;
    if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Načítavam fotografie…';}
    try{
      await Promise.race([
        Promise.allSettled(urls.map(url=>new Promise(resolve=>{
          const img=new Image();let finished=false;
          const done=async(ok)=>{if(finished)return;finished=true;clearTimeout(timer);
            if(ok&&typeof img.decode==='function')try{await img.decode()}catch(_){}
            resolve();
          };
          const timer=setTimeout(()=>{void done(false)},3200);
          img.onload=()=>{void done(true)};img.onerror=()=>{void done(false)};img.src=url;
          if(img.complete&&img.naturalWidth>0)void done(true);
        }))),
        new Promise(resolve=>setTimeout(resolve,3400))
      ]);
      if(generation===friendOpenGenerationV404&&state.session?.user?.id===owner&&approvedForDate(date))openFriends(date);
    }finally{
      if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original;}
    }
  }
  function openFriends(date) {
    if (!approvedForDate(date)) return;
    const updating=rosterDate===date&&!byId('customerDesignModal')?.classList.contains('hidden');
    if(!updating)showModal('Kamaráti v škôlke', skDay(date)+' '+skDate(date),selectedDog()?.sex!=='male'); rosterDate=date;
    const body=byId('customerDesignModalBody'); if(!updating)body.replaceChildren();
    const rows=friends(date);
    if(!rows.length){body.textContent='Zatiaľ tu nie sú ďalší kamaráti.';return;}
    body.querySelector('p')?.remove();
    const wanted=new Set(rows.map(d=>String(d.dog_id||d.key||d.name)));
    [...body.children].forEach(row=>{if(!wanted.has(row.dataset.rosterKey))row.remove();});
    rows.forEach((d,i)=>{const key=String(d.dog_id||d.key||d.name);let row=[...body.children].find(row=>row.dataset.rosterKey===key);if(!row){row=document.createElement('div');row.className='design-roster-row';row.dataset.rosterKey=key;row.append(photoNode(d,'design-friend-photo'),document.createElement('strong'));}else{const version=String(d.photo_updated_at||d.photo_path||d.photo_url?.split('?')[0]||'');const oldPhoto=row.querySelector('.design-friend-photo');if(oldPhoto?.dataset.photoVersion!==version)oldPhoto?.replaceWith(photoNode(d,'design-friend-photo'));}row.querySelector('strong').textContent=d.name||'Prihlásený škôlkar';if(body.children[i]!==row)body.insertBefore(row,body.children[i]||null);});
  }
  // Calendar days in Bratislava; inclusive validity, independent of visits and DST.
  function passValidityV452(source){
    if(!bellaEnabledV450())return null;
    const day=value=>{
      if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return NaN;
      const date=new Date(value+'T00:00:00Z');
      return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?date.getTime()/86400000:NaN;
    };
    const start=day(source.dataset.validityStartV452),end=day(source.dataset.validityEndV452),today=day(bratislavaToday());
    if(![start,end,today].every(Number.isFinite)||end<start||end<today)return null;
    const total=end-start+1,remaining=Math.min(total,Math.max(0,end-today+1));
    const elapsedPercent=end===start?(today>=start?100:0):Math.max(0,Math.min(100,(today-start)/(end-start)*100));
    return {remaining,elapsedPercent,level:remaining<=3?'red':remaining/total<.25?'yellow':'green'};
  }
  function ticket() {
    const source=byId('passSummary'),dog=selectedDog(); if(!source||!dog)return;
    let root=byId('designTicket');
    const originalTitle=source.querySelector('span')?.textContent||'Vstup',counts=source.querySelector('strong')?.textContent||'';
    if(counts==='Jednorazový'||counts==='Single visit'){root?.remove();return;}
    if(!root){root=document.createElement('section');root.id='designTicket';root.className='design-ticket';root.setAttribute('aria-label','Permanentka a vstupy');(byId('customerInboxV363')||byId('bookingDogProfile')).after(root);}
    root.classList.toggle('male',dog.sex==='male');
    root.classList.toggle('design-ticket-single',counts==='Jednorazový');
    const isEn=window.ChvostikovoLocale?.getLanguage?.()==='en';
    // Source is translated live (0 z 10 → 0 of 10); neither locale may erase pass paws.
    const match=counts.match(/(\d+)\s+(?:z|of)\s+(\d+)/i),small=[...source.querySelectorAll('small')].map(x=>x.textContent).filter(s=>s!=='Použité vstupy'&&s!=='Visits used').join(' · ');
    const validity=small.replace(/(\d{2})\.(\d{2})\.(\d{4})/g,(_,d,m,y)=>`${d}. ${m}. ${y.slice(-2)}`).replace(/(\d{4})/g,y=>y.slice(-2));
    const date=small.match(/(?:Platí do|Valid until|\bdo)\s+(.*)/i)?.[1];
    const badge=date?(isEn?'Use by ':'Využiť do ')+date:validity.replace(/^(?:Platnosť |Validity )/,'');
    const usage=match?(isEn?`Used <strong>${Number(match[1])} of ${Number(match[2])} visits</strong>`:`Použité <strong>${Number(match[1])} z ${Number(match[2])} vstupov</strong>`):'';
    root.setAttribute('aria-label',isEn?'Pass and visits':'Permanentka a vstupy');
    const progress=match&&date?passValidityV452(source):null;
    root.classList.toggle('design-pass-validity-v452',!!progress);
    if(progress)root.dataset.validityLevel=progress.level;else delete root.dataset.validityLevel;
    const presentationKey=JSON.stringify([originalTitle,counts,small,dog.sex,isEn,progress]);
    if(root.dataset.presentationKey===presentationKey)return;
    root.dataset.presentationKey=presentationKey;
    const material=root.querySelector(':scope > .lg-v3-material');
    root.innerHTML=`<div class="design-ticket-head"><h2 aria-label="${esc(originalTitle)}">${icon("ticket")}<span>${esc(originalTitle)}</span></h2></div><div class="design-ticket-usage">${match?`<p>${usage}</p>`:`<p class="design-single-entry"><strong>${esc(counts==='Jednorazový'?'Jednorazový vstup':counts)}</strong></p>`}${badge?`<span class="design-validity" title="${esc(small)}">${esc(badge)}</span>`:''}</div>${match?`<div class="design-paws" aria-hidden="true">${Array.from({length:Number(match[2])},(_,i)=>`<span class="${i<Number(match[1])?'used':''}">${icon('pass-paw')}</span>`).join('')}</div>`:''}`;
    if(progress){
      const meter=document.createElement('div');meter.className='design-pass-meter-v452';meter.setAttribute('role','progressbar');meter.setAttribute('aria-label',isEn?'Pass validity elapsed':'Uplynutá platnosť permanentky');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',String(Math.round(progress.elapsedPercent)));meter.setAttribute('aria-valuetext',isEn?`${progress.remaining} days remaining, including today`:`Zostávajúce dni vrátane dneška: ${progress.remaining}`);
      const fill=document.createElement('span');fill.style.width=progress.elapsedPercent+'%';meter.dataset.complete=String(progress.elapsedPercent===100);meter.append(fill);root.querySelector('.design-paws')?.before(meter);
    }
    if(material)root.prepend(material);
  }
  // A locale switch doesn't change the account data; repaint just its pass presentation.
  window.customerDesignRefreshLocaleV420=()=>{if(state.data)ticket();};
  // Presentation only; booking eligibility and capacity enforcement remain server-owned.
  function calendarCapacityLevelV439(day){
    return day.bookings_open===false?'closed':Number(day.available)<=0?'full':Number(day.occupied)>=6?'limited':'free';
  }
  function overviewGuidanceV442(root){
    const model=window.customerOverviewBookingGuidanceV442?.();if(!model)return;
    const host=root.querySelector('.design-visit-empty')||root;
    let block=root.querySelector('.design-booking-guidance-v442');
    if(!block){block=document.createElement('div');block.className='design-booking-guidance-v442';block.innerHTML='<div id="designReservationNotice" class="design-empty-reminder"></div><div id="designWeekDeadline"><strong>Nestihli ste rezervovať miesto do nedele?</strong><span>Kliknite na Rezervovať miesto, vyberte deň, odošlite žiadosť a počkajte na schválenie v prípade voľného miesta.</span></div>';}
    if(block.parentElement!==host){const anchor=host.querySelector(':scope > .design-empty-heading,:scope > .design-visits-title');if(anchor)anchor.after(block);else host.prepend(block);}
    const next=block.querySelector('#designReservationNotice'),missed=block.querySelector('#designWeekDeadline');
    if(next.dataset.noticeText!==model.next.text){next.textContent=model.next.text;next.dataset.noticeText=model.next.text;}next.dataset.deadline=model.next.deadline;
    next.dataset.weekFrom=model.next.from;next.dataset.weekTo=model.next.to;next.hidden=!!model.next.hidden;
    missed.dataset.weekFrom=model.from;missed.dataset.weekTo=model.to;missed.hidden=!model.missed;
    block.hidden=next.hidden&&missed.hidden;
  }
  // v450: visual-only, fail-closed account pilot. No account email or raw UUID in the bundle.
  const BELLA_PILOT_ACCOUNT_SHA256_V450='288c196a3d8f47da8e96737e2c1753be2db7b1864c406c95e312c7687e0dcd66';
  let bellaCheckedV450='',bellaAllowedV450='',bellaEpochV450=0,bellaSizeObserverV453=null;
  const bellaAccountV450=()=>String(state.session?.user?.id||'');
  const bellaReadyV450=()=>!!bellaAccountV450()&&!!state.session?.access_token&&state.data?.profile?.status==='active'&&!!state.data?.dogs?.length;
  const bellaEnabledV450=()=>bellaReadyV450()&&bellaAllowedV450===bellaAccountV450();
  window.customerBellaPilotEnabledV453=bellaEnabledV450;
  function bellaMiddleV454(){
    const overview=byId('bookingTab'),profile=byId('bookingDogProfile');if(!overview||!profile||!bellaEnabledV450())return;
    let scroll=byId('bellaOverviewScrollV454'),created=false;
    if(!scroll){scroll=document.createElement('div');scroll.id='bellaOverviewScrollV454';scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Prehľad');scroll.tabIndex=0;profile.after(scroll);created=true;}
    let previous=null;
    for(const id of ['customerInboxV363','designTicket','designNearest','customerNoticeOverviewV376','notificationList']){
      const node=byId(id);if(!node)continue;
      const target=previous?previous.nextElementSibling:scroll.firstElementChild;
      if(node!==target)scroll.insertBefore(node,target);previous=node;
    }
    if(created)window.customerPollRefreshLayoutV454?.();
    return scroll;
  }
  function restoreBellaMiddleV454(){
    const scroll=byId('bellaOverviewScrollV454');if(!scroll)return;
    window.customerPollRestoreMenuV454?.();
    while(scroll.firstChild)scroll.before(scroll.firstChild);scroll.remove();
  }
  function clearBellaUiV450(){
    document.documentElement.classList.remove('bella-pilot-active-v450');
    bellaSizeObserverV453?.disconnect();bellaSizeObserverV453=null;
    byId('bookingTab')?.style.removeProperty('--bella-height-v453');
    byId('customerBellaPilotV450')?.remove();
    restoreBellaMiddleV454();
    const ticketRoot=byId('designTicket');
    if(ticketRoot?.classList.contains('design-pass-validity-v452')){ticketRoot.classList.remove('design-pass-validity-v452');delete ticketRoot.dataset.validityLevel;delete ticketRoot.dataset.presentationKey;ticketRoot.querySelector('.design-pass-meter-v452')?.remove();}
    if(!bellaReadyV450())document.querySelectorAll('.bella-capacity-v450').forEach(el=>el.remove());
  }
  window.customerBellaPilotClearV450=()=>{++bellaEpochV450;bellaCheckedV450='';bellaAllowedV450='';clearBellaUiV450();};
  function checkBellaV450(){
    const id=bellaAccountV450();
    if(!bellaReadyV450()){if(bellaCheckedV450||bellaAllowedV450)window.customerBellaPilotClearV450();return;}
    if(id===bellaCheckedV450)return;
    window.customerBellaPilotClearV450();bellaCheckedV450=id;
    const epoch=bellaEpochV450;
    // A real authenticated session is needed; browsers without WebCrypto simply see the normal UI.
    if(!globalThis.crypto?.subtle||typeof TextEncoder!=='function')return;
    void crypto.subtle.digest('SHA-256',new TextEncoder().encode(id)).then(bytes=>{
      if(epoch!==bellaEpochV450||id!==bellaAccountV450()||!bellaReadyV450())return;
      const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
      if(hash!==BELLA_PILOT_ACCOUNT_SHA256_V450)return;
      bellaAllowedV450=id;ticket();window.customerRefreshNoticeOverviewV376?.();renderBellaV450();renderNotifications();
      if(!byId('bookingPickerV37')?.classList.contains('hidden'))window.customerDesignPickerRender?.();
    }).catch(()=>{});
  }
  function bellaCopyV450(){
    const model=window.customerOverviewBookingGuidanceV442?.();if(!model?.next)return null;
    const en=document.documentElement.lang==='en',tr=(sk,english)=>en?english:sk;
    const messages=window.customerBellaNotificationsV454?.()||[];
    const alert=messages.find(n=>n.type!=='poll_invitation');
    if(alert){const body=[alert.title,alert.body].filter(Boolean).join(' · ');return {text:tr('Haf! ','Woof! ')+body,action:alert.type==='pass_expiry'?tr('Vybrať termín','Choose a date'):tr('Rozumiem','Got it'),notification:alert.id};}
    const notice=window.customerBellaPriorityNoticeV450?.();
    if(notice&&Number.isFinite(notice.id)&&notice.id>0)return {text:tr('Haf! Máme pre vás nový oznam. ','Woof! We have a new announcement. ')+notice.title,action:tr('Otvoriť oznam','Open announcement'),notice:notice.id};
    const poll=window.customerPollPriorityV454?.();
    if(poll){const invite=messages.find(n=>n.type==='poll_invitation');return {text:tr('Haf! Zaujíma nás váš názor. Zapojte sa do hlasovania.','Woof! We would love your opinion. Take part in our poll.'),action:tr('Zobraziť hlasovanie','View poll'),poll:true,notification:invite?.id};}
    const next=model.next,bookings=futureItems().filter(r=>r.reservation_date>=next.from&&r.reservation_date<=next.to&&['pending','approved'].includes(r.status));
    const dogIds=new Set(bookings.map(r=>Number(r.dog_id))),names=(state.data.dogs||[]).filter(d=>dogIds.has(Number(d.id))).map(d=>String(d.name||'')).filter(Boolean);
    const bookAction=tr('Rezervovať miesto','Book a place');
    if(model.missed)return {text:tr('Haf! Nestihli ste rezervovať miesto do nedele? Ak je ešte voľné miesto, vyberte deň a odošlite žiadosť.','Woof! Missed the Sunday deadline? If there is still a free place, choose a date and send a request.'),action:bookAction};
    if(bookings.length&&names.length){
      const joined=new Intl.ListFormat(en?'en':'sk',{style:'long',type:'conjunction'}).format(names);
      const pending=bookings.some(r=>r.status==='pending');
      return {text:pending?tr('Haf! Ďakujeme za rezerváciu. Žiadosť pre '+joined+' čaká na schválenie.','Woof! Thanks for booking. A request for '+joined+' is awaiting approval.'):tr('Haf! Ďakujeme za rezerváciu. Tešíme sa na návštevu: '+joined+'!','Woof! Thanks for booking. We look forward to seeing '+joined+'!')};
    }
    const clock=overviewClock();
    if(clock.date===next.deadline&&clock.minutes>=1200)return {text:tr('Haf! Riadna uzávierka na budúci týždeň už skončila. Ak je ešte voľné miesto, pošlite žiadosť.','Woof! The regular deadline for next week has passed. If a place is available, send a request.'),action:bookAction};
    if(!next.hidden){
      const date=new Intl.DateTimeFormat(en?'en-GB':'sk-SK',{day:'numeric',month:'numeric',timeZone:'UTC'}).format(new Date(next.deadline+'T12:00:00Z'));
      const days=Math.max(0,Math.round((Date.parse(next.deadline+'T12:00:00Z')-Date.parse(clock.date+'T12:00:00Z'))/86400000));
      const sk=days===0?'Haf! Dnes do 20:00 rezervujte miesto na ďalší týždeň.':days===1?'Haf! Na rezerváciu zostáva už len 1 deň. Do nedele '+date+' do 20:00.':days<=4?'Haf! Na rezerváciu zostávajú '+(days===2?'už len ':'')+days+' dni. Do nedele '+date+' do 20:00.':'Haf! Rezervujte miesto na ďalší týždeň do nedele '+date+' do 20:00.';
      return {text:tr(sk,'Woof! '+(days===0?'Book today by 8 PM.':days===1?'Only 1 day left to book. By Sunday '+date+' at 8 PM.':days+' days left to book. By Sunday '+date+' at 8 PM.')),action:bookAction};
    }
    return {text:tr('Haf! Tešíme sa na ďalšie dni v Chvostíkove.','Woof! We look forward to more days at Chvostíkovo.')};
  }
  function renderBellaV450(){
    if(!bellaEnabledV450()){clearBellaUiV450();return;}
    const anchor=byId('designNearest'),overview=byId('bookingTab');if(!anchor||!overview){clearBellaUiV450();return;}
    bellaMiddleV454();
    const copy=bellaCopyV450();if(!copy){clearBellaUiV450();return;}
    let host=byId('customerBellaPilotV450');
    if(!host){
      host=document.createElement('section');host.id='customerBellaPilotV450';host.className='bella-pilot-v450';host.setAttribute('translate','no');host.setAttribute('aria-label','Bella');
      const photo=document.createElement('img');photo.src='/bella-pilot-v453.webp';photo.alt='';photo.decoding='async';photo.width=58;photo.height=60;
      const bubble=document.createElement('div');bubble.className='bella-bubble-v450';
      const name=document.createElement('strong');name.textContent='Bella';const message=document.createElement('p');message.className='bella-message-v450';
      const action=document.createElement('button');action.type='button';action.className='bella-action-v450';action.onclick=()=>{
        if(!bellaEnabledV450())return;
        if(action.dataset.notification)window.customerBellaActNotificationV454?.(Number(action.dataset.notification));
        else if(action.dataset.poll==='true')window.customerPollOpenOverviewV454?.();
        else if(action.dataset.notice)void window.openCustomerAnnouncementV363?.(Number(action.dataset.notice));
        else window.openBookingPickerV37?.();
      };
      bubble.append(name,message,action);host.append(photo,bubble);
    }
    const msg=host.querySelector('.bella-message-v450'),action=host.querySelector('.bella-action-v450');
    if(msg.textContent!==copy.text)msg.textContent=copy.text;
    if(action.textContent!==(copy.action||''))action.textContent=copy.action||'';
    action.hidden=!copy.action;action.dataset.notice=copy.notice?String(copy.notice):'';
    action.dataset.notification=copy.notification?String(copy.notification):'';action.dataset.poll=String(!!copy.poll);
    host.dataset.notice=String(!!copy.notice);
    if(host.parentElement!==overview)overview.append(host);
    if(!bellaSizeObserverV453&&typeof ResizeObserver==='function'){
      bellaSizeObserverV453=new ResizeObserver(()=>{if(!bellaEnabledV450()||!host.isConnected)return;const height=host.getBoundingClientRect().height;if(height>0)overview.style.setProperty('--bella-height-v453',Math.ceil(height)+'px');});
      bellaSizeObserverV453.observe(host);
    }
    document.documentElement.classList.add('bella-pilot-active-v450');
  }
  window.customerBellaRefreshV450=()=>{if(bellaEnabledV450())renderBellaV450();};
  // Keep the text in the chosen language even when no customer data changes.
  new MutationObserver(()=>{if(bellaEnabledV450())renderBellaV450();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  function bellaCapacityV450(button,day,showCapacity){
    let bar=button.querySelector('.bella-capacity-v450');
    const capacity=Number(day.capacity),occupied=Number(day.occupied);
    if(!bellaReadyV450()||!showCapacity||!['free','limited'].includes(button.dataset.capacityLevel)||day.capacity==null||day.occupied==null||!Number.isFinite(capacity)||capacity<=0||!Number.isFinite(occupied)||occupied<0){bar?.remove();return;}
    if(!bar){bar=document.createElement('i');bar.className='bella-capacity-v450';bar.setAttribute('aria-hidden','true');bar.append(document.createElement('i'));button.append(bar);}
    bar.firstElementChild.style.width=(Math.min(1,occupied/capacity)*100)+'%';
  }
  function nearest() {
    checkBellaV450();
    if(!state.data){clearBellaUiV450();return;}
    if(!selectedDog()){clearBellaUiV450();byId('designNearest')?.remove();byId('designTicket')?.remove();byId('designBulletinTitle')?.remove();return;}
    ticket();
    const anchor=byId('designTicket')||byId('customerInboxV363');if(!anchor)return;
    let root=byId('designNearest');
    if(!root){root=document.createElement('section');root.id='designNearest';root.className='design-nearest';anchor.after(root);}
    const clock=overviewClock(),end=new Date(clock.date+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+14);
    const all=futureItems().filter(r=>overviewDayVisible(r.reservation_date,clock));
    const dates=[...new Set(all.filter(r=>r.reservation_date<end.toISOString().slice(0,10)).map(r=>r.reservation_date))].sort();
    if(dates.length){
      if(!root.querySelector('.design-overview-carousel'))root.innerHTML='<div class="design-visits-title"><h2>📅 Moje rezervácie</h2><small>Posuňte pre zobrazenie ďalších dní →</small></div><div class="design-overview-carousel" role="region" aria-label="Rezervované návštevy" tabindex="0"></div>';
      root.querySelector('.design-visits-title small').hidden=dates.length<2;
      const carousel=root.querySelector('.design-overview-carousel');
      [...carousel.children].forEach(card=>{if(!dates.includes(card.dataset.visitDate))card.remove();});
      dates.forEach((date,i)=>{
        const approved=approvedForDate(date),pending=all.some(r=>r.reservation_date===date&&r.status==='pending'),status=approved?'approved':pending?'pending':'rejected';
        let card=[...carousel.children].find(n=>n.dataset.visitDate===date);
        if(!card){card=document.createElement('article');card.className='design-visit-card';card.dataset.visitDate=date;}
        if(card.dataset.status!==status){
          card.dataset.status=status;
          card.innerHTML=`<div class="design-nearest-head">${icon('calendar')}<strong><span class="design-visit-label"></span>${esc(skDay(date).slice(0,2).toLowerCase())} ${esc(skDate(date).replace(/\s*20\d{2}$/, ''))}</strong><button type="button" class="design-visit-edit" aria-label="Upraviť rezerváciu na ${esc(skDate(date))}"><span aria-hidden="true">✎</span> Upraviť</button>${approved?'<span class="design-approved" aria-label="Schválená">✓</span>':status==='pending'?'<span class="design-visit-status pending" aria-label="Čaká na schválenie" title="Čaká na schválenie">?</span>':'<span class="design-visit-status rejected" aria-label="Zamietnutá" title="Zamietnutá">×</span>'}</div>${approved?'<div class="design-friends-line"><div class="design-friend-strip"></div></div>':`<p class="design-waiting-friends">${status==='pending'?'Čaká na schválenie. Kamarátov uvidíte po schválení rezervácie.':'Rezervácia bola zamietnutá.'}</p>`}<div class="design-visit-footer"><div class="design-visit-entries"></div>${approved?'<button type="button" class="design-friends-button design-friends-inline">Zobraziť kamošov v škôlke <span aria-hidden="true">›</span></button>':''}</div>`;
          if(approved)card.querySelector('.design-friends-button').addEventListener('click',event=>{void openFriendsPreparedV404(date,event.currentTarget)});
          card.querySelector('.design-visit-edit').addEventListener('click',()=>window.customerDesignEditReservation(date));
        }
        card.setAttribute('aria-label',`${i===0?'Najbližšia návšteva, ':''}${skDay(date)} ${skDate(date)}`);
        card.querySelector('.design-visit-label').textContent='Najbližšia návšteva · ';
        const entryRows=all.filter(r=>r.reservation_date===date),multi=(state.data.dogs||[]).length>1;
        card.querySelector('.design-visit-entries').innerHTML=entryRows.map(row=>{const label=bookingEntrySummaryV326(row).label;if(!label)return '';const dog=state.data.dogs.find(d=>Number(d.id)===Number(row.dog_id));return `<div>${icon('ticket')} ${multi?esc(dog?.name||'Psík')+' · ':''}${esc(label)}</div>`;}).join('');
        if(carousel.children[i]!==card)carousel.insertBefore(card,carousel.children[i]||null);
        if(approved){
          const rows=friends(date).slice(0,5),strip=card.querySelector('.design-friend-strip');
          reconcilePhotos(strip,rows);
          let empty=card.querySelector('.design-no-friends');
          if(!rows.length&&!empty){empty=document.createElement('p');empty.className='design-no-friends';empty.textContent='Zatiaľ sa neprihlásil žiaden kamoš.';strip.after(empty);}
          if(rows.length)empty?.remove();
        }

      });
    }else{
      const key=all.length?'outside-range':'empty';
      if(root.dataset.date!==key||root.querySelector('.design-overview-carousel')){
        root.dataset.date=key;root.innerHTML=`<div class="design-visits-title"><h2>📅 Moje rezervácie</h2></div><article class="design-visit-card design-visit-empty"><p class="design-empty-heading">${all.length?'Najbližšia rezervácia je neskôr než o dva týždne.':'Zatiaľ nemáte vytvorenú rezerváciu.'}</p>${all.length?'<button type="button" class="btn full">Moje rezervácie</button>':''}</article>`;
        root.querySelector('button')?.addEventListener('click',()=>window.openBookingPickerV37?.());
      }
    }
    root.querySelector('.compact-overview-v437')?.remove();
    overviewGuidanceV442(root);
    byId('designBulletinTitle')?.remove();
    const inbox=byId('customerInboxV363'),profile=byId('bookingDogProfile'),scroll=byId('bellaOverviewScrollV454');if(inbox&&scroll&&bellaEnabledV450()){if(scroll.firstElementChild!==inbox)scroll.prepend(inbox);}else if(inbox&&profile?.nextElementSibling!==inbox)profile?.after(inbox);
    window.customerRefreshNoticeOverviewV376?.();
    if(bellaEnabledV450())renderBellaV450();
  }
  function layout() {
    document.documentElement.classList.toggle('customer-liquid-v364',!!state.session&&!!state.data);
    if(!state.data)return;
    document.documentElement.classList.add('customer-design');
    const profile=byId('bookingDogProfile'),content=profile?.querySelector('.dog-overview-content');
    if(content&&!byId('designDogName')){
      const name=document.createElement('button');name.type='button';name.id='designDogName';name.className='design-dog-name';
      name.append(byId('bookingDogName'));content.prepend(name);
      name.addEventListener('click',()=>byId('bookingDogDetailsOpenV242').click());
      byId('bookingGradebook').before(byId('bookingVisitCount'));
    }
    if(profile)profile.dataset.designSex=selectedDog()?.sex||'';
    byId('bookingVisitCount')?.querySelector('.design-visits-emoji')?.remove();
    byId('bookingMultiDogsV241')?.querySelectorAll('.dual-dog-visits-v254').forEach(el=>{if(!el.querySelector('.design-visits-emoji'))el.insertAdjacentHTML('afterbegin','<span class="design-visits-emoji" aria-hidden="true">'+icon('chart')+'</span>');});
    const nav=byId('navBooking');if(nav){const label=nav.querySelector(':scope > span:last-child');if(label)label.textContent='Prehľad';}
    ticket();nearest();if(rosterDate){if(approvedForDate(rosterDate))openFriends(rosterDate);else closeModal();}
  }
  function reservationPresentationV360(root,preview=false){
    root?.querySelectorAll('.reserved-roster-v37').forEach(details=>{const card=details.closest('[data-date]'),date=card?.dataset.date;if(!date||(!preview&&!approvedForDate(date)))return;const button=document.createElement('button');button.type='button';button.className='design-carousel-friends';button.textContent='Pozrite si kamošov v škôlke ›';if(!preview)button.addEventListener('click',()=>openFriends(date));details.replaceWith(button);});
  }
  window.customerGuideReservationPresentationV360=root=>reservationPresentationV360(root,true);
  const originalDays=customerRenderers.days;
  customerRenderers.days=(...args)=>{const out=originalDays?.(...args);reservationPresentationV360(byId('weekDays'));nearest();if(!byId('bookingPickerV37')?.classList.contains('hidden'))window.customerDesignPickerRender?.();return out;};
  window.customerDesignPickerRender=()=>{
    checkBellaV450();
    const picker=byId('bookingPickerV37'),card=picker?.querySelector('.booking-picker-card-v37');if(!card)return;
    // Resume/bootstrap can advance availability while this page remains open.
    const calendar=byId('bookingPickerDaysV37');if(!calendar)return;
    const days=window.customerPickerDaysV393?.()||[],tiles=calendar.querySelectorAll('.booking-day-v37[data-date]');
    if((days[0]?.date||'')!==(tiles[0]?.dataset.date||'')||(days[days.length-1]?.date||'')!==(tiles[tiles.length-1]?.dataset.date||'')){window.customerDesignRefreshCalendarV351?.();return;}
    picker.classList.add('design-reservations-page');picker.setAttribute('role','region');picker.removeAttribute('aria-modal');
    byId('bookingPickerTitleV37').textContent='Rezervácie';
    const close=byId('bookingPickerCloseV37');if(!close.querySelector('svg'))close.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    // Reservations live in Overview only; preserve the original hidden #weekDays data source.
    const legacy=byId('designMyBookings');
    if(legacy){const weeks=byId('weekDays');if(weeks)byId('bookingTab')?.append(weeks);legacy.remove();}
    byId('designBookingCarousel')?.remove();byId('designBookingSwipeHint')?.remove();
    // Reservation guidance is owned exclusively by the Overview card.
    picker.querySelectorAll('#designReservationNotice,#designWeekDeadline').forEach(node=>node.remove());

    const selectedSection=byId('bookingPickerTaxiSectionV91');
    const taxiTitle=byId('designSelectedDaysTitle')||selectedSection?.querySelector('.booking-picker-taxi-title-v37');
    if(taxiTitle){taxiTitle.id='designSelectedDaysTitle';taxiTitle.textContent='Vybraté dni ↓';taxiTitle.hidden=selectedSection.classList.contains('hidden');}
    picker.querySelectorAll('.booking-day-v37').forEach(button=>{const day=state.data?.availability?.days?.find(d=>d.date===button.dataset.date);if(!day)return;button.dataset.capacityLevel=day.bookings_open===false?'closed':button.classList.contains('booked')?'reserved':calendarCapacityLevelV439(day);button.title='Obsadené '+Number(day.occupied||0)+' z '+Number(day.capacity||0)+' miest';button.setAttribute('aria-label',new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en':'sk-SK',{weekday:'long',day:'numeric',month:'numeric'}).format(new Date(day.date+'T12:00:00'))+' · '+(button.querySelector(':scope > span')?.textContent||'')+' · '+button.title);
      const span=button.querySelector(':scope > span');if(span){
        const showCapacity=!button.disabled&&!button.classList.contains('booked')&&button.dataset.full!=='true'&&button.dataset.capacityLevel!=='closed';
        if(showCapacity)span.textContent='Voľné: '+Math.max(0,Number(day.available)||0);
        span.querySelector('.design-capacity-dot')?.remove();
        span.classList.remove('calendar-count-hidden-v439');
        bellaCapacityV450(button,day,showCapacity);
        if(showCapacity)button.setAttribute('aria-label',new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en':'sk-SK',{weekday:'long',day:'numeric',month:'numeric'}).format(new Date(day.date+'T12:00:00'))+' · '+(document.documentElement.lang==='en'?'Free: ':'Voľné: ')+Math.max(0,Number(day.available)||0));
      }
    });
    // Keep repeated-days suggestions ahead of the calendar, without any reservations strip.
    byId('designCapacityLegend')?.remove();
    if(taxiTitle){
      const selected=!selectedSection.classList.contains('hidden');
      picker.classList.toggle('has-selected-days-v393',selected);
      const submit=byId('bookingPickerSubmitV37'),error=byId('bookingPickerErrorV95');
      calendar.after(taxiTitle,selectedSection,error,submit);
    }

  };
  window.customerDesignEditReservation=date=>{
    const dogIds=new Set((state.data?.dogs||[]).map(d=>Number(d.id)));
    const rows=futureItems().filter(row=>row.reservation_date===date&&['pending','approved'].includes(row.status)&&dogIds.has(Number(row.dog_id)));
    if(!rows.length){toast('Táto rezervácia už nie je dostupná.');return;}
    rosterDate=null;
    let selected=rows[0];
    const dogOf=row=>(state.data?.dogs||[]).find(d=>Number(d.id)===Number(row.dog_id));
    const identifiers=row=>({
      request:row._legacy||row.can_manage===false?0:Number(row.id)||0,
      reservation:row._legacy||row.can_manage===false?Number(row.reservation_id)||0:0
    });
    const canCancel=row=>row.can_manage!==false||(row.status==='approved'&&Number(row.reservation_id)>0);
    function redraw(){
      const body=byId('customerDesignModalBody');
      const dogPicker=rows.length>1
        ?'<div class="design-edit-dogs" role="group" aria-label="Vyberte psíka">'+rows.map(row=>'<button type="button" data-edit-dog="'+Number(row.dog_id)+'" aria-pressed="'+String(row===selected)+'">'+esc(dogOf(row)?.name||'Psík')+'</button>').join('')+'</div>'
        :'';
      const taxiAllowed=window.customerDesignCanEditTaxi?.(selected)===true;
      const cancelAllowed=canCancel(selected);
      body.innerHTML=dogPicker+'<div class="design-edit-actions">'
        +'<button type="button" data-edit-action="taxi" '+(taxiAllowed?'':'disabled')+'>🚕 '+(taxiLabel(selected.taxi_mode)?'Upraviť taxi':'Pridať taxi')+'</button>'
        +'<button type="button" data-edit-action="cancel" '+(cancelAllowed?'':'disabled')+'>✕ Zrušiť rezerváciu</button></div>'
        +(!taxiAllowed?'<p class="design-edit-hint">Taxík pri tejto rezervácii nemožno teraz upraviť.</p>':'');
      body.querySelectorAll('[data-edit-dog]').forEach(button=>button.addEventListener('click',()=>{
        selected=rows.find(r=>Number(r.dog_id)===Number(button.dataset.editDog))||selected;redraw();
      }));
      body.querySelector('[data-edit-action="taxi"]')?.addEventListener('click',()=>{
        if(!taxiAllowed)return;const ids=identifiers(selected);closeModal();
        window.customerDesignOpenTaxi?.(ids.request,ids.reservation);
      });
      body.querySelector('[data-edit-action="cancel"]')?.addEventListener('click',()=>{
        if(!cancelAllowed)return;const ids=identifiers(selected);closeModal();
        void window.customerDesignCancelBookingV428?.(ids.request,ids.reservation);
      });
    }
    showModal('Upraviť rezerváciu',skDay(date)+' '+skDate(date),dogOf(selected)?.sex!=='male');
    redraw();
  };
  let taxiReturnV328=null,taxiPickerInertV328=false;
  window.customerDesignTaxiOpened=()=>{
    const picker=byId('bookingPickerV37'),taxi=byId('bookingTaxiEditV201');if(!taxi)return;
    taxiReturnV328=document.activeElement;taxiPickerInertV328=!!picker?.inert;
    if(picker&&!picker.classList.contains('hidden'))picker.inert=true;
    document.body.append(taxi);taxi.classList.remove('design-inline-taxi');taxi.classList.add('design-taxi-modal');
    taxi.setAttribute('role','dialog');taxi.setAttribute('aria-modal','true');
    document.documentElement.classList.add('design-modal-open');
    byId('taxiEditCloseV201').focus({preventScroll:true});
  };
  window.customerDesignTaxiClosed=()=>{
    const picker=byId('bookingPickerV37');if(picker)picker.inert=taxiPickerInertV328;
    document.documentElement.classList.remove('design-modal-open');
    if(taxiReturnV328?.isConnected)taxiReturnV328.focus({preventScroll:true});taxiReturnV328=null;
  };
  let chatPickerScroll=null;
  window.customerDesignKeepPickerForChat=()=>{const picker=byId('bookingPickerV37');if(!picker||picker.classList.contains('hidden'))return false;chatPickerScroll=picker.scrollTop;picker.inert=true;return true;};
  window.customerDesignChatOpened=()=>window.customerDesignKeepPickerForChat();
  window.customerDesignChatClosed=()=>{const picker=byId('bookingPickerV37');if(chatPickerScroll!==null&&picker&&!picker.classList.contains('hidden')){picker.inert=false;picker.scrollTop=chatPickerScroll;document.documentElement.classList.add('design-reservations-open');byId('bookingTab').inert=true;}chatPickerScroll=null;};
  window.customerDesignPickerOpened=()=>{window.customerDesignPickerRender();document.documentElement.classList.add('design-reservations-open');byId('bookingTab').inert=true;};
  window.customerDesignPickerClosed=()=>{if(!byId('bookingTaxiEditV201')?.classList.contains('hidden')){byId('bookingTaxiEditV201')?.classList.add('hidden');window.customerDesignTaxiClosed();}byId('bookingPickerV37').inert=false;document.documentElement.classList.remove('design-reservations-open');byId('bookingTab').inert=false;};
  customerHooks.afterSwitchTab.push(()=>{window.closeBookingPickerV305?.();layout();});
  customerHooks.afterRenderDog.push(layout);customerHooks.afterRenderPassSummary.push(layout);customerHooks.afterBootstrap.push(layout);
  document.addEventListener('click',e=>{const single=e.target.closest('#bookingVaccinationStatus'),dual=e.target.closest('.dual-dog-status-v254');if(!single&&!dual)return;e.preventDefault();e.stopImmediatePropagation();openVaccineSummary(dual?Number(dual.dataset.dogOpenV254):state.selectedDogId);},true);
  // Consent or booking changes invalidate an already open roster immediately.
  customerHooks.afterApi.push(()=>{if(rosterDate){if(!approvedForDate(rosterDate))closeModal();else openFriends(rosterDate);}});
  if(state.data)layout();
})();


