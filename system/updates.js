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
  data.meta.updated = '23. 9. 2026 · 23:42';

  const live = data.environments?.find(item => item.label === 'LIVE');
  if (live) {
    live.version = 'v105 · READY';
    live.note = 'Zákaznícka PWA zostáva stabilná na produkčnom builde 20260922-customer-iosproof-v105. Za posledných 24 hodín nebol vytvorený nový customer production deployment.';
    live.bullets = [
      'Vercel production: dpl_Ho4TrEeiU6e7tW61CxA1D3J9FCZT · READY.',
      'Git customer-portal-production: db88da2d75a3584de3430ea77b223eae606eeccb.',
      'Produkčný build: 20260922-customer-iosproof-v105.',
      'Dnešné zmeny sa týkali verejného webu; customer PWA sa zbytočne nedeployovala.'
    ];
  }

  const preview = data.environments?.find(item => item.label === 'PREVIEW');
  if (preview) {
    preview.version = 'staging/preview · používať pred väčšími zmenami';
    preview.note = 'Preview zostáva určené na zoskupenie a otestovanie väčších customer zmien pred jedným vedomým produkčným release.';
    preview.bullets = ['Pokračovať v pravidle: najprv testovací balík, potom jeden production deploy; nevytvárať drobné customer deploye bez potreby.'];
  }

  data.now = {
    title: 'Web Chvostíkovo – silnejšie CTA a vizuálne prepojenie sekcií',
    status: 'Nasadené',
    statusTone: 'production',
    note: 'Za posledných 24 hodín sa nemenila zákaznícka PWA ani jej produkčný backend. Podstatná práca prebehla na verejnom webe Chvostíkovo: mobilné CTA v hero je výraznejšie a medzi FAQ a pásom Prečo využiť psiu škôlku pribudla fotografia škôlkarov, následne kompaktnejšie orezaná a doladená pre desktop.',
    bullets: [
      'Hero CTA „Chcem sa informovať o škôlke“ má na mobile výraznejší oranžový vzhľad.',
      'Pod FAQ pribudla fotografia škôlkarov, ktorá vizuálne prepája recenzie/FAQ s CTA „Prečo využiť psiu škôlku?“.',
      'Fotografia bola následne znížená a orezaná na kompaktnejšiu výšku; desktop CTA dostalo väčší rozostup medzi nadpisom a tlačidlom.',
      'Verejný web aktuálne zobrazuje CTA pás aj galériu škôlkarov; customer produkcia ostala na v105 bez nového Vercel deployu.',
      'Ďalší krok: vizuálne skontrolovať nový webový blok na mobile a desktope a ďalšie customer zmeny opäť zoskupiť pred nasadením.'
    ]
  };

  data.recent = [
    {
      date: '23. 9. 2026',
      app: 'Denný súhrn',
      title: 'Web – hero CTA, fotografia škôlkarov a stabilný customer v105',
      text: 'Verejný web dostal výraznejšie mobilné CTA v hero a nový vizuálny prechod pod FAQ: fotografiu škôlkarov pred pásom Prečo využiť psiu škôlku. Následne sa fotografia kompaktnejšie orezala a na desktope sa doladil rozostup CTA. Customer PWA sa za posledných 24 hodín nemenila: customer-portal-production zostáva na db88da2d, build 20260922-customer-iosproof-v105 a Vercel deployment dpl_Ho4TrEeiU6e7tW61CxA1D3J9FCZT je READY. Rozhodnutie ostáva zoskupovať ďalšie customer zmeny a nerobiť zbytočné priebežné produkčné deploye.'
    },
    ...(data.recent || []).filter(item => item.date !== '23. 9. 2026')
  ];
})();