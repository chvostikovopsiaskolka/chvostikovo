const M = "https://static.wixstatic.com/media/";

export const HERO_IMAGE = `${M}fdc688_6d964e3e1c8b48b6a84a4d5c3cdfd456~mv2.jpg/v1/fill/w_1905,h_1074,fp_0.50_0.50,q_90,usm_0.66_1.00_0.01,enc_auto/fdc688_6d964e3e1c8b48b6a84a4d5c3cdfd456~mv2.jpg`;

export const PHONE = "+421951069395";
export const PHONE_PRETTY = "+421 951 069 395";
export const EMAIL = "chvostikovo.psiaskolka@gmail.com";
export const MAP_LINK = "https://maps.app.goo.gl/otDwUKHtjwUdUa2JA";
export const FACEBOOK = "https://www.facebook.com/profile.php?id=61564093374033";
export const INSTAGRAM = "https://www.instagram.com/chvostikovo.psiaskolka/";

export const ADDRESS = {
  street: "Poľská 6",
  city: "Košice",
  postalCode: "040 01",
  country: "Slovakia",
  countryCode: "SK",
};

export const BUSINESS_NAME = "Chvostíkovo psia škôlka";
export const BUSINESS_DESCRIPTION =
  "Psia škôlka Chvostíkovo v Košiciach – denné stráženie psov s individuálnym prístupom, bezpečným výbehom a celodenným dohľadom.";
export const OPENING_HOURS = [
  { dayOfWeek: "Monday", opens: "07:00", closes: "17:00" },
  { dayOfWeek: "Tuesday", opens: "07:00", closes: "17:00" },
  { dayOfWeek: "Wednesday", opens: "07:00", closes: "17:00" },
  { dayOfWeek: "Thursday", opens: "07:00", closes: "17:00" },
  { dayOfWeek: "Friday", opens: "07:00", closes: "17:00" },
];

export const GARDEN_PHOTO = `${M}fdc688_9f12012fbb7c4cb883a62be50c72cd7f~mv2.png/v1/fill/w_1200,h_1200,al_c,q_85,enc_auto/zahrada.png`;
export const SUNFLOWERS_PHOTO = `${M}fdc688_cfe63a54df4e4e26bb4d8f40be5b6bf7~mv2.jpg/v1/fill/w_1200,h_900,al_c,q_85,enc_auto/slnecnice.jpg`;


const g = (id: string, ext = "png") =>
  `${M}fdc688_${id}~mv2.${ext}/v1/fill/w_900,h_900,al_c,q_85,enc_auto/foto.${ext === "jpeg" ? "jpeg" : "png"}`;

export const GALLERY = [
  { src: g("a425c61c8c23451cbac0b8a33dd2a8bc"), alt: "Vnútorné priestory psej škôlky Chvostíkovo v Košiciach", caption: "Vnútorné priestory" },
  { src: g("623a001b7b884ca9b8475276ba28a74b"), alt: "Vonkajší výbeh pre psíkov v psej škôlke Chvostíkovo", caption: "Výbeh pre psíkov" },
  { src: g("783cf5d1cd9e4412900c168f3ed33463"), alt: "Škôlkári počas dňa v psej škôlke", caption: "Škôlkári počas dňa" },
  { src: g("041d4122616b43e1bd108794e344591d"), alt: "Škôlkári vo vonkajšom výbehu", caption: "Šalenie vo výbehu" },
  { src: g("98ef8646ebfa4ecdaa1a2d6234f42cd3"), alt: "Vnútorné priestory a naša svorka", caption: "Naša svorka" },
  { src: g("905946bdfc024a439515d21869b28341"), alt: "Oddych počas dňa v psej škôlke", caption: "Oddych nesmie chýbať" },
  { src: g("9f0c76ca6f8f4411a0feaf1aae3728e2"), alt: "Výbeh pre psíkov s rozlohou 80 m2", caption: "Výbeh 80 m²" },
  { src: g("b6593ef189ca4412b33245449e4a37b3"), alt: "Rocky odpočíva v psej škôlke", caption: "Rocky a jeho „mám dosť“" },
  { src: g("0b04e4eb6c3640d39780b89f8a4967cd"), alt: "Škôlka pre psov v Košiciach s vlastným výbehom", caption: "Bezpečný výbeh" },
  { src: g("31234cf8269446f1b61673fcbb080139", "jpeg"), alt: "Iris a Gael na gauči počas dňa v škôlke", caption: "Oddych na gauči" },
  { src: g("b932db1fd86c444aa1c985dc3ed1ac92"), alt: "Dievčatá Bella, Stella a Bebe", caption: "Bella, Stella a Bebe" },
  { src: g("2f4ca3a74b5445668e8de7cba425e0ad"), alt: "Dante a Ceresia - barzoje", caption: "Dante a Ceresia" },
];

