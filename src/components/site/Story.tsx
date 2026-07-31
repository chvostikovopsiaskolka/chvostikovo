import { Home, Zap, Dog, Check } from "lucide-react";
import { CARE, WHY, PHONE, CERTIFICATES } from "@/content/site";
import teamPhoto from "@/assets/team-dogs.jpg.asset.json";
import wetpet from "@/assets/partner-wetpet.png";
import bellacord from "@/assets/partner-bellacord.png";
import coursing from "@/assets/partner-coursing.png";
import lolkio from "@/assets/partner-lolkio.png";

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
              const Icon = whyIcons[i]!;
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
        </div>

        <img
          src={teamPhoto.url}
          alt="Majitelia psej škôlky Chvostíkovo so svojimi psíkmi"
          loading="lazy"
          className="h-80 w-full rounded-4xl object-cover shadow-card lg:h-[30rem]"
        />
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4">
        <div className="rounded-4xl bg-secondary p-7 sm:p-10">
          <div className="flex flex-col items-start gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 font-display font-semibold text-forest shadow-card">
              <Check className="size-5 text-coral" /> Zdravie a bezpečie vášho psíka je pre nás na
              prvom mieste!
            </p>
            <p className="max-w-2xl text-forest/80">
              Preto sa neustále vzdelávame – absolvovali sme kurzy a školenia zamerané na prvú pomoc,
              psiu reč a bezpečnú prácu so skupinou psov.
            </p>
          </div>

          {CERTIFICATES.length > 0 && (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CERTIFICATES.map((c) => (
                <img
                  key={c.src}
                  src={c.src}
                  alt={c.alt}
                  loading="lazy"
                  className="h-64 w-full rounded-3xl bg-card object-contain p-3 shadow-card"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const PARTNERS = [
  {
    name: "wetPet – rehabilitácia pre psov a mačky",
    logo: wetpet,
    href: "https://wetpet.sk/",
  },
  {
    name: "Bellacord – handmade vodítka a obojky",
    logo: bellacord,
    href: "https://instagram.com/bellacord_handmade",
  },
  {
    name: "Coursing Košice",
    logo: coursing,
    href: "https://www.facebook.com/groups/631834420173973/",
  },
  { name: "Lolkio – tréner psov", logo: lolkio, href: null },
];

export function Partners() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-sm font-semibold tracking-widest text-forest/60 uppercase">
          Spolupracujeme
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {PARTNERS.map((p) => {
            const inner = (
              <img
                src={p.logo}
                alt={p.name}
                loading="lazy"
                className="max-h-14 w-auto object-contain opacity-80 transition group-hover:opacity-100"
              />
            );
            return p.href ? (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-24 min-w-44 items-center justify-center rounded-2xl bg-card px-6 shadow-card transition hover:-translate-y-0.5"
              >
                {inner}
              </a>
            ) : (
              <div
                key={p.name}
                className="group flex h-24 min-w-44 items-center justify-center rounded-2xl bg-card px-6 shadow-card"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

