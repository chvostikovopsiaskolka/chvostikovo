/* Customer polls owner-only UI pilot v432. Presentation/demo data only: no poll API, no global totals, no push. */
(() => {
  'use strict';
  const OWNER_FINGERPRINT = 'c2a6a40c1905b238cdb5e3cd858a3e8d7e14f5ed2937b90f938bc9ae51a87385';
  const POLL = Object.freeze({
    id:'calendar-interest-pilot',
    sk:{
      tag:'Skúšobné hlasovanie', title:'Škôlkarsky kalendár',
      question:'Mali by ste záujem o kalendár Chvostíkova?',
      details:'Pripravujeme nápad na kalendár so škôlkarmi. Chceli by sme ním podporiť OZ.',
      choices:['Áno, mal/a by som záujem','Nie, nemal/a by som záujem'],
      vote:'Hlasovať', thanks:'Ďakujeme za váš hlas!', answer:'Vaša odpoveď',
      info:'Toto je iba súkromný náhľad. Hlasy sa zatiaľ neukladajú do škôlkarskej databázy.',
      count:'Testovacie hlasy na tomto zariadení: ',
      open:'Pozrieť oznamy', overview:'Aktuálne hlasovanie',
      goto:'Prejsť na hlasovanie', menu:'Hlasovanie',
      reminder:'Kalendár Chvostíkova – záujem'
    },
    en:{
      tag:'Poll preview', title:'Daycare calendar',
      question:'Would you be interested in a Chvostíkovo calendar?',
      details:'We are considering a calendar featuring our daycare dogs to support a nonprofit organization.',
      choices:['Yes, I would be interested','No, not interested'],
      vote:'Vote', thanks:'Thanks for voting!', answer:'Your answer',
      info:'Private preview only. Votes are not yet saved in the daycare database.',
      count:'Demo votes on this device: ',
      open:'View announcements', overview:'Current poll',
      goto:'Open poll', menu:'Poll',
      reminder:'Chvostíkovo calendar – interest'
    }
  });
  const get = id => document.getElementById(id);
  const language = () => window.ChvostikovoLocale?.getLanguage?.()==='en'?'en':'sk';
  const text = () => POLL[language()];
  const storageKey = account => 'chvo-customer-polls-pilot-v432:'+account+':'+POLL.id;
  let eligibleAccount=null,serial=0;
  function readVote(account){
    try{const selected=Number(localStorage.getItem(storageKey(account)));return [1,2].includes(selected)?selected:null}
    catch(_){return null}
  }
  async function isOwner(account){
    if(!account||!crypto?.subtle||typeof TextEncoder==='undefined')return false;
    const input=new TextEncoder().encode(String(account).toLowerCase());
    const buffer=await crypto.subtle.digest('SHA-256',input);
    const hex=Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
    return hex===OWNER_FINGERPRINT;
  }
  function element(tag,className,content){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(content!==undefined)node.textContent=content;
    return node;
  }
  function unmount(){
    get('customerPollMenuV432')?.remove();
    get('customerPollOverviewV432')?.remove();
    get('customerPollNavBadgeV432')?.remove();
    const wrapper=get('customerMenuPrimaryV432');
    if(wrapper){
      for(const child of Array.from(wrapper.children))wrapper.before(child);
      wrapper.remove();
    }
    document.documentElement.classList.remove('customer-polls-owner-v432');
    eligibleAccount=null;
  }
  function mount(){
    const menu=get('menuTab'),booking=get('bookingTab'),upcoming=get('upcomingBookings');
    if(!menu||!booking||!upcoming)return;
    if(!get('customerMenuPrimaryV432')){
      const first=get('menuDogGroup');
      if(first){
        const wrapper=element('div','customer-menu-primary-v432');
        wrapper.id='customerMenuPrimaryV432';
        first.before(wrapper);
        for(const id of ['menuDogGroup','menuContact','menuSettingsGroup','menuMessage']){
          const row=get(id);if(row)wrapper.append(row);
        }
      }
    }
    if(!get('customerPollMenuV432')){
      const card=element('section','customer-poll-v432 customer-poll-menu-v432');
      card.id='customerPollMenuV432';
      card.setAttribute('aria-live','polite');
      const social=menu.querySelector('.customer-social-v223');
      if(social)social.before(card);else menu.append(card);
      card.addEventListener('click',onCardClick);
    }
    if(!get('customerPollOverviewV432')){
      const preview=element('section','customer-poll-v432 customer-poll-overview-v432');
      preview.id='customerPollOverviewV432';
      upcoming.after(preview);
      preview.addEventListener('click',event=>{
        if(!event.target.closest('[data-poll-open]'))return;
        switchTab('menu');
        requestAnimationFrame(()=>{
          get('customerPollMenuV432')?.scrollIntoView({block:'center',behavior:'auto'});
          get('customerPollMenuTitleV432')?.focus({preventScroll:true});
        });
      });
    }
    if(!get('customerPollNavBadgeV432')){
      const nav=get('navDog');
      if(nav){
        const badge=element('span','customer-poll-nav-badge-v432','1');
        badge.id='customerPollNavBadgeV432';
        badge.setAttribute('aria-hidden','true');
        nav.append(badge);
      }
    }
    document.documentElement.classList.add('customer-polls-owner-v432');
  }
  function render(){
    const sessionAccount=state?.session?.user?.id;
    if(!eligibleAccount||sessionAccount!==eligibleAccount){unmount();return}
    const words=text(),vote=readVote(eligibleAccount);
    const container=get('customerPollMenuV432');
    const compact=get('customerPollOverviewV432');
    if(!container||!compact)return;
    container.replaceChildren();
    const heading=element('div','customer-poll-heading-v432');
    const kicker=element('span','customer-poll-kicker-v432',words.tag);
    const title=element('h2','',words.title);
    title.id='customerPollMenuTitleV432';title.tabIndex=-1;
    heading.append(kicker,title);
    container.append(heading,element('p','customer-poll-question-v432',words.question),
      element('p','customer-poll-desc-v432',words.details));
    if(vote){
      const complete=element('div','customer-poll-complete-v432');
      complete.append(element('strong','',words.thanks),
        element('p','',words.answer+': '+words.choices[vote-1]));
      container.append(complete);
      const open=element('button','customer-poll-open-notices-v432',words.open);
      open.type='button';open.dataset.pollNotices='true';
      container.append(open);
    }else{
      const options=element('div','customer-poll-options-v432');
      options.setAttribute('role','group');options.setAttribute('aria-label',words.question);
      words.choices.slice(0,10).forEach((choice,index)=>{
        const button=element('button','customer-poll-choice-v432',choice);
        button.type='button';button.dataset.pollChoice=String(index+1);
        options.append(button);
      });
      container.append(options);
    }
    container.append(element('p','customer-poll-count-v432',words.count+(vote?'1':'0')),
      element('p','customer-poll-info-v432',words.info));
    compact.replaceChildren();
    const subtitle=element('span','customer-poll-kicker-v432',words.overview);
    const intro=element('strong','',words.reminder);
    const button=element('button','customer-poll-preview-action-v432',words.goto);
    button.type='button';button.dataset.pollOpen='true';
    compact.append(subtitle,intro,button);
    const badge=get('customerPollNavBadgeV432');
    if(badge)badge.hidden=Boolean(vote);
  }
  function onCardClick(event){
    if(!eligibleAccount||state?.session?.user?.id!==eligibleAccount)return;
    const option=event.target.closest('[data-poll-choice]');
    if(option&&get('customerPollMenuV432')?.contains(option)){
      if(readVote(eligibleAccount))return;
      const choice=Number(option.dataset.pollChoice);
      if(!Number.isInteger(choice)||choice<1||choice>POLL.sk.choices.length)return;
      try{localStorage.setItem(storageKey(eligibleAccount),String(choice));render()}
      catch(_){const info=get('customerPollMenuV432')?.querySelector('.customer-poll-info-v432');if(info)info.textContent='Hlas sa nepodarilo uložiť na tomto zariadení.'}
      return;
    }
    if(event.target.closest('[data-poll-notices]')){
      const group=get('menuDogGroup');if(group)group.open=true;
      get('menuBulletinV229')?.click();
    }
  }
  async function sync(){
    const account=state?.session?.user?.id;
    if(!account||!state?.data){serial++;unmount();return}
    if(eligibleAccount===account){render();return}
    serial++;const current=serial;
    unmount();
    let allowed=false;
    try{allowed=await isOwner(account)}catch(_){}
    if(current!==serial||state?.session?.user?.id!==account||!state?.data)return;
    if(!allowed)return;
    eligibleAccount=account;mount();render();
  }
  addCustomerHook('afterBootstrap',sync);
  addCustomerHook('afterRenderDog',sync);
  addCustomerHook('afterSwitchTab',sync);
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-customer-locale]'))
      requestAnimationFrame(()=>{if(eligibleAccount===state?.session?.user?.id)render()});
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else void sync();
})();
