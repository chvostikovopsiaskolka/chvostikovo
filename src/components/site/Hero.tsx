import { useState } from "react";
import { LeadStepForm } from "./LeadStepForm";
import { LEAD_REVIEW_GAP_PHOTOS } from "./DaycarePhotoCarousel";
import { PhotoLightbox } from "./PhotoLightbox";
import { Reviews } from "./Reviews";
import { PawTrailBackground } from "./PawTrailBackground";
import { SchoolmatesFormCrown } from "./SchoolmatesFormCrown";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

export function Hero({ onMobileInquiryOpen, mobileInquiryOpen }: {
  onMobileInquiryOpen: () => void;
  mobileInquiryOpen: boolean;
}) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);

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
            <span className="block whitespace-nowrap">ktorú si</span>
            <span data-home-mobile-orange-phrase className="block text-coral-dark">váš psík zamiluje</span>
          </h1>

          {/* Reuse the exact two approved LEAD photos, without new assets. */}
          <div data-home-hero-photos className="mx-auto mt-6 grid w-full max-w-xl grid-cols-2 gap-2.5 sm:gap-4">
            {LEAD_REVIEW_GAP_PHOTOS.map((photo, index) => (
              <button key={photo.src} data-home-hero-photo={index + 1}
                type="button" aria-label={`Zobraziť fotografiu: ${photo.alt}`}
                onClick={() => setActivePhoto(index)}
                className="group relative h-[132px] min-w-0 overflow-hidden rounded-[19px] bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral min-[390px]:h-[154px] min-[480px]:h-[175px] sm:h-[210px]">
                <img src={photo.src} alt={photo.alt} width={672} height={896} loading="eager"
                  decoding="async" fetchPriority={index === 0 ? "high" : "auto"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
              </button>
            ))}
          </div>
          <div className="home-hero-cta mx-auto mt-5 flex w-full max-w-[340px] justify-center">
            <button type="button" data-home-hero-interest-cta aria-controls="home-hero-interest"
              aria-expanded={mobileInquiryOpen}
              onClick={() => {
                trackMarketingInteraction("inquiry_cta", "home_hero_interest_mobile");
                onMobileInquiryOpen();
              }}
              className="hero-cta-primary min-h-[46px] w-full rounded-full font-display text-base font-bold">
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
            <div data-home-form-panel className="form-liquid-surface rounded-4xl border border-white/50 bg-card/20 px-8 pt-9 pb-8 shadow-soft ring-1 ring-forest/8 backdrop-blur-[1px]">
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
      <PhotoLightbox photos={LEAD_REVIEW_GAP_PHOTOS} active={activePhoto}
        onChange={setActivePhoto} onClose={() => setActivePhoto(null)} />
    </section>
  );
}
