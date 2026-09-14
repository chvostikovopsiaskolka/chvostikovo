# SEO checklist pre Chvostíkovo a ďalšie weby

Tento checklist používame ako praktický štandard pri tvorbe a rozširovaní webov. Neobsahuje SEO úpravy, ktoré sa robia iba „pre audit“, ale veci s reálnym významom pre indexáciu, organickú návštevnosť, používateľskú skúsenosť a konverzie.

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
