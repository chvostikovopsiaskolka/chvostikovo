import { createFileRoute } from "@tanstack/react-router";
import { AriaPreviewPage } from "./test-aria";

const BASE_URL = "https://chvostikovo.sk";
const URL = `${BASE_URL}/psia-skolka-kosice`;
const title = "Psia škôlka Košice | Aktívny deň pre vášho psíka | Chvostíkovo";
const description =
  "Kým ste v práci, váš psík môže mať aktívny deň plný pohybu, hier, kamarátov a oddychu. Chvostíkovo – psia škôlka v Košiciach s celodenným dohľadom.";

const LANDING_FAQ_QUESTIONS = new Set([
  "Ako prebieha prvá návšteva psíka v škôlke?",
  "Bude môj psík počas dňa niekedy sám bez dozoru?",
  "Čo ak môj psík ešte nikdy nebol v kolektíve psov?",
  "Prijímate aj šteniatka?",
  "Zabezpečujete aj vyzdvihnutie a odvoz psíka?",
  "Aký je cenník služieb?",
]);

const LANDING_FAQ = FAQ.filter((item) => LANDING_FAQ_QUESTIONS.has(item.q));

const BENEFITS = [
  {
    icon: PawPrint,
    title: "Spoločnosť namiesto čakania",
    content: (
      <>
        Váš psík má počas dňa <strong className="font-bold text-forest">kamošov, pozornosť a príležitosti na hru</strong>.
        <span className="mt-1 block">Vy sa môžete <strong className="font-bold text-forest">venovať práci alebo svojim povinnostiam</strong>.</span>
      </>
    ),
  },
  {
    icon: PawPrint,
    title: "Pohyb, aktivity, ale aj oddych",
    content: (
      <>
        Psík má dostatok priestoru na <strong className="font-bold text-forest">fyzické aj mentálne vyžitie</strong>. S kamošmi sa vyšantí vo výbehu aj vo vnútri, no dbáme aj na jeho <strong className="font-bold text-forest">oddych</strong>.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Ľudia, ktorí ho spoznajú",
    content: (
      <>
        Zaujíma nás jeho <strong className="font-bold text-forest">povaha, zvyky</strong> aj to, čo mu vyhovuje. Počas celého pobytu na psíkov dohliadajú <strong className="font-bold text-forest">minimálne dvaja opatrovatelia</strong>.
      </>
    ),
  },
];

export const Route = createFileRoute("/psia-skolka-kosice")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:image", content: `${BASE_URL}/og-image.png` },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${BASE_URL}/og-image.png` },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  // Approved Aria preview becomes the actual paid lead experience. The
  // route-specific noindex/canonical head remains owned by this route.
  component: AriaPreviewPage,
});
