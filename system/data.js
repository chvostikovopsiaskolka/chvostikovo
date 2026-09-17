window.SYSTEM_DATA = {
  meta: {
    updated: "17. 9. 2026",
    source: "Aktuálny stav podľa produkcie a Supabase",
    note: "System je iba prehľad. Admin ani zákaznícka appka sa z tejto stránky nemenia."
  },

  now: {
    title: "Momentálne nič nerozpracované",
    status: "Voľné",
    statusTone: "done",
    note: "Posledná oprava bezpečného Realtime CSP v zákazníckej PWA bola dokončená a overená 17. 9. 2026.",
    bullets: []
  },

  next: [
    {
      title: "Notifikácie – „od Chvostíkova“",
      status: "Pripravené",
      tone: "ready",
      text: "Preveriť a upraviť názov/atribúciu notifikácie tak, aby výsledok pôsobil prirodzene ako „od Chvostíkova“.",
      detail: "Systémové „from“ na iOS/Chrome nemusí byť upraviteľné; cieľ je nájsť najprirodzenejšie zobrazenie cez názov aplikácie. Branded doménu zatiaľ neriešime a chvostikovo-portal.vercel.app zostáva."
    },
    {
      title: "Narodeniny + očkovania",
      status: "Pripravené",
      tone: "ready",
      text: "Prompt je pripravený, ale zatiaľ ho neimplementujeme.",
      detail: "Dátum narodenia, automatický vek, narodeninové upozornenie a upozornenia na očkovania približne 14 dní pred koncom platnosti."
    },
    {
      title: "Podmienky škôlky",
      status: "Čaká na mňa",
      tone: "waiting",
      text: "Treba potvrdiť finálne znenie podmienok.",
      detail: "Až po finálnom texte má zmysel dokončiť ich nasadenie a testovanie."
    },
    {
      title: "Finálne testovanie",
      status: "Plánované",
      tone: "planned",
      text: "Prejsť celý admin aj zákaznícky proces pred väčším používaním klientmi.",
      detail: "Android, iPhone, rezervácie, správy, permanentky, taxi, upozornenia a základné hraničné situácie."
    }
  ],

  waiting: [
    { title: "Dokončiť podmienky škôlky", text: "Potvrdiť finálne znenie, ktoré pôjde zákazníkom.", status: "Čaká", tone: "waiting" },
    { title: "Otestovať Android", text: "Na fyzickom telefóne skontrolovať výsledné maskovanie monochromatického badge a vzhľad push notifikácie.", status: "Neskôr", tone: "planned" },
    { title: "Otestovať iPhone / iOS", text: "Na fyzickom zariadení overiť PWA notifikáciu a systémové zobrazenie atribúcie aplikácie.", status: "Neskôr", tone: "planned" }
  ],

  recent: [
    { date: "17. 9. 2026", app: "Zákaznícka", title: "Bezpečný Realtime CSP na iPhone", text: "Zákaznícka PWA povoľuje pre Realtime iba konkrétny Supabase WebSocket origin. Hláška „This operation is insecure“ sa po aktualizácii service workera pri opätovnom otvorení už nezobrazila a CSP nebol rozšírený wildcardom." },
    { date: "17. 9. 2026", app: "Admin", title: "Opravené počty na dashboarde", text: "Horné kartičky už nečítajú počty skôr, než sa načítajú rezervácie. Dnešný a zajtrajší počet sa počíta priamo z aktuálnych dát." },
    { date: "17. 9. 2026", app: "Zákaznícka", title: "Rezervácia bez fullscreen načítavania", text: "Pri rezervovaní psa už nevyskakuje celé okno „Načítavam Chvostíkovo“. Odoslanie a synchronizácia prebehnú na pozadí." },
    { date: "17. 9. 2026", app: "Admin", title: "Stabilná obrazovka pri prepínaní kariet", text: "Pri prepínaní Prehľad / Týždeň / Psy / Štatistiky sa obrazovka vráti na začiatok a nezostane samovoľne mierne posunutá." },
    { date: "17. 9. 2026", app: "Obe", title: "Live aktualizácie + push branding", text: "Admin aj zákaznícka PWA teraz dostávajú live zmeny cez Realtime. Zákaznícky 30-sekundový full polling bol odstránený a push badge dostal monochromatickú ikonu." },
    { date: "17. 9. 2026", app: "Zákaznícka", title: "Prehľad rezervovaného dňa a privacy", text: "Zväčšili a upravili sme zoznam prihlásených psíkov a zobrazenie anonymných psíkov podľa súhlasu." }
  ],

  apps: {
    admin: {
      label: "Admin appka",
      intro: "Interné riadenie škôlky – kto príde, akú má permanentku, taxi, správy a ďalšie údaje.",
      features: [
        { title: "Psíkovia a majitelia", text: "Vidíš profil psa, majiteľa, telefón, plemeno, vek, povahu, alergie a poznámky." },
        { title: "Rezervácie", text: "Vidíš plánované dni, pridávaš rezervácie a spracúvaš žiadosti zo zákazníckej appky." },
        { title: "Permanentky", text: "Spravuješ 10/20-vstupové permanentky, zostávajúce vstupy, dátum kúpy a platnosť." },
        { title: "Taxi", text: "Pri rezervácii vidíš, či treba vyzdvihnutie alebo vyzdvihnutie aj dovoz." },
        { title: "Denné návštevy", text: "Máš prehľad, kto v daný deň prišiel a čo sa má započítať." },
        { title: "Dashboard", text: "Horné kartičky počítajú dnešné a zajtrajšie rezervácie priamo z aktuálnych dát, aby po otvorení appky nezostali na nule." },
        { title: "Stabilné prepínanie", text: "Pri prepínaní hlavných kariet sa obrazovka drží v správnej polohe a nezostáva náhodne posunutá." },
        { title: "Štatistiky", text: "Vidíš návštevy a mesačné prehľady, ktoré sa používajú pri vyhodnocovaní škôlky." },
        { title: "Správy", text: "Vieš komunikovať so zákazníkom priamo cez jeho účet a nové správy sa môžu prejaviť bez reloadu." },
        { title: "Live aktualizácie a push", text: "Admin dostáva live zmeny rezervácií, taxi, správ, permanentiek, zatvorených dní, účtov a formulárov. Pri návrate z pozadia alebo po výpadku sa spojenie obnoví a spraví jeden resync." },
        { title: "Očkovania", text: "Pri psovi evidujeme očkovania. Automatické upozornenia na koniec platnosti sú ďalšia plánovaná funkcia." },
        { title: "Fotky", text: "Pri psovi môže byť fotografia používaná v admin aj zákazníckej časti podľa nastavení." },
        { title: "Neaktívni psi", text: "Psíkov, ktorí už škôlku nenavštevujú, vieš oddeliť od aktívnych." },
        { title: "Zákaznícke účty", text: "Schvaľuješ účet klienta a prepájaš ho s existujúcim majiteľom a psom." },
        { title: "Oznamy", text: "Vieš pripraviť dôležitú informáciu, ktorá sa zobrazí zákazníkom v portáli." }
      ]
    },
    customer: {
      label: "Zákaznícka appka",
      intro: "Jednoduché miesto pre klienta – jeho pes, rezervácie, permanentka, taxi, správy a upozornenia.",
      features: [
        { title: "Registrácia a prihlásenie", text: "Klient si vytvorí účet a po schválení ho admin prepojí s jeho psom." },
        { title: "Môj psík", text: "Klient vidí profil svojho psa a dôležité informácie na jednom mieste; zmeny údajov psíka sa môžu prejaviť live." },
        { title: "Fotka psa", text: "Majiteľ môže pracovať s profilovou fotkou psa a jej zobrazením." },
        { title: "Rezervácie", text: "Klient pošle žiadosť o konkrétny deň a schválenie alebo zamietnutie sa môže zobraziť live bez ručného refreshu. Pri odoslaní už neprekryje celú appku obrazovka „Načítavam Chvostíkovo“ – synchronizácia prebehne na pozadí." },
        { title: "Kto príde do škôlky", text: "Pri rezervovanom dni môže vidieť prihlásených psíkov; bez súhlasu sa cudzí pes zobrazí anonymne." },
        { title: "Taxi", text: "Pri rezervácii si klient vyberie, či potrebuje dopravu." },
        { title: "Permanentka", text: "Vidí svoju permanentku, použité a zostávajúce vstupy; zmeny permanentky sa môžu prejaviť live." },
        { title: "Správy", text: "Môže napísať Chvostíkovu a dostať odpoveď priamo v appke; nové správy sa zobrazujú live." },
        { title: "Live aktualizácie a push", text: "Zákaznícka PWA dostáva live zmeny rezervácií, správ, oznamov, zatvorených dní, permanentiek a údajov psíka. Realtime WebSocket je v CSP povolený iba pre konkrétny Supabase origin; appka nepoužíva všeobecný WSS wildcard. Starý 30-sekundový full polling bol odstránený." },
        { title: "Oznamy", text: "Dôležité informácie od škôlky sa môžu zobraziť priamo v appke a ich zmeny sa môžu prejaviť live." },
        { title: "GDPR a súhlasy", text: "Klient môže potvrdiť potrebné súhlasy a nastavenie zdieľania mena/fotky psa." },
        { title: "Podmienky škôlky", text: "Systém je pripravený evidovať potvrdenie podmienok; finálne znenie ešte čaká na dokončenie." },
        { title: "Prepojenie majiteľa so psom", text: "Účet nevidí cudzie interné dáta – admin ho priradí ku konkrétnemu majiteľovi a psovi." }
      ]
    }
  },

  history: [
    { date: "august 2026", title: "Vznik interného admin systému", app: "Admin", text: "Základné profily psov, majitelia, rezervácie a interný denný prehľad." },
    { date: "august 2026", title: "Permanentky", app: "Admin", text: "Pribudli 10/20-vstupové permanentky, zostávajúce vstupy, dátum kúpy a možnosť manuálnej úpravy." },
    { date: "august 2026", title: "Taxi", app: "Admin", text: "K rezerváciám sa pridalo vyzdvihnutie za 5 € a vyzdvihnutie + dovoz za 10 €." },
    { date: "august 2026", title: "Štatistiky a denné uzatváranie", app: "Admin", text: "Začali sme sledovať denné návštevy, mesačné štatistiky a finančný prehľad." },
    { date: "koniec augusta 2026", title: "Zákaznícka PWA", app: "Zákaznícka", text: "Vznikla zákaznícka aplikácia, ktorú si klient môže pridať na plochu telefónu." },
    { date: "september 2026", title: "Registrácia a prepojenie účtu", app: "Obe", text: "Klient sa vie zaregistrovať, admin ho schváli a priradí k existujúcemu psovi." },
    { date: "september 2026", title: "Rezervácie zo zákazníckej appky", app: "Obe", text: "Klient pošle žiadosť, admin ju spracuje a zákazník vidí výsledný stav." },
    { date: "september 2026", title: "Správy", app: "Obe", text: "Pribudla komunikácia medzi klientom a Chvostíkovom priamo v aplikáciách." },
    { date: "september 2026", title: "Oznamy, súhlasy a súkromie", app: "Zákaznícka", text: "Pridali sme oznamy, GDPR/súhlasy a pravidlá zobrazenia mena a fotografie psa." },
    { date: "17. 9. 2026", title: "Live aktualizácie + push branding", app: "Obe", text: "Nasadili sme Supabase Realtime pre admin aj zákaznícku PWA, bezpečný zákaznícky signalizačný kanál, resync po návrate z pozadia/výpadku a nový monochromatický push badge. Starý 30-sekundový full polling zákazníckej appky bol odstránený." },
    { date: "17. 9. 2026", title: "Dashboard a plynulejšie ovládanie", app: "Obe", text: "Admin dostal opravu počtov na úvodnom dashboarde a stabilnú polohu obrazovky pri prepínaní kariet. Zákaznícka rezervácia sa odosiela bez celoobrazovkového načítavania." },
    { date: "17. 9. 2026", title: "Bezpečný CSP pre zákaznícky Realtime", app: "Zákaznícka", text: "CSP povoľuje Realtime iba cez konkrétny Supabase WSS origin. Service worker v47 zachováva bezpečnostnú politiku bez wildcardu a Realtime bootstrap už nenechá WebKit SecurityError zhodiť používateľské rozhranie." }
  ],

  technical: [
    { label: "Zdroj aktuálneho stavu", value: "Produkcia + Supabase" },
    { label: "Admin", value: "Produkčná admin aplikácia používa spoločný Supabase backend." },
    { label: "Zákaznícka appka", value: "Produkčná PWA používa spoločný Supabase backend a vlastné zákaznícke rozhranie." },
    { label: "Live aktualizácie", value: "Supabase Realtime je nasadený pre obe appky. Zákaznícka signalizácia používa bezpečný kanál bez citlivého payloadu; RLS zostalo zachované." },
    { label: "CSP zákazníckej PWA", value: "Realtime WebSocket je povolený iba pre wss://tlhcqwsluyqpywymjoxn.supabase.co. Nebol pridaný žiadny všeobecný WSS wildcard; ostatné CSP obmedzenia zostali zachované." },
    { label: "Push branding", value: "Veľká stará ikona bola zo showNotification odstránená. Badge používa transparentnú monochromatickú 96×96 verziu; farebná PWA ikona zostala nezmenená." },
    { label: "System", value: "Táto stránka je iba čitateľný projektový prehľad. Nemení dáta klientov ani logiku oboch aplikácií." },
    { label: "Poznámka", value: "Technické názvy tabuliek, API a deployov sú zámerne skryté z hlavnej obrazovky." }
  ]
};