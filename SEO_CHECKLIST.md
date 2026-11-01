# SEO checklist pre Chvostíkovo a ďalšie weby

Tento checklist používame ako praktický štandard pri tvorbe a rozširovaní webov. Neobsahuje SEO úpravy, ktoré sa robia iba „pre audit“, ale veci s reálnym významom pre indexáciu, organickú návštevnosť, používateľskú skúsenosť a konverzie.

## Hodnotenie SEO stavu X/10 (kontrolný scorecard)

Hodnotenie sa udeľuje **konkrétnemu webu ku konkrétnemu dátumu**, nie abstraktnému checklistu. Každé z nasledujúcich 10 kritérií má váhu **1 bod**: **PASS = 1**, **PARTIAL = 0,5**, **FAIL = 0**, **NEOVERENÉ = 0** do času získania dôkazu. Vždy uviesť dôkaz, zdroj, dátum a otvorený krok. Nevymýšľať si Google Lighthouse/PageSpeed ani GSC pozície a nezamieňať CI/deploy úspech za LIVE HTTP overenie.

| # | Kritérium (max. 1 bod) | Overenie |
| --- | --- | --- |
| 1 | Dopyty a reálny search intent | GSC queries, stránky, lokalita, zámer |
| 2 | Title, meta description, H1 | Unikátne tagy pre dôležité URL, ideálne prvotný HTML |
| 3 | Obsah a vhodné CTA | Relevantnosť, pravdivé služby, formulár, dôvera |
| 4 | Indexovateľnosť a sitemap/prerender | HTML/HTTP, robots, sitemap, predvykreslené business routes |
| 5 | Canonical, redirecty a jazykové alternatívy | URL varianty, Google-selected canonical, SK/EN |
| 6 | Interné prepojenie | Logické kontextové odkazy, bez nefunkčných ciest |
| 7 | Local SEO a štruktúrované údaje | Lokálna adresa/hodiny, GBP, schema |
| 8 | Meranie SEO výsledkov | Aktuálny GSC export, rozlíšené first-party eventy a leady |
| 9 | Mobilná UX a Core Web Vitals | Fyzický mobil + PSI/CrUX: LCP, INP, CLS |
| 10 | LIVE verifikácia a regresné testy | Prvotný HTML/HTTP, end-to-end formulár, desktop/iOS/Android podľa dostupnosti |

**Aktuálny príklad Chvostíkovo – 29.10.2026:** pred FAQ opravou audit evidoval **6,5/10**: kritériá 1, 2, 3, 6, 7, 8 = 6 bodov; kritérium 5 = 0,5; kritérium 4 = 0 (FAQ chýba v sitemap a prerender konfigurácii); kritériá 9 a 10 = 0 (nezávislé meranie / LIVE test nedostupné). Po tejto izolovanej oprave možno dať **7/10 až po úspešnom CI build+SEO teste** (kritérium 4 = 0,5, kým nie je potvrdený HTTP/HTML LIVE). Toto nie je hodnotenie 10/10 po deployi. Rozpis, dôkazy a otvorené úlohy sú v súkromnom Bellaris SEO audite Chvostíkova. Pri ďalšom webe vyplň scorecard nanovo.

## 1. Search intent a štruktúra webu

- Pred vytvorením stránky určiť, aký dopyt a zámer má pokrývať.
- Jeden hlavný search intent = jedna hlavná URL.
- Nevytvárať viac stránok, ktoré sú prakticky o tom istom a súťažia o rovnaké dopyty.
- Pri existujúcom webe kontrolovať keyword cannibalization v Google Search Console podľa dopytu a záložky Strany.
- Slabé alebo výrazne sa prekrývajúce stránky radšej zlúčiť než vyrábať ďalšie podobné URL.

## 2. Obsah každej indexovateľnej stránky

- Jedinečný a výstižný title.
- Jedinečný meta description.
- Jeden jasný H1.
- Logická hierarchia H2/H3.
- Originálny obsah, ktorý reálne odpovedá na zámer návštevníka.
- Prirodzené použitie hlavnej témy a súvisiacich výrazov; žiadne keyword stuffing.
- Jasná CTA tam, kde má stránka obchodný účel.
- Pri odbornom/informačnom obsahu uvádzať autora alebo odborné pozadie vtedy, keď to zvyšuje dôveryhodnosť.

