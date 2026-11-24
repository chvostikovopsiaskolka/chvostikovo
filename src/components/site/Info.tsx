import { useState } from "react";
import { Syringe, PawPrint, Droplets, HeartPulse, Check, Plus, Minus, Car } from "lucide-react";
import { FormDialog } from "./FormDialog";
import { LongForm } from "./Forms";
import { LeadStepForm } from "./LeadStepForm";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { GALLERY, REQUIREMENTS, PRICING, INCLUDED, FAQ, PHONE } from "@/content/site";
import { ARIA_PREVIEW_REQUIREMENTS, AriaHighlightedText } from "@/components/site/AriaPreviewText";
import { SectionAmbientPaws } from "./SectionAmbientPaws";
import { FirstVisitPhoto } from "./FirstVisitPhoto";
import { InquirySection } from "./InquirySection";
import { ContextFaq, FaqAnswer } from "./ContextFaq";
import { DAYCARE_ELIGIBILITY_ANSWER } from "@/content/daycare-eligibility";


/** Reuse the exact approved lead answers, with native keyboard-accessible disclosure. */
export function DaycareEarlyFaq() {
  const items = [
    { q: "Pre koho je škôlka určená?", a: DAYCARE_ELIGIBILITY_ANSWER },
    ...FAQ.filter(({ q }) => q === "Bude môj psík počas dňa niekedy sám bez dozoru?"),
    ...FAQ.filter(({ q }) => q === "Prijímate aj šteniatka?"),
  ];
  return (
    <section id="home-early-faq" className="relative overflow-hidden bg-secondary py-9 sm:py-12">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <h2 className="section-title text-center text-2xl sm:text-3xl">Čo je dobré vedieť o škôlke?</h2>
        <div className="mt-5 space-y-3">
          {items.map(item => <details key={item.q} className="group rounded-3xl border border-forest/10 bg-card p-4 shadow-card">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-display text-sm font-bold text-forest sm:text-base">
              {item.q === "Prijímate aj šteniatka?" ? "Čo ak chcete prihlásiť šteniatko?" : item.q}<span aria-hidden="true" className="text-lg text-coral group-open:rotate-45">+</span>
            </summary>
            <div className="mt-2 border-t border-forest/10 pt-3 text-sm leading-relaxed text-forest/80">
              <FaqAnswer question={item.q} answer={item.a} />
              {item.q === "Prijímate aj šteniatka?" && (
                <a href="#aria-puppy-check" data-home-faq-puppy-cta
                  onClick={() => void trackCookielessInteraction("explore_daycare", "home_requirements_puppy_checker")}
                  className="btn-coral mt-4 inline-flex min-h-11 items-center justify-center px-5 py-3 text-center text-sm font-bold text-white">
                  Overiť pripravenosť šteniatka
                </a>
              )}
            </div>
          </details>)}
        </div>
      </div>
    </section>
  );
}

const reqIcons = [Syringe, PawPrint, Droplets, HeartPulse];

export function Requirements({ id = "podmienky", showContextFaq = false, ariaPreview = false, hideEyebrow = false }: { id?: string; showContextFaq?: boolean; ariaPreview?: boolean; hideEyebrow?: boolean } = {}) {
  return (
    <section id={id} className={"relative scroll-mt-24 overflow-hidden " + (ariaPreview ? "py-10 sm:py-12" : "py-16 sm:py-20")}>
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center">
          {!hideEyebrow && <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Podmienky prijatia</span>}
          <h2 className={"section-title text-3xl sm:text-4xl " + (hideEyebrow ? "" : "mt-2")}>Čo musí psík spĺňať</h2>
          <p className="mt-3 text-sm text-forest/65 sm:hidden">Potiahnite do strany a pozrite si všetky podmienky.</p>
        </div>

        {/* All conditions remain visible and swipeable on mobile; two-column grid from sm upwards. */}
        <div role="region" aria-label="Podmienky prijatia – posúvajte do strany" tabIndex={0} className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
          {(ariaPreview ? ARIA_PREVIEW_REQUIREMENTS : REQUIREMENTS).map((r, i) => {
            const Icon = reqIcons[i]!;
            return (
              <article key={r.title} className="w-[86%] shrink-0 snap-start rounded-3xl border border-forest/10 bg-card p-6 shadow-card sm:w-auto sm:shrink sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-forest">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#ffa414] sm:text-xl">{r.title}</h3>
                </div>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-forest/80"><AriaHighlightedText text={r.text} /></p>
              </article>
            );
          })}
        </div>
        {showContextFaq && <div className="mx-auto mt-6 max-w-3xl">
          <ContextFaq question="Prijímate aj šteniatka?" label="Čo ak chcete prihlásiť šteniatko?" source="home_requirements_puppy">
            <a href="#aria-puppy-check" onClick={() => void trackCookielessInteraction("explore_daycare", "home_requirements_puppy_checker")}
              className="btn-coral mt-4 inline-flex min-h-11 items-center justify-center px-5 py-3 text-center text-sm font-bold text-white shadow-card">Overiť pripravenosť šteniatka</a>
          </ContextFaq>
        </div>}
      </div>
    </section>
  );
}

