import dogFriendsPhoto from "@/assets/care-dog-friends-square.webp";
import playfulGroupPhoto from "@/assets/deco-3.jpg";
import calmDogPairPhoto from "@/assets/first-visit-dogs-together.webp";
import introductionFriendsPhoto from "@/assets/care-supervision-original.webp";
import puppyPreviewPhoto from "@/assets/first-visit-young-dog.webp";

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
  image: { src: string; alt: string; position?: string };
  secondImage: { src: string; alt: string; position?: string };
  intro: string;
  sections: BlogSection[];
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
    image: { src: dogFriendsPhoto, alt: "Traja psí kamaráti spolu v psej škôlke Chvostíkovo", position: "center 28%" },
    secondImage: { src: playfulGroupPhoto, alt: "Skupina psíkov spolu v interiéri psej škôlky Chvostíkovo", position: "center 40%" },
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
    image: { src: calmDogPairPhoto, alt: "Dvaja pokojne sediaci psi počas zoznamovania v Chvostíkove", position: "center 32%" },
    secondImage: { src: introductionFriendsPhoto, alt: "Dvaja psí kamaráti spolu odpočívajú v Chvostíkove", position: "center 28%" },
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
      alt: "Mladý psík v priestoroch psej škôlky Chvostíkovo",
      position: "center 38%",
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
