import targetLargeProduct from "@/assets/products/target-large-product.jpeg";
import targetMediumPreview from "@/assets/products/target-medium-preview.jpg";
import targetSmallProduct from "@/assets/products/target-small-product.jpeg";
import workdayCoverPhoto from "@/assets/blog/blog-workday-cover.webp";
import standMia from "@/assets/products/stand-mia.avif";
import standDark from "@/assets/products/stand-cori.avif";
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
  variantGallery?: Array<{ src: string; alt: string; label: string }>;
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
    "title": "Drevený stojan na misky: praktický pomocník aj darček pre psíka",
    "seoTitle": "Drevený stojan na misky pre psa – výhody a výber | Chvostíkovo",
    "description": "Ručne vyrábaný stojan na misky pre psa: stabilné miesto, vodeodolne ošetrený povrch, jednoduchá údržba a personalizácia. Kedy zvážiť výšku misiek?",
    "summary": "Nie sériová výroba, ale stojan na mieru: odolný povrch, vyberateľné misky a meno psíka. Plus praktické rady k správnej výške.",
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
    "intro": "Stojan na misky má byť pekný, ale hlavne praktický. Dve misky majú stabilné miesto, voda a jedlo sa ľahšie udržiavajú v jednom kúte a drevené prevedenie si možno prispôsobiť konkrétnemu psíkovi. V Chvostíkove stojany vyrábame ručne, nie na výrobnej linke: záleží nám na spracovaní, odolnosti pri každodennom používaní aj detailoch, ktoré z nich robia osobný výrobok.",
    "sections": [
      {
        "heading": "Misky na jednom mieste – osobný barový pultík",
        "paragraphs": [
          "Keď má každá miska vlastné miesto v jednom pevnom podstavci, pri bežnom jedení a pití sa neposúva samostatne po podlahe. Pre domácnosť je to jednoduchšia organizácia: jedlo aj voda sú na známom mieste a okolie misiek sa ľahšie udržiava.",
          "Pes môže pri pití stále kvapkať vodu alebo vysypať pár granúl. Stojan však pomáha obmedziť posúvanie samotných misiek a udržiavať kŕmne miesto prehľadnejšie — bez sľubov, že okolo neho nikdy nebude ani kvapka."
        ]
      },
      {
        "heading": "Jednoduché čistenie bez zložitého rozoberania",
        "paragraphs": [
          "Dve nerezové misky sa dajú vybrať a umyť samostatne. Drevený stojan má vodeodolne ošetrený povrch, ktorý lepšie znáša bežné kvapky a vlhkosť pri pití; na každodenné čistenie ho stačí utrieť vlhkou handričkou. Vodeodolná povrchová úprava však neznamená, že drevo je určené na dlhodobé máčanie alebo umývanie pod tečúcou vodou.",
          "Vyberateľné misky zjednodušujú hygienu pri každodennom kŕmení. Misky odporúčame pravidelne čistiť a rozliatu vodu zo stojana zotrieť, aby si drevo zachovalo pekný vzhľad."
        ]
      },
      {
        "heading": "Pre menších aj veľkých psov – poznáme vlkodava aj barzoja",
        "paragraphs": [
          "V Chvostíkove máme skúsenosti aj s vlkodavom a barzojom. Pri takýchto psoch si človek uvedomí, že malá miska a univerzálny rozmer nemusia stačiť. Preto ponúkame menší i väčší pôdorys stojana a pri výrobe sa zaujímame o konkrétneho psíka, jeho veľkosť a spôsob kŕmenia.",
          "Veľkosť psa sama osebe nie je dôvod zdvihnúť misky čo najvyššie. Pri veľkých a hlbokohruďových plemenách môže byť zvýšené kŕmenie dokonca rizikovým faktorom torzie žalúdka. Preto netvrdíme, že vyšší stojan je automaticky zdravší: výška má rešpektovať individuálne potreby psa a prípadné veterinárne odporúčanie."
        ]
      },
      {
        "heading": "Kedy môže byť vyvýšené kŕmenie individuálne potrebné?",
        "paragraphs": [
          "Poznáme aj prípad psíka, ktorý po operácii spojenej s refluxom potrebuje jesť z vyvýšenej misky. To je úplne iná situácia než preventívne zvyšovanie misiek každému veľkému psovi. Pri niektorých ochoreniach pažeráka alebo po konkrétnych zákrokoch môže veterinár predpísať presnú polohu pri kŕmení — a vtedy je dôležité prispôsobiť sa jeho pokynom.",
          "Samotný drevený stojan nie je liečba refluxu a nenahrádza špeciálne pomôcky na kŕmenie vo vzpriamenej polohe. Ak sa psíkovi vracia jedlo späť, opakovane vracia alebo má iné ťažkosti, vhodný spôsob a výšku kŕmenia musí určiť veterinár. Ak ide o individuálne odporúčanie po operácii, pri dopyte nám môžete povedať požadovaný rozmer a spolu preveríme možnosti výroby."
        ]
      },
      {
        "heading": "Poctivá výroba, osobné detaily a vianočný darček",
        "paragraphs": [
          "Naše stojany nie sú výsledkom pásovej výroby. Každý kus skladáme a dokončujeme ručne, s dôrazom na pevné spracovanie, ošetrený drevený povrch a jednoduchú údržbu. Môžete si zvoliť farebné prevedenie, meno psíka aj farbu písmen. Výška a rozmery sa riešia podľa konkrétnej objednávky a možností výroby.",
          "Personalizovaný stojan môže byť praktický darček pre psa aj jeho majiteľa, napríklad pod vianočný stromček. Ručná výroba však vyžaduje čas, preto si dostupnosť vybraného prevedenia a termín doručenia overte vopred. Objednávku vybavujeme nezáväzným dopytom, nie automatickou platbou v košíku."
        ]
      }
    ],
    "productPage": {
      "href": "/stojan-na-misky-pre-psa",
      "label": "Pozrieť stojan na misky",
      "description": "Vyberte si ručne vyrábaný stojan s možnosťou personalizácie, individuálnym farebným prevedením a výškou prispôsobenou vášmu psíkovi."
    },
    "sources": [
      {
        "label": "Merck Veterinary Manual – kŕmenie pri ochoreniach pažeráka",
        "href": "https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/disorders-of-the-esophagus-in-dogs"
      },
      {
        "label": "Langford Vets – špecifické odporúčania pri refluxe a kŕmení vo zvýšenej polohe",
        "href": "https://www.langfordvets.co.uk/small-animal-referral-hospital/clinical-services/soft-tissue-surgery/boas-management/"
      },
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
    "description": "Ručne vyrábané targety na cvičenie psov: 40 × 20 × 5, 25 × 25 × 5 aj 30 × 15 × 5 cm. Kvalitné materiály, protišmykový povrch a rozmery na mieru.",
    "summary": "Od prvého dotyku labkou cez kontrolované rehabilitačné cviky až po poslušnosť a zotrvanie na mieste. Všetko s ohľadom na potreby psíka.",
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
    "intro": "Target je jednoduchá pomôcka, ktorá psíkovi ukáže, kam položiť labku. Dá sa využiť pri bežnom tréningu, nácviku zotrvania na mieste a pod vedením odborníka aj pri niektorých rehabilitačných či fyzioterapeutických cvikoch. Začnite krátkymi dobrovoľnými pokusmi a náročnosť prispôsobte psíkovi.",
    "sections": [
      {
        "heading": "1. Najskôr jeden dobrovoľný dotyk labkou",
        "paragraphs": [
          "Target položte na stabilný nešmykľavý povrch. Nechajte psa, aby si pomôcku očuchal, a odmeňte záujem. Keď sa labkou dotkne plochy, označte správny okamih a odmeňte ho. Cieľom nie je psa nasilu postaviť na podložku, ale naučiť ho samostatne ponúknuť jednoduchý pohyb.",
          "Začínajte s krátkymi sériami a pokojne sa vráťte o krok späť, ak pes zaváha. Nech je učenie zrozumiteľné a dobrovoľné."
        ]
      },
      {
        "heading": "2. Rehabilitácia, fyzioterapia a držanie tela",
        "paragraphs": [
          "Pri niektorých veterinárnych rehabilitačných a fyzioterapeutických plánoch sa používajú pevné plošiny na presné umiestnenie labiek. Odborník môže s ich pomocou viesť kontrolované prenášanie váhy, stabilitu postoja a vhodné posilňovacie cviky. Konkrétna poloha labiek, výška a počet opakovaní závisia od diagnózy a možností psa.",
          "Náš pevný target nie je zdravotnícka pomôcka s preukázaným liečebným účinkom a nezaručuje spevnenie svalstva ani správny postoj sám osebe. Po operácii, pri bolesti či problémoch s pohybom vyberajte cvičenia výhradne podľa veterinára alebo kvalifikovaného fyzioterapeuta pre zvieratá."
        ]
      },
      {
        "heading": "3. Poslušnosť a zotrvanie na mieste",
        "paragraphs": [
          "V každodennom tréningu môže target slúžiť ako jasne označené miesto pre jednu alebo dve labky. Najskôr odmeňte dobrovoľný dotyk, potom pridajte jednoduchý povel a pomaly predlžujte čas, počas ktorého psík labku na mieste ponechá. Na konci ho zreteľným slovom uvoľnite.",
          "Takto môžete trénovať pokoj, sústredenie a zotrvanie na určenom mieste. Náš nízky target však nie je plošina na státie celým telom pre každého psa: rozsah cviku vždy prispôsobte rozmerom pomôcky a veľkosti labiek."
        ]
      },
      {
        "heading": "Ktorú veľkosť si vybrať?",
        "paragraphs": [
          "Veľký obdĺžnikový target má rozmery približne 40 × 20 cm, stredný 30 × 15 cm a malý štvorcový približne 25 × 25 cm. Výber závisí od veľkosti labiek a konkrétneho cviku, nie iba od hmotnosti psa. Protišmyková plocha pomáha s kontaktom labky, ale podložka musí stáť na stabilnej podlahe.",
          "Štandardná výška je približne 5 cm; po dohode vieme prispôsobiť výšku aj rozmery podľa vašich požiadaviek. Pokiaľ s targetom len začínate, zvyčajne je rozumnejší jednoduchý nízky cvik než vysoké zdvíhanie labiek."
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
      "description": "Porovnajte všetky tri veľkosti targetov, pozrite si skutočné fotografie a pošlite nezáväzný dopyt."
    },
    "sources": [
      {
        "label": "VCA Animal Hospitals – cvičenia na vnímanie polohy tela a bezpečnosť",
        "href": "https://vcahospitals.com/know-your-pet/exercises-to-improve-proprioception"
      },
      {
        "label": "WSAVA/VIN – terapeutické cvičenia vo veterinárnej rehabilitácii",
        "href": "https://www.vin.com/apputil/content/defaultadv1.aspx?id=7054715&pid=12886&print=1"
      },
      {
        "label": "CattleDog Publishing – nácvik zotrvania na platforme",
        "href": "https://cattledogpublishing.com/blog/stationing-to-a-platform/"
      }
    ]
  },
  {
  "slug": "target-pri-rehabilitacii-psa",
  "title": "Target pri rehabilitácii psa: stabilita, fyzioterapia a posilňovacie cviky",
  "seoTitle": "Target pri rehabilitácii psa: stabilita a fyzioterapia | Chvostíkovo",
  "description": "Objavte využitie targetov pri fyzioterapii a kontrolovanom pohybe psa. V Chvostíkove ich vyrábame ručne, s protišmykovým povrchom a na mieru.",
  "summary": "Objavte využitie targetov pri fyzioterapii a kontrolovanom pohybe psa. V Chvostíkove ich vyrábame ručne, s protišmykovým povrchom a na mieru.",
  "publishedAt": "2026-11-25",
  "readingMinutes": 4,
  "intro": "",
  "sections": [
    {
      "heading": "Target nie je len pomôcka na trik",
      "paragraphs": [
        "Keď pes položí labku na označené miesto, začína rozumieť, kam má postaviť svoju labku. Práca s jasným cieľom môže trénerovi alebo fyzioterapeutovi pomáhať viesť pozornosť psa k polohe končatín. Nemusí pritom ísť o náročný trik ani o rýchly pohyb.",
        "Pevný target je jednoduchá stabilná platforma s protišmykovým povrchom. Jeho úloha je odlišná od nestabilných balančných pomôcok: sám sa nemá kývať ani nútiť psa vyrovnávať pohyb podložky. Konkrétne využitie však závisi od zdravotného stavu, skúseností psa a cieľa tréningu."
      ]
    },
    {
      "heading": "Čo znamená propriocepcia a kontrola pohybu?",
      "paragraphs": [
        "Propriocepcia sa zjednodušene opisuje ako vnímanie polohy jednotlivých častí tela. Pri vedenom cvičení sa môže pracovať napríklad s vedomým umiestňovaním labiek a kontrolovanými zmenami postoja. Nie každé takéto cvičenie je automaticky rehabilitáciou a samotná pomôcka nelieči chorobu.",
        "Pri zdravom psovi môže byť práca s targetom súčasťou bežného tréningu. Pri psovi po úraze, operácii alebo s pohybovým problémom však výber cvikov, rozsah záťaže a tempo určuje veterinár alebo kvalifikovaný rehabilitačný odborník."
      ]
    },
    {
      "heading": "Pevný target alebo balančná pomôcka?",
      "paragraphs": [
        "Pevný target ponúka konkrétne miesto, na ktoré pes kladie labku alebo labky. Dôležitá je stabilita, protišmykovosť a primeraná plocha, aby sa pes nemusel neprirodzene naťahovať.",
        "Balančné pomôcky majú odlišný mechanický charakter a môžu pridávať náročnosť. Nie sú automaticky vhodnejšie. Pri rehabilitačnom programe musí ich použitie vychádzať z odborného plánu, nie z internetového zoznamu cvikov."
      ]
    },
    {
      "heading": "Kedy sa s targetom môže pracovať?",
      "paragraphs": [
        "V primeranom tréningu môže pomôcka poslúžiť na pokojné zoznamovanie s umiestnením labky alebo na krátke zotrvanie v zvolenej polohe. Pri odbornom rehabilitačnom vedení možno podľa stavu psa zvoliť ďalšie kontrolované úlohy, napríklad presnejšie vedenie postoja. Presné rehabilitačné cviky, opakovania a záťaž zámerne neuvádzame ako univerzálny návod.",
        "Ak pes kríva, prejavuje bolesť, ma neurologické ťažkosti alebo sa zotavuje z operácie, tréning podľa všeobecného článku nie je vhodnou náhradou vyšetrenia. Pri neistote patrí prvé rozhodnutie veterinárovi."
      ]
    },
    {
      "heading": "Na čom záleží pri výbere platformy?",
      "paragraphs": [
        "Pri pevnej podložke sledujte rozmer vzhľadom na psa, protišmykový povrch a stabilnú konštrukciu. V Chvostíkove vyrábame drevené targety v troch veľkostiach – veľký 40 × 20 cm, stredný 30 × 15 cm a malý 25 × 25 cm – s bežnou výškou približne 5 cm; ďalšie prevedenie riešime individuálne podľa možností výroby.",
        "Veľkosť targetu nepredstavuje zdravotné odporúčanie. Vyberá sa podľa použitia konkrétneho psa; pre rehabilitáciu rozhoduje aj odporúčanie odborníka. Každý psík má iné potreby. Naše targety vyrábame ručne a po dohode vieme prispôsobiť ich výšku aj rozmery podľa vašich požiadaviek."
      ]
    },
    {
      "heading": "Chcete si pozrieť naše targety?",
      "paragraphs": [
        "Pozrite si skutočné fotografie, rozmery a možnosti výroby na stránke Target na cvičenie pre psov. Záujem o konkrétnu veľkosť nám môžete nezáväzne poslať cez existujúci formulár nižšie."
      ]
    }
  ],
  "productPage": {
    "href": "/target-na-cvicenie-pre-psov",
    "label": "Target na cvičenie pre psov",
    "description": ""
  },
  "sources": [
    {
      "label": "VCA Animal Hospitals – Exercises to Improve Proprioception",
      "href": "https://vcahospitals.com/know-your-pet/exercises-to-improve-proprioception"
    },
    {
      "label": "Veterinary Information Network – rehabilitačné cvičenia",
      "href": "https://www.vin.com/apputil/content/defaultadv1.aspx?id=7054715&pid=12886"
    },
    {
      "label": "CattleDog Publishing – stationing to a platform",
      "href": "https://cattledogpublishing.com/blog/stationing-to-a-platform/"
    }
  ]
,
  "image": { src: targetLargeProduct, alt: "Drevený target 40 × 20 cm s protišmykovým povrchom", width: 1152, height: 1536 },
  "secondImage": { src: targetSmallProduct, alt: "Štvorcový target 25 × 25 cm", width: 1152, height: 1536 },
  "variantGallery": [
    { src: targetLargeProduct, alt: "Veľký drevený target", label: "40 × 20 cm" },
    { src: targetMediumPreview, alt: "Stredný drevený target", label: "30 × 15 cm" },
    { src: targetSmallProduct, alt: "Malý drevený target", label: "25 × 25 cm" }
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
