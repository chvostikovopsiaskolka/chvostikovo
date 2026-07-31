import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL, PHONE_PRETTY } from "@/content/site";

const title = "Zásady ochrany osobných údajov | Chvostíkovo";
const description = "Zásady ochrany osobných údajov psej škôlky Chvostíkovo v Košiciach.";

export const Route = createFileRoute("/ochrana-osobnych-udajov")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="font-display text-sm font-semibold text-coral">
        ← Späť na hlavnú stránku
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Zásady ochrany osobných údajov</h1>

      <div className="mt-6 space-y-5 text-forest/85">
        <p>
          Prevádzkovateľom osobných údajov je psia škôlka Chvostíkovo, Poľská 6, 040 01 Košice,
          e-mail {EMAIL}, telefón {PHONE_PRETTY}. Ochranu vašich osobných údajov berieme vážne a
          spracúvame ich v súlade s Nariadením (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold text-forest">
          Aké údaje spracúvame a prečo
        </h2>
        <p>
          Cez kontaktné formuláre na tejto stránke spracúvame meno, telefónne číslo, e-mail a
          informácie o vašom psíkovi. Údaje používame výhradne na vybavenie vašej žiadosti,
          komunikáciu a poskytovanie služby psej škôlky. Právnym základom je predzmluvný vzťah,
          plnenie zmluvy a náš oprávnený záujem odpovedať na vašu otázku.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold text-forest">Doba uchovávania</h2>
        <p>
          Údaje uchovávame len po dobu nevyhnutnú na daný účel – pri nezáväzných dopytoch najviac 12
          mesiacov, pri klientoch po dobu trvania spolupráce a následne po dobu vyžadovanú právnymi
          predpismi.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold text-forest">Poskytovanie tretím stranám</h2>
        <p>
          Osobné údaje nepredávame. Môžu byť spracúvané našimi dodávateľmi technických služieb
          (hosting, e-mailová schránka), ktorí sú viazaní mlčanlivosťou a spracúvajú ich len podľa
          našich pokynov.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold text-forest">Fotografie a videá</h2>
        <p>
          Zo dňa v škôlke vyhotovujeme fotografie a videá psíkov, ktoré zdieľame s majiteľmi,
          prípadne na našich sociálnych sieťach. Ak si zverejnenie neželáte, stačí nám to oznámiť.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold text-forest">Vaše práva</h2>
        <p>
          Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania,
          prenosnosť, namietať proti spracúvaniu a podať sťažnosť na Úrad na ochranu osobných údajov
          SR. Svoje práva si môžete uplatniť na e-maile {EMAIL}.
        </p>
      </div>
    </main>
  );
}