/** Canonical first-visit explanation reused on home and paid LEAD.
 *  The former long expandable duplicate is folded into these three steps. */
export const FIRST_VISIT_STEPS = [
  {
    title: "Porozprávame sa o vašom psíkovi",
    content: <><strong className="font-extrabold">Pred nástupom do škôlky</strong> absolvuje každý nový psík <strong className="font-extrabold">úvodnú návštevu</strong>. Napíšte nám alebo zavolajte, povedzte nám o jeho povahe, potrebách a skúsenostiach a dohodneme si termín.</>,
  },
  {
    title: "Prídete nás spoznať",
    content: <>Počas návštevy sa postupne zoznámime so psíkom a sledujeme jeho reakcie na nové prostredie, ľudí a ostatných psov. <strong className="font-extrabold">Nie každý psík si zvykne rovnako rýchlo.</strong> Šteniatkam a bojazlivejším psíkom môžeme odporučiť ešte <strong className="font-extrabold">2–3 kratšie návštevy</strong> s majiteľom alebo krátky pobyt bez neho.</>,
    note: "Úvodná návšteva je zadarmo",
  },
  {
    title: "Dohodneme ďalší postup",
    content: <><strong className="font-extrabold">Dôležité je povedať nám o psíkovi pravdivo všetko – nielen to dobré.</strong> Podľa jeho povahy, správania a priebehu adaptácie určíme vhodný ďalší postup. Ak mu kolektív vyhovuje, dohodneme prvý pobyt a počas dňa vám pošleme fotky či videá.</>,
  },
];

export function FirstVisit({ inlineForm = false, leadStyle = false }: { inlineForm?: boolean; leadStyle?: boolean } = {}) {
  const [open, setOpen] = useState(false);

  return (
    <>
    <section id="prva-navsteva" className={"relative scroll-mt-24 overflow-hidden py-10 sm:py-14 " + (leadStyle ? "bg-[#91406b] text-white" : "")}>
      <SectionAmbientPaws tone={leadStyle ? "dark" : "light"} />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className={"font-display text-sm font-semibold tracking-wide uppercase " + (leadStyle ? "text-coral-soft" : "text-coral")}>
            Ako to funguje
          </span>
          <h2 className={"mt-2 text-3xl sm:text-4xl " + (leadStyle ? "text-white" : "section-title")}>Prvá návšteva v 3 krokoch</h2>
          <p className={"mt-3 " + (leadStyle ? "text-white/80" : "text-forest/80")}>Najprv sa spoznáme a spolu zistíme, či sa váš psík bude u nás cítiť dobre.</p>
        </div>

        <ol className="mx-auto mt-10 grid max-w-5xl gap-9 text-center md:grid-cols-3 md:gap-8">
          {FIRST_VISIT_STEPS.map((s, i) => (
            <li key={s.title} data-first-visit-step={i + 1} className="min-w-0">
              <FirstVisitPhoto number={i + 1} image={GALLERY[[2, 0, 5][i]!]!.src} alt={GALLERY[[2, 0, 5][i]!]!.alt} />
              <h3 className={"font-display text-lg font-bold leading-snug " + (leadStyle ? "text-white" : "text-forest")}>{s.title}</h3>
              <p className={"mt-2 text-sm leading-relaxed " + (leadStyle ? "text-white/85" : "text-forest/80")}>{s.content}</p>
              {s.note && <p data-home-free-visit className={"mt-3 inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold shadow-card " + (leadStyle ? "bg-[#ffa414] text-[#26322b]" : "bg-secondary text-forest")}>{s.note}</p>}
            </li>
          ))}
        </ol>


        {!inlineForm && <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              trackMarketingInteraction("inquiry_cta", "home_first_visit_interest");
              void trackCookielessInteraction("inquiry_cta", "home_first_visit_interest");
              setOpen(true);
            }}
            className="btn-coral inline-flex min-w-[220px] items-center justify-center px-7 py-3.5 text-[15px] sm:min-w-[310px] sm:px-10 sm:py-4 sm:text-lg"
          >
            Dohodnúť úvodnú návštevu
          </button>
        </div>}
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Čo hľadáte pre svojho psíka?"
        subtitle="Nechajte nám kontakt a ozveme sa vám. Termín úvodnej návštevy dohodneme po preverení zdravotných podmienok a platných očkovaní vášho psíka."
      >
        <LeadStepForm questionInHeading trackingSource="home_first_visit_interest" />
      </FormDialog>
    </section>
    {inlineForm && <div className="bg-card pt-8">
      <InquirySection allScreens matchHero id="prva-navsteva-form" trackingSource="home_first_visit_interest" title="Máte záujem o prvú návštevu?" />
    </div>}
    </>
  );
}

