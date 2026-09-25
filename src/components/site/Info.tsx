import { useState } from "react";
import { ShieldCheck, HeartHandshake, Sparkles, Stethoscope, Check, Plus, Minus, Car, Phone } from "lucide-react";
import { FormDialog } from "./FormDialog";
import { Collapse } from "./Collapse";
import { LongForm } from "./Forms";
import { REQUIREMENTS, PRICING, INCLUDED, FAQ, PHONE, PHONE_PRETTY } from "@/content/site";

const reqIcons = [ShieldCheck, HeartHandshake, Sparkles, Stethoscope];

export function Requirements() {
  return (
    <section id="podmienky" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            Podmienky prijatia
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">Čo musí psík spĺňať</h2>
        </div>

        {/* Mobil – rozbaľovacie karty */}
        <div className="mt-8 space-y-3 md:hidden">
          {REQUIREMENTS.map((r, i) => {
            const Icon = reqIcons[i]!;
            return (
              <Collapse
                key={r.title}
                title={r.title}
                icon={
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-forest">
                    <Icon className="size-5" />
                  </span>
                }
              >
                {r.text}
              </Collapse>
            );
          })}
        </div>

        {/* Desktop – pôvodné karty */}
        <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2">
          {REQUIREMENTS.map((r, i) => {
            const Icon = reqIcons[i]!;
            return (
              <article key={r.title} className="rounded-4xl bg-card p-7 shadow-card">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-forest">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-4 text-xl text-forest">{r.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-forest/80">{r.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Prvý kontakt",
    text: "Zavoláte nám alebo vyplníte formulár. Poviete nám o psíkovi a dohodneme si termín zoznamovacej návštevy.",
  },
  {
    title: "Zoznamovacia návšteva",
    text: "Zistíme, ako váš psík reaguje na nové prostredie a iných chlpáčov. Prejdeme si spolu priestory, režim dňa aj jeho potreby.",
    note: "Zoznamovacia návšteva je bezplatná",
  },
  {
    title: "Prvý deň v škôlke",
    text: "Psík nastupuje do svorky pod dohľadom opatrovateľov. Počas dňa vám posielame fotky a videá, aby ste vedeli, ako sa má.",
  },
];

export function FirstVisit() {
  const [open, setOpen] = useState(false);

  return (
    <section id="prva-navsteva" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            Ako to funguje
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">Prvá návšteva v 3 krokoch</h2>
          <p className="mt-3 text-forest/80">Prehľadný proces bez zbytočných komplikácií.</p>
        </div>

        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-4xl bg-card p-7 pt-9 shadow-card">
              <span className="absolute -top-5 left-7 flex size-11 items-center justify-center rounded-full bg-coral font-display text-lg font-bold text-primary-foreground shadow-card">
                {i + 1}
              </span>
              <h3 className="text-xl text-forest">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-forest/80">{s.text}</p>
              {s.note && (
                <p className="mt-4 flex items-start gap-2 font-display text-sm font-semibold text-forest">
                  <Check className="size-5 shrink-0 text-forest" /> {s.note}
                </p>
              )}
              {i === 0 && (
                <a
                  href={`tel:${PHONE}`}
                  className="mt-4 inline-flex items-center gap-2 font-display text-sm font-semibold text-coral"
                >
                  <Phone className="size-4" /> {PHONE_PRETTY}
                </a>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex justify-center">
          <button type="button" onClick={() => setOpen(true)} className="btn-coral">
            Prihláška do škôlky
          </button>
        </div>
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Prihlás svojho psíka ešte dnes"
        subtitle="Vyplňte formulár, v ktorom nám poviete viac o vašom psíkovi. Následne sa vám ozveme a dohodneme ďalší postup pri jeho prihlásení do škôlky."
      >
        <LongForm onSent={() => setTimeout(() => setOpen(false), 2200)} />
      </FormDialog>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="cennik" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
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
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 font-display text-xs font-semibold whitespace-nowrap text-primary-foreground">
                  Najvýhodnejšie
                </span>
              )}
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
                  10 vstupov – ušetríte 50 €.
                  <strong className="mt-1 block font-bold">Permanentka platí 2 mesiace.</strong>
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-4xl bg-card p-7 shadow-card sm:p-9">
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

          <p className="mt-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-center font-display text-sm font-semibold text-forest">
            <Car className="size-5 text-coral" /> Vyzdvihnutie a odvoz psíka: 5 € za jednu jazdu
          </p>

          <div className="mt-7 flex justify-center">
            <a href="#kontakt" className="btn-coral">
              Prihláška do škôlky
            </a>
          </div>
        </div>

      </div>
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
const PRACTICAL_FAQ = FAQ.filter((item) => !PRIMARY_FAQ_QUESTIONS.has(item.q));

function FaqList({ items }: { items: Array<(typeof FAQ)[number]> }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mt-8 space-y-3">
      {items.map((f, i) => (
        <div key={f.q} className="overflow-hidden rounded-3xl bg-card shadow-card">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left font-display text-sm font-semibold text-forest sm:text-base"
          >
            {f.q}
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-forest sm:size-8">
              {open === i ? <Minus className="size-3.5 sm:size-4" /> : <Plus className="size-3.5 sm:size-4" />}
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5 text-left text-[0.95rem] leading-relaxed text-forest/80">
              <p className="whitespace-pre-line">{f.a}</p>
              {f.q === "Bude môj psík počas dňa niekedy sám bez dozoru?" && (
                <a
                  href="#starostlivost"
                  className="mt-4 inline-flex font-display text-sm font-semibold text-coral underline-offset-4 hover:underline"
                >
                  Pozrieť, ako sa o psíkov staráme počas dňa →
                </a>
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

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-card pt-16 pb-12 sm:pt-20 sm:pb-14">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Časté otázky</h2>
        <FaqList items={PRIMARY_FAQ} />
        <div className="mt-7 flex justify-center">
          <a href="#dalsie-otazky" className="btn-coral">
            Ďalšie časté otázky
          </a>
        </div>
      </div>
    </section>
  );
}

export function PracticalFaq() {
  return (
    <section id="dalsie-otazky" className="scroll-mt-24 bg-secondary/45 py-12 sm:py-14">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Ďalšie časté otázky</h2>
        <FaqList items={PRACTICAL_FAQ} />

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
