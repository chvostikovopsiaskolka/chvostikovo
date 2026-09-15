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

Produkčný UI patch:

- `admin-ui-v31-v32.html`
  - odstránenie zbytočného textu pri zatvorenom dni,
  - plávajúca spodná navigácia s ikonami,
  - kompaktnejšie karty Týždňa,
  - počet psov a kapacita spojené do pomeru `počet / kapacita`,
  - plná/preplnená kapacita farebne zvýraznená,
  - malé kruhové `+ Pridať`,
  - čistejšie rozbalené rezervácie,
  - rýchly súhrn na Prehľade: Dnes / Čaká / Správy.

## Produkčné rollbacky v Supabase

Pred zásahmi boli vytvorené rollbacky:

- Customer portal: `before-customer-booking-sheet-settings-v37-20260915`
- Admin: `stable-v9-before-admin-ui-v32-20260915-0825`
- Pred odstránením textu zatvoreného dňa: `stable-v9-before-closed-day-text-cleanup-20260915-0821`

## Dôležité

Tieto súbory sú záloha dnešných UI patchov. Produkčný admin sa skladá z `frontend_snapshots.stable-v9` a transformácií Edge Function `chvostikovo-frontend`. Zákaznícky portál sa servuje z `customer_portal_frontend_assets`.

Pri obnove sa patche nemajú aplikovať naslepo na inú verziu. Najprv treba overiť aktuálnu produkčnú verziu a až potom doplniť chýbajúce bloky podľa markerov `v35`, `v36`, `v37`, `v31`, `v32`.
