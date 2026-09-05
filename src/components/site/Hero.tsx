import { Phone } from "lucide-react";
import { PHONE, PHONE_PRETTY } from "@/content/site";
import heroDogs from "@/assets/hero-dogs.jpg";
import { GoogleBadge } from "./GoogleBadge";
import { ShortForm } from "./Forms";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-24 pb-5 sm:pt-28 lg:pb-10">
      <div className="absolute inset-0 z-0">
        <img
          src={heroDogs}
          alt="Psíky v psej škôlke Chvostíkovo v Košiciach"
          className="size-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-cream/10" />
        <div className="absolute inset-0 bg-linear-to-r from-cream/95 via-cream/55 via-45% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-cream to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-4 px-4 pb-4 text-center lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:text-left lg:min-h-[34rem]">
        <div className="lg:py-10">
          <h1 className="text-3xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
            <span className="text-coral-dark">Psia škôlka</span>,
            <br />
            ktorú si váš
            <br />
            psík zamiluje
          </h1>

          <p className="mx-auto mt-2 max-w-md text-balance text-sm font-bold text-forest sm:text-base lg:mx-0 lg:whitespace-nowrap lg:text-base">
            Denná starostlivosť o stredných a veľkých psíkov v Košiciach
          </p>

          <div className="mx-auto mt-3 max-w-md rounded-xl bg-white/95 p-3 shadow-soft text-forest sm:rounded-2xl sm:p-4 lg:mx-0">
            <p className="font-display text-sm font-bold sm:text-base lg:text-lg">
              Váš psík už nemusí tráviť deň sám doma.
            </p>
            <p className="mt-1 text-sm font-medium text-forest/90 sm:text-base">
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
            </p>
          </div>

          <GoogleBadge className="mx-auto mt-3 lg:mx-0" />

          <a
            href={`tel:${PHONE}`}
            className="btn-coral mt-4 hidden items-center gap-2 px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base lg:inline-flex"
          >
            <Phone className="size-4" /> Zavolajte nám
          </a>

        </div>

        <div className="rounded-4xl bg-card/95 p-5 shadow-soft backdrop-blur-sm sm:p-8">
          <h2 className="text-center text-base text-forest sm:whitespace-nowrap sm:text-xl lg:text-2xl">
            Informujte sa o škôlke..
          </h2>
          <p className="mt-2 mb-4 text-center text-sm text-muted-foreground">
            Vyplňte nezáväzný formulár. Radi vám odpovieme na vaše otázky do 24 hodín.
          </p>
          <ShortForm />

          <a
            href={`tel:${PHONE}`}
            className="btn-coral mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base lg:hidden"
          >
            <Phone className="size-4" /> Zavolajte nám
          </a>
        </div>
      </div>
    </section>

  );
}
