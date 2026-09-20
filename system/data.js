window.SYSTEM_DATA = {
  meta: {
    updated: "20. 9. 2026",
    source: "Aktuálny stav LIVE + PREVIEW podľa produkcie, GitHubu, Vercelu a Supabase",
    note: "System je iba prehľad. Admin ani zákaznícka appka sa z tejto stránky nemenia."
  },

  environments: [
    {
      label: "LIVE",
      tone: "live",
      title: "Zákaznícka appka",
      version: "V94 · READY",
      note: "Produkčná verzia, ktorú používajú reálni zákazníci. Túto vetvu pri čistení nemeníme.",
      bullets: [
        "Git vetva: customer-portal-production.",
        "Frontend: V94 – opravený posledný vstup z permanentky + kompaktný loading počas akcií v appke.",
        "Backend: produkčný Supabase; customer-portal-api v20.",
        "Obsahuje multi-day rezervácie, taxi podľa jednotlivých dní, Žiacku knižku – Pripravujeme, foto editor a Realtime."
      ]
    },
    {
      label: "PREVIEW",
      tone: "preview",
      title: "Customer Preview",
      version: "Cleanup v16 + V94 fix · READY",
      note: "Samostatná testovacia verzia. Tu prebieha audit a čistenie kódu bez zásahu do zákazníkov.",
      bullets: [
        "Git vetva: customer-portal-preview.",
        "Frontend je funkčne odvodený od LIVE, ale staré runtime vrstvy sa postupne konsolidujú.",
        "app.js: približne 165,5 kB LIVE → 146,7 kB PREVIEW; priame runtime prepisy hlavných funkcií: 0.",
        "Pred povýšením na LIVE musí prejsť regresným testom na telefóne."
      ]
    },
    {
      label: "STAGING",
      tone: "staging",
      title: "Chvostikovo staging",
      version: "Izolovaný backend",
      note: "Backend iba pre Preview. Produkčné účty, psy ani rezervácie sa sem nekopírujú.",
      bullets: [
        "Samostatný Supabase projekt jgzabminzgbfhsrgqedt.",
        "Google Calendar sync, cron a automatické produkčné push odosielanie sú odpojené.",
        "Testovacia Bella PREVIEW je nastavená na 9/10 pre test posledného vstupu.",
        "Preview customer-portal-api obsahuje rovnaký V94 fix permanentky ako produkcia."
      ]
    },
    {
      label: "ADMIN LIVE",
      tone: "admin",
      title: "Admin appka",
      version: "Produkcia",
      note: "Interná aplikácia zostáva produkčná. Dnešné security úpravy boli nasadené priamo LIVE.",
      bullets: [
        "Po login-e sa povinne overuje aktívny staff účet.",
        "Vytvorenie nového admin účtu bolo odstránené z verejnej prihlasovačky.",
        "Tržby a interné tabuľky zostávajú chránené RLS/staff pravidlami.",
        "Zbytočné klientské databázové práva a verejný EXECUTE interných triggerov boli odobraté."
      ]
    }
  ],

  now: {
    title: "Regresný test vyčisteného Customer Preview",
    status: "Rozpracované",
    statusTone: "planned",
    note: "LIVE zákaznícka appka je stabilná na V94. Ďalšie čistenie už robíme iba v Preview/stagingu. Cieľom je zjednodušiť kód bez zmeny správania a až po dôkladnom teste rozhodnúť, či sa vyčistená verzia povýši do produkcie.",
    bullets: [
      "LIVE: V94 je READY a ostáva nedotknutá počas ďalšieho auditu.",
      "PREVIEW: odstránené staré renderery, single-day rezervovanie, nefunkčný V18 date-search, zbytočné observery, mŕtve helpery a veľká časť starého CSS.",
      "PREVIEW: hlavné render/api/bootstrap vrstvy už používajú centrálne hooky/registry namiesto reťazenia runtime patchov.",
      "Ďalší krok: test registrácie → Bella PREVIEW → rezervácie → taxi → posledný vstup → permanentka → foto → správy → onboarding."
    ]
  },

  next: [
    {
      title: "Regresný test vyčisteného Preview",
      status: "Rozpracované",
      tone: "planned",
      text: "Prejsť celý zákaznícky flow na izolovanom Preview/stagingu a potvrdiť, že cleanup nezmenil správanie.",
      detail: "Registrácia a login, Bella PREVIEW, Môj psík, foto, údaje, podmienky, multi-day rezervácia, taxi po dňoch, zrušenie rezervácie, 9/10 → posledný vstup → záujem o permanentku, správy, push/onboarding a návrat z pozadia."
    },
    {
      title: "Stabilná verejná Preview URL",
      status: "Čaká na nastavenie",
      tone: "waiting",
      text: "Preview branch URL existuje, ale Vercel Deployment Protection stále vyžaduje share bypass.",
      detail: "Vo Vercel projekte chvostikovo-portal vypnúť Vercel Authentication pre Preview deployments. Potom zostane jedna stabilná branch URL bez dočasného _vercel_share tokenu."
    },
    {
      title: "Žiacka knižka – navrhnúť obsah",
      status: "Plánované",
      tone: "planned",
      text: "Karta už je v LIVE aj PREVIEW pod návštevami a zatiaľ zobrazuje iba názov Žiacka knižka + Pripravujeme.",
      detail: "Neskôr navrhnúť, čo sa tam bude zapisovať: pokrok, správanie, socializácia, tréning, poznámky zo škôlky alebo fotografie. Najprv návrh, až potom databáza."
    },
    {
      title: "Úprava webu – formulár, dizajn a 3 body z recenzií",
      status: "Plánované",
      tone: "planned",
      text: "Prejsť a doladiť web Chvostíkova – najmä formulár, celkový dizajn a zapracovanie 3 hlavných bodov z recenzií.",
      detail: "Pri ďalšej úprave webu skontrolovať formulár, používateľský priebeh a vybrať 3 najsilnejšie opakujúce sa benefity alebo skúsenosti z recenzií."
    },
    {
      title: "Odmeny a bonusy pre zákazníkov",
      status: "Nápad",
      tone: "planned",
      text: "Navrhnúť jednoduchý odmeňovací systém pre pravidelnejšie návštevy a prepojenie škôlky s produktmi alebo partnermi.",
      detail: "Najprv obchodné pravidlá a ochrana proti zneužitiu; zatiaľ bez implementácie."
    },
    {
      title: "Podmienky škôlky – finálne potvrdenie",
      status: "Plánované",
      tone: "planned",
      text: "Po posledných textových úpravách ešte potvrdiť finálnu podobu pre appku aj tlačenú verziu.",
      detail: "Až potom považovať text podmienok za uzavretý dokument."
    }
  ],

  waiting: [
    { title: "Otestovať LIVE V94 na Belle 9/10", text: "Vytvoriť jednu rezerváciu a potvrdiť, že sa hneď zobrazí okno Posledný vstup z permanentky a tlačidlo Mám záujem prejde bez chyby.", status: "Čaká", tone: "waiting" },
    { title: "Vytvoriť Preview testovací účet", text: "Zaregistrovať samostatný účet v Preview/staging Auth a prepojiť ho na Bella PREVIEW 9/10.", status: "Čaká", tone: "waiting" },
    { title: "Sprístupniť stabilný Preview link", text: "Vo Verceli vypnúť Preview Deployment Protection, aby branch URL fungovala bez dočasného share tokenu.", status: "Čaká", tone: "waiting" },
    { title: "Otestovať iPhone / Android po finálnom release", text: "Pred širším spustením prejsť inštaláciu, push, foto editor, scroll a návrat z pozadia na fyzických telefónoch.", status: "Neskôr", tone: "planned" }
  ],

  recent: [
    { date: "20. 9. 2026", app: "Zákaznícka LIVE", title: "V94 – posledný vstup z permanentky + kompaktný loading", text: "Opravený flow pre psa na poslednom zostávajúcom vstupe. Backend pri rezervácii vracia projected_entry_number / projected_pass_total a frontend teraz otvorí okno Posledný vstup z permanentky okamžite po úspešnej rezervácii, bez čakania na ďalší bootstrap. customer-portal-api v20 navyše povolí žiadosť o novú 10-vstupovú permanentku, ak sú všetky zostávajúce vstupy aktuálnej permanentky už rezervované. Pri vnútro-app operáciách sa namiesto celej bielej obrazovky ukáže iba malý loading box s labkou; úvodný startup splash s logom zostáva." },
    { date: "20. 9. 2026", app: "Preview", title: "Audit a konsolidácia zákazníckeho frontendu", text: "Cleanup prebieha iba vo vetve customer-portal-preview. app.js klesol približne z 165,5 kB LIVE na 146,7 kB PREVIEW. Odstránené boli mŕtve helpery, staré legacy renderery, nefunkčný V18 date-search, single-day booking handler, staré profile/onboarding/reservation CSS a zbytočné observery. Hlavné render/api/bootstrap vrstvy používajú centrálne hooky/registry; priame runtime prepisy hlavných funkcií sú na nule. V94 fix bol následne synchronizovaný aj do Preview." },
    { date: "20. 9. 2026", app: "System", title: "Oddelené LIVE / PREVIEW / STAGING prostredia", text: "Vznikla vetva customer-portal-preview a samostatný Supabase projekt Chvostikovo staging. Preview už nepoužíva produkčnú databázu. Staging má vlastný Auth/backend, bez produkčných zákazníckych dát; Google Calendar sync, cron a automatické produkčné push odosielanie sú odpojené. Testovacia Bella PREVIEW je pripravená na 9/10. Produkčná vetva customer-portal-production zostáva samostatná." },
    { date: "20. 9. 2026", app: "Admin / Security", title: "Staff gate a databázové hardening úpravy", text: "Admin appka po prihlásení najprv overí aktívny staff účet; zákaznícky účet sa do admin rozhrania nepustí. Z admin loginu bola odstránená registrácia nového účtu. Na produkčnej databáze sa zaplo RLS pre starú frontend snapshot tabuľku, odobrali sa nepotrebné TRUNCATE/REFERENCES/TRIGGER oprávnenia a dve interné trigger funkcie už nie sú verejne spustiteľné ako RPC." },
    { date: "20. 9. 2026", app: "Zákaznícka LIVE", title: "V91 – taxi sa vyberá zvlášť pre každý rezervovaný deň", text: "Pri multi-day rezervácii už taxi nie je jedna spoločná voľba pre všetky dni. Každý vybraný deň má vlastné Bez taxi / Vyzdvihnúť 5 € / Tam aj späť 10 € a do backendu sa ukladá samostatne ku každej rezervácii." },
    { date: "20. 9. 2026", app: "Zákaznícka LIVE", title: "V92–V93 – Žiacka knižka", text: "Na stránke Môj psík pod návštevami pribudla karta Žiacka knižka. Zatiaľ zobrazuje iba názov a stav Pripravujeme; obsah a funkcie budú navrhnuté neskôr." },
    { date: "20. 9. 2026", app: "Zákaznícka LIVE", title: "V89–V90 – foto editor a práca s existujúcou fotkou", text: "Profilová fotografia podporuje posúvanie jedným prstom a pinch zoom dvoma prstami, úpravu aktuálnej fotky, nahratie novej aj vymazanie. Existujúca už orezaná fotka sa pri editovaní otvorí s miernym zoomom, aby sa dala hneď posúvať v rámci dostupných pixelov. Zachované sú iOS decode/picker ochrany." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "Android čistý návrat po zmazanom účte v72", text: "Opravený doslovný text \\n v index.html a zvýšená cache verzia na v72. Pri starej session z vymazaného alebo neplatného účtu sa teraz rozpoznajú aj chyby Invalid Refresh Token / Token Not Found / JWT, session sa vyčistí bez technického toastu, zobrazí sa čistý login a resetuje sa stav install guide, aby sa návod na inštaláciu otvoril automaticky. Produkcia overená: root, app.js v72 a sw.js vracajú 200 a root už neobsahuje viditeľný \\n." },
    { date: "19. 9. 2026", app: "System", title: "Portal preview z main vypnutý", text: "V projekte chvostikovo-portal je Ignored Build Step nastavený tak, aby vetva main vrátila skip (exit 0). customer-portal-production sa ďalej buildí ako produkcia a budúce samostatné testovacie vetvy sa môžu normálne buildiť ako Preview. Cieľ: žiadne zbytočné preview deploye a chybové e-maily pri commitovaní Systemu alebo webu do main." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "UI cleanup + Android splash v71", text: "Konzervatívne upratanie bez zásahu do rezervácií, loginu, Realtime alebo databázy. Odstránená duplicitná v64 vrstva, ktorá do Menu vkladala druhú dvojicu odkazov Ochrana osobných údajov / Podmienky psej škôlky; zostáva iba hlavný stavový blok s Potvrdené/Odsúhlasené a tlačidlami na otvorenie dokumentov. V64 push self-heal bol oddelený a zachovaný ako čistý v71 push self-heal. Opravený viditeľný literál \\n v hlavičke Android appky. Karta Doplňte údaje psíka a Menu dostali kompaktnejšiu typografiu a padding. Launcher ikony 192/512 zostali nezmenené; pridaná samostatná statická maskable 512 ikona s menším vizuálnym logom pre Android splash, bez Edge Function alebo rewrite. Malý monochromatický Android notification badge ostal nezmenený. Produkčný commit cfb81fff je READY." },
    { date: "19. 9. 2026", app: "System", title: "Štandardný postup pre Android PWA", text: "Overený postup pre spoľahlivú Android inštaláciu zákazníckej PWA: 1) manifest musí byť dostupný priamo z /manifest.webmanifest cez HTTPS a obsahovať name, short_name, start_url=/, scope=/, display=standalone, theme/background color a prefer_related_applications=false; 2) launcher ikony majú byť statické PNG priamo v repozitári, minimálne /icon-192.png a /icon-512.png, bez Edge Function, rewrite alebo spätného fetchu; 3) service worker sa registruje iba raz cez stabilnú /sw.js URL, musí mať fetch handler a jeho install fáza nesmie padnúť kvôli nepodstatnému assetu – shell cacheovať odolne cez Promise.allSettled; 4) manifest a launcher ikony neprecacheovať cez problematické externé endpointy; 5) notifikačný monochromatický badge môže zostať samostatný, ale nesmie byť súčasťou kritickej SW install cache; 6) odstrániť staré legacy odkazy typu Store-v2.png, duplicitné SW registrácie a neexistujúce favicon cesty; 7) fallback favicon smerovať na lokálnu statickú ikonu; 8) Android návod má byť browser-agnostic: ⋮ → Nainštalovať aplikáciu → potvrdiť → otvoriť cez ikonu na ploche; 9) po zmene manifestu/SW/ikoniek testovať na čistom stave prehliadača alebo po odstránení starej PWA/WebAPK; 10) po deployi vždy overiť live URL manifestu, SW a ikoniek 192/512 a skontrolovať Vercel rewrite traffic, aby sa nevrátila rekurzívna slučka. Tento postup bol potvrdený reálnou úspešnou inštaláciou na Androide po v70." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "PWA cleanup v70 – odstránený Store-v2 a odolnejší SW", text: "Odstránený posledný runtime odkaz na starý /Store-v2.png z legacy iOS patchu v32 a zrušená duplicitná registrácia service workera v tomto patchi. Apple touch icon používa iba statický /apple-touch-icon.png a favicon fallback statický /icon-192.png. Manifest bol zjednodušený na štandardné 192×192 a 512×512 any ikony. Service worker pri inštalácii cacheuje iba jadro aplikácie a používa Promise.allSettled, takže jeho aktiváciu už nezablokuje výpadok pomocnej ikonky alebo Edge endpointu. Monochromatický Android notification badge zostal vizuálne nezmenený, ale už sa neprecacheuje – Edge Function sa volá len pri reálnom push oznámení. Po nasadení kontrola trafficu: admin 9 rewrites/30 min, portal 6 rewrites/30 min; pôvodná request slučka sa nevrátila." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "Android PWA install kompatibilita v69", text: "Android inštalačný návod je nezávislý od konkrétneho prehliadača: ⋮ → Nainštalovať aplikáciu → potvrdiť → otvoriť cez ikonu na ploche. Manifest sa načítava priamo z /manifest.webmanifest bez query verzie a service worker ho už neprecacheuje ani neinterceptuje, aby Android vždy dostal aktuálny manifest. Doplnené explicitné prefer_related_applications=false a samostatné 192/512 any + 512 maskable ikony. Service worker sa registruje cez stabilnú /sw.js URL s no-cache hlavičkou. Live produkcia overená: manifest, SW, 192 a 512 PNG vracajú 200 OK." },
    { date: "19. 9. 2026", app: "Zákaznícka", title: "Odhlásenie + Android inštalácia v68", text: "Opravené odhlásenie: po kliknutí sa zavrie Menu aj ďalšie otvorené modaly a odstráni sa settings-open scroll lock ešte pred návratom na login. Ak používateľ nie je v standalone PWA, po odhlásení sa znovu sprístupní inštalačný návod na prihlasovacej obrazovke. Opravený aj stav, keď Chrome vyvolal beforeinstallprompt ešte pred vytvorením návodu – inštalačné tlačidlo sa po otvorení návodu zobrazí správne. Samostatné tlačidlo Nainštalovať aplikáciu v používateľskom Menu sa nepoužíva. Overené ikony v manifeste: 192×192 a 512×512 sú platné PNG, takže Android problém nebol spôsobený ich rozmerom." },
    { date: "19. 9. 2026", app: "System", title: "Kritická oprava Vercel Edge Requests slučky", text: "Príčina prudkého rastu Edge Requests bola potvrdená ako rekurzívna slučka: chvostikovo-app /Store-v2.png → Vercel rewrite → Supabase Edge Function chvostikovo-app-icon → spätný fetch na tú istú /Store-v2.png URL → ďalší rewrite. Pred opravou bolo približne 59 603 rewrite requestov za 30 minút a 153 237 za hodinu. Edge Function bola upravená na verziu 6 tak, aby ikonku vracala priamo zo statických dát a už nikdy nevolala Vercel URL. Po oprave klesol traffic na 2 rewrites za minútu. Pravidlo do budúcna: ikony nesmú byť implementované ako spätný fetch cez rovnakú Vercel rewrite cestu; launcher ikony zákazníckeho portálu zostávajú statické v GitHube." },
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
      intro: "Jednoduché miesto pre klienta – jeho pes, rezervácie, permanentka, taxi, správy a upozornenia. LIVE a PREVIEW sú od 20. 9. oddelené.",
      features: [
        { title: "Registrácia a prihlásenie", text: "Klient si vytvorí účet, potvrdí e-mail a admin ho prepojí s existujúcim majiteľom/psom. Zákaznícky účet nemá prístup k interným admin dátam." },
        { title: "Môj psík", text: "Kompaktný profil obsahuje fotku, Údaje psíka, pravidlá/podmienky, návštevy, nastavenia a kartu Žiacka knižka – zatiaľ označenú Pripravujeme." },
        { title: "Fotka psa", text: "Majiteľ môže nahrať novú fotku, upraviť existujúcu alebo ju vymazať. Editor podporuje posun jedným prstom a pinch zoom; iOS picker/decode má samostatnú ochranu proti nechcenému reloadu." },
        { title: "Multi-day rezervácie", text: "Majiteľ otvorí jeden picker, vyberie jeden alebo viac voľných pracovných dní a odošle ich naraz. Zatvorené, plné alebo už rezervované dni nie je možné znovu zvoliť." },
        { title: "Taxi podľa dňa", text: "Každý vybraný deň má vlastnú voľbu Bez taxi / Vyzdvihnúť za 5 € / Tam aj späť za 10 €. Voľba sa ukladá samostatne ku konkrétnej rezervácii." },
        { title: "Posledný vstup z permanentky", text: "Ak rezervácia použije posledný zostávajúci vstup, V94 hneď zobrazí okno s ponukou novej 10-vstupovej permanentky. Žiadosť je povolená až keď sú všetky zostávajúce vstupy aktuálnej permanentky už rezervované." },
        { title: "Permanentka", text: "Na obrazovke Rezervácie klient vidí stav aktívnej permanentky, použité/zostávajúce vstupy a platnosť, ak ju permanentka má. Vie poslať záujem o ďalšiu 10-vstupovú permanentku." },
        { title: "Kto príde do škôlky", text: "Pri rezervovanom dni sa zobrazuje roster ďalších psíkov; meno/fotka sa zobrazí iba podľa súhlasu, inak je pes anonymný ako Prihlásený škôlkar." },
        { title: "Správy", text: "Plávajúce chat tlačidlo na Môj psík otvorí konverzáciu v modale. Správa môže byť naviazaná na konkrétnu rezerváciu alebo vlastný predmet a nové správy sa prejavujú live." },
        { title: "Realtime a návrat z pozadia", text: "Rezervácie, správy, oznamy, zatvorené dni a permanentky sa synchronizujú cez Realtime/resync bez ručného reloadu. Návrat z pozadia bol produkčne testovaný." },
        { title: "Push notifikácie", text: "Zákazník môže povoliť upozornenia na rezervácie, správy a ďalšie udalosti. PWA používa Chvostíkovo branding a samostatný monochromatický badge podľa pravidiel Android/iOS." },
        { title: "Plynulé načítanie", text: "Pri samotnom spustení ostáva branded startup splash. Pri operáciách už v otvorenej appke V94 používa iba malý biely loading box s rotujúcou labkou namiesto celej bielej obrazovky." },
        { title: "Narodeniny a očkovania", text: "Majiteľ môže dostať osobný narodeninový oznam a upozornenia na blížiaci sa koniec platnosti očkovania." },
        { title: "GDPR, podmienky a zdieľanie", text: "Systém eviduje súhlasy, podmienky a dobrovoľné zdieľanie mena/fotky psa ostatným majiteľom prihláseným v rovnaký deň." },
        { title: "Izolovaný Preview", text: "Väčšie zmeny a cleanup sa už robia vo vetve customer-portal-preview napojenej na samostatný staging Supabase. Produkcia sa nemení, kým Preview neprejde regresným testom." }
      ]
    }
  },

  history: [
    { date: "20. 9. 2026", title: "LIVE / PREVIEW / STAGING oddelené", app: "System", text: "Customer produkcia zostala na customer-portal-production. Pre väčšie zmeny vznikla customer-portal-preview a samostatný Supabase staging bez produkčných klientskych dát a externých automatizácií." },
    { date: "20. 9. 2026", title: "Bezpečnostné spevnenie adminu", app: "Admin", text: "Admin login dostal povinný staff gate, verejná registrácia bola odstránená a produkčné databázové oprávnenia/RLS boli sprísnené bez otvorenia prístupu zákazníckym účtom." },
    { date: "20. 9. 2026", title: "Customer V89–V94", app: "Zákaznícka", text: "Dokončený dotykový foto editor, posun existujúcej fotky, taxi podľa jednotlivých dní, Žiacka knižka – Pripravujeme, spoľahlivé upozornenie na posledný vstup z permanentky a kompaktnejší loading počas operácií v appke." },
    { date: "20. 9. 2026", title: "Preview cleanup bez zásahu do LIVE", app: "Preview", text: "Začal sa konzervatívny audit zákazníckeho frontendu. Odstránili sa mŕtve a nefunkčné legacy vrstvy, runtime monkey-patche sa nahradili hookmi/renderer registry a veľkosť JS/CSS sa znížila bez úmyselnej zmeny funkčnosti." },
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
    { label: "Zdroj aktuálneho stavu", value: "LIVE produkcia + customer Preview + GitHub + Vercel + produkčný/staging Supabase" },
    { label: "Customer LIVE", value: "Vetva customer-portal-production. Aktuálne V94, commit cccccaa84f9036cf90c176886401c8c21a7eeda9, Vercel Production READY. Backend: produkčný Supabase tlhcqwsluyqpywymjoxn; customer-portal-api v20." },
    { label: "Customer PREVIEW", value: "Vetva customer-portal-preview. Aktuálne commit a4cae23683daebd94a5e5231dee7d4b8aaa49b94, Vercel Preview READY. Obsahuje cleanup aj synchronizovaný V94 fix." },
    { label: "Staging backend", value: "Supabase projekt jgzabminzgbfhsrgqedt. Bez produkčných klientskych dát; Google Calendar sync, cron a automatické produkčné push odosielanie sú vypnuté. Bella PREVIEW: 9/10." },
    { label: "Release pravidlo", value: "LIVE sa počas väčšieho vývoja nemení. Zmena ide najprv do Preview/stagingu, nasleduje regresný test na reálnom zariadení a až potom vedomé povýšenie do produkcie." },
    { label: "Preview cleanup", value: "app.js: 165 529 znakov LIVE vs. 146 725 PREVIEW. CSS Preview: 73 717 znakov. Priame runtime prepisovanie hlavných funkcií bolo odstránené; aktívne vrstvy používajú hooky/renderer registry." },
    { label: "Admin LIVE", value: "Admin frontend ostáva produkčný v Supabase snapshot/Edge Function architektúre. Login overuje aktívny staff účet ešte pred otvorením dashboardu; verejná registrácia admin účtu je odstránená." },
    { label: "Admin bezpečnosť", value: "RLS chráni interné dáta vrátane tržieb. Odobraté boli nepotrebné klientské DDL práva a verejný EXECUTE dvoch interných trigger funkcií. Customer frontend neobsahuje service-role key." },
    { label: "Realtime", value: "Supabase Realtime je nasadený pre admin aj zákaznícku PWA. Customer signalizácia používa autentifikované dáta/kanály a po návrate z pozadia sa robí resync." },
    { label: "Leaked password protection", value: "Supabase HaveIBeenPwned leaked-password kontrola je dostupná až na Pro. Free projekt ju nemá; klientské heslo má minimálne 8 znakov + malé/veľké písmeno + číslo. Pre admin účty má do budúcna väčší zmysel zvážiť MFA." },
    { label: "System", value: "Táto stránka je interný projektový prehľad. Je na GitHub main v priečinku system/ a nemení dáta klientov ani logiku admin/customer aplikácií." }
  ]
};