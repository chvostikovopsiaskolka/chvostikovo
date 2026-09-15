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

### Aktuálna konsolidovaná verzia

- `admin-ui-v40-consolidated.html`
  - nahrádza dnešné vrstvené UI patche v31–v36 jednou stabilnou UI vrstvou,
  - Prehľad sa zobrazí až po zostavení finálneho dashboardu, takže pri načítaní nepreskakuje,
  - dashboardové počty sa načítavajú priamo zo Supabase: dnes, zajtra, čakajúce rezervácie, neprečítané správy a iba nové záujmy/prihlášky,
  - nový záujem a nová prihláška sa počítajú iba so stavom `new`; `reviewed`/vybavené sa nezapočítavajú,
  - dashboard je jediný zdroj rozloženia Prehľadu; staré re-order skripty `admin-v21-overview-order-pending`, `overview-live-badges-v26` a `overview-live-badges-v28` boli z produkcie odstránené,
  - `admin-ui-v22` si zachováva ostatné funkcie, ale už nenúti `overviewGroupsV22` späť za pôvodný hero,
  - spodná navigácia je skrytá do dokončenia finálnej ikonovej podoby, aby pri štarte neblikala stará verzia,
  - Psy používajú presne fallback znak `🐾`, rovnaký ako pri psovi bez fotografie,
  - Týždeň používa pôvodný dátum/názov dňa generovaný samotnou appkou; v40 ho iba štýluje a ak by chýbal, doplní ho z `data-date`,
  - zatvorenie dňa je priamo pri konkrétnom dni; horný formulár Zatvorené dni sa nepoužíva,
  - pri zatvorenom dni sa nezobrazuje prázdne „Bez schválených rezervácií“,
  - Štatistiky majú pohľady `Návštevy`, `Tržby`, `História návštev` a pri každom otvorení sa predvolene zobrazia `Návštevy`.

### Historické dnešné patche

Súbory `admin-ui-v31-v32.html`, `admin-ui-v33.html`, `admin-ui-v34.html`, `admin-stats-v35.html` a `admin-fixes-v36.html` ostávajú iba ako história postupných zmien. Pri obnove produkcie sa už nemajú vrstviť na seba; preferovaná je konsolidovaná v40.

## Produkčné rollbacky v Supabase

- Customer portal: `before-customer-booking-sheet-settings-v37-20260915`
- Admin pred v32: `stable-v9-before-admin-ui-v32-20260915-0825`
- Admin pred v33: `stable-v9-before-admin-ui-v33-20260915-1152`
- Admin pred opravou v34: `stable-v9-before-admin-ui-v34-20260915-1250`
- Admin pred štatistickými kartami v35: `stable-v9-before-admin-stats-tabs-v35-20260915-1258`
- Admin pred opravami v36: `stable-v9-before-admin-fixes-v36-20260915-1254`
- Admin pred konsolidáciou: `stable-v9-before-consolidated-ui-v40-20260915-1302`
- Admin pred odstránením starých konfliktujúcich runtime skriptov: `stable-v9-before-v40-legacy-cleanup-20260915-1310`
- Pred odstránením textu zatvoreného dňa: `stable-v9-before-closed-day-text-cleanup-20260915-0821`

## Dôležité

Produkčný admin sa skladá z `frontend_snapshots.stable-v9` a transformácií Edge Function `chvostikovo-frontend`. Zákaznícky portál sa servuje z `customer_portal_frontend_assets`.

Pri obnove admin UI po 15. 9. 2026 sa má ako východisko používať `admin-ui-v40-consolidated.html`, nie postupne vrstviť v31–v36. Najprv vždy over aktuálny produkčný snapshot a Edge Function transformácie.
