import { Phone } from "lucide-react";
import { PHONE } from "@/content/site";
import heroDogs from "@/assets/hero-dogs.jpg";
import { ShortForm } from "./Forms";
import { InfoTicker } from "./InfoTicker";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-20 pb-2 sm:pt-24 lg:pb-4">
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

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-2 text-center lg:text-left">
        {/* Mobile layout */}
        <div className="lg:hidden">
          <h1 className="text-3xl leading-[1.05] text-forest sm:text-5xl">
            <span className="text-coral-dark">Psia škôlka</span>,
            <br />
            ktorú si váš
            <br />
            psík zamiluje
          </h1>

          <div className="mx-auto mt-4 max-w-md rounded-xl bg-white/95 p-3 text-forest shadow-soft sm:rounded-2xl sm:p-4">
            <p className="font-display text-sm font-bold sm:text-base">
              Váš psík už nemusí tráviť deň sám doma.
            </p>
            <p className="mt-1 text-sm font-medium text-forest/90 sm:text-base">
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
            </p>
          </div>

          <p className="mx-auto mt-4 mb-2 max-w-fit whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-coral-dark shadow-soft sm:px-4 sm:text-sm">
            Denná starostlivosť o stredných a veľkých psíkov v Košiciach
          </p>

          <InfoTicker className="my-2 w-screen mx-[calc((100%-100vw)/2)]" />

          <div className="mx-auto min-w-0 max-w-2xl rounded-4xl bg-card/95 p-5 shadow-soft backdrop-blur-sm sm:p-8">
            <h2 className="text-center text-base text-forest sm:whitespace-nowrap sm:text-xl">
              Informujte sa o škôlke..
            </h2>
            <p className="mt-2 mb-4 text-center text-sm text-muted-foreground">
              Vyplňte nezáväzný formulár. Radi vám odpovieme na vaše otázky do 24 hodín.
            </p>

            <ShortForm />

            <a
              href={`tel:${PHONE}`}
              className="btn-coral mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base"
            >
              <Phone className="size-4" /> Zavolajte nám
            </a>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="flex min-w-0 flex-col lg:py-6">
            <h1 className="order-2 text-6xl leading-[1.05] text-forest">
              <span className="text-coral-dark">Psia škôlka</span>,
              <br />
              ktorú si váš
              <br />
              psík zamiluje
            </h1>

            <p className="order-1 mx-0 mb-2 mt-0 max-w-fit whitespace-nowrap rounded-full bg-white/95 px-4 py-1 text-sm font-bold text-coral-dark shadow-soft">
              Denná starostlivosť o stredných a veľkých psíkov v Košiciach
            </p>

            <div className="order-3 mx-0 mt-3 max-w-md rounded-2xl bg-white/95 p-4 text-forest shadow-soft">
              <p className="font-display text-base font-bold lg:text-lg">
                Váš psík už nemusí tráviť deň sám doma.
              </p>
              <p className="mt-1 text-base font-medium text-forest/90">
                Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
              </p>
            </div>

            <a
              href={`tel:${PHONE}`}
              className="btn-coral order-4 mt-4 inline-flex items-center gap-2 self-start px-4 py-2 text-sm"
            >
              <Phone className="size-4" /> Zavolajte nám
            </a>
          </div>

          <div className="min-w-0 rounded-4xl bg-card/95 p-8 shadow-soft backdrop-blur-sm">
            <h2 className="text-center text-2xl text-forest sm:whitespace-nowrap">
              Informujte sa o škôlke..
            </h2>
            <p className="mt-2 mb-4 text-center text-sm text-muted-foreground">
              Vyplňte nezáväzný formulár. Radi vám odpovieme na vaše otázky do 24 hodín.
            </p>

            <ShortForm />
          </div>
        </div>
      </div>
    </section>
  );
}
