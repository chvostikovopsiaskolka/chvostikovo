// Runtime documentation overrides for production changes that should be reflected
// in Chvostíkovo System without coupling the documentation app to production data.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;

  const customer = data.sections?.find(section => section.id === 'customer-app');
  const dogProfile = customer?.items?.find(item => item.title === 'Môj psík');
  if (dogProfile) {
    dogProfile.body = 'Sekcia Môj psík je po produkčnom redizajne hlavný rozcestník profilu psa. Hore je výrazná fotka a meno psa, pod nimi šesť kompaktných dlaždíc pre Údaje psíka, Očkovania, Pravidlá škôlky, Návštevy psíka v škôlke, Žiacku knižku a Nastavenia.';
    dogProfile.bullets = [
      'Fotka psa je hore ako samostatný vizuálny blok; avatar a akcenty rozlišujú pohlavie psa.',
      'Údaje psíka a Očkovania sa otvárajú samostatne; Pravidlá škôlky majú vlastný modal.',
      'Návštevy psíka v škôlke sa zobrazujú v modale s celkovým počtom a mesačným prehľadom.',
      'Žiacka knižka zostáva zatiaľ ako Pripravujeme.',
      'Menu bolo premenované na Nastavenia; účet, upozornenia a súhlasy zostávajú oddelené od hlavného profilu.',
      'Spodná navigácia ostáva Rezervácie, Môj psík s reálnou fotkou psa a Správy.'
    ];
    dogProfile.tags = [...new Set([...(dogProfile.tags || []), 'dog-hub', 'settings', 'visits-modal', 'gender-accent', 'app-nav'])];
  }

  const pass = customer?.items?.find(item => item.title === 'Permanentka');
  if (pass) pass.body = 'Zákazník vidí aktuálny typ vstupu bez negatívneho formulovania. Aktívna permanentka má kompaktnú zelenú kartu s počtom použitých a zostávajúcich vstupov, dátumom kúpy a platnosťou. Cena sa pri už zakúpenej permanentke nezobrazuje. Zákazník môže požiadať o 10-vstupovú permanentku.';

  if (customer) {
    let booking = customer.items?.find(item => /rezerv/i.test(String(item.title || '')));
    if (!booking) {
      booking = {title:'Rezervácie',subtitle:'Kompaktný výber jedného alebo viacerých dní.',status:'production',statusLabel:'Produkcia',categories:['customer'],body:'',bullets:[],tags:['booking']};
      customer.items = [...(customer.items || []), booking];
    }
    booking.body = 'Majiteľ otvorí výber cez Chcem prihlásiť psíka, označí jeden alebo viac dní na najbližšie dva týždne, vyberie taxi a odošle rezervácie naraz.';
    booking.bullets = [
      'Oranžová hlavička zobrazuje fotku a meno vybraného psíka a stav vstupu/permanentky.',
      'Zatvorené, plné a už rezervované dni nie je možné znovu vybrať.',
      'Každá rezervácia zobrazuje stav, počet prihlásených psíkov, taxi a možnosť zrušenia.',
      'Avatar psíka v rezerváciách používa rovnaké pohlavné akcenty ako profil.'
    ];
    booking.tags = [...new Set([...(booking.tags || []), 'multi-day', 'booking-sheet', 'two-weeks'])];

    let messages = customer.items?.find(item => /správ|sprav|message/i.test(String(item.title || '')));
    if (messages) messages.body = 'Správy majú kompaktný chatový vzhľad, menšie bubliny a nižší formulár. Blok Zavolať do Chvostíkova je vycentrovaný.';

    let pwa = customer.items?.find(item => /PWA|inštal|instal/i.test(String(item.title || '')));
    if (!pwa) {
      pwa = {title:'PWA inštalácia',subtitle:'Pridanie zákazníckeho portálu na plochu telefónu.',status:'production',statusLabel:'Produkcia',categories:['customer','technical'],body:'',bullets:[],tags:['pwa','ios','android']};
      customer.items = [...(customer.items || []), pwa];
    }
    pwa.body = 'Portál používa lokálne statické launcher/brand assety. Customer shell už kvôli logu nevolá Supabase Edge Function.';
    pwa.bullets = [
      'Launcher ikony ostávajú statické a service worker používa nový cache build v101.',
      'Branding na login obrazovke používa /icon-192.png namiesto Edge Function URL.',
      'Notification badge zostal zachovaný bez zmeny.'
    ];
    pwa.tags = [...new Set([...(pwa.tags || []), 'static-assets', 'usage-fix', 'pwa'])];
  }

  const admin = data.sections?.find(section => String(section.id || '').toLowerCase().includes('admin') || String(section.title || '').toLowerCase().includes('admin'));
  if (admin) {
    let overview = admin.items?.find(item => /prehľad|prehlad|overview/i.test(String(item.title || '')));
    if (!overview) {
      overview = {title:'Prehľad',subtitle:'Prioritné požiadavky na jednom mieste.',status:'production',statusLabel:'Produkcia',categories:['admin'],body:'',bullets:[],tags:['overview']};
      admin.items = [...(admin.items || []), overview];
    }
    overview.body = 'Prehľad obsahuje hlavné operatívne bloky a živé súhrny rezervácií, majiteľov, správ a záujmu o škôlku.';
    overview.bullets = [
      'Admin frontend na Supabase je aktuálne Edge Function chvostikovo-frontend v41.',
      'Admin zostáva mimo Vercel customer deployov; jeho frontend sa spravuje cez Supabase snapshot/frontend mechanizmus.'
    ];

    let nav = admin.items?.find(item => /navig/i.test(String(item.title || '')));
    if (!nav) {
      nav = {title:'Admin navigácia',subtitle:'App-style spodná lišta.',status:'production',statusLabel:'Produkcia',categories:['admin'],body:'Spodná navigácia admin aplikácie je plávajúca lišta s ikonou nad textom.',bullets:[],tags:['navigation','app-style']};
      admin.items = [...(admin.items || []), nav];
    }
  }
})();