export function Pricing({ interestMode = false, homeLayout = false }: { interestMode?: boolean; homeLayout?: boolean } = {}) {
  const [open, setOpen] = useState(false);

  if (homeLayout) return (
    <section id="cennik" data-home-pricing className="relative scroll-mt-24 overflow-hidden bg-secondary py-10 sm:py-14">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Cenník našich služieb</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-forest/80 sm:text-base">V každom vstupe dostane psík to isté – nerobíme rozdiely. Permanentka je len výhodnejšia.</p>
        <div data-home-pricing-columns className="mx-auto mt-7 grid max-w-3xl grid-cols-2 items-stretch gap-3 sm:gap-6">
          <div data-home-prices className="col-span-2 mb-2 grid min-w-0 grid-cols-2 items-stretch gap-3 sm:mb-3 sm:gap-5">
            {PRICING.map(item => <article key={item.name} data-home-price-card={item.highlight ? "pass" : "single"}
              className={"relative grid min-w-0 grid-rows-[auto_auto_auto] content-start items-center justify-items-center gap-1 rounded-3xl px-2 pb-5 pt-3 text-center shadow-card sm:px-4 sm:pb-6 sm:pt-4 " + (item.highlight ? "bg-[#f8ddeb] ring-2 ring-coral" : "bg-card")}>
              <h3 className="whitespace-nowrap font-display text-[clamp(11px,3.3vw,15px)] font-bold leading-snug text-forest sm:text-xl">{item.name}</h3>
              <p data-home-price className={"whitespace-nowrap font-display text-[clamp(22px,6vw,30px)] font-bold leading-tight sm:text-4xl " + (item.highlight ? "text-[#b82e7f]" : "text-[#ffa414]")}>{item.highlight ? <>{Number.parseInt(item.price, 10) / 10}&nbsp;€</> : item.price.replace(" ", "\u00a0")}<span className="text-[0.55em]"> / deň</span></p>
              {item.highlight ? <>
                <p data-home-pass-total className="whitespace-nowrap font-display text-[clamp(10px,3vw,14px)] font-semibold leading-snug text-forest sm:text-lg"><strong>{item.price.replace(" ", "\u00a0")}</strong> · 10 vstupov</p>
                <span data-home-best-value className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 translate-y-1/2 items-center justify-center whitespace-nowrap rounded-full bg-coral px-1.5 py-1 font-display text-[clamp(8px,2.15vw,12px)] font-bold leading-tight tracking-[-0.025em] text-white shadow-sm">Najvýhodnejšie. Ušetríte 50&nbsp;€</span>
              </> : <p data-home-opening-hours className="text-xs leading-snug text-forest/75 sm:text-sm">Pondelok – piatok<br />od 7:00 do 17:00</p>}
            </article>)}
          </div>
          <div data-home-included className="col-span-2 min-w-0 rounded-3xl bg-card p-4 shadow-card sm:p-6 lg:p-8">
            <h3 className="text-center font-display text-base font-bold text-forest sm:text-xl">Čo je v cene zahrnuté</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs leading-relaxed sm:gap-x-6 sm:text-base">
              {INCLUDED.filter(item => item !== "Fotky a videá z priebehu dňa").map(item => <li key={item} className="flex min-w-0 gap-1.5 sm:gap-2.5"><Check className="mt-1 size-3 shrink-0 text-coral-dark sm:size-4" aria-hidden="true" /><span className="min-w-0 text-forest/85">{item}</span></li>)}
            </ul>
          </div>
          <p data-home-taxi className="col-span-2 flex min-w-0 items-center justify-center gap-1.5 rounded-2xl bg-[#c92c89] px-2 py-3 text-center text-[clamp(10px,3vw,14px)] font-semibold leading-snug text-white sm:gap-2 sm:text-sm">
            <Car className="size-4 shrink-0 text-white sm:size-5" aria-hidden="true" />
            <span className="whitespace-nowrap">Odvoz a vyzdvihnutie: <strong>5&nbsp;€ / jazda</strong></span>
          </p>
        </div>
      </div>
    </section>
  );

  return (
    <section id="cennik" className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            Cenník
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">Cenník našich služieb</h2>
          <p className="mt-3 text-forest/80">
            V každom vstupe dostane psík to isté – nerobíme rozdiely. Permanentka je len výhodnejšia.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          {PRICING.map((p) => (
            <article
              key={p.name}
              className={`relative flex flex-col items-center rounded-3xl p-6 text-center shadow-card ${
                p.highlight ? "bg-forest text-cream ring-2 ring-coral" : "bg-card"
              }`}
            >
              <h3 className={`mt-2 text-lg ${p.highlight ? "text-cream" : "text-forest"}`}>
                {p.name}
              </h3>
              <p
                className={`mt-3 font-display text-4xl font-bold ${
                  p.highlight ? "text-cream" : "text-coral"
                }`}
              >
                {p.price}
              </p>
              {p.name === "Permanentka" ? (
                <p className={`mt-2 text-sm ${p.highlight ? "text-cream/85" : "text-forest/70"}`}>
                  10 vstupov.
                  <strong className="mt-1 block font-bold">Permanentka platí 2 mesiace.</strong>
                </p>
              ) : null}
              {p.highlight && (
                <span data-home-best-value className="mt-auto inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full bg-coral px-2 py-1.5 font-display text-[clamp(8px,2.2vw,12px)] font-bold tracking-[-0.02em] text-white">
                  Najvýhodnejšie. Ušetríte 50 €
                </span>
              )}
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-4xl bg-card p-7 shadow-card sm:p-9 lg:mx-auto lg:max-w-2xl lg:rounded-4xl lg:bg-card lg:p-8 lg:shadow-card">
          <h3 className="text-center text-xl text-forest">
            Čo je v cene zahrnuté pri každom vstupe
          </h3>
          <ul className="mx-auto mt-6 grid max-w-3xl gap-3 text-left text-[0.95rem] sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-coral" />
                <span className="text-forest/85">{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 flex flex-nowrap items-center justify-center gap-1 rounded-2xl bg-secondary px-2 py-3 text-center font-display text-[clamp(10px,2.8vw,13px)] font-semibold leading-tight whitespace-nowrap text-forest sm:gap-2 sm:px-5 sm:text-sm lg:mx-auto lg:w-fit lg:rounded-full lg:bg-coral/10 lg:py-2">
            <Car className="size-4 shrink-0 text-coral sm:size-5" /> <span>Odvoz / vyzdvihnutie: 5 € / jazda</span>
          </p>

          <div className="mt-7 flex justify-center">
            <button type="button" onClick={() => {
              if (interestMode) {
                trackMarketingInteraction("inquiry_cta", "home_pricing_interest_20261028");
                void trackCookielessInteraction("inquiry_cta", "home_pricing_interest_20261028");
              }
              setOpen(true);
            }} className={interestMode ? "btn-coral w-full !px-1.5 !text-[clamp(10px,2.75vw,14px)] !leading-tight whitespace-nowrap sm:w-auto sm:!px-6 sm:!text-base" : "btn-coral"}>
              {interestMode ? "Mám záujem o psiu škôlku pre psíka" : "Prihláška do škôlky"}
            </button>
          </div>
        </div>

      </div>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={interestMode ? "Čo hľadáte pre svojho psíka?" : "Prihláška do škôlky"}
        subtitle={interestMode ? "Nechajte nám kontakt. Ozveme sa vám a dohodneme ďalší postup." : "Povedzte nám viac o svojom psíkovi. Po odoslaní prihlášky sa vám ozveme a dohodneme ďalší postup."}
      >
        {interestMode ? <LeadStepForm questionInHeading trackingSource="home_pricing_interest_20261028" /> : <LongForm />}
      </FormDialog>
    </section>
  );
}

const PRIMARY_FAQ_QUESTIONS = new Set([
  "Bude môj psík počas dňa niekedy sám bez dozoru?",
  "Ako prebieha prvá návšteva psíka v škôlke?",
  "Ako zabezpečujete bezpečnosť psíkov v škôlke?",
  "Čo ak môj psík ešte nikdy nebol v kolektíve psov?",
  "Prijímate aj šteniatka?",
  "Hrajú sa psíkovia v škôlke celý deň?",
]);

const PRIMARY_FAQ = FAQ.filter((item) => PRIMARY_FAQ_QUESTIONS.has(item.q));
export const HOME_PRIMARY_FAQ = [...PRIMARY_FAQ, { q: "Pre koho je škôlka určená?", a: DAYCARE_ELIGIBILITY_ANSWER }];
const PRACTICAL_FAQ = FAQ.filter((item) => !PRIMARY_FAQ_QUESTIONS.has(item.q));

function FaqList({ items, source, homeLayout = false }: { items: Array<(typeof FAQ)[number]>; source: string; homeLayout?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mt-8 space-y-3">
      {items.map((f, i) => (
        <div key={f.q} className="overflow-hidden rounded-[2rem] bg-card shadow-card">
          <button
            type="button"
            aria-expanded={open === i}
            onClick={() => {
              if (open !== i) void trackCookielessInteraction("explore_daycare", `faq_${source}_${i + 1}`);
              setOpen(open === i ? null : i);
            }}
            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-display text-[1.05rem] font-bold leading-snug text-forest sm:px-6 sm:py-5 sm:text-lg"
          >
            {f.q}
            <span className="flex shrink-0 items-center justify-center text-coral">
              {open === i ? <Minus className="size-5" /> : <Plus className="size-5" />}
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5 text-left text-[0.95rem] leading-relaxed text-forest/80 sm:px-6 sm:pb-6">
              <FaqAnswer question={f.q} answer={f.a} />
              {homeLayout && f.q === "Prijímate aj šteniatka?" && (
                <a href="#aria-puppy-check" onClick={() => void trackCookielessInteraction("explore_daycare", "home_requirements_puppy_checker")} className="btn-coral mt-4 flex w-fit min-h-11 items-center justify-center px-5 py-3 text-center text-sm font-bold text-white">Overiť pripravenosť šteniatka</a>
              )}
              {f.q === "Prijímate aj šteniatka?" && (
                <a
                  href="/psia-skolka-pre-steniatka"
                  className="mt-4 inline-flex font-display text-sm font-semibold text-coral underline-offset-4 hover:underline"
                >
                  Viac o psej škôlke pre šteniatka →
                </a>
              )}
              {f.q === "Aký je cenník služieb?" && (
                <a
                  href="/#cennik"
                  className="mt-4 inline-flex font-display text-sm font-semibold text-coral underline-offset-4 hover:underline"
                >
                  Prejsť na cenník →
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function Faq({ homeLayout = false }: { homeLayout?: boolean } = {}) {
  return (
    <section id="faq" className="relative scroll-mt-24 overflow-hidden bg-secondary/40 pt-16 pb-12 sm:pt-20 sm:pb-14">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Časté otázky</h2>
        <FaqList items={homeLayout ? HOME_PRIMARY_FAQ : PRIMARY_FAQ} source="home" homeLayout={homeLayout} />
        <div className="mt-7 flex justify-center">
          <a href="/caste-otazky" className="btn-coral">
            Viac častých otázok
          </a>
        </div>
      </div>
    </section>
  );
}

export function PracticalFaq() {
  return (
    <section id="dalsie-otazky" className="relative scroll-mt-24 overflow-hidden bg-secondary/45 py-12 sm:py-14">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Ďalšie časté otázky</h2>
        <FaqList items={PRACTICAL_FAQ} source="practical" />

        <p className="mt-8 text-center text-forest/80">
          Nenašli ste odpoveď?{" "}
          <a href={`tel:${PHONE}`} className="font-semibold text-coral underline-offset-4 hover:underline">
            Zavolajte nám
          </a>
        </p>
      </div>
    </section>
  );
}
