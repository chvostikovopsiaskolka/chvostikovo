import { Phone } from "lucide-react";
import { HERO_IMAGE, PHONE, PHONE_PRETTY } from "@/content/site";
import { GoogleBadge } from "./GoogleBadge";
import { ShortForm } from "./Forms";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 pb-8 sm:pt-28 lg:pb-14">
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Psíky v psej škôlke Chvostíkovo v Košiciach"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-cream/10" />
        <div className="absolute inset-0 bg-linear-to-r from-cream/95 via-cream/55 via-45% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-cream to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 px-4 pb-4 text-center md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:text-left lg:min-h-[34rem] lg:gap-14">
        <div className="lg:py-10">
          <h1 className="text-3xl leading-[1.05] text-forest [text-shadow:0_1px_10px_oklch(0.98_0.02_90/0.9)] sm:text-5xl lg:text-6xl">
            Psia škôlka,
            <br />
            ktorú si váš
            <br />
            psík zamiluje
          </h1>

          <p className="mx-auto mt-5 max-w-md font-display text-base font-bold text-forest [text-shadow:0_1px_8px_oklch(0.98_0.02_90/0.9)] sm:text-lg md:mx-0">
            Denná starostlivosť o stredných a veľkých psíkov v Košiciach
          </p>

          <div className="mx-auto mt-6 max-w-md space-y-1 rounded-2xl bg-card/95 p-4 shadow-soft text-forest md:mx-0">
            <p className="font-display text-lg font-bold">
              Váš psík už nemusí tráviť deň sám doma.
            </p>
            <p className="font-medium text-forest/90">
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným
              dohľadom.
            </p>
          </div>

          <a
            href={`tel:${PHONE}`}
            className="btn-coral mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base"
          >
            <Phone className="size-4" /> {PHONE_PRETTY}
          </a>

          <GoogleBadge className="mt-4" />
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
