import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// Keep the old bookmark as a prerendered permanent meta-refresh alias on Pages,
// not as a second FAQ document. The canonical content lives on the homepage.
export const Route = createFileRoute("/caste-otazky")({
  head: () => ({
    meta: [
      { title: "Časté otázky | Chvostíkovo" },
      { name: "robots", content: "noindex, follow" },
      { httpEquiv: "refresh", content: "0;url=/#faq" },
    ],
    links: [{ rel: "canonical", href: "https://chvostikovo.sk/" }],
  }),
  component: RetiredFaqRedirect,
});

function RetiredFaqRedirect() {
  useEffect(() => { window.location.replace("/#faq"); }, []);
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-center">
      <h1 className="text-3xl text-forest">Časté otázky nájdete na hlavnej stránke</h1>
      <a href="/#faq" className="btn-coral mt-6 inline-flex">Prejsť na časté otázky</a>
    </main>
  );
}
