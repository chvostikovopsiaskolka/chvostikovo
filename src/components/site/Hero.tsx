import { useState } from "react";
import { LeadStepForm } from "./LeadStepForm";
import { FormDialog } from "./FormDialog";
import { Reviews } from "./Reviews";
import { PawTrailBackground } from "./PawTrailBackground";
import { SchoolmatesFormCrown } from "./SchoolmatesFormCrown";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

export function Hero() {
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
      <PawTrailBackground />

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

          <div className="home-hero-copy mx-auto mt-5 max-w-xl min-[390px]:mt-5">
            <p className="font-display text-[13px] font-bold tracking-[-0.02em] min-[350px]:text-[14px] sm:text-base">
              Váš psík už nemusí tráviť deň sám doma.
            </p>
            <p className="mx-auto mt-1.5 max-w-[34rem] text-sm font-bold leading-snug min-[390px]:text-base min-[390px]:leading-relaxed">
              Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov pod celodenným dohľadom.
            </p>
          </div>

          <div className="hero-cta-pair home-hero-cta mx-auto mt-5">
            <button type="button" onClick={() => openInterest("home_hero_interest_mobile")} className="hero-cta-primary">
              Mám záujem
            </button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:min-h-[580px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="home-hero-column flex min-w-0 flex-col lg:py-2">
            <p className="order-1 mx-0 mb-3 mt-0 font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
              Denná starostlivosť o stredných a veľkých psíkov
            </p>

            <h1 className="order-2 text-[56px] leading-[1.01] tracking-[-0.035em] text-forest xl:text-[62px]">
              <span className="block">Psia škôlka v Košiciach,</span>
              <span data-home-hero-title-line className="block">ktorú si váš psík</span>
              <span className="block text-coral-dark">zamiluje</span>
            </h1>

            <div className="home-hero-details order-3 mt-4">
            <span aria-hidden="true" className="home-hero-width-guide font-display text-[56px] font-bold tracking-[-0.035em] xl:text-[62px]">ktorú si váš psík</span>
            <div className="home-hero-copy mx-0 max-w-xl">
              <p className="font-display text-base font-bold">
                Váš psík už nemusí tráviť deň sám doma.
              </p>
              <p className="mt-1.5 max-w-lg text-base font-bold leading-relaxed">
                Počas dňa si užije pohyb, oddych aj spoločnosť psích kamarátov<br />pod celodenným dohľadom.
              </p>
            </div>

            <div className="home-hero-desktop-cta mt-5 flex justify-center">
              <a id="home-hero-learn-more" href="#preco-chvostikovo" onClick={() => {
                trackMarketingInteraction("hero_learn_more", "hero_desktop");
                void trackCookielessInteraction("explore_daycare", "home_hero_desktop_20261028");
              }} className="hero-cta-primary w-full max-w-[320px]">Chcem zistiť viac</a>
            </div>
            </div>
          </div>

          <div id="home-hero-inline-form" className="min-w-0">
            <SchoolmatesFormCrown compact />
            <div data-home-form-panel className="rounded-4xl border border-white/50 bg-card/20 px-8 pt-9 pb-8 shadow-soft ring-1 ring-forest/8 backdrop-blur-[1px]">
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
      <div className="relative z-10 mt-11 sm:mt-10 lg:mt-5"><Reviews variant="hero" /></div>
      <FormDialog open={interestOpen} onOpenChange={setInterestOpen} title="Čo hľadáte pre svojho psíka?"
        subtitle="Vyplňte krátky nezáväzný formulár. Ozveme sa vám.">
        <LeadStepForm questionInHeading trackingSource={interestSource} />
      </FormDialog>
    </section>
  );
}