## 3. Technické SEO

- Čistá a popisná URL.
- Self-referencing canonical na indexovateľných stránkach.
- `noindex` na stránkach bez SEO hodnoty, ak ich nechceme vo výsledkoch vyhľadávania.
- Funkčný `robots.txt`.
- Aktuálna `sitemap.xml` iba s URL, ktoré chceme indexovať.
- Dôležitý obsah dostupný Googlu v HTML; pri JS aplikáciách používať SSR/prerender, keď je to možné.
- Správne `lang` atribúty a pri jazykových verziách `hreflang`.
- Žiadne broken links alebo zbytočné 404.

## 4. Structured data

Používať iba schema, ktorá zodpovedá reálnemu obsahu stránky.

- LocalBusiness / Organization pre firmu.
- Service pre konkrétne služby.
- FAQPage len tam, kde je FAQ reálne viditeľné používateľovi a dáva zmysel.
- Product, Article, Event atď. iba pri relevantnom type obsahu.
- Nepridávať schema len preto, aby jej bolo čo najviac.

## 5. Interné prelinkovanie

- Každá dôležitá stránka musí mať aspoň jeden relevantný interný odkaz.
- Žiadne orphan pages.
- Najdôležitejšie stránky linkovať aj kontextovo z textu, nielen zo sitemap alebo footeru.
- Anchor text má prirodzene opisovať cieľovú stránku.
- Nové obsahové stránky vzájomne prepájať podľa témy.

## 6. Obrázky, video a Core Web Vitals

- Hero/LCP obrázok načítať s vysokou prioritou.
- Obrázky pod prvou obrazovkou používať s lazy loadingom.
- Používať správne rozmery a podľa možností WebP/AVIF.
- Každý významový obrázok má popisný `alt`.
- Dekoratívne obrázky nemajú byť nasilu optimalizované na keywords.
- Nezaťažovať prvé načítanie zbytočným videom, skriptami alebo obrázkami mimo viewportu.
- Pravidelne kontrolovať Core Web Vitals hlavne na mobile: LCP, INP, CLS.

## 7. Mobile first

- Mobil je plnohodnotná verzia webu, nie zmenšený desktop.
- Čitateľný text bez zoomovania.
- Tlačidlá a formuláre sa dajú pohodlne používať dotykom.
- Bez horizontálneho scrollovania a prekrývania prvkov.
- Dôležitý obsah a CTA nesmú byť na mobile skryté.

## 8. Dôveryhodnosť a E-E-A-T signály

- Jasne uviesť, kto za firmou/projektom stojí.
- Kontaktné údaje, adresa a identita prevádzkovateľa musia byť konzistentné.
- Reálne recenzie, skúsenosti, referencie, partneri a certifikáty tam, kde sú relevantné.
- Pri odborných témach ukázať zdroj skúseností alebo odbornosť autora.
- Nevytvárať umelé „author bio“ bloky na každej predajnej stránke len kvôli SEO.

## 9. Po spustení

### Google Search Console
- skontrolovať indexáciu,
- odoslať sitemap,
- pri novej dôležitej URL raz požiadať o indexovanie,
- sledovať dopyty, impressions, kliknutia, CTR a priemernú pozíciu,
- pri podozrení na cannibalization pozrieť, ktoré URL sa zobrazujú na rovnaký dopyt.

### Analytics
- sledovať organic traffic,
- landing pages,
- formuláre/leady a ich zdroj,
- konverzie z organického vyhľadávania.

## 10. Rozvoj SEO podľa dát

- Nové stránky vytvárať podľa reálnych dát, nie podľa počtu možných keywords.
- Priorita sú dopyty, ktoré už majú impressions a web je približne na pozícii 4–20.
- Najprv zlepšiť existujúcu relevantnú stránku; novú URL vytvárať iba pri odlišnom search intente.
- Pri lokálnom webe sledovať aj Google Business Profile.

