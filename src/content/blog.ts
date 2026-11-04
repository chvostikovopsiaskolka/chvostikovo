import workdayCoverPhoto from "@/assets/blog/blog-workday-cover.webp";
import standMia from "@/assets/products/stand-small-mia.webp";
import standDark from "@/assets/products/stand-dark.webp";
import targetLargeDog from "@/assets/products/target-large-dog.jpeg";
import targetLargeDetail from "@/assets/products/target-large-detail.jpeg";
import suitabilityCoverPhoto from "@/assets/blog/blog-suitability-cover.webp";
import puppyPreviewPhoto from "@/assets/blog/blog-puppy-card.webp";
import workdayBodyPhoto from "@/assets/blog/blog-workday-body.webp";
import suitabilityBodyPhoto from "@/assets/blog/blog-suitability-body.webp";

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  points?: string[];
};

export type BlogArticleData = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  summary: string;
  publishedAt: string;
  readingMinutes: number;
  image: { src: string; alt: string; position?: string; width?: number; height?: number };
  secondImage: { src: string; alt: string; position?: string; width?: number; height?: number };
  intro: string;
  sections: BlogSection[];
  productPage?: { href: string; label: string; description: string };
  imageCaption?: string;
  sources?: Array<{ label: string; href: string }>;
};

