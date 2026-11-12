import { useState, type ReactNode } from "react";
import { ArrowDown, CheckCircle2 } from "lucide-react";
import { LeadStepForm } from "./LeadStepForm";
import { FormDialog } from "./FormDialog";
import { InfoTicker } from "./InfoTicker";
import { PawTrailBackground } from "./PawTrailBackground";
import { SchoolmatesFormCrown } from "./SchoolmatesFormCrown";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

function scrollToWhyChvostikovo() {
  const target = document.getElementById("preco-chvostikovo");
  if (!target) return;

  const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function Hero({ background, learnMoreHref }: { background?: ReactNode; learnMoreHref?: string }) {
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestSource, setInterestSource] = useState("home_hero_interest_mobile");
  function openInterest(source: string) {
    trackMarketingInteraction("inquiry_cta", source);
    void trackCookielessInteraction("inquiry_cta", source);
    setInterestSource(source);
    setInterestOpen(true);
  }
  return (
    <section id="top" className="hero-safe-top hero-safe-top-main relative overflow-hidden pt-7 pb-0 sm:pt-9 lg:pt-24 lg:pb-1">
      {background ?? <PawTrailBackground />}

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-0 text-center lg:pb-2 lg:text-left">
        {/* Mobile layout */}
        <div className="lg:hidden">
          <p className="mx-auto mt-1 min-[360px]:whitespace-nowrap font-display text-[8.5px] font-bold uppercase tracking-[0.12em] text-coral-dark min-[390px]:mt-2 min-[390px]:text-[9px] min-[430px]:text-[10px] sm:text-sm sm:tracking-[0.16em]">
            Denná starostlivosť o stredných a veľkých psíkov
          </p>

          <h1 className="mt-4 text-[clamp(22px,7.2vw,33px)] leading-[1.06] tracking-[-0.035em] text-forest min-[480px]:text-[37px] min-[560px]:text-[43px] sm:text-5xl">
            <span className="block whitespace-nowrap">Psia škôlka v Košiciach,</span>
            <span className="block whitespace-nowrap">ktorú si váš psík</span>
            <span className="block text-coral-dark">zamiluje</span>
          </h1>

          <div className="mx-auto mt-5 max-w-xl text-forest min-[390px]:mt-5">
            <p className="font-display text-[13px] font-bold tracking-[-0.02em] min-[350px]:text-[14px] sm:text-base">
              Váš psík už nemusí tráviť deň sám doma.
            </p>
            <p className="mx-auto mt-1.5 max-w-[34rem] text-sm font-medium leading-snug text-forest/90 min-[390px]:text-base min-[390px]:leading-relaxed">
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
            </p>
          </div>

          <div className="mx-auto mt-4 flex w-full max-w-[390px] flex-nowrap justify-center gap-1 min-[390px]:mt-5 min-[390px]:gap-1.5">
            {["Celodenný dohľad", "Vlastný výbeh", "Úvodná návšteva zadarmo"].map((item) => (
              <span
                key={item}
                className="inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-forest px-1.5 py-1 text-[8px] font-bold tracking-[-0.01em] text-white shadow-card min-[350px]:px-2 min-[350px]:text-[8.5px] min-[390px]:gap-1 min-[390px]:px-2.5 min-[390px]:text-[9.5px]"
              >
                <CheckCircle2 className="size-3 shrink-0 text-white min-[390px]:size-3.5" />
                {item}
              </span>
            ))}
          </div>

          <div className="hero-cta-pair mx-auto mt-5">
            <button type="button" onClick={() => openInterest("home_hero_interest_mobile")} className="hero-cta-primary">
              Mám záujem
            </button>
            <button
              type="button"
              onClick={() => {
                if (learnMoreHref) {
                  window.location.assign(learnMoreHref);
                  return;
                }
                trackMarketingInteraction("hero_learn_more", "hero_mobile");
                void trackCookielessInteraction("explore_daycare", "home_hero_mobile_20261028");
                scrollToWhyChvostikovo();
              }}
              className="hero-cta-secondary"
            >
              <span>Viac o škôlke</span>
              <ArrowDown className="hero-cta-icon" aria-hidden="true" />
            </button>
          </div>

          <InfoTicker className="mt-4 mb-0 w-screen mx-[calc((100%-100vw)/2)] min-[390px]:mt-5" compact />
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:min-h-[700px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="flex min-w-0 flex-col lg:py-2">
            <p className="order-1 mx-0 mb-3 mt-0 font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
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

            <div className="order-4 mt-4 flex flex-wrap justify-end gap-2">
              {["Celodenný dohľad", "Vlastný výbeh", "Úvodná návšteva zadarmo"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-xs font-bold text-white shadow-card"
                >
                  <CheckCircle2 className="size-4 text-white" />
                  {item}
                </span>
              ))}
            </div>

            <div className="order-5 mt-4">
              <button type="button"
                onClick={() => {
                  if (learnMoreHref) {
                    window.location.assign(learnMoreHref);
                    return;
                  }
                  trackMarketingInteraction("hero_learn_more", "hero_desktop");
                  void trackCookielessInteraction("explore_daycare", "home_hero_desktop_20261028");
                  scrollToWhyChvostikovo();
                }}
                className="hero-cta-primary w-full max-w-[440px] gap-2"
              >
                Viac o škôlke
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div id="home-hero-inline-form" className="min-w-0">
            <SchoolmatesFormCrown compact />
            <div className="rounded-4xl border border-white/50 bg-card/20 px-8 pt-9 pb-8 shadow-soft ring-1 ring-forest/8 backdrop-blur-[1px]">
              <h2 className="text-center text-xl text-forest sm:whitespace-nowrap">
                Čo hľadáte pre svojho psíka?
              </h2>
              <p className="mt-2 mb-4 text-center text-sm text-muted-foreground">
                Vyplňte krátky nezáväzný formulár. Ozveme sa vám.
              </p>

              <LeadStepForm questionInHeading trackingSource="hero_desktop_inline" />
            </div>
          </div>
        </div>
      </div>
      <FormDialog open={interestOpen} onOpenChange={setInterestOpen} title="Čo hľadáte pre svojho psíka?"
        subtitle="Vyplňte krátky nezáväzný formulár. Ozveme sa vám.">
        <LeadStepForm questionInHeading trackingSource={interestSource} />
      </FormDialog>
    </section>
  );
}