## 11. Backlinky a autorita

- Uprednostniť relevantné a reálne odkazy pred množstvom nekvalitných linkov.
- Partneri, lokálne weby, odborné zdroje, katalógy s reálnym významom, PR a tematické spolupráce.
- Nekupovať náhodné balíky backlinkov.

## Veci, ktoré nie sú samostatným cieľom

- Title nemusí mať presne 50–60 znakov; dôležitejšia je zrozumiteľnosť a relevantnosť.
- Breadcrumbs pridávať hlavne pri hlbšej štruktúre webu, nie nasilu na malom webe.
- Keyword density nie je cieľ.
- Viac schema markup neznamená automaticky lepšie SEO.
- Viac stránok neznamená automaticky viac organickej návštevnosti.

## Chvostíkovo – aktuálne hlavné SEO témy

- Homepage: primárne `psia škôlka Košice`.
- `/strazenie-psov-kosice`: primárne `stráženie psov Košice` a súvisiace denné stráženie.
- `/psia-skolka-pre-steniatka`: informačný + komerčný intent pre škôlku pre šteniatka.
- `/en/dog-daycare-kosice`: anglické dopyty typu dog daycare / dog sitting / pet sitting Košice, bez predstierania overnight boarding služby.
- Budúca stránka o socializácii: informačný search intent, nie ďalšia kópia predajnej landing page.


## 12. Prevádzkový audit Bellaris — jednotný vykonávací checklist (29.10.2026)

Toto je **kontrolný postup**, nie tvrdenie, že každý bod webu Chvostíkova prešiel LIVE testom. Použi ho spolu s klientskym briefom a bezpečnostným/release checklistom. Kanonická súkromná metodika a klientsky výstup: Bellaris Workspace → `05-Sablony/07-SEO-a-organicke-vyhladavanie.md`. Interné údaje a výsledky o zákazníkoch neukladať do verejného repozitára.

### Záznam auditu (povinné polia)

- Projekt, produkčná doména, hlavná lokalita / pôsobnosť, dátum, auditor, aktuálna vetva/commit, deploy URL, existujúci rollback.
- Pre každý bod eviduj **stav** `PASS / FAIL / PARTIAL / N/A / UNVERIFIED`, **dôkaz** `LIVE HTTP / GSC / GA4 / GBP / Supabase agregát / zdrojový kód / screenshot`, dátum kontroly, prioritu `P0/P1/P2`, vlastníka a ďalší krok.
- `PASS v kóde` nie je `LIVE PASS`. `UNVERIFIED` sa nepočíta ako úspech. Neuvádzať skóre, ak vysokoprioritné body nemajú dôkaz.

### Pred obsahovou prácou — klient, publikum a zámer

- [ ] Zadefinovaná služba, klient, oblasť pôsobenia, vylúčené služby, prevádzkové podmienky a primárna konverzia.
- [ ] Zozbierané existujúce domény, URL, vlastníctvo GSC/GA4/GBP, prístupy cez roly, historické indexované URL a možné migrácie.
- [ ] Prieskum reálnych otázok zákazníkov, odporúčaní Google Search Console, Search Results a Keyword Planneru, bez vymyslených mesačných objemov.
- [ ] Mapa `dopyt → intent → cieľová URL → hlavné CTA → meraný výsledok`, oddelený brand/non-brand a lokálne/celoslovenské dopyty.
- [ ] Konkurenčné stránky a rozdiely v službách preverené k dátumu; nevyrábať desiatky mestských kópií alebo duplicitných landing pages.

### Technická brána indexácie — vyžaduje LIVE dôkaz

