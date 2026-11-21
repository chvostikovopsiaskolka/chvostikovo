import { FAQ } from "@/content/site";
import { DAYCARE_ELIGIBILITY_ANSWER } from "@/content/daycare-eligibility";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

const HOME_CARE_FAQ = [
  { q: "Ako zabezpečujete bezpečnosť psíkov v škôlke?", a: FAQ.find((item) => item.q === "Ako zabezpečujete bezpečnosť psíkov v škôlke?")?.a ?? "" },
  { q: "Hrajú sa psíkovia v škôlke celý deň?", a: FAQ.find((item) => item.q === "Hrajú sa psíkovia v škôlke celý deň?")?.a ?? "" },
  { q: "Pre koho je škôlka určená?", a: DAYCARE_ELIGIBILITY_ANSWER },
];

export function HomeCareFaq() {
  return (
    <section id="home-care-faq" className="bg-secondary/30 px-4 py-7 lg:hidden">
      <div className="mx-auto max-w-xl">
        <h2 className="text-center font-display text-xl font-bold text-forest">Čo vás o starostlivosti zaujíma?</h2>
        <div className="mt-5 space-y-3">
          {HOME_CARE_FAQ.map(({ q, a }, index) => (
            <details key={q} onToggle={(event) => {
              if (event.currentTarget.open)
                void trackCookielessInteraction("explore_daycare", "home_care_faq_" + (index + 1), "sk");
            }} className="group overflow-hidden rounded-3xl bg-card p-4 shadow-card">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-display text-sm font-bold leading-snug text-forest">
                {q}<span className="text-lg text-coral transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <div className="mt-3 space-y-2 border-t border-forest/10 pt-3 text-[13px] leading-relaxed text-forest/80">
                {a.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
