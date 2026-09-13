import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

const articles = [
  {
    href: "/psia-skolka-pre-steniatka",
    Icon: Sparkles,
    eyebrow: "Pre najmladších škôlkarov",
    title: "Psia škôlka pre šteniatka",
    text: "Kedy môže šteniatko začať, ako prebieha prvé zoznámenie, prečo je dôležitá správna socializácia aj oddych a ako nastavujeme prvé návštevy.",
  },
  {
    href: "/strazenie-psov-kosice",
    Icon: ShieldCheck,
    eyebrow: "Denná starostlivosť v Košiciach",
    title: "Psia škôlka a stráženie psov",
    text: "Ako vyzerá denné stráženie v Chvostíkove, prečo je dôležitý celodenný dohľad, bezpečie, rodinné prostredie, pohyb aj dostatok oddychu.",
  },
];

export function UsefulInfo() {
  return (
    <section id="uzitocne-informacie" className="scroll-mt-24 bg-secondary/45 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            Užitočné informácie
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">Viac o živote v psej škôlke</h2>
          <p className="mx-auto mt-3 max-w-2xl text-forest/80">
            Praktické informácie pre majiteľov, ktorí chcú vedieť viac ešte pred prvou návštevou.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-5xl gap-5 md:grid-cols-2">
          {articles.map(({ href, Icon, eyebrow, title, text }) => (
            <a
              key={href}
              href={href}
              className="group flex h-full flex-col rounded-4xl bg-card p-7 shadow-card transition-transform hover:-translate-y-1 sm:p-9"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-coral">
                <Icon className="size-6" />
              </div>
              <p className="mt-5 font-display text-sm font-semibold tracking-wide text-coral uppercase">
                {eyebrow}
              </p>
              <h3 className="mt-2 text-2xl text-forest sm:text-3xl">{title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-forest/80">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-coral">
                Prečítať viac <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
