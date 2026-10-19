/* V-039: presentation layer over the current customer runtime. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const icon = name => `<svg aria-hidden="true"><use href="#ci-${name}"/></svg>`;
  let modalReturn = null;
  let rosterDate = null;
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
      return {label,row,status:{...status,text:status.kind==='valid'?status.text.replace('Platnosť: ešte','Platné ešte'):status.text.replace(/^Platnosť:\s*/,'')}};
    });
    const expired = statuses.some(v => v.status.kind === 'expired');
    const warning = statuses.some(v => v.status.kind === 'warning');
    const missing = statuses.some(v => v.status.kind === 'neutral');
    showModal('Očkovania', dog.name, dog.sex !== 'male');
    const body = byId('customerDesignModalBody');
    body.innerHTML = `${expired || warning || missing ? `<p class="design-vaccine-notice ${expired?'expired':'warning'}">${expired?'Niektoré očkovania už nie sú platné.':missing?'Doplňte chýbajúce očkovania alebo doklad.':'Blíži sa koniec platnosti očkovania.'} ${warning || expired?'Nezabudnite preočkovať svojho psíka a aktualizovať doklad, aby ste predišli zablokovaniu ďalších rezervácií.':''}</p>`:''}<div class="design-vaccine-list">${statuses.map(v => `<div class="design-vaccine-row"><span>${esc(v.label)}${v.row?.valid_until?`<small>Platí do ${esc(skDate(v.row.valid_until))}</small>`:''}</span><strong class="${v.status.kind}">${esc(v.status.text.replace(/^Platnosť:\s*/,'').replace(/^Platné očkovanie/,'Platné'))}</strong></div>`).join('')}</div><button type="button" id="designOpenVaccines" class="btn full">Otvoriť očkovania ${icon('chevron-right')}</button>`;
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
    if(!updating)showModal('Kamaráti v škôlke', skDay(date)+' '+skDate(date)); rosterDate=date;
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
    if(!root){root=document.createElement('section');root.id='designTicket';root.className='design-ticket';root.setAttribute('aria-label','Permanentka a vstupy');byId('bookingDogProfile').after(root);}
    root.classList.toggle('male',dog.sex==='male');
    const originalTitle=source.querySelector('span')?.textContent||'Vstup',counts=source.querySelector('strong')?.textContent||'';
    const match=counts.match(/(\d+)\s+z\s+(\d+)/),small=[...source.querySelectorAll('small')].map(x=>x.textContent).filter(s=>s!=='Použité vstupy').join(' · ');
    const validity=small.replace(/(\d{2})\.(\d{2})\.(\d{4})/g,(_,d,m,y)=>`${d}. ${m}. ${y.slice(-2)}`).replace(/(\d{4})/g,y=>y.slice(-2));
    const date=small.match(/(?:do|Platí do)\s+(.*)/)?.[1];
    const badge=date?'Platnosť '+date.replace(/\b20(\d{2})\b/g,'$1'):validity.replace('Platnosť ','');
    root.innerHTML=`<div class="design-ticket-head"><h2><span aria-hidden="true">🎟️</span> ${esc(originalTitle)}</h2>${badge?`<span class="design-validity" title="${esc(small)}">${esc(badge)}</span>`:''}</div>${match?`<p>Použité <strong>${Number(match[1])} z ${Number(match[2])} vstupov</strong></p><div class="design-paws" aria-hidden="true">${Array.from({length:Number(match[2])},(_,i)=>`<span class="${i<Number(match[1])?'used':''}">${icon('paw')}</span>`).join('')}</div>`:`<p class="design-single-entry">${esc(counts)} ${icon('ticket')}</p>`}`;
  }
  function nearest() {
    if(!state.data)return;
    let root=byId('designNearest');
    if(!root){root=document.createElement('section');root.id='designNearest';root.className='design-nearest';byId('designTicket').after(root);}
    const next=futureItems().find(r=>r.status==='approved'&&overviewDayVisible(r.reservation_date,overviewClock()));
    const key=next?.reservation_date||'empty';
    if(root.dataset.date!==key){root.dataset.date=key;root.replaceChildren();
      if(next){root.innerHTML=`<div class="design-nearest-head">${icon('calendar')}<h2>Najbližšia návšteva <span>· ${esc(skDay(next.reservation_date).slice(0,2).toLowerCase())} ${esc(skDate(next.reservation_date).replace(/\s*20\d{2}$/, ''))}</span></h2><span class="design-approved" aria-label="Schválená">✓</span></div><div class="design-friends-line"><div class="design-friend-strip"></div><button type="button" class="design-friends-button">Kamaráti<br>v škôlke <b>›</b></button></div>`;
        root.querySelector('button').addEventListener('click',()=>openFriends(next.reservation_date));
      }else{root.innerHTML='<p class="design-empty-heading">Zatiaľ nemáte vytvorenú rezerváciu.</p><div class="design-empty-reminder"></div><button type="button" class="btn full">Rezervovať miesto v škôlke</button>';root.querySelector('button').addEventListener('click',()=>window.openBookingPickerV37?.());}
    }
    if(next)reconcilePhotos(root.querySelector('.design-friend-strip'),friends(next.reservation_date).slice(0,4));
    else{const target=root.querySelector('.design-empty-reminder');const notice=byId('bookingDeadlineNoticeV127')||byId('deadlineText');target.textContent=notice?.textContent?.trim()||'Prosíme o rezerváciu do nedele 20:00.';}
    const bulletin=byId('customerBulletinV229'); if(bulletin&&root.nextElementSibling!==bulletin)root.after(bulletin);
  }
  function layout() {
    if(!state.data)return;
    document.documentElement.classList.add('customer-design');
    const profile=byId('bookingDogProfile'),content=profile?.querySelector('.dog-overview-content');
    if(content&&!byId('designDogName')){
      const name=document.createElement('button');name.type='button';name.id='designDogName';name.className='design-dog-name';
      name.append(byId('bookingDogName'));name.insertAdjacentHTML('beforeend','<span aria-hidden="true">✎</span>');content.prepend(name);
      name.addEventListener('click',()=>byId('bookingDogDetailsOpenV242').click());
      byId('bookingGradebook').after(byId('bookingVisitCount'));
    }
    const nav=byId('navBooking');if(nav){const label=nav.querySelector(':scope > span:last-child');if(label)label.textContent='Prehľad';}
    ticket();nearest();if(rosterDate){if(approvedForDate(rosterDate))openFriends(rosterDate);else closeModal();}
  }
  const originalDays=customerRenderers.days;
  customerRenderers.days=(...args)=>{const out=originalDays?.(...args);byId('weekDays')?.querySelectorAll('.reserved-roster-v37').forEach(details=>{const card=details.closest('[data-date]'),date=card?.dataset.date;if(!date||!approvedForDate(date))return;const button=document.createElement('button');button.type='button';button.className='design-carousel-friends';button.textContent='Kamaráti v škôlke ›';button.addEventListener('click',()=>openFriends(date));details.replaceWith(button);});nearest();return out;};
  window.customerDesignPickerRender=()=>{
    const picker=byId('bookingPickerV37'),card=picker?.querySelector('.booking-picker-card-v37');if(!card)return;
    picker.classList.add('design-reservations-page');picker.setAttribute('role','region');picker.removeAttribute('aria-modal');
    byId('bookingPickerTitleV37').textContent='Rezervácie';
    const head=card.querySelector('.booking-picker-head-v37');
    if(!byId('designMyBookings')){
      const section=document.createElement('section');section.id='designMyBookings';section.innerHTML='<div id="designReservationNotice"></div><h2>Moje rezervácie</h2>';head.after(section);section.append(byId('weekDays'));
      const chat=document.createElement('button');chat.type='button';chat.className='design-reservation-chat';chat.setAttribute('aria-label','Napísať správu');chat.innerHTML=icon('message');chat.addEventListener('click',()=>{window.closeBookingPickerV305?.();openCustomerChat();});head.insertBefore(chat,byId('bookingPickerCloseV37'));
    }
    const source=byId('bookingDeadlineNoticeV127')||byId('deadlineText');byId('designReservationNotice').textContent=source?.textContent?.trim()||'Prosíme o rezerváciu do nedele 20:00.';
    const empty=byId('weekDays')?.querySelector('.reserved-empty-v37'),smart=byId('bookingPickerSmartDaysV199');
    if(empty&&smart&&!smart.classList.contains('hidden')){empty.classList.add('hidden');byId('designMyBookings').append(smart);}
    else if(smart&&smart.parentElement?.id==='designMyBookings')byId('bookingPickerDaysV37').before(smart);
  };
  window.customerDesignPickerOpened=()=>{window.customerDesignPickerRender();document.documentElement.classList.add('design-reservations-open');};
  window.customerDesignPickerClosed=()=>document.documentElement.classList.remove('design-reservations-open');
  customerHooks.afterSwitchTab.push(()=>{window.closeBookingPickerV305?.();layout();});
  customerHooks.afterRenderDog.push(layout);customerHooks.afterRenderPassSummary.push(layout);customerHooks.afterBootstrap.push(layout);
  document.addEventListener('click',e=>{const single=e.target.closest('#bookingVaccinationStatus'),dual=e.target.closest('.dual-dog-status-v254');if(!single&&!dual)return;e.preventDefault();e.stopImmediatePropagation();openVaccineSummary(dual?Number(dual.dataset.dogOpenV254):state.selectedDogId);},true);
  // Consent or booking changes invalidate an already open roster immediately.
  customerHooks.afterApi.push(()=>{if(rosterDate){if(!approvedForDate(rosterDate))closeModal();else openFriends(rosterDate);}});
  if(state.data)layout();
})();
