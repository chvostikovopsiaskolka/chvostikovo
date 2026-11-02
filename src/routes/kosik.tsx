import { createFileRoute } from "@tanstack/react-router";
import { RetiredShopRedirect } from "@/components/site/RetiredShopRedirect";

export const Route = createFileRoute("/kosik")({
  head: () => ({
    meta: [
      { title: "Produkty | Chvostíkovo" },
      { name: "robots", content: "noindex, follow" },
      { httpEquiv: "refresh", content: "0;url=/produkty" },
    ],
    links: [{ rel: "canonical", href: "https://chvostikovo.sk/produkty" }],
  }),
  component: RetiredShopRedirect,
});