// Daily consolidated project status. Keep one entry per day instead of logging every intermediate step.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;
  data.meta.updated = '21. 9. 2026 · 23:40';

  const live = data.environments?.find(item => item.label === 'LIVE');
  if (live) {
    live.version = 'v101 · READY';
    live.note = 'Zákaznícka PWA je v produkcii na builde 20260921-customer-usagefix-v101. Posledný production deployment je READY a zodpovedá HEAD vetvy customer-portal-production.';
    live.bullets = [
      'Vercel production: dpl_DfqwzVcdmYedkfFRRJvHoZgWbtvp · READY.',
      'Git customer-portal-production: c65de62921e36907ea4e3515566d2ff190116991.',
      'Produkčný build: 20260921-customer-usagefix-v101.',
      'Supabase customer-portal-api je ACTIVE v24; admin-push je ACTIVE v11; admin frontend chvostikovo-frontend je ACTIVE v41.'
    ];
  }

  const preview = data.environments?.find(item => item.label === 'PREVIEW');
  if (preview) {
    preview.version = 'staging/preview · pripravené';
    preview.note = 'Preview zostáva určené na testovanie väčších customer zmien pred vedomým produkčným release; dnešný finálny stav je už v customer produkcii v101.';
    preview.bullets = ['Ďalšie väčšie zmeny najprv zoskupiť a otestovať, potom spraviť jeden production deploy.'];
  }

  data.now = {
    title: 'Stabilizácia customer v101 a pokračovanie konsolidácie',
    status: 'Produkcia stabilizovaná',
    statusTone: 'production',
    note: 'Dnešný customer balík prešiel cez redizajn Môj psík až po technický usage fix. Najdôležitejšie je teraz sledovať Supabase Edge Function spotrebu a ďalšie zmeny opäť zoskupovať, aby sa neopakovali zbytočné requesty ani séria Vercel deployov.',
    bullets: [
      'Môj psík je v produkcii ako feature hub: foto hore, dlaždice Údaje psíka, Očkovania, Pravidlá škôlky, Návštevy, Žiacka knižka a Nastavenia.',
      'Doplnené pohlavné vizuálne akcenty avatarov a doladené názvy/rozloženie profilu.',
      'v101 odstránila zbytočný customer Edge Function traffic: okamžitý bootstrap sync po Realtime open bol odstránený, fallback pri čakaní na pridelenie psa je 60 s a brand obrázky sú lokálne statické assety.',
      'Rozhodnutie: ďalšie customer úpravy robiť ako konsolidovaný balík a až po kontrole requestov spraviť jeden produkčný deploy.',
      'Ďalší krok: skontrolovať Supabase usage po v101, dokončiť zostávajúce onboarding/push testy na iOS/Android a pokračovať v Žiackej knižke až po potvrdení stability.'
    ]
  };

  data.recent = [
    {
      date: '21. 9. 2026',
      app: 'Denný súhrn',
      title: 'Customer v101 + web – konsolidovaný stav',
      text: 'Customer PWA bola dnes posunutá cez redizajn Môj psík do produkčného v101: profil psa je feature hub s fotkou hore, samostatnými dlaždicami pre údaje, očkovania, pravidlá, návštevy, pripravovanú Žiacku knižku a Nastavenia; pribudli pohlavné akcenty avatarov. Po zistení vysokej Supabase Edge Function spotreby bol odstránený zbytočný sync pri otvorení Realtime, waiting fallback sa spomalil na 60 sekúnd a login branding sa presunul na lokálny statický asset. Produkčný Vercel deployment dpl_DfqwzVcdmYedkfFRRJvHoZgWbtvp je READY na commite c65de629 a builde 20260921-customer-usagefix-v101. Web Chvostíkovo dostal sekciu/CTA Prečo využiť psiu škôlku a doladené texty benefitov. Ďalší krok je sledovať Supabase usage po v101 a ďalšie customer zmeny zoskupovať do jedného testovaného release.'
    },
    ...(data.recent || []).filter(item => item.date !== '21. 9. 2026')
  ];
})();