export const blogArticles: BlogArticleData[] = [
  {
    slug: "kam-so-psom-pocas-pracovneho-dna",
    title: "Kam so psom počas pracovného dňa?",
    seoTitle: "Kam so psom počas práce? Možnosti starostlivosti | Chvostíkovo",
    description: "Pracujete a riešite, kto sa postará o vášho psa? Porovnajte venčenie, opatrovanie aj psiu škôlku a zistite, kedy môže byť vhodná pre vášho psíka.",
    summary: "Keď ste v práci, psík nemusí mať iba dve možnosti: čakať doma alebo ísť s vami. Pozrite si, čo pri výbere starostlivosti zvážiť.",
    publishedAt: "2026-11-03",
    readingMinutes: 4,
    image: { src: workdayCoverPhoto, alt: "Štvorica psíkov sedí spolu v priestoroch Chvostíkova", position: "center 43%", width: 1440, height: 1080 },
    secondImage: { src: workdayBodyPhoto, alt: "Zlatý retriever a dvaja psí kamaráti odpočívajú v Chvostíkove", position: "center 47%", width: 810, height: 1080 },
    intro: "Ráno odchádzate do práce a večer sa vraciate domov. Medzitým má váš pes vlastný denný režim: potrebuje bezpečie, primeraný pohyb, odpočinok aj kontakt. Ak riešite, kam so psom počas pracovného dňa v Košiciach, možností je viac. Dôležité je vybrať tú, ktorá vyhovuje konkrétnemu psíkovi, nielen vášmu kalendáru.",
    sections: [
      {
        heading: "Najprv si všimnite, ako váš pes trávi čas doma",
        paragraphs: [
          "Niektoré psy väčšinu pracovného dňa pokojne prespia a stačí im dobrý režim pred odchodom a po návrate. Iné potrebujú počas dňa častejší kontakt, možnosť vyvenčiť sa alebo zmenu prostredia. Vek, zdravotný stav, návyky a povaha sú dôležitejšie než univerzálne pravidlo, koľko hodín má pes vydržať sám.",
          "Ak pes pri samote panikári, ničí zariadenie alebo má výrazné prejavy stresu, samotná škôlka nie je automatickou liečbou. O probléme sa porozprávajte s veterinárom alebo kvalifikovaným odborníkom na správanie psov. Výber dennej starostlivosti má jeho potrebám pomôcť, nie ich prekryť."
        ]
      },
      {
        heading: "Aké možnosti máte, keď ste v práci?",
        paragraphs: [
          "Najjednoduchšou pomocou môže byť člen rodiny alebo známy, ktorého pes pozná. Pri pravidelnom režime môže stačiť aj dohodnuté venčenie v priebehu dňa. Individuálne opatrovanie poskytuje pokojnejšie prostredie, keď psovi veľká skupina nevyhovuje.",
          "Psia škôlka je iná možnosť: pes trávi čas pod dohľadom ľudí a, ak mu to vyhovuje, aj v spoločnosti ďalších psov. Nemá to však byť nepretržitá hra. Dobrý denný program počíta aj s prestávkami a oddychom."
        ],
        points: [
          "Rodina alebo známy: známe prostredie a človek, ktorému pes dôveruje.",
          "Venčiteľ: prestávka počas dňa, bez nutnosti meniť celý režim.",
          "Individuálne opatrovanie: vhodné, ak pes potrebuje pokoj a menší počet podnetov.",
          "Psia škôlka: spoločnosť, aktivity a oddych pod celodenným dohľadom, ak pes zvláda kolektív."
        ]
      },
      {
        heading: "Ako vyzerá pracovný deň v Chvostíkove?",
        paragraphs: [
          "V našej psej škôlke v Košiciach sa staráme predovšetkým o stredných a veľkých psíkov. Majú k dispozícii vykurované vnútorné miestnosti a vonkajší výbeh s rozlohou približne 80 m². Počas pobytu na nich dohliadajú minimálne dvaja opatrovatelia. Striedame pohyb, hru, venčenie a čas na vydýchnutie; nie každý pes chce robiť to isté v rovnakom čase.",
          "Dôležité je, aby sa psík do prostredia zapájal vlastným tempom. Preto sa s každým novým záujemcom a jeho psom najskôr spoznáme na úvodnej návšteve. Pozrieme sa na reakcie na ľudí, prostredie a ostatných psov. Až potom spolu rozhodneme, ako by mohol vyzerať ďalší pobyt."
        ]
      },
      {
        heading: "Podľa čoho sa rozhodnúť?",
        paragraphs: [
          "Pred výberom si ujasnite, či potrebujete starostlivosť každý pracovný deň, párkrát týždenne alebo iba výnimočne. Pýtajte sa na dohľad, prestávky, podmienky prijatia a postup zoznamovania. Cena je dôležitá, ale rovnako dôležité je, aby sa pes v danom prostredí cítil bezpečne.",
          "Ak uvažujete nad škôlkou, nemusíte sa rozhodnúť naslepo. Pozrite si naše podmienky a dohodnite si nezáväzné zoznámenie. Pri ňom vám povieme, či je Chvostíkovo pre vášho psíka vhodná možnosť."
        ]
      }
    ]
  },
  {
    slug: "je-psia-skolka-vhodna-pre-kazdeho-psa",
    title: "Je psia škôlka vhodná pre každého psa?",
    seoTitle: "Je psia škôlka vhodná pre každého psa? | Chvostíkovo",
    description: "Každý pes zvláda kolektív inak. Zistite, kedy môže byť psia škôlka dobrou voľbou, na čo sa pozeráme pri zoznamovaní a kedy je lepší individuálny režim.",
    summary: "Spoločnosť ďalších psov môže byť skvelá, no nie je pre každého. Vysvetľujeme, čo si všímame pri zoznamovaní a prečo je dôležitý oddych.",
    publishedAt: "2026-11-03",
    readingMinutes: 4,
    image: { src: suitabilityCoverPhoto, alt: "Skupina psíkov v spoločnej hernej miestnosti Chvostíkova", position: "center 52%", width: 984, height: 1080 },
    secondImage: { src: suitabilityBodyPhoto, alt: "Dvaja psí kamaráti odpočívajú spolu na gauči v Chvostíkove", position: "center 53%", width: 810, height: 1080 },
    intro: "Nie každý pes túži po veľkej skupine kamarátov. Niekto sa zapojí rýchlo, iný potrebuje čas na pozorovanie a ďalšiemu najviac vyhovuje pokojný deň v známom prostredí. Dobrá psia škôlka preto nezačína otázkou, koľko psov sa spolu zahrá, ale či je spoločný pobyt pre konkrétneho psíka bezpečný a príjemný.",
    sections: [
      {
        heading: "Psí kamaráti sú príjemný bonus, nie povinnosť",
        paragraphs: [
          "Povaha a skúsenosti s inými psami sa líšia. Aktívny pes môže mať rád spoločnú hru, ale aj on potrebuje chvíle pokoja. Opatrný psík môže radšej chvíľu pozorovať z diaľky. Rozhodujúce nie je plemeno alebo množstvo energie samo osebe, ale reakcie psa v konkrétnych situáciách.",
          "Nie je potrebné, aby sa pes hral s každým. Pri kontakte s inými psami sledujeme, či sa dokáže uvoľniť, primerane komunikovať a rešpektovať prestávky. Nevnucujeme spoločnú hru za každú cenu."
        ]
      },
      {
        heading: "Kedy má zmysel skúsiť psiu škôlku?",
        paragraphs: [
          "Škôlka môže byť užitočná pre psa, ktorý má rád primeraný pohyb, zvláda prítomnosť iných psov a potrebuje počas pracovných dní zabezpečenú starostlivosť. Výhodou je stály dohľad a možnosť striedať vonkajšiu aktivitu s oddychom vnútri.",
          "Nové prostredie je však veľká zmena aj pre sebavedomého psa. Pomáha pokojný prvý kontakt a pravdivé informácie od majiteľa: čo pes obľubuje, čoho sa bojí, ako reaguje na cudzích ľudí a ako sa správa voči iným psom."
        ]
      },
      {
        heading: "Kedy je lepšie hľadať inú starostlivosť?",
        paragraphs: [
          "Ak pes reaguje na iné psy agresívne, nedokáže sa upokojiť alebo je preňho pobyt v skupine dlhodobo výrazne stresujúci, spoločná škôlka nemusí byť správna voľba. V takom prípade môže lepšie vyhovovať individuálne opatrovanie alebo režim dohodnutý s odborníkom na správanie psov.",
          "Do Chvostíkova prijímame klinicky zdravých psov s platnými požadovanými očkovaniami a ochranou proti parazitom. Posudzujeme tiež správanie v kolektíve. Tieto pravidlá chránia nielen ostatných škôlkarov, ale aj nového psa. Samotná úvodná návšteva preto ešte neznamená automatické prijatie."
        ]
      },
      {
        heading: "Prečo začíname úvodnou návštevou?",
        paragraphs: [
          "Na bezplatnej úvodnej návšteve sa spoznáme s vami aj vaším psíkom. Ukážeme priestory a sledujeme, ako reaguje na nové podnety, ľudí a ostatných psov. Niekedy si pes potrebuje zvykať postupne a odporučíme kratšie zoznamovanie. V iných prípadoch sa dohodneme, že kolektívne prostredie zatiaľ nie je vhodné.",
          "Nie je to skúška, ktorou musí psík prejsť za každú cenu. Cieľom je zistiť, čo mu skutočne vyhovuje, aby sa z návštevy stal dobrý zážitok, nie povinnosť."
        ]
      },
      {
        heading: "Ako spoznáte, že mu režim vyhovuje?",
        paragraphs: [
          "Zaujímajte sa o to, ako psík počas dňa odpočíva, či sa dokáže upokojiť a ako reaguje na ostatných. Aj unavený pes môže mať za sebou priveľa podnetov; samotné vyčerpanie nie je meradlom dobrého dňa. Dôležitejší je celkový komfort a ochota opäť prísť.",
          "Ak premýšľate, či by bola psia škôlka vhodná aj pre vášho psa, ozvite sa nám. Počas úvodnej návštevy sa spolu rozhodneme, či je Chvostíkovo správna voľba."
        ]
      }
    ]
  },
  {
    "slug": "stojan-na-misky-pre-psa-vyhody-a-vyber",
    "title": "Stojan na misky pre psa: kedy dáva zmysel?",
    "seoTitle": "Stojan na misky pre psa – výhody, výber a bezpečnosť | Chvostíkovo",
    "description": "Prečo si vybrať pevný stojan na misky, ako pomáha pri poriadku a čo treba vedieť pri veľkých plemenách či tráviacich ťažkostiach? Praktický sprievodca.",
    "summary": "Pevné miesto pre misky, menej posúvania a jednoduchšie čistenie. Vysvetľujeme aj to, kedy výšku misky radšej konzultovať s veterinárom.",
    "publishedAt": "2026-11-04",
    "readingMinutes": 5,
    "image": {
      "src": standMia,
      "alt": "Menší drevený stojan MIA s dvojicou misiek od Chvostíkova",
      "position": "center 58%"
    },
    "secondImage": {
      "src": standDark,
      "alt": "Väčší tmavý drevený stojan CORI s miskami od Chvostíkova",
      "position": "center 63%"
    },
    "imageCaption": "Naše aktuálne vyhotovenie dreveného stojana na misky.",
    "intro": "Jedlo a voda patria k najbežnejším momentom psieho dňa. A práve pri nich si majitelia často všimnú cestujúce misky, rozliatu vodu alebo neporiadok okolo kŕmneho miesta. Drevený stojan je praktický doplnok, ktorý môže pomôcť udržať misky pokope a zjednodušiť upratovanie. Nie je však zdravotnou pomôckou pre každého psa.",
    "sections": [
      {
        "heading": "Misky na jednom mieste a kŕmny kút pod kontrolou",
        "paragraphs": [
          "Keď má každá miska vlastné miesto v jednom pevnom podstavci, pri bežnom jedení a pití sa neposúva samostatne po podlahe. Pre domácnosť je to jednoduchšia organizácia: jedlo aj voda sú na známom mieste a okolie misiek sa ľahšie udržiava.",
          "Stojan sám osebe nezaručí suchú podlahu ani to, že pes nebude rozsýpať granule. Pri nadšenom jedákovi sa môže voda či krmivo dostať mimo misky tak či tak. Rozdiel je v praktickom usporiadaní miesta, nie v zázračnom riešení neporiadku."
        ]
      },
      {
        "heading": "Jednoduché čistenie bez zložitého rozoberania",
        "paragraphs": [
          "Naše stojany majú dve vyberateľné nerezové misky, ktoré možno umývať samostatne. Drevený povrch je ošetrený na bežnú údržbu: pri každodennom používaní ho stačí podľa potreby utrieť vlhkou handričkou.",
          "Pri vode a krmive je pravidelné čistenie dôležitejšie než samotný dizajn stojana. Misky umývajte priebežne a nenechávajte zvyšky krmiva dlho stáť."
        ]
      },
      {
        "heading": "A čo veľké plemená? Poznáme vlkodava aj barzoja",
        "paragraphs": [
          "V Chvostíkove máme skúsenosti aj s vlkodavom a barzojom. Pri veľkých psoch si človek rýchlo uvedomí, že veľkosť misky, miesto na kŕmenie a jednotlivé návyky sa líšia. Preto vyrábame menší i väčší pôdorys a pri stojane sa pýtame na výšku konkrétneho psa.",
          "Z toho však nevyplýva, že každý veľký pes potrebuje jesť zo zvýšenej misky. Pri plemenách náchylných na torziu žalúdka je voľba výšky osobitne citlivá. Výskum nezistil, že zvýšené kŕmenie torzii predchádza; niektoré údaje naznačujú dokonca vyššie riziko. Výšku preto neurčujme len podľa kohútikovej výšky alebo estetického dojmu."
        ]
      },
      {
        "heading": "Tráviace ťažkosti: stojan nenahrádza veterinára",
        "paragraphs": [
          "Ak psík pri jedle hltá, vracia, regurgituje, kašle, má bolesti alebo iné problémy s prijímaním potravy, prioritou je zistiť príčinu u veterinára. Zmena polohy misky môže pri niektorých individuálnych diagnózach dávať zmysel, pri iných nemusí byť vhodná.",
          "Neodporúčame zvýšený stojan ako univerzálnu pomoc pri gastroenterologických ťažkostiach. Pri podozrení na torziu žalúdka, najmä ak je brucho nafúknuté a pes sa neúspešne pokúša vracať, ide o urgentný veterinárny stav. O správnom režime kŕmenia, miske a jej výške má pri zdravotných problémoch rozhodnúť veterinár."
        ]
      },
      {
        "heading": "Ako vybrať stojan a čo objednať pred sviatkami",
        "paragraphs": [
          "Pri výbere si najprv premyslite veľkosť misiek, dostupné miesto a spôsob čistenia. Naše drevené stojany vieme pripraviť v rôznych farebných vyhotoveniach a s menom psíka; výšku riešime podľa konkrétneho použitia a podľa potreby aj po konzultácii s veterinárom.",
          "Personalizovaný stojan môže byť milým praktickým darčekom pre majiteľa psa. Keďže ide o ručnú výrobu, pred Vianocami si radšej vopred overte možnosti a termín — bez automatického prísľubu doručenia do sviatkov."
        ]
      }
    ],
    "productPage": {
      "href": "/stojan-na-misky-pre-psa",
      "label": "Pozrieť stojan na misky",
      "description": "Pozrite si fotografie MIA/CORI, rozmery, farby a pošlite nezáväzný dopyt k vlastnému stojanu."
    },
    "sources": [
      {
        "label": "Veterinary Evidence – zvýšené misky a riziko GDV (prehľad dôkazov)",
        "href": "https://veterinaryevidence.org/index.php/ve/article/view/57"
      },
      {
        "label": "PubMed – rizikové faktory torzie žalúdka u veľkých psov",
        "href": "https://pubmed.ncbi.nlm.nih.gov/11128539/"
      }
    ]
  },
  {
    "slug": "target-na-cvicenie-psov-prve-cviky",
    "title": "Target na cvičenie psa: ako začať s prvými cvikmi?",
    "seoTitle": "Target na cvičenie psov – prvé cviky a výber veľkosti | Chvostíkovo",
    "description": "Ako učiť psa dotyk labkou, výdrž v pozícii a jednoduché cviky s dreveným targetom? Praktický postup, bezpečnosť a výber vhodnej veľkosti.",
    "summary": "Ukážeme jednoduché využitie targetu: prvý dotyk labkou, pokojné zotrvanie a postupné rozširovanie tréningu bez zbytočného tlaku.",
    "publishedAt": "2026-11-04",
    "readingMinutes": 4,
    "image": {
      "src": targetLargeDog,
      "alt": "Pes používa väčší drevený target pri tréningu",
      "position": "center 50%"
    },
    "secondImage": {
      "src": targetLargeDetail,
      "alt": "Detail labiek na drevenom targete s protišmykovou plochou",
      "position": "center 50%"
    },
    "imageCaption": "Drevený target Chvostíkova pri ukážke používania.",
    "intro": "Target je jednoduchá pomôcka, ktorá dá psovi jasnú informáciu: sem polož labku. Netreba hneď zložité cviky ani náročné zostavy. Už krátke, príjemné opakovania môžu pomôcť pri učení presného pohybu a pokojnej spolupráce so psom.",
    "sections": [
      {
        "heading": "1. Najskôr jeden dobrovoľný dotyk labkou",
        "paragraphs": [
          "Target položte na stabilný nešmykľavý povrch. Nechajte psa, aby si pomôcku očuchal, a odmeňte záujem. Keď sa labkou dotkne plochy, označte správny okamih a odmeňte ho. Cieľom nie je psa nasilu postaviť na podložku, ale naučiť ho samostatne ponúknuť jednoduchý pohyb.",
          "Začínajte s krátkymi sériami a pokojne sa vráťte o krok späť, ak pes zaváha. Nech je učenie zrozumiteľné a dobrovoľné."
        ]
      },
      {
        "heading": "2. Pridajte krátku výdrž bez naháňania výkonu",
        "paragraphs": [
          "Keď psík rozumie dotyku, môžete skúsiť odmeniť aj okamih, keď labku na targete chvíľu ponechá. Postupne, po malých krokoch, predlžujte čas zotrvania. Predĺženie o sekundu má zmysel len vtedy, keď pes zostáva pokojný a bezpečne stojí.",
          "Target môže byť vhodný aj na nácvik pozície pri bežnej manipulácii. Nesmie však slúžiť na nútené držanie psa v nepohodlnej polohe."
        ]
      },
      {
        "heading": "3. Z jedného dotyku vzniká viac možností",
        "paragraphs": [
          "Po zvládnutí základu môžete meniť požadovanú labku, polohu človeka alebo skúšať jednoduché presuny. Vždy iba jeden nový prvok naraz. Pri väčšej záťaži, nezvyčajnej výške, mladých či starších psoch alebo ortopedickom probléme sa poraďte s odborníkom a nechoďte do cvikov cez bolesť.",
          "Target nie je zárukou rehabilitačného účinku ani náhradou fyzioterapie. Je to pomôcka na vedený tréning, pri ktorom rozhoduje správne prevedenie a komfort psa."
        ]
      },
      {
        "heading": "Ktorú veľkosť si vybrať?",
        "paragraphs": [
          "Veľký obdĺžnikový target má rozmery približne 40 × 20 cm, menší štvorcový približne 25 × 25 cm. Výber závisí od veľkosti labiek a konkrétneho cviku, nie iba od hmotnosti psa. Protišmyková plocha pomáha s kontaktom labky, ale podložka musí stáť na stabilnej podlahe.",
          "Štandardná výška je približne 5 cm; inú výšku riešime individuálne. Pokiaľ s targetom len začínate, zvyčajne je rozumnejší jednoduchý nízky cvik než vysoké zdvíhanie labiek."
        ]
      },
      {
        "heading": "Praktický darček pre ľudí, ktorí so psom radi pracujú",
        "paragraphs": [
          "Ak poznáte niekoho, kto sa venuje tréningu, target môže byť užitočnejší než ďalšia hračka do poličky. Najviac ho ocení človek, ktorý vie začať od jednoduchých cvikov a rešpektuje tempo svojho psa.",
          "Pred Vianocami sa nám môžete ozvať s výberom veľkosti alebo otázkou k vyhotoveniu. Aktuálne možnosti ručnej výroby a doručenia potvrdíme pri dopyte individuálne."
        ]
      }
    ],
    "productPage": {
      "href": "/target-na-cvicenie-pre-psov",
      "label": "Pozrieť drevený target",
      "description": "Porovnajte veľký a malý target, pozrite si skutočné fotografie a pošlite nezáväzný dopyt."
    }
  }
];