- [ ] DNS/HTTPS, 200 na kanonickej URL, redirect HTTP→HTTPS a host variácií bez slučiek, pravdivé 404/410, žiadne soft-404.
- [ ] Každá predajná stránka skutočne v build/prerender zozname, má HTML s vlastným title, description, H1 a obsahom **pred spustením JS**; 404 SPA fallback nie je dôkaz prerenderu.
- [ ] `robots.txt` nezakazuje dôležité URL a správne odkazuje na sitemap, ktorá vracia 200 a parsovateľné XML.
- [ ] Sitemap obsahuje presne požadované indexovateľné canonical URL, neobsahuje súkromné/preview/košík či neexistujúce varianty; `lastmod` iba skutočná zmena obsahu.
- [ ] Self-canonical a skutočná finálna URL sa zhodujú (vrátane lomky, jazykovej verzie a redirects), žiadne konfliktné `noindex` alebo HTTP hlavičky.
- [ ] Všetky SK/EN alternatívy používajú vzájomné `hreflang` a správny `lang`; sú to obsahovo zodpovedajúce stránky, nie nútené preklady.
- [ ] Žiadne dôležité orphan pages, prerušené interné odkazy, cykly, zlé kotvy alebo zablokované obrázky a JS.
- [ ] Google Search Console: overená doména, sitemap stav, URL Inspection a indexácia jednotlivých cieľových URL; exportovať chybové kategórie bez publikovania interných údajov.

### Obsah / dôvera / lokálna relevantnosť

- [ ] Každá relevantná URL má unikátny search intent, prirodzené kľúčové témy, výstižný title/description, logické nadpisy, odpoveď na cenu/proces/podmienky.
- [ ] CTA a formulár skutočne fungujú aj na iOS/Android, vrátane autofill, chýb a server confirmation; nejde iba o kliknutie.
- [ ] Reálne fotky, licencie, alt, veľkosti a prístupnosť; recenzie sú autentické a presné k dátumu.
- [ ] Právne/prevádzkové kontakty, adresa, hodiny, služba a cena sa zhodujú medzi webom a Google Business Profile; link na správne mapy.
- [ ] Schema.org typy `LocalBusiness/Service/Organization/Product` iba k skutočnému obsahu. Validovať Rich Results a Schema validator; FAQ markup nezaručuje Google rich result.
- [ ] Služby a oblasť pôsobenia pravdivé. Lokálna služba sa neoptimalizuje na celoslovenský predaj, pokiaľ ho reálne neposkytuje.
- [ ] Odpovede na otázky klientov zrozumiteľné aj pre AI vyhľadávanie; citovateľné originálne skúsenosti a jasná identita, bez fiktívnych hodnotení alebo AI generovaného keyword spamu.

### Výkon, mobil a prístupnosť

- [ ] Mobile-first render 320–430 px, dotyk, kontrast, formuláre, safe areas, bez CLS spôsobeného fotografiami/animáciami.
- [ ] Google PageSpeed Insights + merania CrUX/GSC tam, kde existujú: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 na 75. percentile; oddeliť lab a field výsledky.
- [ ] Hero obrázok nemá zbytočný lazy loading, má správny rozmer/prioritu; obrázky mimo viewportu lazy; JS/video/fonty nezdržiavajú kritický obsah.
- [ ] Základné a11y: keyboard/focus, alt, nadpisy, labely, error messaging a reduced-motion.

### Meranie a SEO → biznis

