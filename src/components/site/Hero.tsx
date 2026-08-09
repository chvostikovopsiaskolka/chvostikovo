import { Phone } from "lucide-react";
import { PHONE, PHONE_PRETTY } from "@/content/site";
import heroDogs from "@/assets/hero-dogs.jpg.asset.json";
import { GoogleBadge } from "./GoogleBadge";
import { ShortForm } from "./Forms";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 pb-8 sm:pt-28 lg:pb-14">
      <div className="absolute inset-0 z-0">
        <img
          src={heroDogs.url}
          alt="Psíky v psej škôlke Chvostíkovo v Košiciach"
          className="size-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-cream/10" />
        <div className="absolute inset-0 bg-linear-to-r from-cream/95 via-cream/55 via-45% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-cream to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 px-4 pb-4 text-center lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:text-left lg:min-h-[34rem]">
        <div className="lg:py-10">
          <h1 className="text-3xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
            <span className="text-coral-dark">Psia škôlka</span>,
            <br />
            ktorú si váš
            <br />
            psík zamiluje
          </h1>

          <p className="mx-auto mt-5 max-w-md font-display text-base font-bold text-forest sm:text-lg lg:mx-0">
            Denná starostlivosť o stredných a veľkých psíkov v Košiciach
          </p>

          <div className="relative mx-auto mt-6 max-w-md space-y-1 overflow-hidden rounded-2xl bg-card/80 p-4 shadow-soft text-forest backdrop-blur-md sm:rounded-3xl lg:mx-0">
            <div className="pointer-events-none absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream/60 blur-3xl" />
            <div className="pointer-events-none absolute -top-4 -left-4 size-24 rounded-full bg-coral-soft/55 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-6 -right-4 size-28 rounded-full bg-peach/65 blur-3xl" />
            <div className="relative z-10 space-y-1">
              <p className="font-display text-sm font-bold sm:text-base lg:text-lg">
                Váš psík už nemusí tráviť deň sám doma.
              </p>
              <p className="font-medium text-forest/90">
                Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným
                dohľadom.
              </p>
            </div>
          </div>

          <a
            href={`tel:${PHONE}`}
            className="btn-coral mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base"
          >
            <Phone className="size-4" /> Zavolajte nám
          </a>

          <GoogleBadge className="mx-auto mt-4 max-w-md lg:mx-0" />
        </div>

        <div className="rounded-4xl bg-card/95 p-5 shadow-soft backdrop-blur-sm sm:p-8">
          <h2 className="text-center text-base whitespace-nowrap text-forest sm:text-xl lg:text-2xl">
            Chcete sa informovať o škôlke?
          </h2>
          <p className="mt-2 mb-5 text-center text-sm text-muted-foreground">
            Vyplňte krátky formulár. Radi vám odpovieme na vaše otázky do 24 hodín.
          </p>
          <ShortForm />
        </div>
      </div>
    </section>

  );
}
