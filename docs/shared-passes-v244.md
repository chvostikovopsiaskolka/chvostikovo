# V-029 / V-030 – implementácia v245 v stave TEST

**15.10.2026: DRAFT, NENASADENÉ. Toto nie je dokončený produkčný release.**

Pracovný zákaznícky build je Beta 1.0.87 / `20261015-shared-passes-v245`. Nová funkcionalita je predvolene vypnutá a zákazník ju uvidí až po odpovedi `portal_shared_capabilities_v244` s povolenou funkciou. Existujúci PR #37 nebol zlúčený; prevzatý bol jeho izolovaný dvojpsíkový prehľad a klik na pôvodné všeobecné údaje konkrétneho psa.

## Overený východiskový stav

- GitHub: `chvostikovopsiaskolka/chvostikovo`, customer vetva `customer-portal-production`, SHA `829a710220c1582ea87d2d4e025ee661fa761321`, Beta 1.0.85/v243.
- Vercel: `chvostikovo-portal`, production `dpl_3NxLk3qANkRUQzPX4pmywnVWZDbe`, READY.
- Supabase: `tlhcqwsluyqpywymjoxn`, PostgreSQL 17, ACTIVE_HEALTHY. Customer API v54, admin-push v25.
- Admin: `frontend_snapshots.stable-v10-clean`, md5 `ad0e44ab84c454b75b747b3f08da254d`, 693086 znakov.
- Web main: `02e1fe6b2e63ddef900a2315fc225702e775d54a`; `Forms.tsx` obsahuje výber 1/2 psov a samostatné údaje druhého psa. Edge `web-form-submit` v25 obsahuje dvojpsíkový intake. Web sa v tejto zmene neupravuje; reálne odoslanie a konverzia webovej prihlášky sa tu netestovali.
- V aktuálnych nákupných a dochádzkových funkciách sú ceny 200 €/10 a 320 €/20. Obe štandardné permanentky začínajú prvým využitím a funkcie používajú interval 2 mesiace; existuje samostatné `no_expiry`. Toto je overenie implementácie, nie nové rozhodnutie o obchodných podmienkach.
- Rezervácie sa uzatvárajú v nedeľu o 20:00; zákaznícke storno má samostatnú hranicu D−1 21:00. Automatické uzatvorenie dochádzky a následné „Pes neprišiel“ s vrátením vstupu sú existujúce pravidlá. Tieto pravidlá sa nezjednocujú ani nemenia.

Záverečná kontrola zachytila súbežný LIVE release v244: `03e1102bc727dbe65720f6f295b2b30c0bd759ef`, Beta 1.0.86 / `20261015-vaccination-photos-v244`, Vercel `dpl_e9nBydhMBEK4gApxv2oBFUaJgcNE` READY, Customer API v55. Pracovná vetva bola na tento commit preložená; nová úprava fotografií očkovania zostala zachovaná. Dotknuté pôvodné DB funkcie boli opätovne načítané a ich definície sa oproti vstupu nezmenili. Admin md5 zostal rovnaký. Interné SQL/JS identifikátory tejto práce naďalej používajú príponu v244; zákaznícky kandidát je v245.

## Implementované v pracovnej vetve

A. Jedna pôvodná položka `passes` je jeden predaj. Explicitná tabuľka `pass_dogs` oprávňuje dvojicu existujúcich psov používať jeden zostatok. Pôvodné individuálne permanentky fungujú bez prepisu histórie. Spoločný plán zahŕňa skutočné využitia, schválené rezervácie, čakajúce žiadosti, individuálne permy aj spoločnú plánovanú novú permanentku. Čerpanie je dohľadateľné cez `pass_id`, `dog_id`, rezerváciu, návštevu a číslo vstupu; zmeny sa auditujú.

B. Účet dostáva explicitné oprávnenia ku konkrétnym psom cez `customer_owner_links.allowed_dog_ids`. Existujúce NULL väzby zachovávajú doterajší prístup. Pri novom priradení vzniká iba výslovne vybraný pes. Personál potvrdzuje úvodnú návštevu, skutočného majiteľa a poznámku k overeniu. Dvojpsíková otázka sa zobrazí len pri dvoch registračných menách. Odmietnutie druhého zachová jedného; dodatočné priradenie je samostatné. Rovnaký pes môže mať viacerých majiteľov.

C. Registrácia rozpozná jedno/dve mená, vyžiada potvrdenie dvojice a uloží `dog_names`/`dog_count`, profilové pole a samostatné žiadosti psov. Nevytvára psy ani vlastnícke väzby. Zákaznícka karta zobrazuje dve fotky a používa pôvodný editor údajov. Rezervácia umožňuje jedného/oboch; pred odoslaním ukáže pri každom psovi čerpanie alebo jednorazový vstup a oddelené taxi. Server znovu porovná plán pod zámkami. Zmena zostatku vyžaduje nové potvrdenie. Opakovanie rovnakej operácie nevytvára ďalšie rezervácie ani ďalší záujem o permanentku.

D. Schválenie dvojice v jednom dni je transakčné; zrušený pes sa nepridáva späť a zostávajúca rezervácia sa dá schváliť samostatne. Admin-push kód pripravuje spoločnú správu s menami psov a jednu správu o spoločnom záujme. Skutočné doručenie sa netestovalo.

Admin sa naďalej nasadzuje **iba Supabase snapshotom**. `admin/shared-admin-v244.js` je zdroj doplnku; `tools/build-admin-shared.cjs` vyžaduje presný pôvodný md5 a pripraví kandidáta snapshotu. Nejde o zmenu deploy cesty ani o obnovenie vyradeného Chvostíkovo System.

