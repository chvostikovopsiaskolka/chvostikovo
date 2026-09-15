# E-commerce proof of concept

Tento dokument zachytáva existujúci proof of concept nákupného toku, ktorý bol odpojený od používateľského toku stojana, ale zostáva pripravený na neskoršie využitie vo Wolfík e-shope.

## Košík

- Klientská logika je v `src/lib/shop.ts` a UI v `src/components/site/CartDrawer.tsx` a `src/components/site/CartLink.tsx`.
- Položky sa ukladajú do `localStorage` pod kľúčom `chvostikovo_product_cart_v1` a zmeny oznamuje udalosť `chvostikovo-cart-updated`.
- Košík podporuje pridanie a odstránenie položky, počet kusov a výpočet zobrazovaného súčtu.

## Checkout

- Checkout je na route `/objednavka` (`src/routes/objednavka.tsx`).
- Zbiera kontaktné a doručovacie údaje, odosiela obsah košíka na Supabase Edge Function `product-order-submit` a po úspechu košík vyprázdni.
- Route `/kosik` a checkout zostávajú funkčné ako POC, ale stránka stojana ich už nevolá.

## Objednávky a Supabase

- Objednávky sa ukladajú do `public.product_orders`, položky do `public.product_order_items`.
- Obe tabuľky majú zapnuté RLS a nemajú priamy anonymný prístup; zápis vykonáva iba Edge Function pomocou serverového service role kľúča.
- Edge Function posiela internú notifikáciu a potvrdenie zákazníkovi cez Resend. Tajné kľúče sú iba v Supabase secrets.

## Serverová kontrola

- `product-order-submit` ignoruje cenu a názov produktu poslané klientom. Produkt, cenu 40 €, povolené varianty a limity množstva určuje server.
- Server validuje konfiguráciu, kontakt, spôsob doručenia a pri doručení vyžaduje adresu.
- Pred vložením vykonáva krátku kontrolu opakovaného odoslania. Samostatná skladová evidencia ani rezervácia zásob v POC nie je implementovaná.

## Prenos do Wolfík e-shopu

Použiť sa dajú typy košíka, localStorage/event vrstva, košíkové UI, checkout formulár, dvojtabuľkový model objednávky a položiek aj princíp serverom určovanej ceny. Pred produkčným použitím treba doplniť produktový katalóg, skladové transakcie, platby, trvalú idempotenciu checkoutu, správu objednávok a zákaznícke e-maily podľa finálneho Wolfík procesu.

Nezáväzné produktové dopyty sú zámerne oddelené: používajú tabuľku `public.product_inquiries` a Edge Function `product-inquiry-submit`.
