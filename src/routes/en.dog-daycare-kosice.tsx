import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png";
import { Hero } from "@/components/site/Hero";
import { LanguageSwitch } from "@/components/site/LanguageSwitch";
import { MobileDock } from "@/components/site/MobileDock";
import { ReviewReasons } from "@/components/site/Reviews";
import { About, Care, FriendshipApplication, Partners } from "@/components/site/Story";
import { Pricing, Requirements, FirstVisit, Faq } from "@/components/site/Info";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { Gallery } from "@/components/site/Gallery";
import { HomePuppyChecker } from "@/components/site/HomePuppyChecker";
import { InquirySection } from "@/components/site/InquirySection";
import { EnglishInquiryForm } from "@/components/site/EnglishInquiryForm";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { Footer } from "@/components/site/Contact";
import { LongForm } from "@/components/site/Forms";
import { FormDialog } from "@/components/site/FormDialog";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { trackMarketingInteraction } from "@/lib/analytics";
import { HOME_PRIMARY_FAQ_EN } from "@/content/home-faq-en";
import { ADDRESS, EMAIL, PHONE } from "@/content/site";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/en/dog-daycare-kosice`;
const SK_PAGE_URL = `${BASE_URL}/`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Dog Daycare Košice | Daytime Dog Sitting | Chvostíkovo";
const description =
  "Dog daycare in Košice with all-day supervision, safe group care, play and rest. Daytime dog sitting Monday to Friday, 7:00–17:00.";

export const Route = createFileRoute("/en/dog-daycare-kosice")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Chvostíkovo dog daycare in Košice" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: PAGE_URL },
      { rel: "alternate", hrefLang: "en", href: PAGE_URL },
      { rel: "alternate", hrefLang: "sk", href: SK_PAGE_URL },
      { rel: "alternate", hrefLang: "x-default", href: SK_PAGE_URL },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              name: "Dog daycare and daytime dog sitting in Košice",
              serviceType: "Dog daycare and daytime dog sitting",
              description,
              url: PAGE_URL,
              provider: {
                "@type": "LocalBusiness",
                name: "Chvostíkovo psia škôlka",
                url: BASE_URL,
                telephone: PHONE,
                email: EMAIL,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: ADDRESS.street,
                  addressLocality: ADDRESS.city,
                  postalCode: ADDRESS.postalCode,
                  addressCountry: ADDRESS.countryCode,
                },
              },
              areaServed: { "@type": "City", name: "Košice" },
            },
            {
              "@type": "FAQPage",
              mainEntity: HOME_PRIMARY_FAQ_EN.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: EnglishDogDaycarePage,
});


function EnglishHeader() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const application = () => { setSent(false); setOpen(true); };
  return <>
    <header className="fixed inset-x-0 top-0 z-50 hidden px-2 pt-2.5 lg:block min-[390px]:px-3 min-[390px]:pt-3">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-soft backdrop-blur-md sm:px-6">
        <a href="#top" className="shrink-0"><img src={logo} alt="Chvostíkovo dog daycare Košice" className="h-5 w-auto sm:h-6" /></a>
        <nav aria-label="Main navigation" className="flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 xl:gap-x-6">
          {[["about","About us"],["pricing","Prices"],["requirements","Requirements"],["care","Our care"],["en-benefits","Why us?"],["faq","FAQ"]].map(([id,label])=><a key={id} href={"#"+id}
            onClick={()=>{void trackCookielessInteraction("nav_click","desktop_nav_en_"+id,"en");if(id==="pricing")trackMarketingInteraction("view_pricing","en_header_menu");}}
            className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">{label}</a>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitch language="en" />
          <button type="button" onClick={()=>{void trackCookielessInteraction("nav_click","desktop_nav_en_application","en");application();}} className="btn-coral px-3 py-2 text-xs leading-none whitespace-nowrap sm:px-5 sm:py-3 sm:text-sm">Apply for daycare</button>
        </div>
      </div>
    </header>
    <MobileDock language="en" variant="en" onApplicationOpen={application} />
    <FormDialog open={open} onOpenChange={setOpen} hideHeader={sent} title={sent ? "Application submitted" : "Daycare application"} subtitle="Tell us more about your dog. We will get in touch to arrange the next steps."><LongForm language="en" onSent={()=>setSent(true)} /></FormDialog>
  </>;
}

function EnglishDogDaycarePage() {
  const [heroInquiryOpen, setHeroInquiryOpen] = useState(false);
  const heroInquiryRef = useRef<HTMLElement>(null);
  const scrollToInquiry = () => { heroInquiryRef.current?.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}); };
  useEffect(() => {
    if (!heroInquiryOpen) return;
    const frame = requestAnimationFrame(()=>{scrollToInquiry();heroInquiryRef.current?.querySelector<HTMLElement>("h2")?.focus({preventScroll:true});});
    return ()=>cancelAnimationFrame(frame);
  }, [heroInquiryOpen]);
  return <div className="min-h-screen bg-background">
    <EnglishHeader />
    <main>
      <Hero language="en" mobileInquiryOpen={heroInquiryOpen} onMobileInquiryOpen={()=>{if(heroInquiryOpen)scrollToInquiry();else setHeroInquiryOpen(true);}} />
      {heroInquiryOpen && <section id="home-hero-interest" ref={heroInquiryRef} data-home-hero-revealed-form className="relative scroll-mt-20 overflow-hidden bg-card px-4 pb-11 pt-6 lg:hidden">
        <SectionAmbientPaws />
        <div data-lead-form-shell className="form-liquid-surface relative z-10 mx-auto max-w-xl overflow-hidden rounded-[26px] px-4 py-6 min-[390px]:px-6">
          <h2 data-lead-form-intro tabIndex={-1} className="font-display text-center text-lg font-bold text-forest focus:outline-none">What are you looking for for your dog?</h2>
          <p data-lead-form-intro className="mt-2 mb-4 text-center text-sm text-muted-foreground">Fill in a short <strong className="font-bold text-forest">no-obligation enquiry</strong>. We will be in touch.</p>
          <EnglishInquiryForm trackingSource="en_hero_mobile_form" questionInHeading compact />
        </div>
      </section>}
      <ReviewReasons variant="home" withVideo showCta={false} language="en" />
      <About language="en" homeLayout />
      <DaycarePhotoCarousel language="en" />
      <HomePuppyChecker language="en" />
      <Pricing interestMode homeLayout language="en" />
      <FriendshipApplication language="en" />
      <Requirements id="requirements" language="en" title="What your dog needs before daycare" />
      <Care language="en" showEmbeddedFriendship={false} showInterest={false} showContextFaq={false} homeCombined />
      <Gallery language="en" homeMosaic />
      <FirstVisit inlineForm leadStyle language="en" />
      <Faq homeLayout language="en" />
      <Partners language="en" />
      <PhotoStrip />
      <div id="contact" className="scroll-mt-24"><InquirySection allScreens matchHero language="en" trackingSource="en_contact" title="Interested in daycare?" subtitle="Fill in a short, no-obligation enquiry. We will be in touch." /></div>
    </main>
    <Footer language="en" />
  </div>;
}
