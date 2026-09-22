// Runtime documentation overrides for production changes that should be reflected
// in Chvostíkovo System without coupling the documentation app to production data.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;

  const customer = data.sections?.find(section => section.id === 'customer-app');
  const dogProfile = customer?.items?.find(item => item.title === 'Môj psík');
  if (dogProfile) {
    dogProfile.body = 'Sekcia Môj psík je produkčný rozcestník profilu psa: foto a meno hore, dlaždice pre Údaje psíka, Očkovania, Pravidlá škôlky, Návštevy, Žiacku knižku a Nastavenia.';
    dogProfile.bullets = [
      'Očkovania sú oddelené od základných údajov a po novom pracujú s platnosťou troch povinných očkovaní a fotografiami očkovacieho preukazu.',
      'Používateľ môže nahrať 1 až 3 fotografie; iOS spracovanie fotiek bolo upravené na bezpečnejší decode/resize/JPEG flow.',
      'Pravidlá a ochrana osobných údajov sú v Nastaveniach oddelené a majú vlastné otvorenie dokumentu.',
      'Návštevy zostávajú v samostatnom modale; Žiacka knižka je zatiaľ Pripravujeme.',
      'Spodná navigácia ostáva Rezervácie, Môj psík a Správy.'
    ];
    dogProfile.tags = [...new Set([...(dogProfile.tags || []), 'dog-hub', 'vaccination-proofs', 'ios-photo-flow', 'settings'])];
  }

  if (customer) {
    let booking = customer.items?.find(item => /rezerv/i.test(String(item.title || '')));
    if (!booking) {
      booking = {title:'Rezervácie',subtitle:'Kompaktný výber jedného alebo viacerých dní.',status:'production',statusLabel:'Produkcia',categories:['customer'],body:'',bullets:[],tags:['booking']};
      customer.items = [...(customer.items || []), booking];
    }
    booking.body = 'Rezervácie zachovávajú multi-day výber, taxi a existujúcu schvaľovaciu logiku. Nová ochrana blokuje rezervovanie, ak povinné očkovanie už nie je platné.';
    booking.bullets = [
      'Platnosť očkovania sa porovnáva s aktuálnym dňom; expirované očkovanie sa nepovažuje za kompletné.',
      'Rezervačná obrazovka dostala iba vizuálne doladenie pozadia/labiek, bez zmeny jadra rezervácií.',
      'Zatvorené, plné a už rezervované dni zostávajú nevyberateľné.'
    ];
    booking.tags = [...new Set([...(booking.tags || []), 'vaccination-gate', 'multi-day'])];

    let pwa = customer.items?.find(item => /PWA|inštal|instal/i.test(String(item.title || '')));
    if (!pwa) {
      pwa = {title:'PWA inštalácia',subtitle:'Pridanie zákazníckeho portálu na plochu telefónu.',status:'production',statusLabel:'Produkcia',categories:['customer','technical'],body:'',bullets:[],tags:['pwa','ios','android']};
      customer.items = [...(customer.items || []), pwa];
    }
    pwa.body = 'Produkčný customer shell je v105. Login logo je vložené priamo ako statický data asset, takže jeho zobrazenie nezávisí od ďalšieho requestu na Edge Function ani samostatný obrázkový endpoint.';
    pwa.bullets = [
      'Service worker/cache build: 20260922-customer-iosproof-v105.',
      'Launcher ikony a notification badge zostávajú statické.',
      'Posledná oprava loga nemenila build identifikátor v105, iba spôsob vykreslenia login loga.'
    ];
    pwa.tags = [...new Set([...(pwa.tags || []), 'v105', 'static-logo', 'ios'])];
  }

  const admin = data.sections?.find(section => String(section.id || '').toLowerCase().includes('admin') || String(section.title || '').toLowerCase().includes('admin'));
  if (admin) {
    let overview = admin.items?.find(item => /prehľad|prehlad|overview/i.test(String(item.title || '')));
    if (!overview) {
      overview = {title:'Prehľad',subtitle:'Prioritné požiadavky na jednom mieste.',status:'production',statusLabel:'Produkcia',categories:['admin'],body:'',bullets:[],tags:['overview']};
      admin.items = [...(admin.items || []), overview];
    }
    overview.body = 'Admin frontend zostáva na Supabase mimo customer Vercel deployov.';
    overview.bullets = [
      'chvostikovo-frontend je ACTIVE v41.',
      'customer-portal-api je ACTIVE v26 a admin-push ACTIVE v11.',
      'Admin frontend sa naďalej spravuje cez Supabase snapshot/frontend mechanizmus.'
    ];
  }
})();

