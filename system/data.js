window.SYSTEM_DATA = {
  meta: {
    updated: "18. 9. 2026",
    source: "Aktuálny stav podľa produkcie a Supabase",
    note: "System je iba prehľad. Admin ani zákaznícka appka sa z tejto stránky nemenia."
  },

  now: {
    title: "Momentálne nič nerozpracované",
    status: "Voľné",
    statusTone: "done",
    note: "Produkčné appky sú momentálne stabilné. Ďalšie plánované práce sú resume po návrate z pozadia, upratanie kódu a bezpečný preview/release proces; zatiaľ bez zásahu do produkcie.",
    bullets: []
  },

  next: [
    {
      title: "Odmeny a bonusy pre zákazníkov",
      status: "Nápad",
      tone: "planned",
      text: "Do budúcna navrhnúť jednoduchý odmeňovací systém v zákazníckej appke, ktorý motivuje k pravidelnejším návštevám a vie prepojiť škôlku s vlastnými produktmi alebo partnermi.",
      detail: "Možné príklady: navštív škôlku 5× za mesiac a získaj benefit, zľava v petshope/partnerovi, zľava na vodítko alebo obojok, zľava na stojan, bonusový vstup k permanentke. Zatiaľ nič neimplementovať ani nepridávať DB tabuľky; najprv vymyslieť pravidlá, aby systém dával obchodný zmysel a nebol ľahko zneužiteľný."
    },
    {
      title: "Môj psík – Pravidlá škôlky a Menu",
      status: "Nápad",
      tone: "planned",
      text: "Sprístupniť Pravidlá škôlky priamo z obrazovky Môj psík bez toho, aby sa profil znovu zaplnil právnymi detailmi.",
      detail: "Odporúčaný smer: pod štatistiky pridať jednoduchý riadok/kartu „Pravidlá škôlky“ s otvorením existujúceho dokumentu v modale alebo samostatnom view. Stav súhlasov, účet, notifikácie a odhlásenie ponechať v menu. Zvážiť nahradenie ozubeného kolieska všeobecnejším tlačidlom „Menu“ (hamburger/tri bodky + text), pretože obsahuje viac než len nastavenia. Neimplementovať, kým nebude finálne znenie podmienok."
    },
    {
      title: "Správy – plávajúci chat namiesto samostatnej záložky",
      status: "Nápad",
      tone: "planned",
      text: "Prepracovať zákaznícke správy na plávajúcu kruhovú ikonku chatu podobnú webovej podpore a časom zrušiť samostatnú spodnú záložku Správy.",
      detail: "Mechanizmus správ má zostať rovnaký. Po otvorení chatu si používateľ vyberie konkrétnu rezerváciu alebo všeobecnú správu. Najprv vyriešiť umiestnenie ikonky a UX tak, aby bola dostupná bez toho, aby zavadzala v navigácii."
    },
    {
      title: "Návrat appky z pozadia – vždy čerstvé dáta",
      status: "Na preverenie",
      tone: "ready",
      text: "Overiť a doladiť správanie admin aj zákazníckej PWA po dlhšom pobyte na pozadí bez úplného vypnutia.",
      detail: "Po návrate má appka obnoviť Realtime spojenie a spraviť jeden bezpečný full resync, aby používateľ videl nové rezervácie, psov, oznamy, správy, permanentky a ďalšie zmeny. Push musí prísť aj keď appka nie je aktívne otvorená. Zákaznícka appka už má focus/online/visibility resume resync; admin má rovnaký základ. Treba to fyzicky otestovať po dlhšom uspání na iPhone aj Androide a prípadne iba doladiť hraničné situácie."
    },
    {
      title: "Upratanie kódu a starších vrstiev",
      status: "Na plán",
      tone: "planned",
      text: "Spraviť bezpečný audit starších verzií, runtime patchov a prekrývajúcich sa UI vrstiev bez zmeny správania aplikácií.",
      detail: "Cieľ nie je prepisovať architektúru. Najprv zmapovať, ktoré vXX vrstvy a patche sú ešte reálne potrebné, potom ich postupne zlúčiť do jedného zdroja pravdy, odstrániť mŕtvy kód a zachovať rollback aj testy. Robiť až keď je aktuálna produkcia stabilná."
    },
    {
      title: "Bezpečný preview a release proces",
      status: "Na plán",
      tone: "planned",
      text: "Nastaviť spôsob, ako si pozrieť budúcu verziu admin alebo zákazníckej appky bez zásahu do produkcie.",
      detail: "Každú väčšiu zmenu najprv nasadiť na samostatný Vercel preview deployment, otestovať na reálnom telefóne a až potom ju vedome povýšiť na produkciu. Produkčná verzia ostane nedotknutá počas testovania a posledný stabilný deploy musí zostať pripravený na okamžitý rollback. Súčasťou má byť aj kontrola service workera/cache, aby klientom neostala zmiešaná stará a nová verzia."
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
    { date: "18. 9. 2026", app: "Obe", title: "Profil psa + Nastavenia bez preskakovania", text: "V admin detaile sú Vek a Dátum narodenia vedľa seba aj na mobile a vek sa počíta z dogs.birth_date. Existujúce Meno do SMS sa načítava z dogs.sms_name bez hromadného prepisovania. V zákazníckej appke sa už pri otvorení Môj psík ani po uložení údajov na chvíľu nevracajú staré sekcie Súhlasy a podmienky; právne a účtové položky patria priamo do Nastavení. Odhlásenie je v Nastaveniach v admin aj zákazníckej appke." },
    { date: "18. 9. 2026", app: "Obe", title: "Narodeniny + očkovania v produkcii", text: "Používa sa existujúce dogs.birth_date a vaccinations.valid_until. Vek sa počíta automaticky, admin vidí narodeniny a blížiace sa expirácie, zákazník dostane vlastný in-app oznam a pri povolených notifikáciách jednorazový push. Deduplikácia je podľa psa a roka, resp. psa, typu očkovania a dátumu platnosti. PWA zostala pomenovaná Chvostíkovo; systémové „from“ riadi iOS a oddeliť ho od názvu aplikácie sa nedá." },
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
        { title: "Psíkovia a majitelia", text: "Vidíš profil psa, majiteľa, telefón, plemeno, dátum narodenia, automaticky vypočítaný vek, povahu, alergie a poznámky. Vek a dátum narodenia sú v detaile kompaktne vedľa seba aj na mobile." },
        { title: "Rezervácie", text: "Vidíš plánované dni, pridávaš rezervácie a spracúvaš žiadosti zo zákazníckej appky." },
        { title: "Permanentky", text: "Spravuješ 10/20-vstupové permanentky, zostávajúce vstupy, dátum kúpy a platnosť." },
        { title: "Taxi", text: "Pri rezervácii vidíš, či treba vyzdvihnutie alebo vyzdvihnutie aj dovoz." },
        { title: "Denné návštevy", text: "Máš prehľad, kto v daný deň prišiel a čo sa má započítať." },
        { title: "Dashboard", text: "Horné kartičky počítajú dnešné a zajtrajšie rezervácie priamo z aktuálnych dát, aby po otvorení appky nezostali na nule." },
        { title: "Stabilné prepínanie", text: "Pri prepínaní hlavných kariet sa obrazovka drží v správnej polohe a nezostáva náhodne posunutá." },
        { title: "Štatistiky", text: "Vidíš návštevy a mesačné prehľady, ktoré sa používajú pri vyhodnocovaní škôlky." },
        { title: "Správy", text: "Vieš komunikovať so zákazníkom priamo cez jeho účet a nové správy sa môžu prejaviť bez reloadu." },
        { title: "Live aktualizácie a push", text: "Admin dostáva live zmeny rezervácií, taxi, správ, permanentiek, zatvorených dní, účtov a formulárov. Pri návrate z pozadia alebo po výpadku sa spojenie obnoví a spraví jeden resync." },
        { title: "Narodeniny a vek", text: "Používa sa dátum narodenia psa a vek sa počíta automaticky podľa aktuálneho dátumu, vrátane mesiacov pri mladých psoch. Admin vidí narodeninové upozornenie v správny deň." },
        { title: "Očkovania", text: "Pri psovi evidujeme očkovania a admin dostane upozornenie približne 14 dní pred koncom platnosti. Po zmene dátumu sa staré upozornenie deaktivuje." },
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
        { title: "Môj psík", text: "Klient vidí profil svojho psa a dôležité informácie na jednom mieste; hlavná obrazovka zostáva stabilná aj pri opätovnom renderovaní a uložení údajov. Súhlasy, kontaktné údaje a odhlásenie patria do Nastavení." },
        { title: "Fotka psa", text: "Majiteľ môže pracovať s profilovou fotkou psa a jej zobrazením." },
        { title: "Rezervácie", text: "Klient pošle žiadosť o konkrétny deň a schválenie alebo zamietnutie sa môže zobraziť live bez ručného refreshu. Pri odoslaní už neprekryje celú appku obrazovka „Načítavam Chvostíkovo“ – synchronizácia prebehne na pozadí." },
        { title: "Kto príde do škôlky", text: "Pri rezervovanom dni môže vidieť prihlásených psíkov; bez súhlasu sa cudzí pes zobrazí anonymne." },
        { title: "Taxi", text: "Pri rezervácii si klient vyberie, či potrebuje dopravu." },
        { title: "Permanentka", text: "Vidí svoju permanentku, použité a zostávajúce vstupy; zmeny permanentky sa môžu prejaviť live." },
        { title: "Správy", text: "Môže napísať Chvostíkovu a dostať odpoveď priamo v appke; nové správy sa zobrazujú live." },
        { title: "Live aktualizácie a push", text: "Zákaznícka PWA dostáva live zmeny rezervácií, správ, oznamov, zatvorených dní, permanentiek a údajov psíka. Realtime WebSocket je v CSP povolený iba pre konkrétny Supabase origin; appka nepoužíva všeobecný WSS wildcard. Starý 30-sekundový full polling bol odstránený." },
        { title: "Narodeniny a očkovania", text: "Majiteľ dostane v deň narodenín svojho psa osobný oznam a pri povolených notifikáciách aj jednorazový push. Približne 14 dní pred koncom platnosti očkovania dostane detailný oznam v appke a jednoduchý push." },
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
    { date: "17. 9. 2026", title: "Bezpečný CSP pre zákaznícky Realtime", app: "Zákaznícka", text: "CSP povoľuje Realtime iba cez konkrétny Supabase WSS origin. Service worker v47 zachováva bezpečnostnú politiku bez wildcardu a Realtime bootstrap už nenechá WebKit SecurityError zhodiť používateľské rozhranie." },
    { date: "18. 9. 2026", title: "Narodeniny, očkovania a push atribúcia", app: "Obe", text: "Nasadili sme automatický vek z dogs.birth_date, narodeninové admin aj zákaznícke oznamy, jednorazové push notifikácie, 14-dňové upozornenia na koniec platnosti očkovaní a deduplikáciu v databáze. PWA názov zostal Chvostíkovo, pretože systémové „from“ na iOS sa nedá oddeliť od názvu nainštalovanej aplikácie." },
    { date: "18. 9. 2026", title: "Profil psa a stabilné Nastavenia", app: "Obe", text: "Admin dostal mobilný dvojstĺpec Vek + Dátum narodenia a zachované individuálne Meno do SMS. Zákaznícka PWA už pri renderovaní nepresúva Súhlasy a podmienky cez hlavnú obrazovku Môj psík; účet, súhlasy a odhlásenie sú priamo v Nastaveniach. Odhlásenie bolo presunuté do kolieska Nastavenia aj v admine." }
  ],

  technical: [
    { label: "Zdroj aktuálneho stavu", value: "Produkcia + Supabase" },
    { label: "Admin", value: "Produkčná admin aplikácia používa spoločný Supabase backend." },
    { label: "Zákaznícka appka", value: "Produkčná PWA používa spoločný Supabase backend a vlastné zákaznícke rozhranie." },
    { label: "Live aktualizácie", value: "Supabase Realtime je nasadený pre obe appky. Zákaznícka signalizácia používa bezpečný kanál bez citlivého payloadu; RLS zostalo zachované." },
    { label: "CSP zákazníckej PWA", value: "Realtime WebSocket je povolený iba pre wss://tlhcqwsluyqpywymjoxn.supabase.co. Nebol pridaný žiadny všeobecný WSS wildcard; ostatné CSP obmedzenia zostali zachované." },
    { label: "Push branding", value: "PWA aj push title zostávajú Chvostíkovo. Systémové „from“ na iOS riadi operačný systém a samostatne ho nevieme premenovať. Badge používa transparentnú monochromatickú 96×96 verziu; veľká ikona sa neposiela." },
    { label: "Narodeniny a očkovania", value: "Spracovanie beží raz za hodinu podľa Europe/Bratislava. Push je deduplikovaný: narodeniny podľa pes + rok, očkovanie podľa pes + typ + dátum platnosti. Zákaznícke oznamy používajú existujúce portal_notifications, RLS a Realtime." },
    { label: "System", value: "Táto stránka je iba čitateľný projektový prehľad. Nemení dáta klientov ani logiku oboch aplikácií." },
    { label: "Poznámka", value: "Technické názvy tabuliek, API a deployov sú zámerne skryté z hlavnej obrazovky." }
  ]
};