export const CARE = [
  {
    img: g("3922bb32a21642d5b57ed9938ffd256b"),
    pos: "object-[50%_18%]",
    title: "Aktívny deň",
    alt: "Aktívny deň v psej škôlke",
    text: "**Kým pracujete**, alebo si vybavujete povinnosti, váš psík si u nás užije **aktívny deň** plný pohybu, hier a kontaktu s inými psami. Do sýtosti si **vybije fyzickú aj mentálnu energiu**, užije si výbeh a prechádzky na čerstvom vzduchu. Samozrejmosťou je aj **oddych** a **veľa mojkania**!",
  },
  {
    img: g("c8799fdc98554252af0a25aa67197faa"),
    pos: "object-[50%_12%]",
    title: "Celodenný dohľad",
    alt: "Celodenný dohľad v psej škôlke v Košiciach",
    text: "Chvostíkovo je **druhým domovom** pre vášho psíka. Preto sú **bezpečie a komfort** našich psích škôlkarov na prvom mieste. Počas celého dňa na psy **dohliadajú minimálne dvaja skúsení opatrovatelia**, ktorí zabezpečujú pokojné prostredie pre hru, oddych a bezpečné interakcie.",
  },
  {
    img: g("edc3d7299bb443f2ad29502a3d0ea3c6"),
    pos: "object-[50%_10%]",
    title: "Individuálny prístup",
    alt: "Psia škôlka - weimarský stavač",
    text: "**Každý psík je jedinečný**, preto ku každému pristupujeme **individuálne**, **s trpezlivosťou a rešpektom** k jeho potrebám. Ako majitelia psov vieme, akú dôveru nám zverujete – každému škôlkarovi venujeme rovnakú starostlivosť, akú by sme dopriali aj **vlastným psom**.",
  },
];

