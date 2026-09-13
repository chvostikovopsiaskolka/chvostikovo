# Chvostíkovo System

Interná, read-only mapa funkcií Chvostíkovo APP.

## Účel

- prehľad zákazníckeho portálu / PWA,
- prehľad admin appky,
- upozornenia a push,
- právne súhlasy a Podmienky škôlky,
- prevádzkové pravidlá,
- technická mapa Supabase / Vercel.

Táto appka nemá zapisovať do produkčného Supabase.

## Aktualizácia

Funkčný obsah je primárne v `data.js`. Pri zmene hlavnej aplikácie:

1. overiť produkčné správanie,
2. upraviť príslušný blok v `data.js`,
3. aktualizovať dátum `meta.updated`,
4. commitnúť do GitHubu,
5. Vercel po prepojení na repo automaticky vytvorí nový deployment.

## Vercel

Odporúčaný názov projektu: `chvostikovo-system`.

Pri importe repozitára nastav Root Directory na `system`. Framework Preset môže zostať `Other`; ide o statický web bez buildu.
