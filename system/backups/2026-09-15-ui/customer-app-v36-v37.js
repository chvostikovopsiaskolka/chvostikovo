/* v36: app-style navigation, dog reservation hero and settings */
(function customerAppChromeV36(){
  if(window.__chvostikovoCustomerAppChromeV36)return;
  window.__chvostikovoCustomerAppChromeV36=true;

  const calendarSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M7 3v4M17 3v4M3 10h18"></path></svg>';
  const messageSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"></path><path d="M7.5 10h9M7.5 13.5h6"></path></svg>';
  const gearSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10 3.01V3h4v.08a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.96 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"></path></svg>';

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
    dogBtn.innerHTML=dogAvatarMarkup(dog,'nav-dog-avatar-v36')+'<span>Môj psík</span>';
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
    info.innerHTML=dogAvatarMarkup(dog,'hero-dog-avatar-v36')+'<div class="hero-dog-copy-v36"><span>Rezervácie</span><strong>'+esc(dog.name||'Psík')+'</strong></div>';
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
      const btn=document.createElement('button');btn.id='dogSettingsBtnV36';btn.className='dog-settings-btn-v36';btn.type='button';btn.setAttribute('aria-label','Nastavenia');btn.title='Nastavenia';btn.innerHTML=gearSvg;
      head.appendChild(btn);
      btn.addEventListener('click',openSettings);
    }
    if(!$('dogSettingsModalV36')){
      document.body.insertAdjacentHTML('beforeend','<div id="dogSettingsModalV36" class="settings-modal-v36 hidden" role="dialog" aria-modal="true" aria-labelledby="dogSettingsTitleV36"><div class="settings-card-v36"><div class="settings-head-v36"><div><small>Chvostíkovo</small><h2 id="dogSettingsTitleV36">Nastavenia</h2><p>Účet, upozornenia a súhlasy</p></div><button id="dogSettingsCloseV36" class="settings-close-v36" type="button" aria-label="Zavrieť">×</button></div><div id="dogSettingsContentV36" class="settings-content-v36"></div></div></div>');
      $('dogSettingsCloseV36').addEventListener('click',closeSettings);
      $('dogSettingsModalV36').addEventListener('click',e=>{if(e.target===$('dogSettingsModalV36'))closeSettings()});
    }
  }

  function relocateSettings(){
    ensureSettings();
    const content=$('dogSettingsContentV36'),tab=$('dogTab');if(!content||!tab)return;
    const account=tab.querySelector('.account-card')||document.querySelector('#dogSettingsContentV36 .account-card');
    const legal=$('customerLegalSectionV23');
    if(account&&account.parentElement!==content)content.appendChild(account);
    if(legal&&legal.parentElement!==content){content.appendChild(legal);if(!legal.dataset.v36SettingsCollapsed){legal.open=false;legal.dataset.v36SettingsCollapsed='1'}}
  }

  function openSettings(){relocateSettings();$('dogSettingsModalV36')?.classList.remove('hidden');document.documentElement.classList.add('settings-open-v36')}
  function closeSettings(){$('dogSettingsModalV36')?.classList.add('hidden');document.documentElement.classList.remove('settings-open-v36')}

  function applyAll(){applyNav();applyHero();ensureSettings();setTimeout(relocateSettings,0)}

  const oldPass=renderPassSummary;
  renderPassSummary=function(...args){const out=oldPass.apply(this,args);setTimeout(()=>{applyHero();applyNav()},0);return out};
  const oldDog=renderDog;
  renderDog=function(...args){const out=oldDog.apply(this,args);setTimeout(applyAll,60);setTimeout(applyAll,950);return out};

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
    submittingV37=true;renderPickerV37();loading(true);
    let ok=0;const failed=[];
    for(const date of dates){
      try{await api({action:'request_booking',dog_id:Number(dog.id),reservation_date:date,taxi_mode:selectedTaxiV37});ok++}
      catch(e){failed.push({date,error:e.message||'Nepodarilo sa rezervovať.'})}
    }
    try{if(ok)await bootstrap(false)}finally{loading(false);submittingV37=false}
    if(ok){closePickerV37();toast(ok===dates.length?(ok===1?'Rezervácia bola odoslaná na schválenie.':`${ok} rezervácie boli odoslané na schválenie.`):`Odoslané ${ok} z ${dates.length} rezervácií.`)}
    else{renderPickerV37();toast(failed[0]?.error||'Rezerváciu sa nepodarilo odoslať.')}
  }

  function bookingRosterV37(day){
    const count=(day?.dogs?.length||0)+(Number(day?.anonymous_dogs)||0);
    if(!count)return '<span class="reserved-roster-count-v37">Zatiaľ bez ďalších psíkov</span>';
    if(!day?.roster_visible)return `<span class="reserved-roster-count-v37">${esc(pluralDogs(count))}</span>`;
    return `<details class="reserved-roster-v37"><summary>${esc(pluralDogs(count))}</summary><div>${(day.dogs||[]).map(x=>`<span>${x.photo_url?`<i class="reserved-roster-avatar-v37"><img src="${esc(x.photo_url)}" alt=""></i>`:'<i class="reserved-roster-avatar-v37">🐶</i>'}<b>${esc(x.name)}</b></span>`).join('')}${Array.from({length:Number(day.anonymous_dogs)||0},()=>'<span><i class="reserved-roster-avatar-v37">🐾</i><b>Prihlásený škôlkar</b></span>').join('')}</div></details>`;
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
      return `<div class="card reserved-day-card-v37" data-date="${esc(r.reservation_date)}"><div class="reserved-day-top-v37"><div><strong>${esc(skDay(r.reservation_date))}</strong><span>${esc(skDate(r.reservation_date))}</span></div><span class="pill ${pending?'pending':'approved'}">${pending?'Čaká na schválenie':'Schválená'}</span></div><div class="reserved-day-meta-v37">${bookingRosterV37(day)}${taxi?`<span class="reserved-taxi-v37">${esc(taxi)}</span>`:''}</div>${note}<button class="text-btn cancel-booking-v37" type="button" data-request="${r._legacy?'':r.id||''}" data-reservation="${r._legacy?r.reservation_id||r.id:''}">Zrušiť rezerváciu</button></div>`;
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