export const REVIEWS = [
  {
    name: "Heka & Leraie",
    text: "Škôlku pre psov Chvostíkovo môžem naozaj len odporučiť. Môj Leraie sa tam vždy teší na kamarátov a mňa teší, že je v rukách skvelých ľudí ❤️",
  },
  {
    name: "Ľubka & Aron",
    text: "Odporúčam ❤️ úžasní majitelia, ktorí milujú psíkov a je to vidieť. Keď nechcete nechávať svojho psíka samého doma, lepšie miesto nenájdete. Áron je tam šťastný a vždy sa tam vyblázni.",
  },
  {
    name: "Erik & Gaston",
    text: "Skvelé miesto, skvelí ľudia! Náš psík od radosti nevie obsedieť pred dverami, kým sa konečne otvoria.",
  },
  {
    name: "Dagmar & Merlin",
    text: "Chvostíkovo je najúžasnejšia škôlka akú poznám, úžasný prístup, starostlivosť o môjho miláčika, celý deň sa hrá, má výbeh aj kamarátov, domov príde, navečeria sa a spinká. Mne táto možnosť škôlky úžasne pomáha – keď pracujem, môj psík nie je doma sám, má spoločnosť. Majitelia sú láskaví, psíkom dávajú pohladenie a ❤️ Som veľmi vďačná za všetko, čo robíte pre nás 👍",
  },
  {
    name: "Alžbeta & Eliška",
    text: "Ak hľadáte miesto, kde bude váš psík spokojný, tak určite navštívte túto škôlku. Majitelia sú milí, veľmi ústretoví a naša Eliška sa do škôlky vždy teší. Po škôlke máme doma šťastného a unaveného psíka. Ďakujeme",
  },
  {
    name: "Richard & Bella",
    text: "Výborná škôlka, skvelý prístup majiteľov, pes sa tam nešmýka ako na klzisku, odporúčam určite. Bella sa tam stále teší. ❤️👍",
  },
  {
    name: "Helena & Colin",
    text: "Colin navštevuje Chvostíkovo už zopár mesiacov. Je to border kólia a teda má viac energie ako väčšina psíkov. Tu to ale neprekáža. Zahrá sa s loptičkou aj s ostatnými a domov ho berieme s tým, že má za sebou aktívny, dobre strávený deň... a my pred sebou pokojný večer :D Majitelia sú milí ľudia, ktorým sa nebojím psíka nechať na starosť.",
  },
  {
    name: "Bianka & Monty",
    text: "Škôlku Chvostíkovo odporúčam všetkými desiatimi. Je vidieť, že majitelia majú psov naozaj radi, môj psík sa do škôlky vždy veľmi teší a domov sa vracia spokojný a unavený z hry – keď pre neho prídeme, ani sa mu nechce domov 😋 Komunikácia je vždy bezproblémová. Super výhodou je aj výbeh!",
  },
  {
    name: "Martina & Belisha",
    text: "Veľká spokojnosť! Majitelia škôlky majú úžasný prístup, sú milí, starostliví a vždy ochotní pomôcť. Po presťahovaní do nových priestorov dokonca zabezpečili nášmu psíkovi odvoz do škôlky, čo nám veľmi uľahčilo život. Beli sa tam vždy veľmi teší a domov sa vracia šťastná a príjemne unavená. Odporúčame všetkým, ktorí hľadajú kvalitnú a láskyplnú starostlivosť pre svojich psíkov! 🫶",
  },
  {
    name: "Alena & Becky",
    text: "Po dlhom hľadaní sme konečne našli škôlku a ľudí, ku ktorým mám dôveru. Naša Becky sa veľmi teší na každú návštevu, výborne bolo o ňu postarané aj počas našej dovolenky. Túto škôlku odporúčam každému. 😍🐕",
  },
];


export const WHY = [
  {
    title: "Psík býva sám doma",
    text: "Pomáhame psíkom, ktorí trpia separačnou úzkosťou, výrazne zavíjajú alebo majú tendenciu ničiť zariadenie domácnosti.",
  },
  {
    title: "Nadbytok energie",
    text: "Keď má psík priveľa energie a potrebuje ju aktívne vybiť, pomôže mu náš program, starostlivý dohľad a bezpečné prostredie.",
  },
  {
    title: "Deň s kamarátmi",
    text: "Aj keď váš psík vydrží sám doma, u nás si užije deň plný pohybu, hier a spoločnosti psích kamarátov. Domov odchádza spokojný po dni plnom zážitkov.",
  },
];

export const REQUIREMENTS = [
  {
    title: "Očkovanie a prevencia",
    text: "Podmienkou je platný očkovací preukaz so všetkými povinnými vakcínami proti besnote, infekčným ochoreniam (psinka, parvoviróza, parainfluenza, infekčná hepatitída a leptospiróza) a kotercovému kašľu. Psík musí byť pravidelne odčervovaný a chránený proti vonkajším parazitom.",
  },
  {
    title: "Správanie psíka",
    text: "Psík musí byť nekonfliktný voči iným psom aj ľuďom. Neprijímame agresívne psy ani psy s prejavmi neprimeraného správania. Z bezpečnostných dôvodov neprijímame psy označené ako nebezpečné alebo ťažko zvládnuteľné v kolektíve.",
  },
  {
    title: "Hygiena",
    text: "Psík musí mať základné hygienické návyky v interiéri, pričom pri šteniatkach sa prihliada na ich vek a vývoj. Majiteľ je povinný psa ráno vyvenčiť pred príchodom do škôlky, počas dňa majú psíky zabezpečené pravidelné venčenie podľa ich potrieb.",
  },
  {
    title: "Zdravotný stav",
    text: "Prijímame len klinicky zdravých psíkov bez krátkodobých či prenosných ochorení. V prípade chronických ochorení nás prosím informujte vopred, aby sme mohli posúdiť individuálne potreby a bezpečnosť. Fenky počas hárania neprijímame z dôvodu bezpečnosti a pohody ostatných psíkov.",
  },
];