export const blogPath = (slug: string) => "/blog/" + slug + "/";

export type BlogCardData = {
  id: string;
  href: string;
  title: string;
  summary: string;
  image: BlogArticleData["image"];
  eyebrow: string;
  ctaLabel: string;
};

// Information cards: two actual blog articles and one established puppy page.
// The puppy entry links to its existing text section; it is NOT a new article URL.
export const blogCards: BlogCardData[] = [
  ...blogArticles.map((article) => ({
    id: article.slug,
    href: blogPath(article.slug),
    title: article.title,
    summary: article.summary,
    image: article.image,
    eyebrow: `Rady od Chvostíkova · ${article.readingMinutes} min čítania`,
    ctaLabel: "Prečítať článok",
  })),
  {
    id: "psia-skolka-pre-steniatka",
    href: "/psia-skolka-pre-steniatka/#puppy-benefits",
    title: "Psia škôlka pre šteniatka",
    summary: "Kedy môže šteniatko začať, ako sa zoznamuje so psíkmi a prečo sú pri prvých návštevách dôležité aj prestávky a oddych.",
    image: {
      src: puppyPreviewPhoto,
      alt: "Usmiaty mladý psík sedí v herni psej škôlky Chvostíkovo",
      position: "center 38%",
      width: 1440,
      height: 1080,
    },
    eyebrow: "Pre najmladších škôlkarov",
    ctaLabel: "Prečítať viac",
  },
];

export const findBlogArticle = (slug: string) => {
  const article = blogArticles.find(item => item.slug === slug);
  if (!article) throw new Error("Unknown blog article: " + slug);
  return article;
};