## Overenia

Spustenie z koreňa repozitára:

```bash
npm ci --prefix tests/shared-v244
npm test --prefix tests/shared-v244
NODE_PATH=tests/shared-v244/node_modules node tests/customer-second-owner-v162.cjs
NODE_PATH=tests/shared-v244/node_modules node tests/customer-registration-audit-v143.cjs
```

PASS:

- kompletné SQL migrácie sa skompilovalo proti metadátam 70 aktuálnych tabuliek; release zostal vypnutý;
- celé zákaznícke HTML/poradie skriptov sa inicializovalo v DOM teste bez runtime chyby;
- počítanie 4/10, 8/10, 9/10, 10/10, 18/20, 19/20, 20/20;
- budúce rezervácie, nedostatok vstupov, výslovný posledný vstup + jednorazová návšteva;
- opakovanie operácie, strata odpovede po úspešnom zápise, odmietnutie zastaraného potvrdenia;
- očkovanie jedného psa blokuje celú dvojicu; kapacita 1 neumožní dvojicu ani čiastočný zápis;
- dve návštevy/dve čerpania/jedna permanentka, opakované uzavretie dochádzky a neúčasť bez dvojitého vrátenia;
- jedna spoločná 20-vstupová žiadosť a jeden nákup aj po opakovanom schválení; queued permanentka bez predčasného začiatku platnosti;
- storno Belly zachová Ariu a prepočíta posledný vstup; zostávajúcu Ariu možno schváliť;
- nový profil 1/2 mená vytvorí samostatné žiadosti, žiadne psy ani owner links;
- zákazník/anon nesmú meniť členstvo permanentky; cudzí pes je odmietnutý;
- DOM admin testy „Nie, iba jedného“, registrácia jedného bez otázky a explicitné priradenie druhého;
- regresné testy druhého majiteľa a existujúcej registrácie/fotiek; starý test dostal potrebné aktuálne registračné a v234 fixture závislosti;
- JS/TS syntaktické overenie a kontrola diff whitespace.

**Rozsah dôkazov:** PGlite + JSDOM, izolované syntetické účty. SQL/DOM test nie je fyzický iPhone, Android, render prehliadača, produkčné Supabase Auth/RLS/PostgREST E2E ani test dvoch nezávislých PostgreSQL relácií.

## Otvorené podmienky pred nasadením

1. Overiť celý tok v izolovanom Supabase prostredí s reálnym Auth, PostgREST, RLS a dvoma súbežnými spojeniami. Lokálne natívne PostgreSQL nebolo možné spustiť pod dostupným používateľom; PGlite nepotvrdzuje správanie advisory zámkov medzi nezávislými spojeniami.
2. Vizuálny desktop + iPhone + Android test vrátane scrollu, klávesnice, safe-area, preukazov, prepínania psov a offline aktualizácie PWA. Cloudový prehliadač odmietol lokálny server (`ERR_CONNECTION_REFUSED`); Chromium download vracal poškodený/prázdny archív. Žiadny úspešný screenshotový E2E sa neprehlasuje.
3. Fyzicky overiť skupinové push, storno/taxi notifikácie, očkovacie pripomienky a druhého majiteľa s prístupom iba k jednému psovi zo spoločnej permy.
4. Overiť finančný report celým admin UI, historické uzamknuté rezervácie, presuny vlastníctva psov a platnosť pri spätne uzatváraných dňoch. Tieto širšie regresné scenáre nie sú uzavreté.
5. Bezpečne naplánovať kompatibilné poradie DB/Edge/admin/PWA. Počas výmeny pôvodného owner-wide API za explicitné oprávnenia nesmie starý API proces sprístupniť druhého psa. Nepovažovať jednoduché „DB najprv“ za postačujúce overenie tohto prechodu.

Kým sa tieto body neuzavrú, release flag sa nezapína a PR sa nezlučuje do produkcie. Celý cieľ používateľa zostáva **nedokončený**.

## Zálohy a rollback

Aktuálna vytvorená GitHub záloha: `backup-customer-before-shared-passes-current-20261015` na SHA `03e1102bc727dbe65720f6f295b2b30c0bd759ef`. Pôvodná vstupná záloha: `backup-customer-before-shared-passes-20261015` na SHA `829a710220c1582ea87d2d4e025ee661fa761321`. Pôvodné databázové definície bez dát sú verzované v `supabase/backups/shared-v243-functions.json`.

**Zatiaľ nevykonané v LIVE:** `shared-backup-before-v244.sql` (guarded admin snapshot + privátne zálohy funkcií), migrácia v245 a oba Edge deploye. Nevytvorená DB/admin záloha sa nesmie označiť za existujúcu iba preto, že je pripravený skript.

Pred prípadným nasadením znovu prečítať produkčný SHA, md5 adminu a Edge verzie; pri zmene zastaviť a prepočítať diff. Až potom vykonať a readbackom overiť zálohovací skript.

Operačný rollback: `shared-disable-v244.sql`, návrat zákazníckej vetvy/deploymentu na aktuálnu zálohu `03e1102bc727dbe65720f6f295b2b30c0bd759ef`; spoločné účtovanie a audit sa ponechajú pre už vzniknuté spoločné predaje. Zálohovaný admin sa obnoví len ak reálne existuje. `shared-restore-functions-no-data-v244.sql` odmietne návrat na staré funkcie, ak už existujú spoločné alebo nové registračné dáta. Žiadne slepé mazanie predajov, návštev ani čerpaní.
