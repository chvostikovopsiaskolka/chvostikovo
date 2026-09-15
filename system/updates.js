// Runtime documentation overrides for production changes that should be reflected
// in Chvostíkovo System without coupling the documentation app to production data.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;

  const customer = data.sections?.find(section => section.id === 'customer-app');
  const dogProfile = customer?.items?.find(item => item.title === 'Môj psík');
  if (dogProfile) {
    dogProfile.body = 'Sekcia Môj psík je zjednodušená na informácie o psíkovi, permanentke a návštevách. Účet majiteľa, upozornenia a súhlasy sú presunuté do samostatných Nastavení cez ikonu ozubeného kolieska.';
    dogProfile.bullets = [
      'Foto psa + editor fotografie.',
      'Na hlavnej obrazovke ostávajú tri hlavné bloky: Údaje psíka, Vstup a permanentka a Štatistiky návštev.',
      'Ikona Nastavenia v hlavičke otvára spodné modal okno s účtom, upozorneniami a súhlasmi.',
      'Upozornenia sú v Nastaveniach viditeľné priamo bez ďalšieho rozkliknutia.',
      'Súhlasy a podmienky sú pri otvorení Nastavení rozbalené; ochrana osobných údajov a Podmienky škôlky zostávajú oddelené.',
      'Mobilné dátumové polia pri dátume narodenia a očkovaniach sú stabilizované tak, aby nepresahovali šírku svojich stĺpcov.',
      'Aktívna permanentka používa kompaktnú zelenú kartu so stavom použitých a zostávajúcich vstupov.',
      'Štatistiky návštev sú rozbaľovacie: návštevy celkovo + jednotlivé mesiace.',
      'Spodná navigácia je app-style: Rezervácie, Môj psík s reálnou fotkou psa a Správy.'
    ];
    dogProfile.tags = [...new Set([...(dogProfile.tags || []), 'compact-profile', 'settings-sheet', 'monthly-visits', 'legal-links', 'app-nav'])];
  }

  const pass = customer?.items?.find(item => item.title === 'Permanentka');
  if (pass) {
    pass.body = 'Zákazník vidí aktuálny typ vstupu bez negatívneho formulovania. Aktívna permanentka má kompaktnú zelenú kartu s počtom použitých a zostávajúcich vstupov, dátumom kúpy a platnosťou. Cena sa pri už zakúpenej permanentke nezobrazuje. Zákazník môže požiadať o 10-vstupovú permanentku.';
  }

  if (customer) {
    let booking = customer.items?.find(item => /rezerv/i.test(String(item.title || '')));
    if (!booking) {
      booking = {
        title: 'Rezervácie',
        subtitle: 'Kompaktný výber jedného alebo viacerých dní.',
        status: 'production',
        statusLabel: 'Produkcia',
        categories: ['customer'],
        body: '',
        bullets: [],
        tags: ['booking']
      };
      customer.items = [...(customer.items || []), booking];
    }
    booking.body = 'Hlavná obrazovka Rezervácie už nezobrazuje všetkých desať dní pod sebou. Majiteľ otvorí výber cez Chcem prihlásiť psíka, označí jeden alebo viac dní na najbližšie dva týždne, vyberie taxi a odošle rezervácie naraz.';
    booking.bullets = [
      'Oranžová hlavička zobrazuje fotku a meno vybraného psíka a stav vstupu/permanentky.',
      'Výber dní sa otvára ako kompaktné spodné okno a podporuje viac dní v jednej akcii.',
      'Zatvorené, plné a už rezervované dni nie je možné znovu vybrať.',
      'Po odoslaní zostávajú na hlavnej obrazovke iba skutočne rezervované dni.',
      'Každá rezervácia zobrazuje stav Schválená / Čaká na schválenie, počet prihlásených psíkov, taxi a možnosť zrušenia.',
      'Voľný priestor na obrazovke je pripravený aj pre budúce oznamy alebo produktovú/e-shop sekciu.'
    ];
    booking.tags = [...new Set([...(booking.tags || []), 'multi-day', 'booking-sheet', 'two-weeks'])];

    let messages = customer.items?.find(item => /správ|sprav|message/i.test(String(item.title || '')));
    if (messages) {
      messages.body = 'Správy majú kompaktnejší chatový vzhľad, menšie bubliny a nižší formulár. Blok Zavolať do Chvostíkova je vycentrovaný.';
    }

    let pwa = customer.items?.find(item => /PWA|inštal|instal/i.test(String(item.title || '')));
    if (!pwa) {
      pwa = {
        title: 'PWA inštalácia',
        subtitle: 'Pridanie zákazníckeho portálu na plochu telefónu.',
        status: 'production',
        statusLabel: 'Produkcia',
        categories: ['customer', 'technical'],
        body: 'Portál sa dá nainštalovať na plochu ako webová aplikácia s vlastnou štvorcovou ikonou Chvostíkovo.',
        bullets: [],
        tags: ['pwa', 'ios', 'android']
      };
      customer.items = [...(customer.items || []), pwa];
    }
    pwa.body = 'Portál sa dá pridať na plochu ako webová aplikácia. iOS aj manifest používajú overený štvorcový asset Store-v2.png – rovnaký ako admin PWA.';
    pwa.bullets = [
      'iOS postup: Safari → tri bodky vľavo dole → Zdieľať → Zobraziť viac → Pridať na plochu → Otvoriť ako webovú apku → Pridať.',
      '7. bod návodu: zavrieť Safari, otvoriť Chvostíkovo cez ikonu na ploche a tam pokračovať prihlásením.',
      'Funkčná ikona je Store-v2.png; nepoužívať horizontálne logo ani runtime-generovanú náhradu.',
      'Presný postup pre budúce zásahy je uložený v system/PWA_ICON.md.'
    ];
    pwa.tags = [...new Set([...(pwa.tags || []), 'square-icon', 'Store-v2', 'install-guide'])];
  }

  const admin = data.sections?.find(section =>
    String(section.id || '').toLowerCase().includes('admin') ||
    String(section.title || '').toLowerCase().includes('admin')
  );
  if (admin) {
    let overview = admin.items?.find(item => /prehľad|prehlad|overview/i.test(String(item.title || '')));
    if (!overview) {
      overview = {
        title: 'Prehľad',
        subtitle: 'Prioritné požiadavky na jednom mieste.',
        status: 'production',
        statusLabel: 'Produkcia',
        categories: ['admin'],
        body: '',
        bullets: [],
        tags: ['overview']
      };
      admin.items = [...(admin.items || []), overview];
    }
    overview.body = 'Prehľad obsahuje tri hlavné rozbaľovacie bloky – Rezervácie, Majitelia psíkov a Záujem o škôlku – a nad nimi kompaktný súhrn Dnes / Čaká / Správy.';
    overview.bullets = [
      'Rýchly súhrn zobrazuje počet dnešných rezervácií, čakajúcich požiadaviek a neprečítaných správ.',
      'Rezervácie zobrazujú živé číslo iba vtedy, keď existuje čakajúca rezervácia, cancel request alebo čakajúca zmena taxi.',
      'Majitelia psíkov zobrazujú počet čakajúcich registrácií a samostatný text pre neprečítané správy od zákazníkov.',
      'Záujem o škôlku zobrazuje samostatné badge pre nové záujmy a nové prihlášky.',
      'Živé badge v28 sa načítavajú priamym autentifikovaným PostgREST fetchom s aktuálnym admin JWT a obnovujú sa aj pri focus/click/intervale.'
    ];
    overview.tags = [...new Set([...(overview.tags || []), 'live-badges', 'quick-summary', 'direct-postgrest'])];

    let week = admin.items?.find(item =>
      /týždeň|tyzden|week|zatvorené dni|zatvorene dni/i.test(String(item.title || ''))
    );
    if (!week) {
      week = {
        title: 'Týždeň a nasledujúci týždeň',
        subtitle: 'Kompaktný operatívny prehľad dní.',
        status: 'production',
        statusLabel: 'Produkcia',
        categories: ['admin'],
        body: '',
        bullets: [],
        tags: ['week', 'reservations']
      };
      admin.items = [...(admin.items || []), week];
    }
    week.body = 'Admin stránka Týždeň používa kompaktnejšie karty. Počet psov a kapacita sú spojené do pomeru počet / kapacita, akcia Pridať je malé kruhové + a rozbalené rezervácie sú vizuálne odľahčené.';
    week.bullets = [
      'Aktuálny týždeň ostáva viditeľný a nasledujúci týždeň zostáva samostatne rozbaľovací.',
      'Kapacita sa zobrazuje napr. 6 / 8; plná kapacita sa zvýrazní oranžovo a prekročená červeno.',
      'Kliknutie na pomer kapacity naďalej otvára existujúcu úpravu kapacity.',
      '+ Pridať je kompaktné kruhové tlačidlo, funkcia pridania rezervácie zostáva rovnaká.',
      'Pri zatvorenom dni ostáva badge Zatvorené, kapacita a tlačidlo Otvoriť; zbytočný text o zachovaní existujúcich rezervácií bol odstránený.',
      'Rozbalený deň používa kompaktnejšie karty psov s fotkou a existujúcimi vstup/taxi údajmi.'
    ];
    week.tags = [...new Set([...(week.tags || []), 'next-week', 'compact-week', 'capacity-ratio'])];

    let nav = admin.items?.find(item => /navig/i.test(String(item.title || '')));
    if (!nav) {
      nav = {
        title: 'Admin navigácia',
        subtitle: 'App-style spodná lišta.',
        status: 'production',
        statusLabel: 'Produkcia',
        categories: ['admin'],
        body: 'Spodná navigácia admin aplikácie je plávajúca lišta s ikonou nad textom pre Prehľad, Týždeň, Psy a Štatistiky.',
        bullets: ['Aktívna karta je oranžová a všetky pôvodné tab akcie zostávajú zachované.'],
        tags: ['navigation', 'app-style']
      };
      admin.items = [...(admin.items || []), nav];
    }
  }
})();
