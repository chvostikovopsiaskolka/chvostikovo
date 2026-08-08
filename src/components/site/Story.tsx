import { useState } from "react";
import { Home, Zap, Dog, Check } from "lucide-react";
import { FormDialog } from "./FormDialog";
import { LongForm } from "./Forms";
import { CARE, WHY, PHONE, GARDEN_PHOTO } from "@/content/site";
import teamPhoto from "@/assets/team-dogs.jpg.asset.json";
import dogsPair from "@/assets/dogs-pair.jpg.asset.json";
import certAdriana from "@/assets/cert-adriana.jpg.asset.json";
import certMarek from "@/assets/cert-marek.png.asset.json";
import wetpet from "@/assets/partner-wetpet.png";
import bellacord from "@/assets/partner-bellacord.png";
import coursing from "@/assets/partner-coursing.png";
import lolkio from "@/assets/partner-lolkio.png";

const whyIcons = [Home, Zap, Dog];

function renderText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}



export function Care() {
  return (
    <section id="starostlivost" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">Ako sa postaráme o psíka</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {CARE.map((c) => (
            <article
              key={c.title}
              className="flex flex-col overflow-hidden rounded-4xl bg-card shadow-card"
            >
              <img
                src={c.img}
                alt={c.alt}
                loading="lazy"
                className={`h-56 w-full object-cover ${c.pos}`}
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl text-forest">{c.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-forest/80">{renderText(c.text)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Why() {
  const [open, setOpen] = useState(false);

  return (
    <section id="preco" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-4xl bg-forest px-6 py-10 text-cream sm:px-12 sm:py-12">
          <h2 className="text-center font-display text-3xl text-cream sm:text-4xl">
            Prečo využiť psiu škôlku?
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
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

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="btn-coral">
              Mám záujem o škôlku
            </button>
            <a
              href={`tel:${PHONE}`}
              className="inline-flex items-center justify-center rounded-full border-2 border-cream/60 px-6 py-3 font-display font-semibold text-cream transition-colors hover:bg-cream hover:text-forest"
            >
              Zavolajte nám
            </a>
          </div>
        </div>
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Máte záujem o škôlku?"
        subtitle="Formulár je nezáväzný – môžete cez neho prihlásiť psíka alebo nám jednoducho napísať otázku."
      >
        <LongForm onSent={() => setTimeout(() => setOpen(false), 2200)} />
      </FormDialog>
    </section>
  );
}

export function About() {
  return (
    <section id="o-nas" className="scroll-mt-24 py-12 sm:py-16">
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

        <div className="space-y-4">
          <img
            src={teamPhoto.url}
            alt="Majitelia psej škôlky Chvostíkovo so svojimi psíkmi"
            loading="lazy"
            className="h-60 w-full rounded-4xl object-cover shadow-card sm:h-72"
          />
          <div className="grid grid-cols-2 gap-3">
            <img
              src={dogsPair.url}
              alt="Naši psíci – írske vlkodavy"
              loading="lazy"
              className="h-36 w-full rounded-3xl object-cover shadow-card sm:h-44"
            />
            <img
              src={GARDEN_PHOTO}
              alt="Naši psíci oddychujú v záhrade"
              loading="lazy"
              className="h-36 w-full rounded-3xl object-cover shadow-card sm:h-44"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="grid items-center gap-8 rounded-4xl bg-secondary p-7 sm:p-10 md:text-center lg:grid-cols-[1fr_auto] lg:text-left">
          <div className="md:flex md:flex-col md:items-center lg:items-start">
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 font-display font-semibold text-forest shadow-card">
              <Check className="size-5 text-coral" /> Zdravie a bezpečie vášho psíka je pre nás na
              prvom mieste!
            </p>
            <p className="mt-4 max-w-lg text-forest/80 md:mx-auto lg:mx-0">
              Obaja sme absolvovali workshop prvej pomoci pre psov, takže v prípade potreby vieme
              zareagovať rýchlo a správne.
            </p>
          </div>

          <div className="grid grid-cols-2 place-items-center gap-3 sm:gap-5">
            {[
              {
                src: certAdriana.url,
                alt: "Certifikát – workshop prvej pomoci pre psov, Adriana Konkoľová",
              },
              {
                src: certMarek.url,
                alt: "Certifikát – workshop prvej pomoci pre psov, Marek Leder",
              },
            ].map((c) => (
              <img
                key={c.src}
                src={c.src}
                alt={c.alt}
                loading="lazy"
                className="w-full max-w-36 rounded-2xl object-contain shadow-card sm:max-w-44"
              />
            ))}
          </div>

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
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-base font-semibold tracking-widest text-forest/60 uppercase sm:text-lg">
          Spolupracujeme
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-5">
          {PARTNERS.map((p) => {
            const inner = (
              <img
                src={p.logo}
                alt={p.name}
                loading="lazy"
                className="max-h-10 w-auto max-w-[80%] object-contain opacity-80 transition group-hover:opacity-100 sm:max-h-12 lg:max-h-16"
              />
            );
            return p.href ? (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-20 items-center justify-center rounded-2xl bg-card px-5 shadow-card transition hover:-translate-y-0.5 sm:min-w-44 sm:px-7"
              >
                {inner}
              </a>
            ) : (
              <div
                key={p.name}
                className="group flex h-20 items-center justify-center rounded-2xl bg-card px-5 shadow-card sm:min-w-44 sm:px-7"
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

