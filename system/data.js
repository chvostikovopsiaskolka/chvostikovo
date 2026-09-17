window.SYSTEM_DATA = {
  meta: {
    updated: "17. 9. 2026",
    source: "Aktuálny stav podľa produkcie a Supabase",
    note: "System je iba prehľad. Admin ani zákaznícka appka sa z tejto stránky nemenia."
  },

  now: {
    title: "Live aktualizácie + push notifikácie / branding",
    status: "Rozpracované",
    statusTone: "progress",
    note: "Práca bola prerušená, pretože Work chat narazil na limit. Pokračovať v existujúcom Work chate.",
    bullets: [
      "live aktualizácie aplikácie",
      "push notifikácie",
      "Android ikonky notifikácií",
      "texty notifikácií",
      "dokončenie súvisiacich úprav z pripraveného promptu"
    ]
  },

  next: [
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
    { title: "Pokračovať v Work chate", text: "Dokončiť rozpracované live aktualizácie a push branding.", status: "Teraz", tone: "progress" },
    { title: "Dokončiť podmienky škôlky", text: "Potvrdiť finálne znenie, ktoré pôjde zákazníkom.", status: "Čaká", tone: "waiting" },
    { title: "Otestovať Android", text: "Skontrolovať push notifikácie, ikonky a PWA správanie.", status: "Neskôr", tone: "planned" },
    { title: "Otestovať iPhone / iOS", text: "Skontrolovať PWA, upozornenia a hlavné používateľské kroky.", status: "Neskôr", tone: "planned" }
  ],

  recent: [
    { date: "17. 9. 2026", app: "Zákaznícka", title: "Prehľad rezervovaného dňa a privacy", text: "Zväčšili a upravili sme zoznam prihlásených psíkov a zobrazenie anonymných psíkov podľa súhlasu." },
    { date: "16. 9. 2026", app: "Admin", title: "Permanentky a rezervácie", text: "Doladili sme správanie permanentiek pri rezerváciách a oddelili zmeny, ktoré ešte čakajú." },
    { date: "12. 9. 2026", app: "Admin", title: "Telefónne čísla", text: "Do detailu psa sme doplnili telefón a automatické upratanie čísla pre SMS." },
    { date: "september 2026", app: "Obe", title: "Správy a zákaznícke účty", text: "Prepojili sme zákaznícke účty, psov a komunikáciu medzi klientom a škôlkou." },
    { date: "august–september 2026", app: "Obe", title: "Rezervácie, taxi a permanentky", text: "Postupne sme spojili rezervácie so stavom permanentky, taxi a interným prehľadom admina." }
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
        { title: "Štatistiky", text: "Vidíš návštevy a mesačné prehľady, ktoré sa používajú pri vyhodnocovaní škôlky." },
        { title: "Správy", text: "Vieš komunikovať so zákazníkom priamo cez jeho účet." },
        { title: "Upozornenia a push", text: "Admin appka vie pracovať s upozorneniami a push notifikáciami. Aktuálne ich ešte dolaďujeme." },
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
        { title: "Môj psík", text: "Klient vidí profil svojho psa a dôležité informácie na jednom mieste." },
        { title: "Fotka psa", text: "Majiteľ môže pracovať s profilovou fotkou psa a jej zobrazením." },
        { title: "Rezervácie", text: "Klient pošle žiadosť o konkrétny deň a následne vidí jej stav." },
        { title: "Kto príde do škôlky", text: "Pri rezervovanom dni môže vidieť prihlásených psíkov; bez súhlasu sa cudzí pes zobrazí anonymne." },
        { title: "Taxi", text: "Pri rezervácii si klient vyberie, či potrebuje dopravu." },
        { title: "Permanentka", text: "Vidí svoju permanentku, použité a zostávajúce vstupy." },
        { title: "Správy", text: "Môže napísať Chvostíkovu a dostať odpoveď priamo v appke." },
        { title: "Push notifikácie", text: "Appka vie posielať upozornenia do zariadenia. Branding a Android ikonky práve dolaďujeme." },
        { title: "Oznamy", text: "Dôležité informácie od škôlky sa môžu zobraziť priamo v appke." },
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
    { date: "september 2026", title: "Push notifikácie", app: "Obe", text: "Aplikácie dostali základ pre push upozornenia. Aktuálne dolaďujeme live správanie, texty a Android branding." }
  ],

  technical: [
    { label: "Zdroj aktuálneho stavu", value: "Produkcia + Supabase" },
    { label: "Admin", value: "Produkčná admin aplikácia používa spoločný Supabase backend." },
    { label: "Zákaznícka appka", value: "Produkčná PWA používa spoločný Supabase backend a vlastné zákaznícke rozhranie." },
    { label: "System", value: "Táto stránka je iba čitateľný projektový prehľad. Nemení dáta klientov ani logiku oboch aplikácií." },
    { label: "Poznámka", value: "Technické názvy tabuliek, API a deployov sú zámerne skryté z hlavnej obrazovky." }
  ]
};
