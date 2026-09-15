# Chvostíkovo PWA ikona – overené funkčné nastavenie

Tento súbor je záväzná poznámka pre budúce úpravy admin aplikácie aj zákazníckeho portálu.

## Základné pravidlo

**Nevyrábať novú/náhradnú PWA ikonku, ak to používateľ výslovne nežiada.**

Ako zdroj sa má použiť **presne tá istá ikonka, ktorá funguje v admin aplikácii:**

- súbor: `Store-v2.png`
- rozmer: `500x500`
- formát: PNG
- referenčný produkčný asset admin aplikácie: `/Store-v2.png`

Pri zákazníckom portáli sa táto ikonka používa ako zdroj aj pre iOS aj pre manifest.

## Overené produkčné riešenie zákazníckeho portálu

Funkčná verzia bola potvrdená používateľom 15. 9. 2026.

Manifest používa ikonku rovnakého obsahu ako admin `Store-v2.png`:

```json
{
  "icons": [
    {
      "src": "/app.js?icon=1&v=20260915-v34",
      "sizes": "500x500",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Aktuálny zákaznícky portál má historický statický Vercel shell, preto je ikonka servovaná cez existujúcu same-origin route. Route `/app.js?icon=1` musí vrátiť **binárne rovnaký obrázok ako admin `/Store-v2.png`**, s `Content-Type: image/png`.

Starý `apple-touch-icon` odkaz smeruje cez Edge Function `chvostikovo-logo`. Táto funkcia má viesť na tú istú overenú ikonku, nie na horizontálne logo ani na inú generovanú grafiku.

## Čomu sa vyhnúť

- nevytvárať novú ikonku z loga;
- nepoužívať horizontálne logo ako `apple-touch-icon`;
- nespoliehať sa iba na runtime JavaScript prepísanie `<link rel="apple-touch-icon">`;
- nemeníť fungujúcu admin ikonku za „podobnú“ verziu;
- neexperimentovať s iným assetom, pokiaľ `Store-v2.png` existuje a funguje.

## Kontrola po zmene

Pred označením úpravy za hotovú overiť:

1. manifest vracia správny icon `src`;
2. icon URL vracia HTTP 200 a `Content-Type: image/png`;
3. obrázok je štvorcový a zodpovedá admin `Store-v2.png`;
4. na iPhone v Safari pri **Pridať na plochu** sa v náhľade zobrazuje správna ikonka;
5. starú už pridanú PWA ikonu môže byť potrebné z plochy odstrániť a pridať znova kvôli iOS cache.

## Dôležité

Ak sa v budúcnosti rieši problém „PWA ikonka nefunguje“, **prvý krok je porovnať nastavenie s admin aplikáciou a znovu použiť presný `Store-v2.png` asset**. Nezačínať novým generovaním alebo obchádzkami.
