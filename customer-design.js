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
    if (dog.photo_url) { const img = document.createElement('img'); img.src = dog.photo_url; img.alt = dog.name || 'Psík'; img.decoding='async'; el.append(img); }
    else el.innerHTML = icon('paw');
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
    rows.forEach((d,i)=>{const key=String(d.dog_id||d.key||d.name);let row=[...body.children].find(row=>row.dataset.rosterKey===key);if(!row){row=document.createElement('div');row.className='design-roster-row';row.dataset.rosterKey=key;row.append(photoNode(d,'design-friend-photo'),document.createElement('strong'));}row.querySelector('strong').textContent=d.name||'Prihlásený škôlkar';if(body.children[i]!==row)body.insertBefore(row,body.children[i]||null);});
  }
  function ticket() {
    const source=byId('passSummary'),dog=selectedDog(); if(!source||!dog)return;
    let root=byId('designTicket');
    const originalTitle=source.querySelector('span')?.textContent||'Vstup',counts=source.querySelector('strong')?.textContent||'';
    if(counts==='Jednorazový'){root?.remove();return;}
    if(!root){root=document.createElement('section');root.id='designTicket';root.className='design-ticket';root.setAttribute('aria-label','Permanentka a vstupy');(byId('customerInboxV363')||byId('bookingDogProfile')).after(root);}
    root.classList.toggle('male',dog.sex==='male');
    root.classList.toggle('design-ticket-single',counts==='Jednorazový');
    const match=counts.match(/(\d+)\s+z\s+(\d+)/),small=[...source.querySelectorAll('small')].map(x=>x.textContent).filter(s=>s!=='Použité vstupy').join(' · ');
    const validity=small.replace(/(\d{2})\.(\d{2})\.(\d{4})/g,(_,d,m,y)=>`${d}. ${m}. ${y.slice(-2)}`).replace(/(\d{4})/g,y=>y.slice(-2));
    const date=small.match(/(?:do|Platí do)\s+(.*)/)?.[1];
    const badge=date?'Platnosť do '+date:validity.replace('Platnosť ','');
    const presentationKey=JSON.stringify([originalTitle,counts,small,dog.sex]);
    if(root.dataset.presentationKey===presentationKey)return;
    root.dataset.presentationKey=presentationKey;
    const material=root.querySelector(':scope > .lg-v3-material');
    root.innerHTML=`<div class="design-ticket-head"><h2 aria-label="${esc(originalTitle)}">${icon("ticket")}<span>${esc(originalTitle)}</span></h2></div><div class="design-ticket-usage">${match?`<p>Použité <strong>${Number(match[1])} z ${Number(match[2])} vstupov</strong></p>`:`<p class="design-single-entry"><strong>${esc(counts==='Jednorazový'?'Jednorazový vstup':counts)}</strong></p>`}${badge?`<span class="design-validity" title="${esc(small)}">${esc(badge)}</span>`:''}</div>${match?`<div class="design-paws" aria-hidden="true">${Array.from({length:Number(match[2])},(_,i)=>`<span class="${i<Number(match[1])?'used':''}">${icon('pass-paw')}</span>`).join('')}</div>`:''}`;
    if(material)root.prepend(material);
  }
  function nearest() {
    if(!state.data)return;
    if(!selectedDog()){byId('designNearest')?.remove();byId('designTicket')?.remove();byId('designBulletinTitle')?.remove();return;}
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
          if(approved)card.querySelector('.design-friends-button').addEventListener('click',()=>openFriends(date));card.querySelector('.design-visit-edit').addEventListener('click',()=>window.customerDesignEditReservation(date));
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
        root.dataset.date=key;root.innerHTML=`<div class="design-visits-title"><h2>📅 Moje rezervácie</h2></div><article class="design-visit-card design-visit-empty"><p class="design-empty-heading">${all.length?'Najbližšia rezervácia je neskôr než o dva týždne.':'Zatiaľ nemáte vytvorenú rezerváciu.'}</p><div class="design-empty-reminder"></div>${all.length?'<button type="button" class="btn full">Moje rezervácie</button>':''}</article>`;
        root.querySelector('button')?.addEventListener('click',()=>window.openBookingPickerV37?.());
      }
      const target=root.querySelector('.design-empty-reminder'),notice=byId('deadlineText');target.textContent=notice?.textContent?.trim()||'Prosíme o rezerváciu miesta do nedele 20:00.';target.hidden=!!notice?.classList.contains('hidden');target.classList.remove('design-deadline-closed');
    }
    byId('designBulletinTitle')?.remove();
    const inbox=byId('customerInboxV363'),profile=byId('bookingDogProfile');if(inbox&&profile?.nextElementSibling!==inbox)profile?.after(inbox);
    window.customerRefreshNoticeOverviewV376?.();
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
    const picker=byId('bookingPickerV37'),card=picker?.querySelector('.booking-picker-card-v37');if(!card)return;
    // Resume/bootstrap can advance availability while this page remains open.
    const firstDate=state.data?.availability?.days?.[0]?.date;
    const renderedDate=byId('bookingPickerDaysV37')?.querySelector('.booking-picker-week-v127')?.dataset.weekFrom;
    if(firstDate&&renderedDate&&firstDate!==renderedDate){window.customerDesignRefreshCalendarV351?.();return;}
    picker.classList.add('design-reservations-page');picker.setAttribute('role','region');picker.removeAttribute('aria-modal');
    byId('bookingPickerTitleV37').textContent='Rezervácie';
    const head=card.querySelector('.booking-picker-head-v37');
    const close=byId('bookingPickerCloseV37');if(!close.querySelector('svg'))close.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    if(!byId('designMyBookings')){
      const section=document.createElement('section');section.id='designMyBookings';section.innerHTML='<h2>📅 Moje rezervácie</h2>';head.after(section);section.append(byId('weekDays'));
    }
    let carousel=byId('designBookingCarousel');if(!carousel){carousel=document.createElement('div');carousel.id='designBookingCarousel';byId('weekDays').before(carousel);carousel.append(byId('weekDays'));}
    let hint=byId('designBookingSwipeHint');if(!hint){hint=document.createElement('p');hint.id='designBookingSwipeHint';hint.textContent='Posuňte pre zobrazenie ďalších dní →';carousel.before(hint);}hint.hidden=byId('weekDays').querySelectorAll('.reserved-day-card-v37').length<2;
    const reminder=window.customerDesignRefreshDeadline?.();
    const calendar=byId('bookingPickerDaysV37');
    // Reattach exactly one reminder under the matching next-week heading.
    let notice=byId('designReservationNotice');if(!notice){notice=document.createElement('div');notice.id='designReservationNotice';}
    const nextWeek=[...calendar.querySelectorAll('.booking-picker-week-v127')].find(week=>week.dataset.weekFrom===reminder?.from);
    const nextHeading=nextWeek?.querySelector('.booking-picker-week-label-v127');
    if(nextHeading)nextHeading.after(notice);else calendar.append(notice);
    notice.hidden=!nextHeading||!!reminder?.hidden;notice.textContent=reminder?.text||'';
    notice.dataset.weekFrom=reminder?.from||'';notice.dataset.weekTo=reminder?.to||'';notice.dataset.deadline=reminder?.deadline||'';
    // The core calendar owns the Monday-to-Sunday notice and its visibility.
    const weekNotice=byId('designWeekDeadline');if(weekNotice){weekNotice.hidden=!!window.customerDesignHasWeekBooking?.(weekNotice.dataset.weekFrom,weekNotice.dataset.weekTo);byId('bookingPickerDaysV37').querySelector('.booking-picker-week-label-v127')?.after(weekNotice);}

    const selectedSection=byId('bookingPickerTaxiSectionV91');
    const taxiTitle=byId('designSelectedDaysTitle')||selectedSection?.querySelector('.booking-picker-taxi-title-v37');
    if(taxiTitle){taxiTitle.id='designSelectedDaysTitle';taxiTitle.textContent='Vybraté dni ↓';taxiTitle.hidden=selectedSection.classList.contains('hidden');}
    picker.querySelectorAll('.booking-day-v37').forEach(button=>{const day=state.data?.availability?.days?.find(d=>d.date===button.dataset.date);if(!day)return;button.dataset.capacityLevel=Number(day.available)<=0?'full':Number(day.available)<=2?'limited':'free';button.title='Obsadené '+Number(day.occupied||0)+' z '+Number(day.capacity||0)+' miest';
      const span=button.querySelector(':scope > span');if(span&&!button.disabled&&button.dataset.full!=='true')span.textContent=Number(day.occupied||0)+'/'+Number(day.capacity||0);
      if(!button.disabled&&!button.classList.contains('booked')&&button.dataset.full!=='true'&&!button.querySelector('.design-capacity-dot')){const dot=document.createElement('i');dot.className='design-capacity-dot';dot.setAttribute('aria-hidden','true');span?.prepend(dot);}
    });
    const empty=byId('weekDays')?.querySelector('.reserved-empty-v37'),smart=byId('bookingPickerSmartDaysV199');
    const hasReservations=!!byId('weekDays')?.querySelector('.reserved-day-card-v37');
    if(smart&&!smart.classList.contains('hidden')){smart.classList.toggle('design-smart-hidden',hasReservations);if(!hasReservations){empty?.classList.add('hidden');carousel.append(smart);}}
    if(empty&&!hasReservations&&(!smart||smart.classList.contains('hidden'))) {empty.classList.remove('hidden');let text=empty.querySelector('.design-empty-booking-cta');if(!text){text=document.createElement('p');text.className='design-empty-booking-cta';empty.replaceChildren(text);}text.textContent='Rezervujte miesto pre svojho psíka. Vyberte si deň/dni nižšie.';}
    byId('designCapacityLegend')?.remove();
    if(taxiTitle)byId('bookingPickerDaysV37').after(taxiTitle);

  };
  window.customerDesignEditReservation=date=>{window.openBookingPickerV37?.();const carousel=byId('designBookingCarousel'),card=byId('weekDays')?.querySelector('[data-date="'+date+'"]');if(carousel&&card)carousel.scrollLeft=card.offsetLeft-carousel.offsetLeft;};
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


