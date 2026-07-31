import { useState } from "react";
import { ShieldCheck, HeartHandshake, Sparkles, Stethoscope, Check, Plus, Minus, Car } from "lucide-react";
import { REQUIREMENTS, PRICING, INCLUDED, FAQ, PHONE } from "@/content/site";

const reqIcons = [ShieldCheck, HeartHandshake, Sparkles, Stethoscope];

export function Requirements() {
  return (
    <section id="podmienky" className="py-16 sm:py-20">
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

export function FirstVisit() {
  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-6 rounded-4xl bg-secondary px-6 py-12 text-center sm:px-12">
          <h2 className="section-title text-3xl sm:text-4xl">Prvá návšteva škôlky</h2>
          <p className="max-w-2xl text-forest/85">
            Pred prvým dňom v škôlke nás čaká zoznamovacia návšteva. Počas nej zistíme, ako váš psík
            reaguje na nové prostredie a iných chlpáčov, aby sme mu zabezpečili čo najlepší štart.
          </p>
          <a href="#kontakt" className="btn-coral">
            Mám záujem o prvú návštevu
          </a>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="cennik" className="py-16 sm:py-20">
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

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
          {PRICING.map((p) => (
            <article
              key={p.name}
              className={`relative flex h-full flex-col rounded-4xl p-7 shadow-card ${
                p.highlight ? "bg-forest text-cream" : "bg-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-coral px-4 py-1 font-display text-xs font-semibold text-primary-foreground">
                  Najobľúbenejšia voľba
                </span>
              )}
              <h3
                className={`text-xl ${p.highlight ? "text-cream" : "text-forest"}`}
              >
                {p.name}
              </h3>
              <p
                className={`mt-3 font-display text-5xl font-bold ${
                  p.highlight ? "text-cream" : "text-coral"
                }`}
              >
                {p.price}
              </p>
              <p className={`mt-2 text-sm ${p.highlight ? "text-cream/85" : "text-forest/70"}`}>
                {p.note}
              </p>

              <ul className="mt-6 space-y-2.5 border-t pt-6 text-[0.92rem] leading-snug">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check
                      className={`mt-0.5 size-4 shrink-0 ${
                        p.highlight ? "text-coral-soft" : "text-coral"
                      }`}
                    />
                    <span className={p.highlight ? "text-cream/90" : "text-forest/85"}>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#kontakt"
                className={`mt-7 ${p.highlight ? "btn-coral" : "btn-outline-forest"} w-full`}
              >
                Mám záujem o škôlku
              </a>
            </article>
          ))}
        </div>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-display text-sm font-semibold text-forest">
          <Car className="size-5 text-coral" /> Vyzdvihnutie a odvoz psíka: 5 € za jednu jazdu
        </p>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-20">
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
