// Runtime documentation overrides for production changes that should be reflected
// in Chvostíkovo System without coupling the documentation app to production data.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;

  const customer = data.sections?.find(section => section.id === 'customer-app');
  const dogProfile = customer?.items?.find(item => item.title === 'Môj psík');
  if (dogProfile) {
    dogProfile.body = 'Sekcia Môj psík je kompaktne usporiadaná do rozbaľovacích blokov, aby majiteľ videl údaje psa, súhlasy, typ vstupu a históriu návštev bez zbytočného scrollovania.';
    dogProfile.bullets = [
      'Foto psa + editor fotografie.',
      'Údaje psíka a očkovania sú spolu v jednom rozbaľovacom bloku.',
      'Súhlasy a podmienky sú predvolene otvorené; preklik na ochranu osobných údajov a preklik na Podmienky škôlky sú umiestnené priamo pod príslušným riadkom.',
      'Súhlasy a podmienky obsahujú aj nastavenie upozornení a súhlas so zobrazením mena/fotky.',
      'Mobilné dátumové polia pri dátume narodenia a očkovaniach sú stabilizované tak, aby nepresahovali šírku svojich stĺpcov.',
      'Vstup a permanentka používajú neutrálne označenie Jednorazový vstup alebo zobrazia stav permanentky.',
      'Pri aktívnej permanentke zákazník vidí počet vstupov, cenu, dátum kúpy, stav platnosti, zostávajúce vstupy a počet použitých vstupov.',
      'Štatistiky návštev sú rozbaľovacie: návštevy celkovo + jednotlivé mesiace.',
      'Budúce rezervácie sa v Môj psík neduplikujú; zostávajú v rezervačnom prehľade.',
      'Moje kontaktné údaje sú posledná sekcia.'
    ];
    dogProfile.tags = [...new Set([...(dogProfile.tags || []), 'compact-profile', 'monthly-visits', 'legal-links', 'mobile-date-fields'])];
  }

  const pass = customer?.items?.find(item => item.title === 'Permanentka');
  if (pass) {
    pass.body = 'Zákazník vidí aktuálny typ vstupu bez negatívneho formulovania: pri jednorazovom režime sa zobrazí Jednorazový vstup; pri permanentke počet vstupov, cenu, dátum kúpy, stav platnosti, zostávajúce vstupy a počet použitých vstupov. Zákazník môže požiadať o 10-vstupovú permanentku.';
  }

  const admin = data.sections?.find(section =>
    String(section.id || '').toLowerCase().includes('admin') ||
    String(section.title || '').toLowerCase().includes('admin')
  );
  if (admin) {
    let week = admin.items?.find(item =>
      /týždeň|tyzden|week|zatvorené dni|zatvorene dni/i.test(String(item.title || ''))
    );
    if (!week) {
      week = {
        title: 'Týždeň a nasledujúci týždeň',
        subtitle: 'Aktuálny týždeň ostáva viditeľný, ďalší je kompaktne rozbaľovací.',
        status: 'production',
        statusLabel: 'Produkcia',
        categories: ['admin'],
        body: 'Admin stránka Týždeň zobrazuje pracovné dni aktuálneho obdobia a nasledujúci týždeň v samostatnej rozbaľovacej karte.',
        bullets: [],
        tags: ['week', 'reservations']
      };
      admin.items = [...(admin.items || []), week];
    }
    week.body = 'Admin stránka Týždeň ponecháva aktuálny týždeň priamo viditeľný. Nasledujúci týždeň je samostatná rozbaľovacia karta, aby prehľad nezaberal zbytočne veľa vertikálneho priestoru.';
    week.bullets = [
      ...(week.bullets || []).filter(text => !/nasledujúci týždeň.*rozbaľ/i.test(String(text))),
      'Nasledujúci týždeň je predvolene zbalený a otvorí sa kliknutím na jeho hlavičku.',
      'Po rozbalení zostávajú zachované rovnaké akcie pre jednotlivé dni – rezervácie, + Pridať, kapacita, zatvorené dni a čakajúce zákaznícke požiadavky.'
    ];
    week.tags = [...new Set([...(week.tags || []), 'next-week', 'collapse'])];
  }
})();