// Daily consolidated project status. Keep one entry per day instead of logging every intermediate step.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;
  data.meta.updated = '22. 9. 2026 · 23:40';

  const live = data.environments?.find(item => item.label === 'LIVE');
  if (live) {
    live.version = 'v105 · READY';
    live.note = 'Zákaznícka PWA je v produkcii na builde 20260922-customer-iosproof-v105. Verejná production URL vracia tento build a posledný Vercel production deployment je READY na aktuálnom HEAD customer-portal-production.';
    live.bullets = [
      'Vercel production: dpl_Ho4TrEeiU6e7tW61CxA1D3J9FCZT · READY.',
      'Git customer-portal-production: db88da2d75a3584de3430ea77b223eae606eeccb.',
      'Produkčný build: 20260922-customer-iosproof-v105.',
      'Supabase: customer-portal-api ACTIVE v26; admin-push ACTIVE v11; chvostikovo-frontend ACTIVE v41.'
    ];
  }

  const preview = data.environments?.find(item => item.label === 'PREVIEW');
  if (preview) {
    preview.version = 'staging/preview · používať pred väčšími zmenami';
    preview.note = 'Dnešný iOS vaccination flow bol pred produkciou skúšaný cez pracovnú preview vetvu. Ďalšie väčšie customer balíky opäť najprv otestovať a potom publikovať jedným produkčným release.';
    preview.bullets = ['Nevytvárať sériu drobných produkčných deployov; vizuálne a funkčné úpravy zoskupiť do jedného testovaného balíka.'];
  }

  data.now = {
    title: 'Customer v105 – očkovania a iOS foto flow',
    status: 'Produkcia READY',
    statusTone: 'production',
    note: 'Hlavnou dnešnou zmenou je nový praktický flow očkovaní: zákazník zadáva platnosť troch povinných očkovaní a prikladá fotografie očkovacieho preukazu. Rezervácia sa pri expirovanom očkovaní zablokuje. iOS výber a spracovanie fotografií bol následne stabilizovaný a produkcia je na v105.',
    bullets: [
      'Očkovania: pridané 1–3 fotografie preukazu, náhľady a jednoduchšie zadávanie platnosti bez zbytočného dátumu aplikácie.',
      'Bezpečnostná logika rezervácie: expirované povinné očkovanie už nespĺňa podmienku pre rezervovanie.',
      'iOS: foto flow používa bezpečnejší decode/resize/JPEG postup a je chránený proti duplicitnému renewal modalu počas práce s očkovaniami.',
      'Nastavenia/pravidlá boli vizuálne a funkčne upratané; rezervácie dostali len jemný vizuálny polish.',
      'Login logo bolo opravené vloženým statickým assetom, aby sa spoľahlivo zobrazilo bez ďalšieho sieťového requestu.',
      'Ďalší krok: manuálne potvrdiť upload/nahradenie 1–3 fotiek na reálnom iPhone a Androide, blokáciu rezervácie po expirácii a sledovať customer-portal-api usage po v26.'
    ]
  };

  data.recent = [
    {
      date: '22. 9. 2026',
      app: 'Denný súhrn',
      title: 'Customer v105 – očkovania, iOS fotografie a produkčný stav',
      text: 'Customer PWA je na produkčnom builde 20260922-customer-iosproof-v105. Očkovania boli zjednodušené na platnosť troch povinných vakcín a 1–3 fotografie očkovacieho preukazu; expirované očkovanie teraz blokuje rezerváciu. Po prvom nasadení foto flow bol opravený pre iOS spracovanie obrázkov a doladený upload/náhľad, Nastavenia a pravidlá. Login logo je vložené priamo ako statický asset. Aktuálny HEAD customer-portal-production je db88da2d a Vercel deployment dpl_Ho4TrEeiU6e7tW61CxA1D3J9FCZT je READY. Supabase customer-portal-api je ACTIVE v26, admin-push v11 a admin frontend v41. Web Chvostíkovo dostal kompaktný CTA pás Prečo využiť psiu škôlku. Ďalší krok je potvrdiť očkovací foto flow na reálnom iOS/Android zariadení a ďalšie customer zmeny opäť zoskupiť do jedného release.'
    },
    ...(data.recent || []).filter(item => item.date !== '22. 9. 2026')
  ];
})();