- [ ] Zvlášť merať Search Console impressions/kliknutia/CTR/pozíciu, interné landings, reálny form submit, CRM kvalifikáciu a klienta.
- [ ] `google_organic` klasifikácia nie je ekvivalent všetkých výsledkov GSC; nespočítavať PageView + interné prechody ako nových používateľov.
- [ ] Normalizovať `/cesta`, `/cesta/`, fragmenty, query a UTM do reportov podľa definovaného kontraktu bez mazania historických raw udalostí.
- [ ] Consent a právny základ GA4/Pixel/cookieless zodpovedajú skutočnému nasadeniu; testy a recovery leady nie sú produkčné konverzie.
- [ ] **GA4/GTM pred každou úpravou CTA, formulára alebo trackingu:** overiť aktuálny produkčný commit, použitý GA4 measurement ID, samostatne publikovanú GTM verziu a jej *skutočné* tagy/triggery. Dátum prázdneho GTM kontajnera nie je dôvod na pridanie druhého GA4 tagu. Skontrolovať zdroj eventu v kóde aj v GA4, prípadné rozšírené meranie formulárov a duplicity; nič automaticky nepublikovať.
- [ ] **Zdroj návštevy ≠ názov tlačidla:** externé `utm_source`/`utm_medium` a referrer zachovať oddelene od interného `cta_source`. Pri zmene mobilnej navigácie alebo CTA cez povolený analytický súhlas otestovať `Network → collect?v=2 → Payload`: `en=view_pricing` (alebo skutočná udalosť), `ep.cta_source` má názov CTA, `ep.source` NESMIE niesť názov CTA. Screenshot aktuálnej požiadavky má vyššiu dôkazovú váhu pre aktuálny *payload* než starší agregovaný akvizičný report; nevysvetlené GA4 `session source/medium` riadky ostať [NA OVERENIE].
- [ ] **Konverzie a kvalita údajov:** po úspešnom server confirmation iba jedna správna `generate_lead` (záujem) alebo `application_submit` (prihláška); `form_start`, `form_attempt`, `form_error`, `form_submit`, GA4 key events, CRM záznamy a sessions nie sú zameniteľné. Porovnať identické dni a časové pásma; odlíšiť vlastné/test/QA podania, zlyhania HTTP/validácie, opakované pokusy a consent. Nespravovať historické GA4 čísla ako spätne prepočítateľné ani nevytvárať ostré falošné leady kvôli testu.
- [ ] Baseline 28 dní (ak dostupné), porovnanie 7/28/90 dní a podľa URL/kanálu/zariadenia; report uvádza výluky, dátum pokrytia a chýbajúce zdroje.
- [ ] Prioritizovať: P0 indexovateľnosť a súkromie; P1 relevantnosť/konverzia; P2 obsahové rozšírenie/backlinky. Zmeny testovať izolovane, bez falošných sľubov poradia.

### Migrácia, release, odovzdanie

- [ ] Pred migráciou export aktuálnych URL, GSC, sitemap, canonical, redirects, merania a formulárov; 301 mapovanie každá dôležitá stará URL → najbližší relevantný obsah.
- [ ] Staging nie je indexovaný; zachovať doménu a vlastníctvo účtov klienta, rollback, schema, UTM a formulárové eventy.
- [ ] Git diff → test statického HTML, routes, sitemap, JSON-LD, mobil/EN, formulár → kontrolovaný deploy → LIVE HTTP/HTML/CTA/GSC kontrola → wiki release + rollback.
- [ ] Výstup je auditný report `PASS/FAIL/UNVERIFIED`, prioritný backlog a dátum ďalšej kontroly. Odovzdať klientovi len jeho dáta.

### Chvostíkovo: konkrétny technický regresný kontrakt

- Verejná route `/psia-skolka-kosice` musí byť súčasne v `vite.config.pages.ts`, `public/sitemap.xml` a finálnom statickom HTML; normalizácia URL je v `scripts/finalize-pages.mjs`.
- Po `bun run build:pages` vykonaj `node scripts/check-seo-indexability.cjs`. Chybové hlásenie nesmie byť ignorované pred merge/deploy.
- **Referenčné overenie 01.11.2026:** pri inkognito teste mobilného Cenníka bolo používateľom potvrdené `en=view_pricing`, `ep.cta_source=mobile_dock_lead_lead-pricing`, bez problémového `ep.source`; aktuálny webový kód `src/lib/analytics.ts` oddeľuje `cta_source` od Meta payloadu. GTM `GTM-WDMHSCZD` má podľa používateľa publikovaný prázdny kontajner (12.10.2024), GA4 `G-0VM48RXZV9` je načítaný priamo. Staré/nejasné riadky GA4 session akvizície neoznačovať automaticky ako opravené. Číselné výsledky a otvorené otázky sú **iba v súkromnej wiki**, nie v tomto public checklistu.
- Priebeh, dátum a agregované výsledky reálneho auditu patria do súkromnej wiki `01-Chvostikovo/06-Web-SEO-tracking-a-suhlas.md`, nie do public repozitára.
