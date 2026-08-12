import { useState } from "react";
import { ShieldCheck, HeartHandshake, Sparkles, Stethoscope, Check, Plus, Minus, Car, Phone } from "lucide-react";
import { FormDialog } from "./FormDialog";
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

        <div className="mt-10 grid gap-5 md:grid-cols-2">
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
                <p className="mt-4 inline-flex items-center gap-2 font-display text-sm font-semibold text-forest">
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
              <p
                className={`mt-2 text-sm ${p.highlight ? "text-cream/85" : "text-forest/70"}`}
              >
                {p.note}
              </p>
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

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Časté otázky</h2>

        <div className="mt-10 space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-3xl bg-card shadow-card">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-display text-base font-semibold text-forest sm:text-lg"
              >
                {f.q}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-forest">
                  {open === i ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>
              {open === i && (
                <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-forest/80">{f.a}</p>
              )}
            </div>
          ))}
        </div>

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
