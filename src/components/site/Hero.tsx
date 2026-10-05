import { CheckCircle2, Phone } from "lucide-react";
import { PHONE } from "@/content/site";
import heroDogs from "@/assets/hero-dogs.jpg";
import { ShortForm } from "./Forms";
import { InfoTicker } from "./InfoTicker";
import { trackMarketingInteraction } from "@/lib/analytics";

function scrollToWhyChvostikovo() {
  const target = document.getElementById("preco-chvostikovo");
  if (!target) return;

  const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function Hero() {
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
        {/* Mobile layout */}
        <div className="lg:hidden">
          <p className="mx-auto mt-1 max-w-fit whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-coral-dark shadow-soft min-[390px]:mt-2 min-[390px]:text-xs sm:text-sm">
            Denná starostlivosť o stredných a veľkých psíkov
          </p>

          <h1 className="mt-3 text-[29px] leading-[1.01] tracking-[-0.035em] text-forest min-[350px]:text-[31px] min-[390px]:text-[36px] sm:text-5xl">
            <span className="block">Psia škôlka v Košiciach,</span>
            <span className="block">ktorú si váš psík</span>
            <span className="block text-coral-dark">zamiluje</span>
          </h1>

          <div className="mx-auto mt-3.5 max-w-xl text-forest min-[390px]:mt-4">
            <p className="font-display text-[13px] font-bold tracking-[-0.02em] min-[350px]:text-[14px] sm:text-base">
              Váš psík už nemusí tráviť deň sám doma.
            </p>
            <p className="mx-auto mt-1.5 max-w-[34rem] text-sm font-medium leading-snug text-forest/90 min-[390px]:text-base min-[390px]:leading-relaxed">
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
            </p>
          </div>

          <div className="mx-auto mt-3 flex w-full max-w-[390px] flex-nowrap justify-center gap-1 min-[390px]:mt-4 min-[390px]:gap-1.5">
            {["Celodenný dohľad", "Vlastný výbeh", "Úvodná návšteva zadarmo"].map((item) => (
              <span
                key={item}
                className="inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-white/95 px-1.5 py-1 text-[8px] font-bold tracking-[-0.01em] text-forest shadow-card min-[350px]:px-2 min-[350px]:text-[8.5px] min-[390px]:gap-1 min-[390px]:px-2.5 min-[390px]:text-[9.5px]"
              >
                <CheckCircle2 className="size-3 shrink-0 text-coral min-[390px]:size-3.5" />
                {item}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              trackMarketingInteraction("hero_learn_more", "hero_mobile");
              scrollToWhyChvostikovo();
            }}
            className="btn-coral mt-3 inline-flex min-w-[190px] items-center justify-center px-5 py-2.5 text-sm min-[390px]:mt-4 min-[390px]:min-w-[220px] min-[390px]:py-3 min-[390px]:text-[15px]"
          >
            Zistiť viac o škôlke
          </button>

          <InfoTicker className="mt-3 mb-0 w-screen mx-[calc((100%-100vw)/2)] min-[390px]:mt-4" compact />
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="flex min-w-0 flex-col lg:py-6">
            <p className="order-1 mx-0 mb-3 mt-0 max-w-fit whitespace-nowrap rounded-full bg-white/95 px-4 py-1.5 text-sm font-bold text-coral-dark shadow-soft">
              Denná starostlivosť o stredných a veľkých psíkov
            </p>

            <h1 className="order-2 text-[56px] leading-[1.01] tracking-[-0.035em] text-forest xl:text-[62px]">
              <span className="block">Psia škôlka v Košiciach,</span>
              <span className="block">ktorú si váš psík</span>
              <span className="block text-coral-dark">zamiluje</span>
            </h1>

            <div className="order-3 mx-0 mt-4 max-w-xl text-forest">
              <p className="font-display text-lg font-bold">
                Váš psík už nemusí tráviť deň sám doma.
              </p>
              <p className="mt-1.5 max-w-lg text-base font-medium leading-relaxed text-forest/90">
                Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
              </p>
            </div>

            <div className="order-4 mt-4 flex flex-wrap gap-2">
              {["Celodenný dohľad", "Vlastný výbeh", "Úvodná návšteva zadarmo"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-forest shadow-card"
                >
                  <CheckCircle2 className="size-4 text-coral" />
                  {item}
                </span>
              ))}
            </div>

            <a
              href={`tel:${PHONE}`}
              className="btn-coral order-5 mt-5 inline-flex min-w-48 items-center justify-center gap-2 self-start px-5 py-2.5 text-sm"
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

    </section>
  );
}
