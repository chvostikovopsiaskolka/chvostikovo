window.SYSTEM_DATA = {
  meta: {
    updated: "19. 9. 2026",
    source: "Aktuálny stav podľa produkcie, GitHubu a Supabase",
    note: "System je iba prehľad. Admin ani zákaznícka appka sa z tejto stránky nemenia."
  },

  now: {
    title: "Stabilizácia po Git/Vercel prepojení",
    status: "Kontrola",
    statusTone: "ready",
    note: "Zákaznícka V64 je už produkčne nasadená z vetvy customer-portal-production. Admin ostáva na Supabase stable-v9 a posledné UI opravy sú nasadené. Ešte sledujeme správanie PWA po obnove cache a neobvyklý Vercel traffic na Store-v2.png.",
    bullets: [
      "Zákaznícky portál: GitHub → Vercel production branch funguje.",
      "Admin: dashboard modaly, narodeniny a floating vyhľadávanie psa boli opravené.",
      "System: dôležité zmeny zapisujeme samostatným commitom do main ako projektový prehľad."
    ]
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
    { date: "19. 9. 2026", app: "System", title: "Štandard pre PWA ikony", text: "Pre zákaznícku PWA používame statické súbory priamo v GitHube: apple-touch-icon.png 180×180 pre iPhone, icon-192.png 192×192 pre Android a hlavnú push ikonu, icon-512.png 512×512 pre Android/PWA. Cesty sa nemenia; pri budúcej zmene vzhľadu sa nahradí iba obsah týchto troch PNG. Ikony sa nesmú routovať cez Supabase Edge Function ani cez staré Store-v2.png/app-icon.png. Monochromatický notification-badge-v64.png zostáva samostatný a jeho vzhľad sa nemení. Aktuálny schválený motív labky je mierne priblížený približne o 20 %." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "Statické PWA ikony z originálu Store.png", text: "Launcher ikony boli definitívne oddelené od Edge Function. iPhone používa statický apple-touch-icon 180×180, Android manifest statické 192×192 a 512×512 ikony z používateľom dodaného Store.png a hlavná ikona push notifikácie používa rovnaký statický 192×192 súbor. Pôvodný monochromatický notification badge zostal bez vizuálnej zmeny. Staré customer cesty Store-v2.png a app-icon.png už nie sú používané ani routované." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "Opravená PWA ikona labky v66", text: "iPhone pri novej inštalácii zobrazoval generickú ikonu C, pretože pôvodná Store-v2.png bola závislá od ďalšieho načítania starej admin ikony. Portál teraz používa stabilnú same-origin URL /app-icon.png, ktorá priamo generuje ružovú labku. Apple touch icon aj manifest smerujú na novú v66 ikonu a produkčná URL bola overená ako PNG 200 OK." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "Jednoduchší iPhone návod na inštaláciu v65", text: "iPhone návod už nepredpokladá Safari ani menu s tromi bodkami. Začína priamo tlačidlom Zdieľať (štvorec so šípkou nahor), potom pokračuje Zobraziť viac → Pridať na plochu → Otvoriť ako webovú apku → Pridať. Cache a app.js dostali novú v65 verziu, aby sa návod načítal aj po predchádzajúcom otvorení portálu." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "V64 na GitHub → Vercel produkcii", text: "Zákaznícky portál bol presunutý na samostatnú vetvu customer-portal-production. Vercel Production Branch teraz sleduje túto vetvu, takže každý ďalší commit je zároveň verzovaná GitHub záloha aj automatický production deploy. V64 bola úspešne nasadená ako production a verejná URL už vracia zákaznícku PWA namiesto hlavného webu." },
    { date: "19. 9. 2026", app: "Admin", title: "Dashboard modaly + narodeniny opravené", text: "Dashboard karty znovu otvárajú pracovný modal v strede obrazovky. Opravené bolo prepojenie dashboard runtime na existujúce admin dáta, takže akcie pri rezerváciách a ďalších kartách môžu používať reálny stav appky. Narodeniny a očkovania sa po renderi dashboardu znovu vykreslia a karta je umiestnená pod dashboardom." },
    { date: "19. 9. 2026", app: "Admin", title: "Floating vyhľadávanie psa", text: "V sekcii Psy bol odstránený pevný horný vyhľadávací riadok. Namiesto neho je pri spodnej lište plávajúca lupa; otvorí modal s vyhľadávaním podľa psa, majiteľa alebo telefónu a tlačidlom + Pridať psa. Výsledky sú zjednodušené bez štítkov Aktívny/Neaktívny a kliknutím sa otvorí profil psa." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Správna brand ikona Android pushu v62", text: "Generická ružová labka bola odstránená. Veľká farebná ikonka Android notifikácie teraz používa reálny Chvostíkovo brand asset cez samostatný /notification-icon.png endpoint s novou cache verziou. Malý monochromatický badge zostal bez zmeny. Produkčný alias aj service worker v62 boli overené." },
    { date: "18. 9. 2026", app: "Admin", title: "Dashboard v42 ako pracovný inbox", text: "Dashboard modaly už nie sú iba read-only náhľad. Z Čakajúcich rezervácií sa dá priamo schváliť alebo zamietnuť rezervácia/zmena taxi, pri Čakajúcich majiteľoch vybrať psíka a schváliť priradenie, Záujem o škôlku a Úvodné návštevy sa dajú priamo otvoriť a pri Záujme o permanentku ostal iba text „Má záujem o X-vstupovú permanentku“ + tlačidlo Vybavené. Dnes/Zajtra umožňuje rovno otvoriť profil psa. Modaly sa na mobile otvárajú v strede obrazovky, nie ako spodný sheet. Pôvodné bloky pod Dashboardom zostali zachované." },
    { date: "18. 9. 2026", app: "Admin", title: "Dashboard v41 s modálnymi detailmi", text: "Dashboard admin appky má nové stabilné poradie: Dnes/Zajtra, Čakajúce rezervácie/Záujem o permanentku, Záujem o škôlku/Správy, Čakajúci majitelia/Úvodné návštevy. Čakajúce rezervácie majú zelený zvýraznený štýl. Kliknutie na každú kartu otvorí prehľadový modal s údajmi; pôvodné pracovné bloky pod Dashboardom zostali zachované." },
    { date: "18. 9. 2026", app: "Obe", title: "Kompaktnejšie hlavičky a väčší roster", text: "Admin v37 už po prihlásení nezobrazuje horné Chvostíkovo logo; prihlasovacie logo zostalo zachované. Zákaznícka PWA v61 zväčšila v rozbalenom zozname prihlásených psíkov profilové fotky približne na 50 px a mená na 17 px, aby viac vynikla personalizácia." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Mobilné UI a súhlasy v60", text: "Z produkčnej hlavičky zákazníckej appky bolo odstránené logo, aby sa uvoľnil vertikálny priestor hlavne na menších Androidoch. Spodná navigácia je znovu pevne ukotvená k spodnému okraju, pribudla obnova prípadných zatuchnutých scroll-lock stavov a iOS date inputy v profile/očkovaniach majú pevné šírkové obmedzenia proti presahu modalu. Po potvrdení podmienok sa teraz zobrazí samostatný dobrovoľný krok, či zobraziť meno a fotku psíka ostatným v rovnaký deň; nastavenie ostáva neskôr meniteľné v Menu. Oznámenie po schválení rezervácie navyše vyzýva klienta, aby si pozrel, kto bude v ten deň s jeho psíkom v škôlke." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Stabilné fotky a oznamy v59", text: "Profilová fotka sa pri resyncu identifikuje podľa photo_path + photo_updated_at, takže nová dočasná podpísaná URL už nespôsobí znovunačítanie tej istej fotky v Rezerváciách, spodnej lište ani Môj psík. Odstránené boli aj staré oneskorené rendery po 900/1050 ms. Zatvorený notification modal sa v rovnakej relácii znovu neotvorí počas serverového mark-read resyncu. Deadline oznam je presunutý priamo nad Moje rezervácie." },
    { date: "18. 9. 2026", app: "Obe", title: "Live a návrat z pozadia fyzicky overené", text: "Produkčný test so schválením Bellinej rezervácie potvrdil zákaznícky push, Realtime/live zmenu rezervácie a obnovu po návrate z pozadia. Admin aj zákaznícka appka sa po návrate synchronizujú bez ručného reloadu; samostatný bod na preverenie resume bol preto uzavretý." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Ružová ikona push notifikácie v57", text: "Veľká farebná ikonka vpravo v Android notifikácii používa ružovú Chvostíkovo labku. Malý systémový monochromatický badge ostal bez zmeny. Zmenila sa aj verzia URL ikonky v service workeri, aby Android nepoužíval starú oranžovú ikonku z immutable cache." },
    { date: "18. 9. 2026", app: "Admin", title: "Detail psa v36 – stabilný legal blok bez blokovania otvorenia", text: "Opravená regresia v35, pri ktorej sa detail psa mohol neotvoriť, ak sa načítanie súhlasov alebo podmienok oneskorilo alebo zlyhalo. V36 vytvorí kartu Súhlasy a podmienky okamžite na správnom mieste pred revealom detailu a jej stav sa doplní asynchrónne iba do existujúceho kontajnera bez posunu layoutu." },
    { date: "18. 9. 2026", app: "Obe", title: "Stabilné obrazovky bez dodatočného preskakovania", text: "Zákaznícka PWA v56 zachováva rovnaké avatarové DOM prvky pri nezmenenej fotke, pred prvým zobrazením fotku predecodeuje a odstránila druhý oneskorený render. Pravidlá sa načítajú vopred a modal sa otvorí až s hotovým dokumentom. Admin v35 odstránil starý samostatný legal-status script; Súhlasy a podmienky sa načítajú spolu s detailom psa ešte pred jeho zobrazením." },
    { date: "18. 9. 2026", app: "Admin", title: "Info o psíkovi ako rozbaľovacie karty v34", text: "V admin detaile psa sú v sekcii Info o psíkovi položky Informácie o psovi a Očkovania zbalené do samostatných accordion kariet. Staršie v32/v33 vrstvy boli odstránené a v34 sa celý detail vrátane accordionov zostaví ešte pred zobrazením, takže sa neukazuje starý layout ani ďalší prechodný build." },
    { date: "18. 9. 2026", app: "Admin", title: "Detail psa v32 bez prebliknutia starého layoutu", text: "Staršia v31 vrstva pre detail psa bola odstránená. Tri sekcie Štatistiky, Info o psíkovi a Rezervácie sa teraz zostavia ešte pred zobrazením detailu, takže používateľ už neuvidí pôvodný accordion a následný preskok. Telefón majiteľa zostáva stále viditeľný hore mimo tabov." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Pravidlá, Menu a stabilnejšie fotky v55", text: "Na obrazovke Môj psík pribudla karta Pravidlá škôlky medzi profilom a štatistikami; otvára aktuálne aktívny dokument z databázy. Ozubené koliesko bolo nahradené hamburger Menu. Pri prvom potvrdení podmienok je samostatná dobrovoľná voľba, či zobraziť meno a fotku psíka ostatným majiteľom prihláseným na ten istý deň; rovnaké nastavenie zostáva dostupné aj v Menu. Fotka v oranžovej rezervačnej karte je väčšia bez zväčšenia karty a opakované renderovanie avatarov pri štarte/resyncu bolo obmedzené, aby nepreblikávali." },
    { date: "18. 9. 2026", app: "Obe", title: "Admin detail psa v31 + väčšie fotky v54", text: "Admin detail psa má tri hlavné sekcie Štatistiky, Info o psíkovi a Rezervácie. Núdzový kontakt s telefónom ostáva stále viditeľný hore mimo tabov. Rezervácie zhromažďujú čakajúce a plánované rezervácie, aktuálnu/nasledujúcu permanentku, správu permanentiek aj kúpu novej. V zákazníckej PWA sa zväčšili kruhové fotky psa v Rezerváciách aj Môj psík, aby viac vynikla personalizácia." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Môj psík v53 – chat, spodná lišta a Android push ikona", text: "Výzva na doplnenie údajov je centrovaná, spodná navigácia má pre bežného zákazníka iba dve rovnako široké položky Rezervácie a Môj psík. Plávajúci chat je väčší a oranžový; pri prvom otvorení Môj psík v relácii sa zobrazí krátka nápoveda „Máte otázku? Napíšte nám správu“. Android push používa Chvostíkovo PWA ikonu ako hlavný icon a monochromatický badge zostáva zachovaný." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Plávajúci chat + kompaktnejší Môj psík", text: "Výzva na doplnenie údajov psa je kratšia a centrovaná, návštevy celkovo sú v jednom riadku s číslom vpravo. Samostatná spodná záložka Správy bola skrytá a komunikácia je dostupná cez plávajúce chat tlačidlo na obrazovke Môj psík. Chat sa otvára v modale, zachováva existujúce správy a umožňuje zvoliť rezerváciu, správu bez predmetu alebo vlastný predmet." },
    { date: "18. 9. 2026", app: "Zákaznícka", title: "Môj psík uprataný + opravená cache verzií", text: "Zákaznícka PWA má kompaktnú hlavičku psa s tlačidlom Údaje psíka, údaje sa upravujú v jednom modale, zobrazujú sa návštevy celkovo s mesačným rozbalením a permanentka ostáva v Rezerváciách vrátane dátumu platnosti. Odstránené customer polia váhy a interných poznámok sa pri ukladaní neprepisujú. Opravený bol aj service worker: nová v51 používa vlastný cache namespace a network-first načítanie JS/CSS bez ignoreSearch, aby sa nemiešala stará a nová verzia." },
    { date: "18. 9. 2026", app: "Admin", title: "Web záujem / prihláška → úvodná návšteva", text: "Pri označení webového záujmu ako vybaveného sa admin opýta, či bola dohodnutá úvodná návšteva. Existujúci formulár úvodnej návštevy sa otvorí s predvyplneným majiteľom, telefónom a dostupnými údajmi. Pri plnej prihláške je možné vytvoriť úvodnú návštevu alebo prihlásiť psíka rovno; do poznámky sa prenesie aj plemeno a váha, informácie o psíkovi a plán využívania." },
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
        { title: "Psíkovia a majitelia", text: "Detail psa je rozdelený na Štatistiky, Info o psíkovi a Rezervácie. Telefón majiteľa ostáva stále viditeľný hore pre núdzový kontakt. V profile vidíš plemeno, dátum narodenia, automatický vek, povahu, alergie a poznámky." },
        { title: "Rezervácie", text: "Vidíš plánované dni, pridávaš rezervácie a spracúvaš žiadosti zo zákazníckej appky." },
        { title: "Permanentky", text: "Spravuješ 10/20-vstupové permanentky, zostávajúce vstupy, dátum kúpy a platnosť." },
        { title: "Taxi", text: "Pri rezervácii vidíš, či treba vyzdvihnutie alebo vyzdvihnutie aj dovoz." },
        { title: "Denné návštevy", text: "Máš prehľad, kto v daný deň prišiel a čo sa má započítať." },
        { title: "Dashboard", text: "Horné kartičky počítajú dnešné a zajtrajšie rezervácie priamo z aktuálnych dát, aby po otvorení appky nezostali na nule." },
        { title: "Stabilné prepínanie", text: "Pri prepínaní hlavných kariet sa obrazovka drží v správnej polohe a nezostáva náhodne posunutá." },
        { title: "Štatistiky", text: "Vidíš návštevy a mesačné prehľady, ktoré sa používajú pri vyhodnocovaní škôlky." },
        { title: "Správy", text: "Vieš komunikovať so zákazníkom priamo cez jeho účet a nové správy sa môžu prejaviť bez reloadu." },
        { title: "Live aktualizácie a push", text: "Admin dostáva live zmeny rezervácií, taxi, správ, permanentiek, zatvorených dní, účtov a formulárov. Návrat z pozadia aj následný resync boli fyzicky overené v produkčnom teste." },
        { title: "Narodeniny a vek", text: "Používa sa dátum narodenia psa a vek sa počíta automaticky podľa aktuálneho dátumu, vrátane mesiacov pri mladých psoch. Admin vidí narodeninové upozornenie v správny deň." },
        { title: "Očkovania", text: "Pri psovi evidujeme očkovania a admin dostane upozornenie približne 14 dní pred koncom platnosti. Po zmene dátumu sa staré upozornenie deaktivuje." },
        { title: "Fotky", text: "Pri psovi môže byť fotografia používaná v admin aj zákazníckej časti podľa nastavení." },
        { title: "Neaktívni psi", text: "Psíkov, ktorí už škôlku nenavštevujú, vieš oddeliť od aktívnych." },
        { title: "Zákaznícke účty", text: "Schvaľuješ účet klienta a prepájaš ho s existujúcim majiteľom a psom." },
        { title: "Webové záujmy a prihlášky", text: "Z webového záujmu alebo vyplnenej prihlášky vieš predvyplniť existujúcu úvodnú návštevu; pri prihláške môžeš psíka aj prihlásiť rovno." },
        { title: "Oznamy", text: "Vieš pripraviť dôležitú informáciu, ktorá sa zobrazí zákazníkom v portáli." }
      ]
    },
    customer: {
      label: "Zákaznícka appka",
      intro: "Jednoduché miesto pre klienta – jeho pes, rezervácie, permanentka, taxi, správy a upozornenia.",
      features: [
        { title: "Registrácia a prihlásenie", text: "Klient si vytvorí účet a po schválení ho admin prepojí s jeho psom." },
        { title: "Môj psík", text: "Klient vidí kompaktný profil psa, tlačidlo Údaje psíka, kartu Pravidlá škôlky a návštevné štatistiky. Po prvom potvrdení podmienok nasleduje samostatná dobrovoľná voľba zdieľania mena/fotky; rovnaké nastavenie je neskôr dostupné aj cez hamburger Menu." },
        { title: "Fotka psa", text: "Majiteľ môže pracovať s profilovou fotkou psa a jej zobrazením." },
        { title: "Rezervácie", text: "Klient pošle žiadosť o konkrétny deň a schválenie alebo zamietnutie sa zobrazí live bez ručného refreshu; tento tok bol fyzicky overený produkčným testom. Po schválení oznam klienta priamo navádza, aby si pozrel, kto bude v ten deň s jeho psíkom v škôlke." },
        { title: "Kto príde do škôlky", text: "Pri rezervovanom dni môže vidieť prihlásených psíkov; bez súhlasu sa cudzí pes zobrazí anonymne." },
        { title: "Taxi", text: "Pri rezervácii si klient vyberie, či potrebuje dopravu." },
        { title: "Permanentka", text: "Stav permanentky je súčasťou obrazovky Rezervácie, vrátane použitých vstupov a dátumu platnosti, ak ho permanentka má. Duplicitná permanentková karta bola z Môj psík odstránená." },
        { title: "Správy", text: "Komunikácia je dostupná cez väčšie oranžové plávajúce chat tlačidlo na obrazovke Môj psík namiesto samostatnej spodnej záložky. Pri prvom otvorení profilu v relácii sa zobrazí krátka nápoveda. Chat sa otvorí v modale a používateľ môže zvoliť konkrétnu rezerváciu, správu bez predmetu alebo vlastný predmet; existujúci backend a live synchronizácia správ zostali zachované." },
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
    { date: "18. 9. 2026", title: "Profil psa a stabilné Nastavenia", app: "Obe", text: "Admin dostal mobilný dvojstĺpec Vek + Dátum narodenia a zachované individuálne Meno do SMS. Zákaznícka PWA už pri renderovaní nepresúva Súhlasy a podmienky cez hlavnú obrazovku Môj psík; účet, súhlasy a odhlásenie sú priamo v Nastaveniach. Odhlásenie bolo presunuté do kolieska Nastavenia aj v admine." },
    { date: "18. 9. 2026", title: "Môj psík v51 + web formuláre do úvodných návštev", app: "Obe", text: "Customer profil bol zjednodušený na kompaktnú hlavičku, modal Údaje psíka a návštevné štatistiky; permanentka zostáva v Rezerváciách. Service worker v51 už nemieša staré JS/CSS verzie. Admin vie z webového záujmu alebo prihlášky vytvoriť predvyplnenú úvodnú návštevu, prípadne psa prihlásiť rovno." },
    { date: "18. 9. 2026", title: "Plávajúci zákaznícky chat v52", app: "Zákaznícka", text: "Samostatná záložka Správy bola nahradená plávajúcim chat tlačidlom na obrazovke Môj psík. Správy sa otvárajú v modale so zachovaným vláknom, výberom rezervácie alebo vlastného predmetu. Súčasne sa skompaktnila výzva na doplnenie údajov a karta návštev." },
    { date: "18. 9. 2026", title: "Doladenie zákazníckeho UI v53", app: "Zákaznícka", text: "Onboarding je vycentrovaný, spodná navigácia sa pre zákazníka skladá z dvoch rovnako širokých položiek, chat je väčší a oranžový a pri prvom vstupe na Môj psík ukáže krátku nápovedu. Push na Androide dostal PWA ikonu Chvostíkova ako hlavný icon pri zachovaní monochromatického badge." },
    { date: "18. 9. 2026", title: "Pravidlá + Menu + photo stability v55", app: "Zákaznícka", text: "Môj psík dostal samostatnú kartu Pravidlá škôlky a hamburger Menu. Pri potvrdení podmienok sa dá dobrovoľne povoliť meno a fotka pre ostatných majiteľov prihlásených v rovnaký deň. Oranžová rezervačná karta má väčší avatar bez rastu samotnej karty a avatar sa pri nezmenených dátach zbytočne neprestavuje." }
  ],

  technical: [
    { label: "Zdroj aktuálneho stavu", value: "Produkcia + GitHub + Supabase" },
    { label: "Git workflow", value: "Zákaznícky frontend je verzovaný vo vetve customer-portal-production a Vercel ju používa ako Production Branch. Commit do tejto vetvy zároveň vytvorí GitHub históriu aj production deploy. Chvostikovo System ostáva na main." },
    { label: "Admin", value: "Produkčná admin aplikácia používa Supabase backend a frontend stable-v9 načítaný cez Edge Function chvostikovo-frontend. Dôležité admin zmeny sa zároveň zaznamenávajú do System appky v GitHub main, ale plný admin frontend zatiaľ nie je zdrojovaný z GitHubu." },
    { label: "Zákaznícka appka", value: "Produkčná PWA používa spoločný Supabase backend a vlastné zákaznícke rozhranie." },
    { label: "Live aktualizácie", value: "Supabase Realtime je nasadený pre obe appky. Zákaznícka signalizácia používa bezpečný kanál bez citlivého payloadu; RLS zostalo zachované." },
    { label: "CSP zákazníckej PWA", value: "Realtime WebSocket je povolený iba pre wss://tlhcqwsluyqpywymjoxn.supabase.co. Nebol pridaný žiadny všeobecný WSS wildcard; ostatné CSP obmedzenia zostali zachované." },
    { label: "Push branding", value: "PWA aj push title zostávajú Chvostíkovo. Systémové „from“ na iOS riadi operačný systém a samostatne ho nevieme premenovať. Malý systémový badge zostáva monochromatický; od v57 používa veľká farebná ikona Android pushu ružovú Chvostíkovo labku s vlastnou verziou URL, aby sa nevracala stará oranžová ikona z cache. Výsledný spôsob vykreslenia stále čiastočne riadi Android/iOS." },
    { label: "Narodeniny a očkovania", value: "Spracovanie beží raz za hodinu podľa Europe/Bratislava. Push je deduplikovaný: narodeniny podľa pes + rok, očkovanie podľa pes + typ + dátum platnosti. Zákaznícke oznamy používajú existujúce portal_notifications, RLS a Realtime." },
    { label: "UI stabilita", value: "Pri ďalších UI úpravách sa obrazovka nemá zobraziť skôr, než sú všetky jej karty a ovládacie prvky na správnom mieste. Dáta sa majú načítať pred revealom alebo dopĺňať iba do už existujúceho stabilného kontajnera. Fotky a avatary sa pri nezmenenom zdroji nesmú zbytočne vyhadzovať z DOM a vytvárať nanovo." },
    { label: "System", value: "Táto stránka je iba čitateľný projektový prehľad. Nemení dáta klientov ani logiku oboch aplikácií." },
    { label: "Poznámka", value: "Technické názvy tabuliek, API a deployov sú zámerne skryté z hlavnej obrazovky." }
  ]
};