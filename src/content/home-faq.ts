import { FAQ, PRICING, DAYCARE_LOCATION_QUESTION, DAYCARE_LOCATION_ANSWER } from "./site";
import { DAYCARE_ELIGIBILITY_ANSWER } from "./daycare-eligibility";

export const HOME_PRICE_QUESTION = "Aký je cenník a treba si rezervovať miesto vopred?";
function faqAnswer(question: string) {
  return FAQ.find(item => item.q === question)?.a ?? "";
}
export const HOME_PRIMARY_FAQ = [
  { trackingId: 7, q: "Pre koho je škôlka určená?", a: DAYCARE_ELIGIBILITY_ANSWER },
  { trackingId: 2, q: "Ako prebieha prvá návšteva psíka v škôlke?",
    a: "Pred nástupom absolvuje každý nový psík bezplatnú vstupnú návštevu. Zoznámime sa s ním a sledujeme jeho reakcie na prostredie, ľudí a ostatných psov. Ak ešte nemá skúsenosti s kolektívom, nemusí to byť problém – zoznamovanie prebieha postupne.\nŠteniatkam, bojazlivejším psíkom a psíkom, ktoré potrebujú viac času, môžeme odporučiť ešte 2–3 kratšie návštevy s majiteľom alebo niekoľkohodinový pobyt bez neho. Adaptáciu prispôsobujeme tempu psíka.\nJe dôležité povedať nám o psíkovi pravdivo všetko vrátane jeho povahy, skúseností, obáv a problémových situácií." },
  { trackingId: 3, q: "Ako zabezpečujete bezpečnosť psíkov v škôlke?",
    a: "Bezpečnosť začína už vstupnou návštevou. Agresívne psy alebo psíky nevhodné do kolektívu neprijímame; Chvostíkovo nie je výcvikové centrum.\nPočas celého pobytu sú psíkovia pod neustálym dohľadom minimálne dvoch skúsených opatrovateľov. Sledujeme vzájomné interakcie a včas predchádzame konfliktom.\nAktivitu prispôsobujeme psíkom a počasiu. V horúčavách obmedzujeme intenzívny pohyb, pri nepriaznivom počasí volíme kratšie a podľa potreby častejšie venčenie. Ak sa psík necíti dobre alebo sa zmení jeho zdravotný stav, konzultujeme situáciu s majiteľom a podľa potreby pobyt ukončíme skôr." },
  { trackingId: 4, q: "Hrajú sa psíkovia v škôlke celý deň?", a: faqAnswer("Hrajú sa psíkovia v škôlke celý deň?") },
  { trackingId: 6, q: "Prijímate aj šteniatka?",
    a: "Áno, približne od 4 mesiacov podľa individuálnej pripravenosti. Podmienkou je ukončené kompletné očkovanie vrátane očkovania proti kotercovému kašľu, dobrý zdravotný stav a vhodný adaptačný proces. Pripravenosť šteniatka si môžete orientačne overiť nižšie; konečné prijatie posúdime na úvodnej návšteve." },
  { trackingId: 8, q: HOME_PRICE_QUESTION,
    a: `Jednorazový celodenný vstup stojí ${PRICING[0]!.price}. Permanentka stojí ${PRICING[1]!.price}, zahŕňa 10 vstupov (20 € za deň) a platí 2 mesiace. Úvodná návšteva je bezplatná.\nMiesto si rezervujte vopred, ideálne na celý nasledujúci týždeň do nedele 20:00. Ak potrebujete rezervovať neskôr, žiadosť cez zákaznícku aplikáciu môžete odoslať najneskôr deň vopred do 19:00 podľa voľnej kapacity. Po tomto čase nám napíšte správu a dohodneme sa individuálne.` },
  { trackingId: 9, q: "Aké sú otváracie hodiny a ponúkate aj odvoz?",
    a: faqAnswer("Aké sú otváracie hodiny?") + "\n" + faqAnswer("Zabezpečujete aj vyzdvihnutie a odvoz psíka?") },
  { trackingId: 10, q: "Zabezpečujete aj stravu?", a: faqAnswer("Zabezpečujete aj stravu?") },
  { trackingId: 12, q: DAYCARE_LOCATION_QUESTION, a: DAYCARE_LOCATION_ANSWER },
];


