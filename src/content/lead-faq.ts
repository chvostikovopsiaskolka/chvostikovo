import { HOME_PRIMARY_FAQ } from "./home-faq";
import { FAQ } from "./site";
import { DAYCARE_ELIGIBILITY_ANSWER } from "./daycare-eligibility";

type LeadFaq = { id: string; q: string; a: string; href?: string; linkLabel?: string };
const answer = (question: string) => {
  const item = FAQ.find(item => item.q === question);
  if (!item) throw new Error("Missing canonical daycare FAQ: " + question);
  return item.a;
};

const sharedHomeAnswer = (q: string) => {
  const item = HOME_PRIMARY_FAQ.find(item => item.q === q);
  if (!item) throw new Error("Missing shared FAQ: " + q);
  return item.a;
};

/** One ordered campaign FAQ source; no widget coupling or tracking changes. */
export const LEAD_FAQ: readonly LeadFaq[] = [
  { id: "eligibility", q: "Pre koho je škôlka určená?", a: DAYCARE_ELIGIBILITY_ANSWER },
  { id: "supervision", q: "Bude môj psík počas dňa niekedy sám bez dozoru?", a: answer("Bude môj psík počas dňa niekedy sám bez dozoru?") },
  { id: "first-visit", q: "Ako prebieha prvá návšteva psíka v škôlke?", a: sharedHomeAnswer("Ako prebieha prvá návšteva psíka v škôlke?").split("\n")[0]!, href: "#lead-first-visit", linkLabel: "Prvá návšteva v 3 krokoch" },
  { id: "first-group", q: "Čo ak môj psík ešte nikdy nebol v kolektíve psov?", a: answer("Čo ak môj psík ešte nikdy nebol v kolektíve psov?") },
  { id: "taxi", q: "Zabezpečujete aj vyzdvihnutie a odvoz psíka?", a: answer("Zabezpečujete aj vyzdvihnutie a odvoz psíka?") },
  { id: "puppies", q: "Prijímate aj šteniatka?", a: sharedHomeAnswer("Prijímate aj šteniatka?"), href: "#aria-puppy-check", linkLabel: "Zistite, či šteniatko spĺňa podmienky" },
];
