import { createFileRoute } from "@tanstack/react-router";
import { AriaPreviewPage } from "./test-aria";

const BASE_URL = "https://chvostikovo.sk";
const URL = `${BASE_URL}/psia-skolka-kosice`;
const title = "Psia škôlka Košice | Aktívny deň pre vášho psíka | Chvostíkovo";
const description =
  "Kým ste v práci, váš psík môže mať aktívny deň plný pohybu, hier, kamarátov a oddychu. Chvostíkovo – psia škôlka v Košiciach s celodenným dohľadom.";

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
