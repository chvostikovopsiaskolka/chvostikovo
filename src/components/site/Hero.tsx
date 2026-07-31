import { Phone } from "lucide-react";
import { HERO_IMAGE, PHONE, PHONE_PRETTY } from "@/content/site";
import { GoogleBadge } from "./GoogleBadge";
import { ShortForm } from "./Forms";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 pb-14 sm:pt-28 lg:pb-20">
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Psíky v psej škôlke Chvostíkovo v Košiciach"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-cream/55" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-cream to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 pb-8 md:grid-cols-[1.05fr_0.95fr] md:gap-8 lg:min-h-[34rem] lg:gap-14">
        <div className="lg:py-10">
          <h1 className="text-3xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
            Psia škôlka,
            <br />
            ktorú si váš
            <br />
            psík zamiluje
          </h1>

          <p className="mt-5 max-w-md font-display text-base font-semibold text-forest/90 sm:text-lg">
            Denná starostlivosť o stredných a veľkých psíkov v Košiciach
          </p>

          <div className="mt-6 max-w-md space-y-1 text-forest/85">
            <p className="font-semibold">Váš psík už nemusí tráviť deň sám doma.</p>
            <p>
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným
              dohľadom.
            </p>
          </div>

          <a
            href={`tel:${PHONE}`}
            className="btn-coral mt-6 inline-flex items-center gap-2.5"
          >
            <Phone className="size-4.5" /> {PHONE_PRETTY}
          </a>

          <GoogleBadge className="mt-4" />
        </div>

        <div className="rounded-4xl bg-card/95 p-5 shadow-soft backdrop-blur-sm sm:p-8">
          <h2 className="text-center text-xl text-forest sm:text-2xl">
            Chcete sa informovať o psej škôlke?
          </h2>
          <p className="mt-2 mb-6 text-center text-sm text-muted-foreground">
            Vyplňte krátky formulár. Radi vám odpovieme na vaše otázky do 24 hodín.
          </p>
          <ShortForm />
        </div>
      </div>
    </section>
  );
}
