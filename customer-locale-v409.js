/* Chvostíkovo SK/EN customer interface v409.
 * Presentation-only: no auth, API, profile, terms or checkout mutation.
 * Keep legally binding text and staff-written notices in their original language.
 */
(() => {
  'use strict';
  const STORAGE_KEY = 'chvostikovo-customer-locale-v408';
  const DICTIONARY = new Map([
  ["Späť na úvod","Back to welcome"],
  ["Späť","Back"],
  ["Bližšie k vášmu psíkovi","Closer to your dog"],
  ["Zákaznícky portál","Customer portal"],
  ["Permanentka, dochádzka, rezervácie aj oznamy. Všetko dôležité na jednom mieste.","Passes, attendance, bookings and announcements. Everything important in one place."],
  ["Prehľad funkcií","Features"],
  ["Permanentka","Pass"],
  ["Dochádzka","Attendance"],
  ["Oznamy","Announcements"],
  ["Vytvoriť účet","Create an account"],
  ["Už mám účet","I already have an account"],
  ["Prihlásenie","Sign in"],
  ["Prihlásiť sa","Sign in"],
  ["Obnova hesla","Reset password"],
  ["Nové heslo","New password"],
  ["E-mail","Email"],
  ["Heslo","Password"],
  ["Zapamätať prihlásenie","Remember me"],
  ["Zabudli ste heslo?","Forgot your password?"],
  ["Meno a priezvisko","Full name"],
  ["Telefón","Phone number"],
  ["Meno psíka","Dog's name"],
  ["Podľa mena ho priradíme k vášmu účtu.","We will link your dog to your account by name."],
  ["V prípade dvoch psíkov vyplňte mená oboch oddelené čiarkou (napr. Bella, Iris).","If you have two dogs, enter both names separated by a comma (e.g. Bella, Iris)."],
  ["Minimálne 8 znakov, malé a veľké písmeno a aspoň 1 číslica.","At least 8 characters, including upper- and lower-case letters and one digit."],
  ["E-mail k účtu","Account email"],
  ["Pošleme vám odkaz na vytvorenie nového hesla.","We will email you a password reset link."],
  ["Poslať odkaz na obnovu","Send reset link"],
  ["Späť na prihlásenie","Back to sign in"],
  ["Zopakujte nové heslo","Repeat your new password"],
  ["Uložiť nové heslo","Save new password"],
  ["Skúsiť znova","Try again"],
  ["Appku sa nepodarilo načítať","The app couldn't be loaded"],
  ["Prihlásenie zostalo zachované. Skontrolujte pripojenie alebo to skúste znova o chvíľu.","Your sign-in has been preserved. Check your connection or try again shortly."],
  ["Neplatné prihlasovacie údaje.","Invalid sign-in details."],
  ["Požiadavka sa nepodarila.","The request couldn't be completed."],
  ["Prístup k účtu je zablokovaný. Kontaktujte Chvostíkovo.","Your account is blocked. Please contact Chvostíkovo."],
  ["Zadajte e-mail.","Enter your email."],
  ["Zadajte heslo.","Enter your password."],
  ["E-mail bol odoslaný.","Email sent."],
  ["Skontrolujte e-mail.","Check your email."],
  ["Zmena hesla","Change password"],
  ["Otvoriť účet","Open account"]
  ]);
  // v409: selected navigation/booking/vaccination/guide UI, never customer content.
  for(const [sk,en] of [["Môj psík","My dog"],["Správa údajov a informácií o psíkovi","Manage your dog's information"],["Údaje psíka","Dog details"],["Očkovania","Vaccinations"],["Oznamy","Announcements"],["Pravidlá škôlky","Daycare rules"],["Žiacka knižka","Report card"],["Pripravujeme","Coming soon"],["Moje kontaktné údaje","My contact details"],["Vaše osobné údaje a kontakty","Your personal and contact details"],["Nastavenia","Settings"],["Upozornenia a súhlasy","Notifications and consents"],["Upozornenia","Notifications"],["Súhlasy a podmienky","Consents and terms"],["Požiadať o vymazanie účtu","Request account deletion"],["Odhlásiť sa","Sign out"],["Všetky práva vyhradené.","All rights reserved."],["Sledujte Chvostíkovo aj na sociálnych sieťach 🐾","Follow Chvostíkovo on social media 🐾"],["Nájdete tu príbehy, fotky a videá vašich štvornohých ratolestí z ich dní v škôlke.","Enjoy stories, photos and videos from your dogs' days at daycare."],["Napíšte nám správu","Send us a message"],["Správy","Messages"],["Napíšte nám otázku k rezervácii alebo čokoľvek iné.","Ask us about a booking or anything else."],["Zavolať do Chvostíkova","Call Chvostíkovo"],["Súvisiaca rezervácia (nepovinné)","Related booking (optional)"],["Bez konkrétnej rezervácie","No specific booking"],["Správa","Message"],["Odoslať správu","Send message"],["Napíšte správu pre Chvostíkovo…","Write a message to Chvostíkovo…"],["Vyberte deň","Choose a day"],["Rezervácie na ďalší týždeň do nedele 20:00.","Book next week's visits by Sunday at 8 PM."],["Ak potrebujete individuálny termín, kontaktujte nás.","Contact us if you need an individual arrangement."],["Rezervácie","Bookings"],["Rezervovať miesto","Book a place"],["Rezervovať","Book"],["Upraviť","Edit"],["Zrušiť","Cancel"],["Potvrdiť","Confirm"],["Vybraté dni","Selected days"],["Vyberte psíka","Select a dog"],["Otvoriť údaje psíka","Open dog details"],["Moje rezervácie","My bookings"],["Dnes","Today"],["Zajtra","Tomorrow"],["Použité vstupy","Visits used"],["Platnosť od","Valid from"],["Platí do","Valid until"],["Bez aktuálnej permanentky","No active pass"],["Aktívna permanentka","Active pass"],["Plánovaný vstup","Planned visit"],["Jednorazový vstup","Single visit"],["Posledný vstup","Final visit"],["Rezervácia","Booking"],["Čaká na schválenie","Pending approval"],["Schválené","Approved"],["Zrušené","Cancelled"],["Návštevy","Visits"],["Počet návštev","Visit count"],["Príchod","Arrival"],["Odchod","Departure"],["Otvoriť Správy","Open messages"],["Zobraziť viac","Show more"],["Zobraziť všetky","Show all"],["Zavrieť","Close"],["Uložiť","Save"],["Uložiť kontaktné údaje","Save contact details"],["Uložiť očkovania","Save vaccinations"],["Údaje môžete kedykoľvek doplniť alebo upraviť.","You can complete or update these details at any time."],["Fotografie očkovacieho preukazu","Vaccination record photos"],["Nahrajte alebo odfoťte 1 až 5 fotografií strán s platnosťou očkovaní.","Upload or take 1 to 5 photos showing the validity of vaccinations."],["Kotercový kašeľ","Kennel cough"],["Besnota","Rabies"],["Infekčné ochorenia","Infectious diseases"],["Má váš psík leptospirózu zaočkovanú zvlášť?","Has your dog received a separate leptospirosis vaccination?"],["Dátum vyplňte iba pri samostatnom očkovaní L4. Ak má psík spoločné DHPPi+L, nechajte toto pole prázdne.","Enter the date only if L4 was given separately. Leave this blank for a combined DHPPi+L vaccination."],["Platí do (nepovinné)","Valid until (optional)"],["Zdravotné údaje","Health information"],["Plemeno","Breed"],["Váha","Weight"],["Pohlavie","Sex"],["Dátum narodenia","Date of birth"],["Súhlasy","Consents"],["Podmienky škôlky","Daycare terms"],["Ochrana osobných údajov","Privacy policy"],["Preskočiť","Skip"],["Pokračovať","Continue"],["Dokončiť","Finish"],["Spustiť sprievodcu","Start guide"],["Sprievodca appkou","App guide"],["Sprievodca aplikáciou","App guide"],["Ukážka rezervácie","Example booking"],["Rezervovať 2 dni","Book 2 days"],["Váš psík v Prehľade","Your dog in Overview"],["Permanentka a vaše rezervácie","Your pass and bookings"],["Vaše rezervácie","Your bookings"],["Výber dní a taxi","Choose dates and taxi"],["Všetko ostatné v Menu","Everything else in Menu"],["Ťuknutím na profil otvoríte údaje a fotografiu psíka. Pri očkovaniach nájdete ich platnosť, pri grafe počet návštev. Pri zapnutých upozorneniach pripomenieme končiace očkovanie 14 a 7 dní vopred.","Tap the profile to see your dog's details and photo. Check vaccination validity and visit count. With notifications enabled, we'll remind you 14 and 7 days before vaccinations expire."],["Ak máte zakúpenú permanentku, tu uvidíte jej platnosť a počet využitých vstupov. Pod ňou nájdete svoje rezervácie a možnosť Upraviť. Cez Oznamy otvoríte novinky zo škôlky a cez Správy nám priamo napíšete.","Here you'll find your pass validity and used visits. Below are your bookings and an Edit option. Open daycare news in Announcements or contact us in Messages."],["Tlačidlom Rezervovať miesto v spodnej lište otvoríte dostupné dni. Po výbere uvidíte Vybraté dni a potvrdenie rezervácie.","Use Book a place in the bottom bar to view available dates. After selecting, review Selected days and confirm the booking."],["Tu nájdete vytvorené rezervácie a stav schválenia. Podľa dostupných možností pridáte alebo upravíte taxi či zrušíte návštevu. Ak chcete zmeniť termín, zrušíte pôvodný a vyberiete nový.","Find your bookings and approval status here. Depending on availability, you can add or edit taxi transport or cancel a visit. To change a date, cancel the original and book a new one."],["Ukážka: vyberte dni v kalendári. Vybraté dni a tlačidlo Rezervovať nájdete pod kalendárom. Ku každému dňu môžete pridať taxi.","Example: select dates in the calendar. Selected days and the Book button appear below. Taxi transport can be added for each day."],["V Menu nájdete údaje psíka, očkovania, svoje kontakty aj správy pre škôlku. V Nastaveniach si môžete tohto sprievodcu kedykoľvek zopakovať. Pripravujeme aj rozšírenú žiacku knižku a odmeny.","The Menu contains your dog's details, vaccinations, contacts and messages. You can repeat this guide in Settings. More report-card features and rewards are coming."],["Ukážeme vám Prehľad, rezervácie a Menu v šiestich krátkych krokoch. Sprievodcu môžete kedykoľvek preskočiť.","We'll show you Overview, Bookings and the Menu in six short steps. You can skip the guide any time."]]) DICTIONARY.set(sk,en);
  const root = document.getElementById('authView');
  const controls = document.getElementById('customerLocaleSwitchV408');
  if (!root || !controls) return;
  const original = new WeakMap();
  const knownAttributes = new WeakMap();
  let lang = 'sk';
  try {
    const requested = new URL(location.href).searchParams.get('lang');
    lang = requested === 'en' || requested === 'sk' ? requested :
      localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'sk';
  } catch (_) { lang = 'sk'; }
  try { if (new URL(location.href).searchParams.has('lang')) localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  const roots = () => [root,document.getElementById('appView'),
    document.getElementById('customerGuideV358'),document.getElementById('dogDetailsModal'),
    document.getElementById('bookingPickerV37')].filter(Boolean);
  const excluded='script,style,textarea,[contenteditable="true"],.legal-body,.legal-card,#messageThread,.message-thread,#announcementNotice,#notificationList,.customer-bulletin-dialog-v229,.customer-bulletin-history-row-v229';
  const translate = text => DICTIONARY.get(text) ||
    (/^\d+ z \d+$/.test(text) ? text.replace(/^([0-9]+) z ([0-9]+)$/, '$1 of $2') : null);
  const bare = node => (node?.nodeValue || '').trim();
  function updateText(node) {
    if (node.nodeType !== 3 || !node.parentElement ||
      node.parentElement.closest(excluded)) return;
    const current = bare(node);
    if (!current) return;
    let record = original.get(node);
    if (!record || (current !== record.sk && current !== record.en)) {
      const en = translate(current);
      if (!en) return;
      record = {sk: current, en};
      original.set(node, record);
    }
    const next = lang === 'en' ? record.en : record.sk;
    if (current === next) return;
    const value = node.nodeValue;
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    node.nodeValue = leading + next + trailing;
  }
  function updateAttributes() {
    for(const scope of roots()) for(const element of scope.querySelectorAll('[aria-label],[title],[placeholder]')){
      if(element.closest(excluded))continue;
      let records=knownAttributes.get(element);
      if(!records){records=new Map();knownAttributes.set(element,records);}
      for(const attribute of ['aria-label','title','placeholder']){
        const current=element.getAttribute(attribute);
        if(current===null||!current.trim())continue;
        let record=records.get(attribute);
        if(!record||(current!==record.sk&&current!==record.en)){
          const en=translate(current);if(!en)continue;
          record={sk:current,en};records.set(attribute,record);
        }
        const next=lang==='en'?record.en:record.sk;
        if(current!==next)element.setAttribute(attribute,next);
      }
    }
  }
  function apply(){
    for(const scope of roots()){
      const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
      let node;while((node=walker.nextNode()))updateText(node);
    }
    updateAttributes();
    for(const button of document.querySelectorAll('#customerLocaleSwitchV408 button[data-customer-locale],#customerLocaleInMenuV409 button[data-customer-locale]')){
      const active=button.dataset.customerLocale===lang;
      if(button.getAttribute('aria-pressed')!==String(active))button.setAttribute('aria-pressed',String(active));
      button.classList.toggle('active',active);
    }
    if(document.documentElement.lang!==lang)document.documentElement.lang=lang;
  }
  let queued = false;
  const requestApply = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {queued = false;apply();});
  };
  const clickLocale=event=>{
    const button=event.target.closest('button[data-customer-locale]');
    if(!button||!event.currentTarget.contains(button))return;
    const chosen=button.dataset.customerLocale;if(chosen!=='sk'&&chosen!=='en')return;
    lang=chosen;try{localStorage.setItem(STORAGE_KEY,lang)}catch(_){}
    apply();
  };
  controls.addEventListener('click',clickLocale);
  document.getElementById('customerLocaleInMenuV409')?.addEventListener('click',clickLocale);
  const observer=new MutationObserver(records=>{
    if(records.some(record=>{
      const element=record.target.nodeType===1?record.target:record.target.parentElement;
      if(element?.closest?.('.lg-v3-material,.lg-v3-output,'+excluded))return false;
      if(element?.closest?.('#authView,#appView,#customerGuideV358,#dogDetailsModal,#bookingPickerV37'))return true;
      return [...record.addedNodes].some(node=>node.nodeType===1&&(node.id==='customerGuideV358'||node.querySelector?.('#customerGuideV358')));
    }))requestApply();
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
  window.ChvostikovoLocale = Object.freeze({
    getLanguage: () => lang,
    setLanguage: value => {
      if (value !== 'sk' && value !== 'en') return false;
      lang = value;
      try {localStorage.setItem(STORAGE_KEY,lang)} catch (_) {}
      apply();
      return true;
    }
  });
  apply();
})();
