# Chvostíkovo UI backup – 15. 9. 2026

Tento priečinok zálohuje produkčné UI zmeny urobené 15. 9. 2026 pre zákaznícky portál a internú admin aplikáciu.

## Zákaznícky portál

Produkčný stav po úpravách:

- `app.js` – v37
- `styles.css` – v37
- PWA/service worker zostáva na existujúcom funkčnom riešení; ikona je samostatne zdokumentovaná v `system/PWA_ICON.md`.

Zálohované patche:

- `customer-app-v36-v37.js`
  - app-style spodná navigácia,
  - fotka psíka v navigácii,
  - oranžová rezervačná hlavička s fotkou a menom psa,
  - Nastavenia v sekcii Môj psík,
  - upozornenia vytiahnuté priamo do Nastavení,
  - otvorené Súhlasy a podmienky,
  - nový multi-day rezervačný picker na najbližšie dva týždne,
  - hlavná obrazovka Rezervácie zobrazuje iba skutočne rezervované dni.

- `customer-styles-v35-v37.css`
  - kompaktnejšie Správy,
  - vycentrovaný blok Zavolať do Chvostíkova,
  - užšie kontaktné údaje,
  - plávajúca spodná navigácia,
  - Nastavenia,
  - nový vzhľad permanentky,
  - nový rezervačný picker a karty rezervovaných dní.

## Admin aplikácia

Produkčné UI patche:

- `admin-ui-v31-v32.html`
  - odstránenie zbytočného textu pri zatvorenom dni,
  - plávajúca spodná navigácia s ikonami,
  - kompaktnejšie karty Týždňa,
  - počet psov a kapacita spojené do pomeru `počet / kapacita`,
  - plná/preplnená kapacita farebne zvýraznená,
  - malé kruhové `+ Pridať`,
  - čistejšie rozbalené rezervácie,
  - rýchly súhrn na Prehľade.

- `admin-ui-v33.html`
  - klikateľný dashboard namiesto oranžového hero,
  - dashboardové karty Psíkov dnes / Zajtra / Čakajúce rezervácie / Správy / Záujem o škôlku,
  - kompaktné ovládanie zatvorených dní priamo pri jednotlivom dni,
  - Štatistiky majú hlavičku Prehľad / História návštev.

- `admin-ui-v34.html`
  - opravuje poradie dashboardu tak, aby bol nad pôvodnými rozbaľovacími blokmi,
  - pôvodné dashboardové skupiny sa po načítaní predvolene zbalia a zostávajú cieľom po kliknutí na kartu,
  - obnovuje pôvodné názvy dní a dátumy v Týždni namiesto nespoľahlivého runtime labelu,
  - odstraňuje text „Bez schválených rezervácií“ pri zatvorenom dni,
  - zatvorenie dňa používa priamy autentifikovaný RPC call a nepotrebuje horný formulár Zatvorené dni,
  - navigačná položka Psy dostala novú výraznejšiu plnú labku,
  - dashboard Záujem o škôlku používa živé badge počty.

## Produkčné rollbacky v Supabase

Pred zásahmi boli vytvorené rollbacky:

- Customer portal: `before-customer-booking-sheet-settings-v37-20260915`
- Admin pred v32: `stable-v9-before-admin-ui-v32-20260915-0825`
- Admin pred v33: `stable-v9-before-admin-ui-v33-20260915-1152`
- Admin pred opravou v34: `stable-v9-before-admin-ui-v34-20260915-1250`
- Pred odstránením textu zatvoreného dňa: `stable-v9-before-closed-day-text-cleanup-20260915-0821`

## Dôležité

Tieto súbory sú záloha dnešných UI patchov. Produkčný admin sa skladá z `frontend_snapshots.stable-v9` a transformácií Edge Function `chvostikovo-frontend`. Zákaznícky portál sa servuje z `customer_portal_frontend_assets`.

Pri obnove sa patche nemajú aplikovať naslepo na inú verziu. Najprv treba overiť aktuálnu produkčnú verziu a až potom doplniť chýbajúce bloky podľa markerov `v35`, `v36`, `v37`, `v31`, `v32`, `v33`, `v34`.