export const INCLUDED = [
  "Profesionálne a bezpečné denné stráženie psíka",
  "Prechádzky a výbeh s rozlohou až 80 m²",
  "Aktívny deň, hry a šantenie s kamošmi",
  "Rodinné prostredie a celodenný dohľad",
  "Fotky a videá z priebehu dňa",
  "Individuálny prístup ku každému psíkovi",
  "Pitný režim a zdravé mlsky",
];

export const PRICING = [
  {
    name: "Jednorazový vstup",
    price: "25 €",
    note: "pes od 6 mesiacov",
    highlight: false,
  },
  {
    name: "Permanentka",
    price: "200 €",
    note: "10 vstupov – ušetríte 50 €. Permanentka platí 2 mesiace.",
    highlight: true,
  },
];


export const FAQ = [
  {
    q: "Bude môj psík počas dňa niekedy sám bez dozoru?",
    a: "Nie. Psíkovia sú počas pobytu v škôlke pod celodenným dohľadom a vždy sú s nimi minimálne dvaja skúsení opatrovatelia.",
  },
  {
    q: "Ako prebieha prvá návšteva psíka v škôlke?",
    a: "Pred nástupom do škôlky absolvuje každý nový psík vstupnú návštevu. Počas nej sa zoznámime so psíkom, sledujeme jeho správanie a reakcie na nové prostredie, ľudí aj ostatných psov a postupne ho zoznamujeme s kolektívom.\n\u00a0Nie každý psík si zvykne rovnako rýchlo. Šteniatkam, bojazlivejším psíkom alebo psíkom, ktoré potrebujú viac času, môžeme odporučiť ešte 2–3 kratšie návštevy spolu s majiteľom alebo niekoľkohodinový pobyt bez neho. Následne podľa toho, ako psík napreduje, zvolíme ďalší postup. Vo väčšine prípadov si psík postupne zvykne a prirodzene sa začlení do kolektívu.\n\u00a0Veľmi dôležité je, aby nám majiteľ o svojom psíkovi povedal pravdivo všetko – nielen to dobré. Potrebujeme vedieť o jeho povahe, správaní, skúsenostiach s inými psami a ľuďmi, obavách aj problémových situáciách. Čím lepšie psíka poznáme, tým lepšie vieme jeho prvé návštevy prispôsobiť.",
  },
  {
    q: "Ako zabezpečujete bezpečnosť psíkov v škôlke?",
    a: "Bezpečnosť začína už vstupnou návštevou. Počas nej zisťujeme, ako psík reaguje na ostatných psov, cudzích ľudí a nové prostredie. Ak sa prejavuje výrazne agresívne alebo jeho správanie nie je vhodné pre pobyt v kolektíve, do škôlky ho neprijmeme.\n\u00a0Chvostíkovo nie je výcvikové centrum, preto v rámci bežných návštev neriešime prevýchovu agresívneho alebo problémového správania s cieľom zaradiť psíka do kolektívu.\n\u00a0Počas pobytu sú psíkovia pod neustálym dohľadom. Sledujeme ich správanie a vzájomné interakcie, aby sme dokázali včas predchádzať nedorozumeniam a situáciám, ktoré by mohli prerásť do konfliktu.\n\u00a0Rovnako dôležité je pre nás aj fyzické zdravie psíkov. Hru a pohyb počas dňa regulujeme a nenechávame psov hrať sa bez prestávky alebo až do úplného vyčerpania. Aktivitu vždy prispôsobujeme konkrétnym psíkom aj aktuálnym podmienkam. Počas horúcich dní dbáme na prevenciu prehriatia a obmedzujeme intenzívnu či dlhú aktivitu vonku. V daždivom alebo nepriaznivom počasí zase volíme kratšie a podľa potreby častejšie venčenia.\n\u00a0Súčasťou dňa je preto aj pravidelný oddych a čas na upokojenie. Ak si všimneme, že sa psík necíti komfortne, je nezvyčajne unavený alebo sa zmení jeho nálada, správanie či zdravotný stav, situáciu konzultujeme s majiteľom. Ak je to potrebné, pobyt ukončíme skôr, aby sme psíka zbytočne nezaťažovali a predišli prípadnému zhoršeniu jeho stavu.",
  },
  {
    q: "Musím si rezervovať termín vopred?",
    a: "Áno, vzhľadom na obmedzenú kapacitu a snahu udržať bezpečnú atmosféru je potrebné rezervovať si miesto týždeň dopredu, do nedele 20:00. Samozrejme, ak máte vzhľadom na prácu problém prihlásiť psíka týždeň dopredu, vieme sa dohodnúť aj individuálne – stačí nám zavolať.",
  },
  {
    q: "Hrajú sa psíkovia v škôlke celý deň?",
    a: "Nie. Pohyb, hra a kontakt s ostatnými psami sú dôležitou súčasťou dňa, ale rovnako dôležitý je pre nás oddych. V škôlke máme denný režim, v ktorom sa striedajú aktivity s časom na upokojenie a odpočinok.\n\u00a0Chceme, aby sa psík dokázal nielen hrať s ostatnými, ale aj oddychovať v prostredí, kde sú okolo neho ďalší psi a rôzne podnety.\n\u00a0Pri šteniatkach navyše prispôsobujeme dĺžku a intenzitu aktivít ich veku, aby sme zbytočne nepreťažovali vyvíjajúci sa pohybový aparát a organizmus.",
  },
  {
    q: "Čo ak môj psík ešte nikdy nebol v kolektíve psov?",
    a: "Práve na to slúži vstupná návšteva. Zistíme, ako psík reaguje na nové prostredie, cudzích ľudí a ostatných psov a či sa v kolektíve cíti dobre.\n\u00a0Ak zatiaľ so skupinou psov nemá skúsenosti, nemusí to byť problém. Zoznamovanie prebieha postupne a ku každému psíkovi pristupujeme individuálne. Ak potrebuje viac času, adaptačný proces prispôsobíme jeho tempu.",
  },
  {
    q: "Zabezpečujete aj vyzdvihnutie a odvoz psíka?",
    a: "Áno, ponúkame službu vyzdvihnutia a odvozu psíka za 5 € za jednu jazdu. Ak máte o ňu záujem, dajte nám, prosím, vedieť už spolu s rezerváciou psíka. Podrobnosti vieme doladiť individuálne po telefonickom kontakte.",
  },
  {
    q: "Prijímate aj šteniatka?",
    a: "Podmienkou prijatia je ukončené kompletné očkovanie vrátane očkovania proti kotercovému kašľu. V prípade záujmu o prihlásenie šteniatka nás, prosím, kontaktujte telefonicky, aby sme spolu prebrali všetky potrebné informácie a vhodný adaptačný proces pre vášho psíka.",
  },
  {
    q: "Zabezpečujete aj stravu?",
    a: "V rámci denného pobytu psíkom stravu nepodávame.\u00a0\nKeďže deň v škôlke zahŕňa pohyb, hry a šantenie, z bezpečnostných dôvodov chceme minimalizovať riziko torzie žalúdka, ktoré môže súvisieť aj s intenzívnou aktivitou po kŕmení.\u00a0\nPreto odporúčame psíka nakŕmiť s dostatočným predstihom pred príchodom do škôlky a ďalšie jedlo mu podať až po návrate domov a následnom oddychu.\n\u00a0Ak má váš psík alergiu alebo špeciálne stravovacie obmedzenia, prineste mu, prosím, vlastné maškrty.\n",
  },
  {
    q: "Aké sú otváracie hodiny?",
    a: "Sme tu pre vás každý pracovný deň od 7:00 do 17:00. Psíka môžete priniesť od 7:00 a vyzdvihnúť si ho kedykoľvek popoludní.",
  },
];


