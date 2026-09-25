import { useEffect, useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { PHONE } from "@/content/site";
import heroDogs from "@/assets/hero-dogs.jpg";
import { ShortForm } from "./Forms";
import { InfoTicker } from "./InfoTicker";
import { FormDialog } from "./FormDialog";
import { trackMarketingInteraction } from "@/lib/analytics";

export function Hero() {
  const [announcementVisible, setAnnouncementVisible] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncementVisible(true), 220);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pt-20 pb-0 sm:pt-24 lg:pt-28 lg:pb-4">
      <div className="absolute inset-0 z-0">
        <img
          src={heroDogs}
          alt="Psíky v psej škôlke Chvostíkovo v Košiciach"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-[50%_54%] lg:object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-cream/25 lg:bg-cream/10" />
        <div className="absolute inset-0 bg-linear-to-r from-cream/95 via-cream/55 via-45% to-cream/35 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-cream to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-0 text-center lg:pb-2 lg:text-left">
        <div
          className={`pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 transition-all duration-700 lg:block ${announcementVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
          aria-hidden={!announcementVisible}
        >
          <p className="whitespace-nowrap rounded-full bg-white/95 px-5 py-2 font-display text-sm font-bold text-coral-dark shadow-soft">
            🐾 Prijímame nových škôlkarov
          </p>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden">
          <div className="mb-2.5 h-6 min-[390px]:mb-4 min-[390px]:h-7 sm:h-8">
            <p
              className={`mx-auto max-w-fit whitespace-nowrap rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-coral-dark shadow-soft transition-all duration-700 min-[390px]:px-3 min-[390px]:py-1 min-[390px]:text-xs sm:px-4 sm:text-sm ${announcementVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
              aria-hidden={!announcementVisible}
            >
              🐾 Prijímame nových škôlkarov
            </p>
          </div>

          <h1 className="text-[26px] leading-[1.03] tracking-[-0.02em] text-forest min-[350px]:text-[29px] min-[390px]:text-[34px] sm:text-5xl">
            <span className="block whitespace-nowrap text-coral-dark">Psia škôlka</span>
            <span className="block whitespace-nowrap">v Košiciach, ktorú si</span>
            <span className="block whitespace-nowrap">váš psík zamiluje</span>
          </h1>

          <p className="mx-auto mt-3 max-w-fit whitespace-nowrap rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-coral-dark shadow-soft min-[390px]:mt-4 min-[390px]:px-3 min-[390px]:py-1 min-[390px]:text-xs sm:px-4 sm:text-sm">
            Denná starostlivosť o stredných a veľkých psíkov
          </p>

          <div className="mx-auto mt-3.5 max-w-xl rounded-2xl bg-white/95 p-3 text-forest shadow-soft min-[390px]:mt-5 min-[390px]:p-4">
            <p className="font-display text-sm font-bold min-[390px]:text-base sm:text-lg">
              Váš psík už nemusí tráviť deň sám doma.
            </p>
            <p className="mt-1.5 text-sm font-medium leading-snug text-forest/90 min-[390px]:mt-2 min-[390px]:text-base min-[390px]:leading-relaxed">
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              trackMarketingInteraction("inquiry_cta", "hero_mobile");
              setInquiryOpen(true);
            }}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-coral bg-coral px-4 py-2 font-display text-xs font-semibold text-primary-foreground shadow-card transition-colors hover:bg-coral-dark min-[390px]:mt-4 min-[390px]:px-5 min-[390px]:py-2.5 min-[390px]:text-sm"
          >
            Chcem sa informovať o škôlke
            <ChevronDown className="size-4" />
          </button>

          <InfoTicker className="mt-3.5 mb-0 w-screen mx-[calc((100%-100vw)/2)] min-[390px]:mt-5" compact />
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="flex min-w-0 flex-col lg:py-6">
            <h1 className="order-2 text-6xl leading-[1.05] text-forest">
              <span className="text-coral-dark">Psia škôlka</span>{" "}
              <span className="whitespace-nowrap">v Košiciach,</span>
              <br />
              ktorú si váš
              <br />
              psík zamiluje
            </h1>

            <p className="order-1 mx-0 mb-2 mt-0 max-w-fit whitespace-nowrap rounded-full bg-white/95 px-4 py-1 text-sm font-bold text-coral-dark shadow-soft">
              Denná starostlivosť o stredných a veľkých psíkov
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
              className="btn-coral order-4 mt-4 inline-flex min-w-44 items-center justify-center gap-2 self-start px-4 py-2 text-sm"
            >
              <Phone className="size-4" /> Zavolajte nám
            </a>
          </div>

          <div className="min-w-0 rounded-4xl bg-card/95 p-8 shadow-soft backdrop-blur-sm">
            <h2 className="text-center text-2xl text-forest sm:whitespace-nowrap">
              Informujte sa o škôlke..
            </h2>
            <p className="mt-2 mb-4 text-center text-sm text-muted-foreground">
              Vyplňte nezáväzný formulár. Ozveme sa vám späť do 24 hodín a radi s vami preberieme viac informácií.
            </p>

            <ShortForm trackingSource="hero_desktop_inline" />
          </div>
        </div>
      </div>

      <FormDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        title="Informujte sa o škôlke"
        subtitle="Vyplňte nezáväzný formulár. Ozveme sa vám späť do 24 hodín a radi s vami preberieme viac informácií."
      >
        <ShortForm
          trackingSource="hero_mobile"
          onSent={() => setTimeout(() => setInquiryOpen(false), 2200)}
        />
      </FormDialog>
    </section>
  );
}
