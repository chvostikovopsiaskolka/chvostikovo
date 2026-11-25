import { Phone } from "lucide-react";
import { PHONE, PHONE_PRETTY } from "@/content/site";
import { EnglishInquiryForm } from "./EnglishInquiryForm";
import { useState } from "react";
import { LeadStepForm } from "./LeadStepForm";
import { LEAD_REVIEW_GAP_PHOTOS } from "./DaycarePhotoCarousel";
import { PhotoLightbox } from "./PhotoLightbox";
import { Reviews } from "./Reviews";
import { PawTrailBackground } from "./PawTrailBackground";
import { SchoolmatesFormCrown } from "./SchoolmatesFormCrown";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

export function Hero({ onMobileInquiryOpen, mobileInquiryOpen, language = "sk" }: {
  onMobileInquiryOpen: () => void;
  mobileInquiryOpen: boolean;
  language?: "sk" | "en";
}) {
  const t = (sk: string, en: string) => language === "en" ? en : sk;
  const [activePhoto, setActivePhoto] = useState<number | null>(null);

  return (
    <section id="top" className="hero-safe-top hero-safe-top-main relative overflow-hidden pt-7 pb-0 sm:pt-9 lg:pt-24 lg:pb-1">
      <PawTrailBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-0 text-center lg:pb-2 lg:text-left">
        {/* Mobile layout */}
        <div className="lg:hidden">
          <p className="mx-auto mt-1 min-[360px]:whitespace-nowrap font-display text-[8.5px] font-bold uppercase tracking-[0.12em] text-coral-dark min-[390px]:mt-2 min-[390px]:text-[9px] min-[430px]:text-[10px] sm:text-sm sm:tracking-[0.16em]">
            {t("Denná starostlivosť o stredných a veľkých psíkov", "Daycare for medium and large dogs")}
          </p>

          <h1 className="mt-4 text-[clamp(22px,7.2vw,33px)] leading-[1.06] tracking-[-0.035em] text-forest min-[480px]:text-[37px] min-[560px]:text-[43px] sm:text-5xl">
            <span className="block whitespace-nowrap">{t("Psia škôlka v Košiciach,", "Dog daycare in Košice")}</span>
            <span className="block whitespace-nowrap">{t("ktorú si", "your dog")}</span>
            <span data-home-mobile-orange-phrase className="block text-coral-dark">{t("váš psík zamiluje", "will love")}</span>
          </h1>

          {/* Reuse the exact two approved LEAD photos, without new assets. */}
          <div data-home-hero-photos className="mx-auto mt-6 grid w-full max-w-xl grid-cols-2 gap-2.5 sm:gap-4">
            {LEAD_REVIEW_GAP_PHOTOS.map((photo, index) => (
              <button key={photo.src} data-home-hero-photo={index + 1}
                type="button" aria-label={language === "en" ? `Open daycare photo ${index + 1}` : `Zobraziť fotografiu: ${photo.alt}`}
                onClick={() => setActivePhoto(index)}
                className="group relative h-[132px] min-w-0 overflow-hidden rounded-[19px] bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral min-[390px]:h-[154px] min-[480px]:h-[175px] sm:h-[210px]">
                <img src={photo.src} alt={language === "en" ? `Daycare photo ${index + 1}` : photo.alt} width={672} height={896} loading="eager"
                  decoding="async" fetchPriority={index === 0 ? "high" : "auto"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
              </button>
            ))}
          </div>
          <div className="home-hero-cta mx-auto mt-5 flex w-full max-w-[340px] items-center justify-center gap-2">
            <button type="button" data-home-hero-interest-cta aria-controls="home-hero-interest"
              aria-expanded={mobileInquiryOpen}
              onClick={() => {
                trackMarketingInteraction("inquiry_cta", t("home_hero_interest_mobile", "en_hero_mobile_form"));
                onMobileInquiryOpen();
              }}
              className="hero-cta-primary min-h-[46px] min-w-0 flex-1 rounded-full font-display text-base font-bold">
              {t("Mám záujem o škôlku", "I'm interested in daycare")}
            </button>
            <a data-home-hero-phone href={"tel:" + PHONE} data-tracking-source={t("home_hero_phone", "en_hero_phone")} aria-label={t("Zavolať do Chvostíkova", "Call Chvostíkovo")} onClick={() => void trackCookielessInteraction("phone_click", t("home_hero_phone", "en_hero_phone"), language)} className="grid size-[46px] shrink-0 place-items-center rounded-full bg-[#ffa414] text-[#26322b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"><Phone size={20} aria-hidden="true" /></a>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-10">
          <div className="home-hero-column self-start flex min-w-0 flex-col lg:pt-20">
            <p className="order-1 mx-0 mb-3 mt-0 font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
              {t("Denná starostlivosť o stredných a veľkých psíkov", "Daycare for medium and large dogs")}
            </p>

            <h1 className="order-2 text-[3.25rem] leading-[1.01] tracking-[-0.035em] text-forest xl:text-[3.625rem]">
              <span className="block">{t("Psia škôlka v Košiciach,", "Dog daycare in Košice")}</span>
              <span data-home-hero-title-line className="block">{t("ktorú si váš psík", "your dog")}</span>
              <span className="block text-coral-dark">{t("zamiluje", "will love")}</span>
            </h1>

            <div className="home-hero-desktop-cta order-3 mt-6 flex items-center justify-start gap-3">
              <a id="home-hero-learn-more" href={t("#preco-chvostikovo", "#en-benefits")} onClick={() => {
                trackMarketingInteraction("hero_learn_more", t("hero_desktop", "en_hero_desktop_cta"));
                void trackCookielessInteraction("explore_daycare", t("home_hero_desktop_20261028", "en_hero_desktop_cta"), language);
              }} className="hero-cta-primary min-w-0 flex-1 max-w-[320px]">{t("Chcem zistiť viac", "Learn more")}</a>
              <a data-home-hero-desktop-phone href={"tel:" + PHONE} data-tracking-source={t("home_hero_phone_desktop", "en_hero_phone_desktop")} aria-label={t("Zavolať do Chvostíkova", "Call Chvostíkovo") + ": " + PHONE_PRETTY} onClick={() => void trackCookielessInteraction("phone_click", t("home_hero_phone_desktop", "en_hero_phone_desktop"), language)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#ffa414] bg-[#ffe3ae] px-3 text-xs font-semibold whitespace-nowrap text-[#26322b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral xl:px-4 xl:text-sm"><Phone size={16} aria-hidden="true" />{PHONE_PRETTY}</a>
            </div>
          </div>

          <div id="home-hero-inline-form" className="min-w-0">
            <SchoolmatesFormCrown compact />
            <div data-lead-form-shell data-home-form-panel className="form-liquid-surface rounded-4xl border border-white/50 bg-card/20 px-8 pt-9 pb-8 shadow-soft ring-1 ring-forest/8 backdrop-blur-[1px]">
              <h2 data-lead-form-intro className={"text-center text-xl text-forest " + (language === "sk" ? "sm:whitespace-nowrap" : "")}>
                {t("Čo hľadáte pre svojho psíka?", "What are you looking for for your dog?")}
              </h2>
              <p data-lead-form-intro className="mt-2 mb-4 text-center text-sm text-muted-foreground">
                {language === "en" ? <>Fill in a short <strong className="font-bold text-forest">no-obligation enquiry</strong>. We will be in touch.</> : <>Vyplňte krátky <strong className="font-bold text-forest">nezáväzný formulár</strong>. Ozveme sa vám.</>}
              </p>

              {language === "en" ? <EnglishInquiryForm questionInHeading trackingSource="en_hero_desktop_inline" /> : <LeadStepForm questionInHeading trackingSource="hero_desktop_inline" />}
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-11 sm:mt-10 lg:mt-5"><Reviews variant="hero" language={language} /></div>
      <PhotoLightbox photos={LEAD_REVIEW_GAP_PHOTOS} active={activePhoto}
        onChange={setActivePhoto} onClose={() => setActivePhoto(null)} language={language} />
    </section>
  );
}
