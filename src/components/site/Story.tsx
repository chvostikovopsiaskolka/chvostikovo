import { Home, Zap, Dog, Check } from "lucide-react";
import { CARE, WHY, PHONE } from "@/content/site";

const whyIcons = [Home, Zap, Dog];

export function Care() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Ako sa postaráme o psíka</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {CARE.map((c) => (
            <article
              key={c.title}
              className="flex flex-col overflow-hidden rounded-4xl bg-card shadow-card"
            >
              <img src={c.img} alt={c.alt} loading="lazy" className="h-56 w-full object-cover" />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl text-forest">{c.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-forest/80">{c.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Why() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-4xl bg-forest px-6 py-12 text-cream sm:px-12">
          <h2 className="text-center font-display text-3xl text-cream sm:text-4xl">
            Prečo využiť psiu škôlku?
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {WHY.map((w, i) => {
              const Icon = whyIcons[i];
              return (
                <div
                  key={w.title}
                  className="rounded-3xl bg-cream/10 p-6 ring-1 ring-cream/15 backdrop-blur-sm"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-coral text-primary-foreground">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-xl text-cream">{w.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-cream/85">{w.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#kontakt" className="btn-coral">
              Mám záujem o škôlku
            </a>
            <a
              href={`tel:${PHONE}`}
              className="inline-flex items-center justify-center rounded-full border-2 border-cream/60 px-6 py-3 font-display font-semibold text-cream transition-colors hover:bg-cream hover:text-forest"
            >
              Zavolajte nám
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="o-nas" className="py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          <img
            src={CARE[1].img}
            alt="Opatrovatelia v psej škôlke Chvostíkovo"
            loading="lazy"
            className="col-span-2 h-64 w-full rounded-4xl object-cover shadow-card"
          />
          <img
            src={CARE[0].img}
            alt="Aktívny deň v psej škôlke"
            loading="lazy"
            className="h-44 w-full rounded-3xl object-cover shadow-card"
          />
          <img
            src={CARE[2].img}
            alt="Individuálny prístup ku psíkom"
            loading="lazy"
            className="h-44 w-full rounded-3xl object-cover shadow-card"
          />
        </div>

        <div>
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            O nás
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">Kto stojí za Chvostíkovom?</h2>
          <div className="mt-5 space-y-4 text-forest/85">
            <p>
              Sme starostlivá mladá dvojica, ktorú spája láska k psom, najmä k stredným a veľkým
              plemenám.
            </p>
            <p>
              Ako majitelia väčších psíkov sme si uvedomili, aké náročné môže byť nájsť miesto, kde
              by sme svojich štvornohých spoločníkov nechali s úplnou dôverou počas pracovného dňa
              či nečakaných povinností.
            </p>
            <p>
              Práve preto vzniklo Chvostíkovo – psia škôlka v Košiciach zameraná na stredné a veľké
              plemená, kde sú bezpečie, pohoda a individuálny prístup na prvom mieste. Máme
              dlhoročné skúsenosti s prácou so psami (práca v útulku, starostlivosť o psov v
              dočasnej opatere, výchova vlastných psíkov). Tieto skúsenosti nás naučili rozumieť
              ich potrebám, komunikácii aj správaniu v skupine.
            </p>
            <p>
              Chvostíkovo nie je len miesto na stráženie psov. Je to druhý domov, kde sa o každého
              člena svorky staráme s rovnakou zodpovednosťou a pozornosťou, akú venujeme našim
              vlastným psom.
            </p>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-display font-semibold text-forest">
            <Check className="size-5 text-coral" /> Zdravie a bezpečie vášho psíka je pre nás na
            prvom mieste!
          </p>
        </div>
      </div>
    </section>
  );
}

const PARTNERS = ["Veterina", "Krmivo", "Chovateľské potreby", "Psí tréning", "Salón"];

export function Partners() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-sm font-semibold tracking-widest text-forest/60 uppercase">
          Spolupracujeme
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {PARTNERS.map((p) => (
            <div
              key={p}
              className="flex h-16 min-w-40 items-center justify-center rounded-2xl bg-card px-6 font-display font-semibold text-forest/50 shadow-card"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
