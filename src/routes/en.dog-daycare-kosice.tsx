import { LanguageSwitch, MobileLanguageHeader } from "@/components/site/LanguageSwitch";
import { Hero } from "@/components/site/Hero";
import { LongForm } from "@/components/site/Forms";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Check,
  Car,
  HeartHandshake,
  Menu,
  Moon,
  Phone,
  ShieldCheck,
  Syringe,
  PawPrint,
  Droplets,
  HeartPulse,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { EnglishInquiryForm } from "@/components/site/EnglishInquiryForm";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { FirstVisitPhoto } from "@/components/site/FirstVisitPhoto";
import { FriendshipFeature } from "@/components/site/FriendshipFeature";

import { GALLERY } from "@/content/site";
import { SchoolmatesFormCrown } from "@/components/site/SchoolmatesFormCrown";
import { LandingPracticalInfo } from "@/components/site/LandingPracticalInfo";
import { ContactRevealButton, FormDialog } from "@/components/site/FormDialog";
import { MobileDock } from "@/components/site/MobileDock";
import { trackMarketingInteraction } from "@/lib/analytics";
import { Collapse } from "@/components/site/Collapse";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Gallery } from "@/components/site/Gallery";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { GoogleReviewMark, VideoReasonsGrid } from "@/components/site/Reviews";
import schoolmatesLineup from "@/assets/skolkari-lineup.webp";
import { Care, About } from "@/components/site/Story";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { EnglishContact, Footer } from "@/components/site/Contact";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ADDRESS,
  EMAIL,
  PHONE,
} from "@/content/site";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/en/dog-daycare-kosice`;
const SK_PAGE_URL = `${BASE_URL}/strazenie-psov-kosice`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Dog Daycare Košice | Daytime Dog Sitting | Chvostíkovo";
const description =
  "Dog daycare in Košice with all-day supervision, safe group care, play and rest. Daytime dog sitting Monday to Friday, 7:00–17:00.";

const FAQ = [
  {
    q: "Is Chvostíkovo dog daycare or pet sitting?",
    a: "Chvostíkovo is a daytime dog daycare in Košice. Dogs spend the day with us at our daycare facility in a supervised group environment. We do not provide in-home pet sitting.",
  },
  {
    q: "Do you offer overnight dog boarding?",
    a: "No. We provide daytime care only. Dogs are dropped off in the morning and picked up during our opening hours, Monday to Friday from 7:00 to 17:00.",
  },
  {
    q: "Will my dog ever be left alone without supervision?",
    a: "No. Dogs are under all-day supervision while they are with us, and at least two experienced caregivers are present with them during the day.",
  },
  {
    q: "How does the first visit work?",
    a: "Every new dog starts with an introductory visit. We get to know your dog, observe how they respond to a new environment, people and other dogs, and introduce them to the group gradually. Some puppies, shy dogs or dogs that need more time may benefit from a few shorter visits before a full daycare day. The introductory visit is free.",
  },
  {
    q: "How do you keep dogs safe at daycare?",
    a: "Safety starts with the introductory visit, where we assess whether group daycare is suitable for the dog. During the day we continuously supervise behaviour, play, interactions, energy levels and rest. We step in before situations escalate, regulate activity so dogs are not pushed to exhaustion, and contact the owner if we notice a meaningful change in behaviour, comfort or health.",
  },
  {
    q: "Do I need to book in advance?",
    a: "Yes. Because we keep capacity limited to maintain a safe and comfortable environment, places should be booked in advance. Our regular booking deadline is Sunday at 20:00 for the following week, although individual arrangements may be possible when work schedules make this difficult.",
  },
  {
    q: "Do dogs play all day?",
    a: "No. Movement, play and social contact are important parts of the day, but so is rest. We alternate active periods with calmer time so dogs can settle and recover instead of playing continuously until they are exhausted.",
  },
  {
    q: "What if my dog has never been in a group of dogs before?",
    a: "That is one of the reasons we start with an introductory visit. We observe how your dog responds to other dogs, people and the new environment. Lack of previous group experience is not automatically a problem — introductions are gradual and we adapt the process to the individual dog.",
  },
  {
    q: "Do you offer dog pick-up and drop-off?",
    a: "Yes. We offer a dog taxi service for €5 per one-way trip. Please let us know when booking if you are interested so we can arrange the details individually.",
  },
  {
    q: "Do you accept puppies?",
    a: "Yes, once the required vaccination schedule is complete, including kennel cough vaccination. For puppies we adapt the introduction, activity and rest to their age and individual needs.",
  },
  {
    q: "Do you provide food during the day?",
    a: "We do not normally feed dogs during daycare. Because the day includes movement and play, we prefer to reduce the risks associated with activity after feeding. We recommend feeding your dog with enough time before arrival and again after they return home and have had time to rest. If your dog has allergies or dietary restrictions, please bring suitable treats.",
  },
  {
    q: "What are your opening hours?",
    a: "We are open Monday to Friday from 7:00 to 17:00. You can drop your dog off from 7:00 and pick them up during the afternoon before closing.",
  },
];

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
              mainEntity: FAQ.map((item) => ({
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


const WHY_EN = [
  {
    title: "Company instead of a day alone",
    text: "For dogs that enjoy the company of people and other dogs, daycare can turn a long workday at home into a varied day with interaction and attention.",
    icon: Users,
  },
  {
    title: "A healthy outlet for energy",
    text: "Dogs have room for movement, games and mental stimulation while still getting proper downtime instead of being pushed to play continuously.",
    icon: Sparkles,
  },
  {
    title: "Routine and social experience",
    text: "Regular visits can help a dog become more familiar with a predictable routine, different dogs, people and everyday situations in a controlled environment.",
    icon: HeartHandshake,
  },
];

const REQUIREMENTS_EN = [
  {
    title: "Vaccinations and prevention",
    text: "Your dog needs a valid vaccination record covering rabies, core infectious diseases (distemper, parvovirus, parainfluenza, infectious hepatitis and leptospirosis), and kennel cough. Regular deworming and protection against external parasites are required.",
    icon: Syringe,
  },
  {
    title: "Behaviour around dogs and people",
    text: "Dogs must be comfortable and non-aggressive around people and other dogs. Dogs displaying aggression or unsafe group behaviour cannot attend. We assess suitability during the introductory visit.",
    icon: PawPrint,
  },
  {
    title: "Hygiene",
    text: "Dogs should have basic indoor toilet habits, taking a puppy's age and development into account. Please walk your dog before arrival; we provide opportunities to relieve themselves during the day.",
    icon: Droplets,
  },
  {
    title: "Health and comfort",
    text: "Dogs must be clinically healthy and free of contagious illness. Please tell us about allergies and chronic conditions in advance so we can assess their needs. Female dogs cannot attend while in heat.",
    icon: HeartPulse,
  },
];

const INCLUDED_EN = [
  "Safe, supervised daytime dog care",
  "Heated indoor spaces and an outdoor run of approximately 80 m²",
  "Movement, games and time with dog friends",
  "A friendly environment with all-day supervision",
  "Photos and videos from the day",
  "Individual attention for each dog",
  "Drinking water and suitable treats",
];

function EnglishHeader({ onEnquire, onApplication }: { onEnquire: () => void; onApplication: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const mobileItems = [
    ["#reviews", "Reviews"],
    ["#spaces", "Our spaces"],
    ["#care", "How we care"],
    ["#why-daycare", "Why daycare"],
    ["#faq", "FAQ"],
    ["#pricing", "Pricing"],
    ["#requirements", "Requirements"],
    ["#about", "About us"],
    ["/produkty", "Our products"],
  ];

  const openEnquiry = (source: string) => {
    trackMarketingInteraction("inquiry_cta", source);
    setMenuOpen(false);
    onEnquire();
  };

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 hidden px-3 pt-3 lg:block">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-soft backdrop-blur-md sm:px-6">
        <a href="/" className="shrink-0">
          <img src={logo} alt="Chvostíkovo dog daycare Košice" className="h-5 w-auto sm:h-6" />
        </a>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex">
          <a href="#spaces" className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">Our spaces</a>
          <a href="#care" className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">How we care</a>
          <a href="#why-daycare" className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">Why daycare</a>
          <a href="#requirements" className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">Requirements</a>
          <a href="#faq" className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">FAQ</a>
          <a href="/produkty" className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">Our products</a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <LanguageSwitch language="en" />
          <button
            type="button"
            onClick={onApplication}
            className="btn-coral px-3 py-2 text-[0.65rem] leading-none whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm"
          >
            Daycare application
          </button>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-forest transition-colors hover:bg-coral-soft lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-2 max-h-[calc(100vh-5.5rem)] max-w-6xl overflow-y-auto rounded-3xl bg-card/98 p-3 shadow-soft backdrop-blur-md lg:hidden">
          <nav className="flex flex-col">
            {mobileItems.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral"
              >
                {label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => openEnquiry("en_mobile_menu")}
            className="btn-coral mt-2 flex w-full items-center justify-center py-3 text-sm"
          >
            Enquire about daycare
          </button>
          <a
            href={"tel:" + PHONE}
            data-tracking-source="en_mobile_menu"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border-2 border-coral/35 px-5 py-3 font-display text-sm font-semibold text-forest"
          >
            <Phone className="size-4" /> Call us
          </a>
        </div>
      )}
    </header>
    <MobileDock language="en" variant="en" onInterestOpen={() => openEnquiry("en_mobile_dock")} />
    </>
  );
}

function EnglishDogDaycarePage() {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);
  const [heroInquiryOpen, setHeroInquiryOpen] = useState(false);
  const heroInquiryRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!heroInquiryOpen) return;
    const frame = window.requestAnimationFrame(() => { heroInquiryRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); heroInquiryRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true }); });
    return () => window.cancelAnimationFrame(frame);
  }, [heroInquiryOpen]);

  const exploreDaycare = (source: string) => {
    trackMarketingInteraction("explore_daycare", source);
    const target = document.getElementById("en-benefits");
    if (!target) return;
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
    window.scrollTo({
      top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerHeight - 8),
      behavior: "smooth",
    });
  };

  const openInquiry = (source: string) => {
    trackMarketingInteraction("inquiry_cta", source);
    setInquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <EnglishHeader onEnquire={() => setInquiryOpen(true)} onApplication={() => { setApplicationSent(false); setApplicationOpen(true); }} />
      <MobileLanguageHeader language="en" />

      <main>
        <Hero language="en" mobileInquiryOpen={heroInquiryOpen} onMobileInquiryOpen={() => { if (heroInquiryOpen) heroInquiryRef.current?.scrollIntoView({block:"start",behavior:"auto"}); else setHeroInquiryOpen(true); }} />
        {heroInquiryOpen && <section id="home-hero-interest" ref={heroInquiryRef} data-home-hero-revealed-form className="relative scroll-mt-20 overflow-hidden bg-card px-4 pb-11 pt-6 lg:hidden">
          <SectionAmbientPaws />
          <div data-lead-form-shell className="form-liquid-surface relative z-10 mx-auto max-w-xl overflow-hidden rounded-[26px] px-4 py-6 min-[390px]:px-6">
            <h2 data-lead-form-intro tabIndex={-1} className="font-display text-center text-lg font-bold text-forest focus:outline-none">What are you looking for for your dog?</h2>
            <p data-lead-form-intro className="mt-2 mb-4 text-center text-sm text-muted-foreground">Fill in a short <strong className="font-bold text-forest">no-obligation enquiry</strong>. We will be in touch.</p>
            <EnglishInquiryForm trackingSource="en_hero_mobile_form" questionInHeading compact />
          </div>
        </section>}

        <section id="en-benefits" className="relative scroll-mt-24 overflow-hidden bg-forest pt-10 pb-0 text-cream sm:pt-12 sm:pb-0">
          <SectionAmbientPaws tone="dark" />
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <h2 className="text-center font-display text-3xl text-cream sm:text-4xl">
              Why choose Chvostíkovo?
            </h2>

            <div className="mt-7 grid gap-4 md:grid-cols-3 md:gap-5">
              {[
                [HeartHandshake, "People dogs can trust", "A kind, personal approach and a small enough daycare to genuinely know the dogs in our care."],
                [ShieldCheck, "Supervised throughout the day", "Dogs are not simply left together. We watch interactions, play, rest and how each dog is feeling."],
                [Sparkles, "Happy and pleasantly tired", "The day combines movement, enrichment, dog friends, calmer time and proper rest."],
              ].map(([Icon, heading, copy]) => {
                const CardIcon = Icon as typeof HeartHandshake;
                return (
                  <article key={String(heading)} className="flex items-start gap-3 rounded-2xl bg-cream/10 px-4 py-4 ring-1 ring-cream/15 md:block md:p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-coral text-primary-foreground md:size-11">
                      <CardIcon className="size-5" />
                    </span>
                    <div className="min-w-0 md:mt-3">
                      <h3 className="font-display text-base font-bold text-cream md:text-lg">{String(heading)}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-cream/80">{String(copy)}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="relative z-20 mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => openInquiry("en_why_chvostikovo")}
                className="btn-coral inline-flex items-center justify-center px-6 py-3 text-center"
              >
                This is what I'm looking for
              </button>
            </div>

            <div className="mx-auto -mt-1 h-[138px] w-full max-w-[820px] overflow-hidden sm:mt-2 sm:h-[225px]" aria-hidden="true">
              <img
                src={schoolmatesLineup}
                alt=""
                loading="lazy"
                decoding="async"
                width={1200}
                height={630}
                className="block h-full w-full scale-[1.08] object-cover object-bottom sm:scale-[1.04]"
              />
            </div>
          </div>
        </section>

        <DaycarePhotoCarousel language="en" />

        <Care language="en" showEmbeddedFriendship={false} showInterest={false} />

        <section id="pricing" className="relative scroll-mt-24 overflow-hidden py-14 sm:py-20">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Daycare prices</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Our daycare prices</h2>
              <p className="mt-3 text-forest/80">Every dog enjoys the same care — a pass simply offers better value.</p>
            </div>

            <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
              {[
                { title: "Single visit", price: "25 €", highlight: false, detail: "" },
                { title: "10-visit pass", price: "200 €", highlight: true, detail: "Save €50. Valid for 2 months." },
              ].map((item) => (
                <article
                  key={item.title}
                  className={`relative flex flex-col items-center rounded-3xl p-6 text-center shadow-card ${item.highlight ? "bg-forest text-cream ring-2 ring-coral" : "bg-card"}`}
                >
                  {item.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 font-display text-xs font-semibold whitespace-nowrap text-primary-foreground">
                      Best value
                    </span>
                  )}
                  <h3 className={`mt-2 text-lg ${item.highlight ? "text-cream" : "text-forest"}`}>{item.title}</h3>
                  <p className={`mt-3 font-display text-4xl font-bold ${item.highlight ? "text-cream" : "text-coral"}`}>{item.price}</p>
                  {item.detail && <p className="mt-2 text-sm font-semibold text-cream/85">{item.detail}</p>}
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-4xl bg-card p-7 shadow-card sm:p-9">
              <h3 className="text-center text-xl text-forest">Included with every visit</h3>
              <ul className="mx-auto mt-6 grid max-w-3xl gap-3 text-left text-[0.95rem] sm:grid-cols-2">
                {INCLUDED_EN.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-coral" />
                    <span className="text-forest/85">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-center font-display text-sm font-semibold text-forest">
                <Car className="size-5 text-coral" /> Dog pick-up or drop-off: €5 per one-way journey
              </p>
              <div className="mt-7 flex justify-center">
                <button type="button" onClick={() => openInquiry("en_pricing")} className="btn-coral">
                  Enquire about daycare
                </button>
              </div>
            </div>
          </div>
        </section>

        <FriendshipFeature language="en" applicationMode />
        <section id="en-application" className="bg-card px-4 pb-10"><div data-home-friendship-form className="form-liquid-surface mx-auto max-w-4xl rounded-3xl bg-card p-4 shadow-card sm:p-6 lg:p-8"><h3 className="mb-5 text-center font-display text-xl font-bold text-forest sm:text-2xl">Daycare application</h3><LongForm language="en" collapsible onExpand={() => trackMarketingInteraction("inquiry_cta", "en_friendship_20261028")} /></div></section>

        <Gallery language="en" />

        <section id="en-first-visit" className="relative scroll-mt-4 overflow-hidden py-14 sm:py-18">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">How it works</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Starting daycare in 3 simple steps</h2>
            </div>

            <p className="mx-auto mt-4 w-fit rounded-full border border-coral/30 bg-coral/10 px-5 py-2 text-center font-display text-base font-bold text-coral-dark sm:text-lg">Free introductory visit</p>

            <div className="mt-10 grid gap-9 text-center md:grid-cols-3 md:gap-8">
              {[
                ["1", "Get in touch", "Send us a short enquiry or call us. Tell us a little about your dog and we will arrange an introductory visit."],
                ["2", "Meet us", "The introductory visit is free. We get to know your dog, show you the daycare and see how they respond to the new environment."],
                ["3", "Plan the first daycare day", "If daycare is a good fit, we agree on the next visit. If your dog needs more time, we can recommend a gentler introduction."],
              ].map(([number, heading, copy], i) => (
                <article key={number} className="min-w-0">
                  <FirstVisitPhoto language="en" number={number ?? i + 1} image={GALLERY[[2, 0, 5][i]!]!.src} alt={["Dogs enjoying the daycare", "Indoor daycare space", "Dogs relaxing at daycare"][i]!} />
                  <h3 className="font-display text-xl font-bold text-forest">{heading}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-forest/80">{copy}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button type="button" onClick={() => openInquiry("en_first_visit")} className="btn-coral">
                Enquire about a first visit
              </button>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-card py-10 lg:hidden">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-2xl px-4">
            <div className="rounded-4xl bg-secondary/70 p-6 shadow-soft ring-1 ring-coral/15 sm:p-8">
              <h2 className="text-center text-2xl text-forest">Want to know if daycare is right for your dog?</h2>
              <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
                Fill in a short, no-obligation enquiry. We will be in touch.
              </p>
              <ContactRevealButton language="en" onClick={() => openInquiry("en_care_inline_mobile")} />
            </div>
          </div>
        </section>

        <section id="why-daycare" className="scroll-mt-24 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="relative overflow-hidden rounded-4xl bg-forest px-6 py-10 text-cream sm:px-12 sm:py-12">
              <SectionAmbientPaws tone="dark" />
              <div className="relative z-10">
              <h2 className="text-center font-display text-3xl text-cream sm:text-4xl">
                Why use dog daycare?
              </h2>

              <VideoReasonsGrid items={WHY_EN} language="en" />

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => openInquiry("en_why_daycare")} className="btn-coral">
                  Enquire about daycare
                </button>
                <a
                  href={"tel:" + PHONE}
                  data-tracking-source="en_why_daycare"
                  className="inline-flex items-center justify-center rounded-full border-2 border-cream/60 px-6 py-3 font-display font-semibold text-cream transition-colors hover:bg-cream hover:text-forest"
                >
                  Call us
                </a>
              </div>
              </div>
            </div>
          </div>
        </section>

        <section id="requirements" className="relative scroll-mt-24 overflow-hidden bg-secondary/45 py-14 sm:py-18">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Before joining</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">What your dog needs before daycare</h2>
              <p className="mt-3 text-sm text-forest/65 sm:hidden">Swipe sideways to see all requirements.</p>
            </div>

            <div role="region" aria-label="Daycare requirements – swipe sideways" tabIndex={0} className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
              {REQUIREMENTS_EN.map(({ title, text, icon: Icon }) => (
                <article key={title} className="w-[86%] shrink-0 snap-start rounded-3xl border border-forest/10 bg-card p-6 shadow-card sm:w-auto sm:shrink sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-forest"><Icon className="size-6" aria-hidden /></span>
                    <h3 className="font-display text-lg font-bold text-forest sm:text-xl">{title}</h3>
                  </div>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-forest/80">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="relative scroll-mt-24 overflow-hidden bg-card py-14 sm:py-18">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Questions before the first visit</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Frequently asked questions</h2>
            </div>
            <div className="mt-8 space-y-3">
              {FAQ.map((item, index) => (
                <Collapse key={item.q} title={item.q} defaultOpen={index === 0}>
                  <p>{item.a}</p>
                </Collapse>
              ))}
            </div>
          </div>
        </section>





        <About language="en" />
        <PhotoStrip />
        <EnglishContact onEnquire={() => openInquiry("en_contact")} />
      </main>

      <Footer language="en" />
      <FormDialog open={applicationOpen} onOpenChange={setApplicationOpen} hideHeader={applicationSent} title={applicationSent ? "Application submitted" : "Daycare application"} subtitle="Tell us more about your dog. We will get in touch to arrange the next steps."><LongForm language="en" onSent={() => setApplicationSent(true)} /></FormDialog>

      <FormDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        title="Enquire about dog daycare"
        subtitle="Fill in the short, no-obligation form. We will be in touch."
      >
        <EnglishInquiryForm trackingSource="en_modal" />
      </FormDialog>
    </div>
  );
}
