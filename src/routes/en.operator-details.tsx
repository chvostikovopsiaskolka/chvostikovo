import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL, PHONE, PHONE_PRETTY } from "@/content/site";

const title = "Operator Details | Chvostíkovo";
const description = "Identification and contact details for the operator of chvostikovo.sk and Chvostíkovo dog daycare.";
const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/en/operator-details`;

export const Route = createFileRoute("/en/operator-details")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: EnglishOperatorDetails,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 font-display text-xl font-bold text-forest">{children}</h2>;
}

function EnglishOperatorDetails() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/en/dog-daycare-kosice" className="font-display text-sm font-semibold text-coral">
        ← Back to the English page
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Operator details</h1>

      <p className="mt-4 text-forest/85">
        Identification and contact details for the operator of chvostikovo.sk and Chvostíkovo dog daycare.
      </p>

      <div className="mt-6 space-y-4 text-forest/85">
        <div>
          <H2>Operator</H2>
          <p className="mt-1">Marek Leder – Bellaris</p>
        </div>
        <div>
          <H2>Company ID (IČO)</H2>
          <p className="mt-1">56447001</p>
        </div>
        <div>
          <H2>Registered place of business</H2>
          <p className="mt-1">Miškovecká 1023/2, 040 11 Košice-Juh, Slovakia</p>
        </div>
        <div>
          <H2>Chvostíkovo premises</H2>
          <p className="mt-1">Poľská 2207/6, 040 01 Košice-Juh, Slovakia</p>
        </div>
        <div>
          <H2>Trade Register</H2>
          <p className="mt-1">Registered in the Trade Register of the District Office Košice, no. 820-106266.</p>
        </div>
        <div>
          <H2>Contact</H2>
          <ul className="mt-1 list-none space-y-1">
            <li>
              E-mail:{" "}
              <a href={`mailto:${EMAIL}`} className="font-semibold text-coral hover:underline">{EMAIL}</a>
            </li>
            <li>
              Phone:{" "}
              <a href={`tel:${PHONE}`} className="font-semibold text-coral hover:underline">{PHONE_PRETTY}</a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
