window.SYSTEM_DATA = {
  meta: {
    name: "Chvostíkovo System",
    updated: "13. 9. 2026",
    supabaseProject: "tlhcqwsluyqpywymjoxn",
    github: "chvostikovopsiaskolka/chvostikovo",
    note: "Funkčný stav podľa produkcie a aktuálnej databázovej schémy."
  },
  filters: [
    { id: "all", label: "Všetko" },
    { id: "customer", label: "Zákazník" },
    { id: "admin", label: "Admin" },
    { id: "notification", label: "Upozornenia" },
    { id: "legal", label: "Súhlasy" },
    { id: "technical", label: "Technika" }
  ],
  systems: [
    { name: "Admin APP", status: "production", statusLabel: "Produkcia", detail: "Vercel projekt chvostikovo-app. Interné riadenie psov, rezervácií, permanentiek, taxi, správ, oznamov a štatistík." },
    { name: "Zákaznícky portál / PWA", status: "production", statusLabel: "Produkcia", detail: "Vercel projekt chvostikovo-portal. Registrácia, priradený pes, rezervácie, Môj psík, správy, push, oznamy a súhlasy." },
    { name: "Supabase", status: "production", statusLabel: "Produkcia", detail: "Spoločná databáza a autentifikácia. Projekt tlhcqwsluyqpywymjoxn. Dokumentačná appka doň nezapisuje." }
  ],
  sections: [
    {
      id: "customer-journey",
      title: "Cesta zákazníka",
      description: "Od prvého otvorenia portálu až po plnohodnotné používanie účtu.",
      items: [
        { title: "PWA inštalácia", subtitle: "Android aj iPhone, s návodom pred prihlásením.", status: "production", statusLabel: "Produkcia", categories: ["customer","technical"], body: "Portál funguje ako PWA. Android manifest používa štvorcové ikony 192×192 a 512×512; po inštalácii používateľ zavrie Chrome a otvorí Chvostíkovo cez ikonu na ploche.", bullets: ["Web nevie automaticky prepnúť používateľa na domovskú obrazovku Androidu.", "Návod už nepoužíva text „Pokračovať na prihlásenie“.", "PWA je oddelená od interného admin rozhrania."], tags: ["manifest","Android","iOS","PWA"] },
        { title: "Registrácia zákazníka", subtitle: "Nový účet začína ako čakajúci.", status: "production", statusLabel: "Produkcia", categories: ["customer"], body: "Používateľ sa zaregistruje do zákazníckeho portálu. Profil má stav pending / active / suspended. Samotná registrácia ešte nedáva prístup ku konkrétnemu psovi.", bullets: ["Zákazník si sám nevytvára psa.", "Po registrácii nasleduje schválenie adminom."], tags: ["customer_profiles","Auth"] },
        { title: "Schválenie a priradenie psa", subtitle: "Admin priradí účet k existujúcemu majiteľovi a psovi.", status: "production", statusLabel: "Produkcia", categories: ["customer","admin"], body: "Po schválení sa účet prepojí s existujúcimi údajmi. Až potom zákazník vidí svojho priradeného psa a nadväzujúce povinnosti.", bullets: ["Priradenie je kontrolované adminom.", "Existujúci pes sa neduplikuje."], tags: ["customer_owner_links","owners","dogs"] },
        { title: "GDPR a Podmienky škôlky", subtitle: "Súhlasy sa zobrazujú až po priradení psa.", status: "testing", statusLabel: "Podmienky testujeme", categories: ["customer","legal"], body: "Podmienky škôlky sú viazané na konkrétneho používateľa a konkrétneho psa.", bullets: ["Aktuálna testovacia verzia: preview-2026-09-13.", "Testovací profil: Chvostíkovo, priradená Bella.", "Finálny text ešte nie je uzavretý, najmä bod o zodpovednosti.", "Admin nesmie potvrdiť Podmienky za zákazníka."], tags: ["GDPR","portal_terms_documents","portal_terms_acceptances"] }
      ]
    },
    {
      id: "customer-app",
      title: "Zákaznícky portál",
      description: "Funkcie, ktoré používa majiteľ psa po aktivácii účtu.",
      items: [
        { title: "Môj psík", subtitle: "Profil priradeného psa.", status: "production", statusLabel: "Produkcia", categories: ["customer"], body: "Sekcia združuje údaje psa a informácie používané počas starostlivosti a rezervácií.", bullets: ["Foto psa + editor fotografie.", "Očkovania.", "Permanentka a zostávajúce vstupy.", "Plánované rezervácie.", "GDPR a stav Podmienok škôlky."], tags: ["dogs","vaccinations","passes"] },
        { title: "Rezervácie", subtitle: "Žiadosť zákazníka → rozhodnutie admina → rezervácia.", status: "production", statusLabel: "Produkcia", categories: ["customer","admin"], body: "Zákazník vyberie deň a odošle žiadosť. Admin ju schváli alebo zamietne; schválenie vytvorí reálnu rezerváciu.", bullets: ["Deadline: nedeľa 20:00.", "Rýchly výber dátumu lupou.", "Zatvorené dni.", "Stavy requestu: pending, approved, rejected, cancelled, cancel_requested."], tags: ["customer_booking_requests","reservations","portal_day_settings"] },
        { title: "Taxi", subtitle: "Dva platené režimy dopravy.", status: "production", statusLabel: "Produkcia", categories: ["customer","admin"], body: "Taxi sa vyberá pri rezervácii a prenáša sa do rezervácie a návštevy.", bullets: ["Vyzdvihnúť / odvoz: 5 €.", "Vyzdvihnúť aj doviezť: 10 €.", "Podporovaná je aj žiadosť o zmenu taxi."], tags: ["taxi_mode","taxi_amount"] },
        { title: "Permanentka", subtitle: "Zákazníkovi ponúkame iba 10 vstupov.", status: "production", statusLabel: "Produkcia", categories: ["customer","admin"], body: "Zákaznícka permanentka má 10 vstupov za 200 € a platnosť 2 mesiace od prvého použitia.", bullets: ["10 vstupov = 200 €.", "Jednorazový vstup = 25 €.", "20-vstupová permanentka sa zákazníkovi neponúka."], tags: ["passes","200 €","25 €"] },
        { title: "Správy", subtitle: "Priama komunikácia majiteľ ↔ Chvostíkovo.", status: "production", statusLabel: "Produkcia", categories: ["customer","admin","notification"], body: "Zákaznícky účet má konverzáciu so správami zákazníka aj personálu; správy majú stav prečítania a môžu byť previazané s rezerváciou.", bullets: ["Admin vidí správy od majiteľov.", "Eviduje sa odosielateľ, rola, čas a read_at."], tags: ["portal_conversations","portal_messages"] },
        { title: "Oznamy v popup okne", subtitle: "Časovo platné oznamy pre zákazníkov.", status: "production", statusLabel: "Produkcia", categories: ["customer","admin","notification"], body: "Admin vytvára oznamy s platnosťou. Portál ich zobrazuje a eviduje, keď ich používateľ zavrie.", bullets: ["title, body, active, valid_from, valid_until.", "Dismissal sa eviduje pre konkrétneho používateľa."], tags: ["portal_announcements","portal_announcement_dismissals"] }
      ]
    },
    {
      id: "notifications",
      title: "Upozornenia a push",
      description: "Notifikačné centrum a push odbery zákazníkov aj admina.",
      items: [
        { title: "Notifikačné centrum portálu", subtitle: "Interné upozornenia a stav prečítania.", status: "production", statusLabel: "Produkcia", categories: ["customer","notification"], body: "Portál eviduje upozornenia pre konkrétneho používateľa a môže ich previazať na konkrétny objekt systému.", bullets: ["recipient_user_id určuje príjemcu.", "notification_type rozlišuje typ.", "read_at eviduje prečítanie.", "entity_type + entity_id umožňujú väzbu na obsah."], tags: ["portal_notifications"] },
        { title: "Push zákazníkov", subtitle: "Web Push odbery zákazníckej PWA.", status: "production", statusLabel: "Produkcia", categories: ["customer","notification","technical"], body: "PWA eviduje push subscription endpoint a kryptografické údaje zariadenia používateľa.", bullets: ["Viazané na user_id.", "Eviduje sa active, user_agent a last_seen_at.", "Používateľ môže mať viac zariadení."], tags: ["portal_push_subscriptions","Web Push"] },
        { title: "Push admina", subtitle: "Oddelené od zákazníckych odberov.", status: "production", statusLabel: "Produkcia", categories: ["admin","notification","technical"], body: "Interná admin appka má samostatnú evidenciu push subscription.", bullets: ["Zákaznícke a interné odbery sa nemiešajú."], tags: ["admin_push_subscriptions"] },
        { title: "Notifikačné udalosti", subtitle: "Rezervácie, správy, oznamy a ďalšie budúce typy.", status: "production", statusLabel: "Infraštruktúra aktívna", categories: ["customer","admin","notification"], body: "Pri ďalších úpravách treba v tomto prehľade držať aj presné znenia a spúšťače konkrétnych notifikácií.", bullets: ["Rozhodnutie o rezervácii.", "Nová správa.", "Dôležitý oznam.", "Ďalšie typy dopĺňať spolu s implementáciou."], tags: ["rezervácie","správy","oznamy"] }
      ]
    },
    {
      id: "admin-app",
      title: "Admin appka",
      description: "Interné obrazovky a prevádzkové funkcie Chvostíkova.",
      items: [
        { title: "Prehľad", subtitle: "Domovská prevádzková obrazovka.", status: "production", statusLabel: "Produkcia", categories: ["admin"], body: "Rýchly pohľad na aktuálnu prevádzku a nadväzujúce moduly.", bullets: ["Čakajúce rezervácie.", "Správy od majiteľov.", "Oznamy.", "Týždenný kontext."], tags: ["dashboard"] },
        { title: "Čakajúce rezervácie", subtitle: "Schváliť alebo zamietnuť.", status: "production", statusLabel: "Produkcia", categories: ["admin","customer"], body: "Admin spracuje customer_booking_requests a pri schválení sa request prepojí s reálnou rezerváciou.", bullets: ["Schváliť / Zamietnuť.", "Rozhodnutie má čas a používateľa.", "Podporované sú aj zrušenia a zmeny taxi."], tags: ["customer_booking_requests","reservations"] },
        { title: "Týždeň a zatvorené dni", subtitle: "Obsadenosť a dostupnosť dní.", status: "production", statusLabel: "Produkcia", categories: ["admin"], body: "Admin má týždenný prehľad a zatvorené dni ako rozbaľovaciu kartu.", bullets: ["Predvolená kapacita day settings je 8.", "bookings_open riadi dostupnosť.", "note vysvetľuje konkrétny deň."], tags: ["portal_day_settings","kapacita"] },
        { title: "Psy a detail psa", subtitle: "Centrálny profil psa, majiteľa, permanentky a súhlasov.", status: "production", statusLabel: "Produkcia", categories: ["admin","legal"], body: "Detail psa združuje prevádzkové údaje aj stav zákazníckych súhlasov.", bullets: ["Meno, plemeno, vek, pohlavie, kastrácia, hmotnosť.", "Alergie, povaha, poznámky, očkovania.", "Foto psa.", "Permanentka a plánované dni.", "Ochrana osobných údajov – potvrdené.", "Podmienky škôlky – odsúhlasené + dátum.", "Telefón majiteľa je normalizovaný pre SMS."], tags: ["dogs","owners","vaccinations","súhlasy"] },
        { title: "Permanentky", subtitle: "Aktívne, čakajúce, minuté a expirované.", status: "production", statusLabel: "Produkcia", categories: ["admin"], body: "Permanentky evidujú počet vstupov, použité vstupy, platnosť, cenu, nákup a stav.", bullets: ["Stavy: active, queued, used_up, expired, cancelled.", "Možnosť no_expiry pre výnimky.", "Rezervácia môže mať uzamknutú konkrétnu permanentku."], tags: ["passes","reservations"] },
        { title: "História návštev", subtitle: "Mesiac → týždeň → deň → psi.", status: "production", statusLabel: "Detailná od 24. 8. 2026", categories: ["admin"], body: "História používa reálne návštevy a uchováva typ vstupu, číslo vstupu permanentky, taxi a finančnú hodnotu.", bullets: ["Príklad: 10. 9. 2026 · 8 psov → Cory · 3/10, Bebe · Jednorazový…", "visit_date, entry_type a pass_entry_number tvoria detail návštevy."], tags: ["visits","monthly_visit_totals"] },
        { title: "Štatistiky a denné financie", subtitle: "Návštevnosť, typy vstupov a taxi.", status: "production", statusLabel: "Produkcia", categories: ["admin"], body: "Systém drží mesačné súčty návštev a denné finančné agregácie.", bullets: ["Mesačné návštevy po psovi.", "single_count, pass10_count, pass20_count a taxi_amount."], tags: ["monthly_visit_totals","daily_financials"] },
        { title: "Správy a oznamy", subtitle: "Interná obsluha komunikácie.", status: "production", statusLabel: "Produkcia", categories: ["admin","notification"], body: "Admin číta a odosiela správy a spravuje oznamy pre zákaznícku PWA.", bullets: ["Správy majú read_at.", "Oznamy môžu mať časovú platnosť."], tags: ["portal_messages","portal_announcements"] }
      ]
    },
    {
      id: "legal",
      title: "GDPR a Podmienky",
      description: "Čo sa eviduje ako potvrdenie a čo admin nesmie urobiť za zákazníka.",
      items: [
        { title: "Ochrana osobných údajov", subtitle: "Stav potvrdenia pri zákazníckom profile.", status: "production", statusLabel: "Produkcia", categories: ["legal","customer","admin"], body: "Profil eviduje verziu privacy notice a čas potvrdenia; admin má stav iba zobraziť.", bullets: ["privacy_notice_version", "privacy_notice_acknowledged_at"], tags: ["customer_profiles","GDPR"] },
        { title: "Dokument Podmienok škôlky", subtitle: "Verzovaný dokument s hashom.", status: "testing", statusLabel: "Testujeme", categories: ["legal","technical"], body: "Každá verzia je samostatný dokument s verziou, názvom, textom, SHA-256 hashom, active a effective_from.", bullets: ["Aktuálny test: preview-2026-09-13.", "Finálny právny text ešte nie je uzavretý."], tags: ["portal_terms_documents","SHA-256"] },
        { title: "Akceptácia Podmienok", subtitle: "Dôkaz súhlasu viazaný na používateľa a psa.", status: "testing", statusLabel: "Testujeme", categories: ["legal","customer","admin"], body: "Akceptácia eviduje user_id, dog_id, terms_version, serverový accepted_at, text akceptácie a hash dokumentu.", bullets: ["Súhlas patrí konkrétnemu používateľovi a psovi.", "Admin stav iba číta – nesmie ho vytvoriť za zákazníka."], tags: ["portal_terms_acceptances","serverový čas"] },
        { title: "Prevádzkovateľ pre GDPR", subtitle: "Údaje používané v právnych textoch.", status: "production", statusLabel: "Aktuálne údaje", categories: ["legal"], body: "Marek Leder – Bellaris, IČO 56447001. Miesto podnikania: Miškovecká 1023/2, 040 11 Košice-Juh. Prevádzkareň Chvostíkovo: Poľská 2207/6, 040 01 Košice-Juh.", bullets: ["Živnostenský register: Okresný úrad Košice, č. 820-106266.", "E-mail: chvostikovo.psiaskolka@gmail.com.", "Telefón: +421 951 069 395."], tags: ["prevádzkovateľ"] }
      ]
    },
    {
      id: "technical",
      title: "Technická mapa",
      description: "Hlavné dátové celky a hranice medzi produkčnými systémami.",
      items: [
        { title: "Architektúra", subtitle: "Dve produkčné appky + spoločný Supabase + táto dokumentácia.", status: "production", statusLabel: "Aktuálne", categories: ["technical"], body: "Admin a zákaznícky portál sú samostatné Vercel projekty. Spoločné dáta a autentifikácia sú v Supabase. Chvostíkovo System je informačná vrstva bez zápisu do produkčných dát.", bullets: ["chvostikovo-app = admin.", "chvostikovo-portal = zákaznícky portál / PWA.", "Supabase = tlhcqwsluyqpywymjoxn."], tags: ["Vercel","Supabase","GitHub"] },
        { title: "Kľúčové tabuľky – prevádzka", subtitle: "Majitelia, psy, rezervácie, návštevy a permanentky.", status: "production", statusLabel: "Produkcia", categories: ["technical","admin"], body: "Jadro prevádzky tvorí sada RLS tabuliek pre majiteľov a psy, rezervácie, návštevy, permanentky a financie.", bullets: ["owners", "dogs", "passes", "reservations", "visits", "monthly_visit_totals", "daily_financials", "vaccinations"], tags: ["RLS","Postgres"] },
        { title: "Kľúčové tabuľky – portál", subtitle: "Účty, requesty, správy, push, oznamy a súhlasy.", status: "production", statusLabel: "Produkcia", categories: ["technical","customer"], body: "Zákaznícka vrstva oddeľuje používateľský účet od interných dát a používa vlastné request / notification tabuľky.", bullets: ["customer_profiles", "customer_owner_links", "customer_booking_requests", "portal_notifications", "portal_push_subscriptions", "portal_conversations", "portal_messages", "portal_announcements", "portal_day_settings", "portal_terms_documents", "portal_terms_acceptances"], tags: ["RLS","Auth"] },
        { title: "Zálohy frontendu portálu", subtitle: "Snapshot / backup tabuľky vyžadujú bezpečnostnú kontrolu.", status: "attention", statusLabel: "Pozor na RLS", categories: ["technical"], body: "Pri kontrole 13. 9. 2026 mali customer_portal_frontend_snapshots a customer_portal_frontend_backups vypnuté RLS.", bullets: ["Teraz do nich nič nemeníme.", "Pred zapnutím RLS treba pripraviť správne policies, aby sa nerozbila cesta nasadenia / záloh."], tags: ["customer_portal_frontend_snapshots","customer_portal_frontend_backups","RLS"] }
      ]
    },
    {
      id: "rules",
      title: "Prevádzkové pravidlá",
      description: "Hodnoty, ktoré ovplyvňujú funkčné správanie oboch appiek.",
      items: [
        { title: "Cenník a permanentky", subtitle: "Zákaznícka ponuka.", status: "production", statusLabel: "Platné", categories: ["customer","admin"], body: "Zákaznícky portál pracuje s jednorazovým vstupom a 10-vstupovou permanentkou.", bullets: ["Jednorazový vstup: 25 €.", "10 vstupov: 200 €.", "Platnosť: 2 mesiace od prvého použitia.", "20-vstupová permanentka sa zákazníkovi neponúka."], tags: ["cenník"] },
        { title: "Taxi", subtitle: "Dva zákaznícke režimy.", status: "production", statusLabel: "Platné", categories: ["customer","admin"], body: "Taxi sa vyberá pri rezervácii a suma sa eviduje spolu s rezerváciou / návštevou.", bullets: ["Vyzdvihnúť / odvoz: 5 €.", "Vyzdvihnúť aj doviezť: 10 €."], tags: ["taxi"] },
        { title: "Deadline rezervácií", subtitle: "Nedeľa o 20:00.", status: "production", statusLabel: "Platné", categories: ["customer","admin"], body: "Rezervačný flow musí rešpektovať deadline v nedeľu o 20:00.", bullets: ["Pri zmenách kalendára alebo rezervácií toto pravidlo nerozbiť."], tags: ["nedeľa 20:00"] }
      ]
    }
  ]
};
