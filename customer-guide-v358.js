/* Optional, account-scoped tour. Demo cards never enter booking state or API payloads. */
(function customerGuideV358(){
  'use strict';
  const $=id=>document.getElementById(id);
  let tour=null,offerTimer=null,epoch=0,writing=null;
  const pending=new Map();
  const account=()=>state.session?.user?.id||'';
  const pickerOpen=()=>!!$('bookingPickerV37')&&!$('bookingPickerV37').classList.contains('hidden');
  const key=id=>'chvo-guide-v358:'+id;
  function saved(id){try{return localStorage.getItem(key(id))}catch(_){return null}}
  function remember(id,result){try{localStorage.setItem(key(id),result)}catch(_){}pending.set(id,result);}
  async function record(result){
    const id=account();if(!id)return;
    remember(id,result);
    if(state.data?.profile){state.data.profile.intro_guide_seen_at=new Date().toISOString();state.data.profile.intro_guide_result=result;}
    if(writing)return;
    writing=(async()=>{
      while(pending.has(id)&&account()===id){
        const value=pending.get(id);
        try{
          await ensureCustomerSessionV357();if(account()!==id)return;
          const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/portal_record_guide_v358',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_result:value})});
          if(!r.ok||await r.json()!==true)return;
          if(pending.get(id)===value)pending.delete(id);
        }catch(_){return;}
      }
    })().finally(()=>{writing=null;});
    return writing;
  }
  function ready(){
    const dogs=state.data?.dogs||[];
    return !!account()&&state.data?.profile?.status==='active'&&dogs.length>0&&window.__customerOnboardingCompleteV75===true&&dogs.every(d=>window.customerDogDetailsCompleteV95?.(d)&&window.customerVaccinationsCompleteV96?.(d));
  }
  function otherModal(){return [...document.querySelectorAll('[role="dialog"]')].some(el=>el.id!=='customerGuideV358'&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none');}
  function shell(){
    let root=$('customerGuideV358');if(root)return root;
    root=document.createElement('div');root.id='customerGuideV358';root.className='customer-guide hidden';
    root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','guideTitleV358');
    root.innerHTML='<div class="guide-spot" aria-hidden="true"></div><section class="guide-card"><div class="guide-top"><span id="guideProgressV358"></span><button id="guideSkipV358" type="button">Preskočiť</button></div><h2 id="guideTitleV358"></h2><p id="guideTextV358"></p><div class="guide-actions"><button id="guideBackV358" class="btn secondary" type="button">Späť</button><button id="guideNextV358" class="btn" type="button">Pokračovať</button></div></section>';
    document.body.append(root);
    $('guideSkipV358').onclick=()=>finish('skipped');
    $('guideBackV358').onclick=()=>{if(tour?.step>0)void step(tour.step-1);};
    $('guideNextV358').onclick=()=>{if(!tour)return;if(tour.step===-1){void record('started');void step(0);}else if(tour.step<5)void step(tour.step+1);else finish('completed');};
    root.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish('skipped');}
      if(e.key!=='Tab')return;
      const nodes=[...root.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled);
      if(!nodes.length)return;
      if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}
      else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}
    });
    return root;
  }
  function navigation(tab){
    window.closeBookingPickerV305?.();switchTab(tab);
  }
  function cleanDemo(){ $('guideDemoReservationV358')?.remove();$('guidePickerPreviewV360')?.remove();document.querySelectorAll('[data-guide-stashed-v360]').forEach(n=>n.removeAttribute('data-guide-stashed-v360')); }
  function sample(){
    const markup=window.customerGuidePreviewV360?.(),host=$('designMyBookings');if(!markup||!host)return null;
    host.querySelectorAll('.reserved-empty-v37,#bookingPickerSmartDaysV199').forEach(n=>n.setAttribute('data-guide-stashed-v360',''));
    const frame=document.createElement('div');frame.id='guideDemoReservationV358';frame.inert=true;
    frame.innerHTML='<p class="guide-demo-label">Ukážka rezervácie</p>'+markup.reservation;
    window.customerGuideReservationPresentationV360?.(frame);host.append(frame);return frame;
  }
  function calendarSample(){
    const markup=window.customerGuidePreviewV360?.(),picker=$('bookingPickerV37');if(!markup||!picker)return null;
    picker.querySelector('.booking-picker-card-v37')?.setAttribute('data-guide-stashed-v360','');
    const frame=document.createElement('section');frame.id='guidePickerPreviewV360';frame.className='booking-picker-card-v37 guide-picker-preview-v360';frame.inert=true;
    frame.innerHTML='<div class="booking-picker-days-v37 guide-preview-calendar">'+markup.calendar+'</div><div class="booking-picker-taxi-title-v37">Vybraté dni ↓</div><div class="booking-picker-taxi-by-day-v91 design-selected-days">'+markup.selected+'</div><button type="button" class="btn full booking-picker-submit-v37">Rezervovať 2 dni</button>';
    frame.querySelectorAll('.booking-day-v37').forEach(button=>{button.dataset.capacityLevel='free';const span=button.querySelector('span');if(span){const dot=document.createElement('i');dot.className='design-capacity-dot';dot.setAttribute('aria-hidden','true');span.prepend(dot);}});
    picker.append(frame);return frame;
  }
  function union(nodes){
    const rects=nodes.filter(Boolean).map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
    if(!rects.length)return null;
    return {left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right)),top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom))};
  }
  function position(){
    if(!tour)return;
    const root=shell(),spot=root.querySelector('.guide-spot'),card=root.querySelector('.guide-card');
    const width=document.documentElement.clientWidth||innerWidth,height=window.visualViewport?.height||innerHeight;
    const offset=window.visualViewport?.offsetTop||0;root.style.top=offset+'px';root.style.height=height+'px';
    card.style.left=Math.max(10,(width-Math.min(width-20,390))/2)+'px';card.style.width=Math.min(width-20,390)+'px';card.style.maxHeight=Math.max(140,height-28)+'px';
    if(tour.step===-1){spot.hidden=true;root.classList.add('guide-welcome');card.style.top=Math.max(14,(height-card.offsetHeight)/2)+'px';return;}
    root.classList.remove('guide-welcome');
    const preview=$('guidePickerPreviewV360');if(preview)preview.style.setProperty('max-height',Math.max(120,height-card.offsetHeight-32)+'px','important');
    const rect=union(tour.targets||[]);if(!rect){spot.hidden=true;card.style.top='20px';return;}
    spot.hidden=false;
    const top=Math.max(8,Math.min(rect.top-6,height-66)),bottom=Math.max(top+36,Math.min(rect.bottom+6,height-8));
    spot.style.left=Math.max(6,rect.left-6)+'px';spot.style.top=top+'px';spot.style.width=Math.min(width-12,rect.right-rect.left+12)+'px';spot.style.height=(bottom-top)+'px';
    const cardHeight=card.offsetHeight;
    if(bottom+12+cardHeight<=height-10)card.style.top=(bottom+12)+'px';
    else if(top-12-cardHeight>=10)card.style.top=(top-12-cardHeight)+'px';
    else{card.style.top=Math.max(10,height-cardHeight-10)+'px';spot.style.height=Math.max(28,Math.min(bottom-top,height-cardHeight-top-22))+'px';}
  }
  async function step(index){
    if(!tour||account()!==tour.id)return abort();
    const current=++epoch;tour.step=index;cleanDemo();shell().classList.toggle('guide-calendar-step',index===4);
    shell().querySelector('.guide-top').append($('guideSkipV358'));
    const titles=['Váš psík v Prehľade','Permanentka a vaše rezervácie','Rezervovať miesto','Vaše rezervácie','Výber dní a taxi','Všetko ostatné v Menu'];
    const texts=[
      'Ťuknutím na profil otvoríte údaje a fotografiu psíka. Pri očkovaniach nájdete ich platnosť, pri grafe počet návštev. Pri zapnutých upozorneniach pripomenieme končiace očkovanie 14 a 7 dní vopred.',
      'Ak máte zakúpenú permanentku, tu uvidíte jej platnosť a počet využitých vstupov. Pod ňou nájdete svoje rezervácie a možnosť Upraviť. Cez Oznamy otvoríte novinky zo škôlky a cez Správy nám priamo napíšete.',
      'Tlačidlom Rezervovať miesto v spodnej lište otvoríte dostupné dni. Po výbere uvidíte Vybraté dni a potvrdenie rezervácie.',
      'Tu nájdete vytvorené rezervácie a stav schválenia. Podľa dostupných možností pridáte alebo upravíte taxi či zrušíte návštevu. Ak chcete zmeniť termín, zrušíte pôvodný a vyberiete nový.',
      'Ukážka: vyberte dni v kalendári. Vybraté dni a tlačidlo Rezervovať nájdete pod kalendárom. Ku každému dňu môžete pridať taxi.',
      'V Menu nájdete údaje psíka, očkovania, svoje kontakty aj správy pre škôlku. V Nastaveniach si môžete tohto sprievodcu kedykoľvek zopakovať. Pripravujeme aj rozšírenú žiacku knižku a odmeny.'
    ];
    const next=$('guideNextV358');next.disabled=true;
    if(index===5)navigation('menu');
    else if(index===3||index===4){navigation('booking');if((state.data?.dogs||[]).every(d=>window.customerVaccinationsCompleteV96?.(d)))window.openBookingPickerV37?.();}
    else navigation('booking');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(!tour||current!==epoch)return;
    if(index===0)tour.targets=[$('bookingDogProfile')];
    if(index===1)tour.targets=[$('designTicket'),$('designNearest')];
    if(index===2)tour.targets=[$('navBookAddV220')];
    if(index===3){const existing=$('designMyBookings')?.querySelector('.reserved-day-card-v37');tour.targets=[existing||sample()];}
    if(index===4)tour.targets=[calendarSample()];
    if(index===5)tour.targets=[$('menuDogGroup'),$('menuContact'),$('menuSettingsGroup')];
    const target=tour.targets.find(Boolean);
    if(index!==2&&index!==4&&target)target.scrollIntoView({block:'start',behavior:'instant'});
    $('guideTitleV358').textContent=titles[index];$('guideTextV358').textContent=texts[index];
    $('guideProgressV358').textContent=(index+1)+' z 6';$('guideBackV358').hidden=index===0;
    next.textContent=index===5?'Dokončiť':'Pokračovať';next.disabled=false;position();next.focus({preventScroll:true});
  }
  function begin(manual=false){
    if(tour||!account()||!state.data?.dogs?.length||otherModal())return;
    if(!manual&&!ready())return;
    const root=shell();tour={id:account(),step:-1,targets:[],tab:state.activeTab,scroll:window.scrollY,focus:document.activeElement,picker:pickerOpen()};
    root.classList.remove('hidden','guide-calendar-step');document.documentElement.classList.add('customer-guide-open');
    $('guideProgressV358').textContent='';$('guideTitleV358').textContent='Sprievodca appkou';
    root.querySelector('.guide-card').append($('guideSkipV358'));
    $('guideTextV358').textContent='Ukážeme vám Prehľad, rezervácie a Menu v šiestich krátkych krokoch. Sprievodcu môžete kedykoľvek preskočiť.';
    $('guideBackV358').hidden=true;$('guideNextV358').textContent='Spustiť sprievodcu';$('guideNextV358').disabled=false;
    position();$('guideNextV358').focus({preventScroll:true});
  }
  function abort(){
    const previous=tour;tour=null;++epoch;cleanDemo();$('customerGuideV358')?.classList.add('hidden');document.documentElement.classList.remove('customer-guide-open');
    if(previous&&account()===previous.id){window.closeBookingPickerV305?.();switchTab(previous.tab);window.scrollTo(0,previous.scroll);if(previous.picker)window.openBookingPickerV37?.();previous.focus?.isConnected&&previous.focus.focus({preventScroll:true});}
  }
  function finish(result){if(!tour)return;void record(result);abort();}
  function maybeOffer(){
    clearTimeout(offerTimer);
    const id=account(),profile=state.data?.profile;if(!id||!profile||tour)return;
    if(saved(id)&&!profile.intro_guide_seen_at){void record(saved(id));return;}
    if(profile.intro_guide_eligible!==true||profile.intro_guide_seen_at||saved(id)||!ready())return;
    if(state.activeTab!=='booking'||pickerOpen()||!$('loading')?.classList.contains('hidden')||otherModal())return;
    begin(false);
  }
  function schedule(){clearTimeout(offerTimer);offerTimer=setTimeout(maybeOffer,350);}
  function mount(){
    const rows=$('menuSettingsGroup')?.querySelector('.customer-menu-rows');if(!rows||$('menuGuideV358'))return;
    const button=document.createElement('button');button.id='menuGuideV358';button.type='button';
    button.innerHTML='<svg aria-hidden="true"><use href="#ci-book"/></svg><span>Sprievodca appkou</span><b>›</b>';
    button.onclick=()=>begin(true);rows.insertBefore(button,$('menuLogout'));
  }
  window.customerGuideAbortV358=abort;
  document.addEventListener('customer-onboarding-ready-v358',schedule);
  addCustomerHook('afterBootstrap',()=>{if(tour&&tour.id!==account())abort();mount();schedule();});
  addCustomerHook('afterSwitchTab',()=>{if(!tour)schedule();});
  addCustomerHook('afterRenderDog',()=>{if(tour&&tour.id!==account())abort();});
  window.addEventListener('resize',position);window.visualViewport?.addEventListener('resize',position);
  document.addEventListener('scroll',()=>{if(tour)position();},true);
  mount();
})();
