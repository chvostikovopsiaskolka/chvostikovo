import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Sparkles,
  Users,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { EnglishInquiryForm } from "@/components/site/EnglishInquiryForm";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { SchoolmatesFormCrown } from "@/components/site/SchoolmatesFormCrown";
import { FormDialog } from "@/components/site/FormDialog";
import { trackMarketingInteraction } from "@/lib/analytics";
import { Collapse } from "@/components/site/Collapse";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Gallery } from "@/components/site/Gallery";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { VideoSection } from "@/components/site/Reviews";
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

const REVIEWS_EN = [
  {
    name: "Heka & Leraie",
    text: "I can wholeheartedly recommend Chvostíkovo. My Leraie is always excited to see his friends there, and I am happy knowing he is in the hands of great people. ❤️",
  },
  {
    name: "Ľubka & Aron",
    text: "Highly recommended ❤️ The owners are wonderful people who truly love dogs, and it shows. If you do not want to leave your dog home alone, you will be hard-pressed to find a better place. Aron is happy there and always has a great time.",
  },
  {
    name: "Erik & Gaston",
    text: "Great place, great people! Our dog can barely sit still with excitement at the door while waiting for it to open.",
  },
  {
    name: "Dagmar & Merlin",
    text: "Chvostíkovo is the most wonderful daycare I know. The care for my dog is amazing — he gets to play, enjoy the outdoor run and spend time with his friends. He comes home, has dinner and falls asleep. It helps me enormously to know that while I am at work, he is not home alone and has company. The owners are kind and give the dogs plenty of affection. I am very grateful for everything you do for us. ❤️",
  },
  {
    name: "Alžbeta & Eliška",
    text: "If you are looking for a place where your dog will be happy, definitely visit this daycare. The owners are kind and very helpful, and our Eliška is always excited to go. She comes home happy and pleasantly tired. Thank you.",
  },
  {
    name: "Richard & Bella",
    text: "Excellent daycare and a great approach from the owners. The flooring is safe and not slippery, which we really appreciate. Bella is always excited to go. Definitely recommended. ❤️👍",
  },
  {
    name: "Helena & Colin",
    text: "Colin has been going to Chvostíkovo for several months. He is a Border Collie, so he has more energy than most dogs, but that is never a problem here. He plays with the ball and with the other dogs, and we pick him up after an active, well-spent day — while we get a peaceful evening. The owners are lovely people I feel completely comfortable leaving my dog with.",
  },
  {
    name: "Bianka & Monty",
    text: "I recommend Chvostíkovo without hesitation. You can really see that the owners genuinely love dogs. My dog is always very excited to go and comes home happy and tired from playing — when we arrive to pick him up, he barely wants to leave. Communication is always easy, and the outdoor run is a great bonus.",
  },
  {
    name: "Martina & Belisha",
    text: "We are extremely happy with Chvostíkovo. The owners are kind, caring and always willing to help. After moving to the new premises, they even arranged transport to daycare for our dog, which made life much easier for us. Beli is always excited to go and comes home happy and pleasantly tired. We recommend Chvostíkovo to anyone looking for high-quality, loving care for their dog. 🫶",
  },
  {
    name: "Alena & Becky",
    text: "After a long search, we finally found a daycare and people we truly trust. Our Becky looks forward to every visit and was also very well cared for while we were away on holiday. I would recommend this daycare to anyone. 😍🐕",
  },
];

function EnglishReviewCard({ name, text }: { name: string; text: string }) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLQuoteElement>(null);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    setClamped(el.scrollHeight - el.clientHeight > 2);
  }, [text]);

  return (
    <figure className="flex w-[82%] shrink-0 flex-col items-center justify-start rounded-3xl bg-card px-4 py-3.5 text-center shadow-card sm:w-[46%] sm:px-5 sm:py-4 lg:w-[31%]">
      <figcaption className="font-display text-sm font-bold text-forest">{name}</figcaption>
      <span className="text-sm tracking-tight text-[#F5B301]" aria-label="5 out of 5 stars">★★★★★</span>
      <blockquote
        ref={body}
        className={`mt-2 min-h-[3.75rem] text-[0.88rem] leading-[1.4] text-forest/85 sm:min-h-[4rem] sm:text-[0.93rem] ${open ? "" : "line-clamp-3"}`}
      >
        “{text}”
      </blockquote>
      <div className="min-h-[1.75rem] sm:min-h-[2rem]">
        {(clamped || open) && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="mt-1 font-display text-sm font-semibold text-coral underline underline-offset-4"
          >
            {open ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </figure>
  );
}

function EnglishReviewCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimer = useRef<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    const narrowQuery = window.matchMedia("(max-width: 390px)");
    let speed = narrowQuery.matches ? 32 : isMobile ? 50 : 36;
    const updateSpeed = () => {
      speed = narrowQuery.matches ? 32 : isMobile ? 50 : 36;
    };
    narrowQuery.addEventListener("change", updateSpeed);
    window.addEventListener("resize", updateSpeed);

    let raf = 0;
    let last = performance.now();
    let carry = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!paused.current) {
        carry += speed * dt;
        const delta = Math.floor(carry);
        if (delta > 0) {
          carry -= delta;
          const half = el.scrollWidth / 2;
          const next = el.scrollLeft + delta;
          el.scrollLeft = half > 0 && next >= half ? next - half : next;
        }
      } else {
        carry = 0;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      narrowQuery.removeEventListener("change", updateSpeed);
      window.removeEventListener("resize", updateSpeed);
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    };
  }, [isMobile]);

  const pause = () => {
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    paused.current = true;
  };

  const resume = () => {
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    paused.current = false;
  };

  const pauseForReading = () => {
    pause();
    resumeTimer.current = window.setTimeout(() => {
      paused.current = false;
      resumeTimer.current = null;
    }, 8000);
  };

  return (
    <div
      ref={track}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={pauseForReading}
      onTouchCancel={pauseForReading}
      onFocusCapture={pause}
      onBlurCapture={resume}
      className="relative left-1/2 mt-3 flex w-screen max-w-none -translate-x-1/2 items-stretch gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [touch-action:pan-x] [will-change:scroll-position] sm:gap-5 [&::-webkit-scrollbar]:hidden"
    >
      {[...REVIEWS_EN, ...REVIEWS_EN].map((review, index) => (
        <EnglishReviewCard key={`${review.name}-${index}`} name={review.name} text={review.text} />
      ))}
    </div>
  );
}

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
    icon: ShieldCheck,
  },
  {
    title: "Behaviour around dogs and people",
    text: "Dogs must be comfortable and non-aggressive around people and other dogs. Dogs displaying aggression or unsafe group behaviour cannot attend. We assess suitability during the introductory visit.",
    icon: Users,
  },
  {
    title: "Hygiene",
    text: "Dogs should have basic indoor toilet habits, taking a puppy's age and development into account. Please walk your dog before arrival; we provide opportunities to relieve themselves during the day.",
    icon: Sparkles,
  },
  {
    title: "Health and comfort",
    text: "Dogs must be clinically healthy and free of contagious illness. Please tell us about allergies and chronic conditions in advance so we can assess their needs. Female dogs cannot attend while in heat.",
    icon: Moon,
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

function EnglishHeader({ onEnquire }: { onEnquire: () => void }) {
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
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
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
          <a href="/" className="inline-flex rounded-full bg-secondary px-2.5 py-2 font-display text-[0.68rem] font-semibold text-forest transition-colors hover:bg-coral-soft sm:px-3 sm:text-xs">
            SK
          </a>
          <button
            type="button"
            onClick={() => openEnquiry("en_header")}
            className="btn-coral px-3 py-2 text-[0.65rem] leading-none whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm"
          >
            Enquire
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
  );
}

function EnglishDogDaycarePage() {
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const openInquiry = (source: string) => {
    trackMarketingInteraction("inquiry_cta", source);
    setInquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <EnglishHeader onEnquire={() => setInquiryOpen(true)} />

      <main>
        <section id="top" className="relative overflow-hidden pt-20 pb-0 sm:pt-24 lg:pt-24 lg:pb-1">
          <PawTrailBackground />

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-0 text-center lg:pb-2 lg:text-left">
            <div className="lg:hidden">
              <p className="mx-auto mt-1 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-coral-dark min-[390px]:mt-2 min-[390px]:text-[10px] sm:text-sm sm:tracking-[0.16em]">
                Daytime care for medium and large dogs
              </p>

              <h1 className="mt-3 text-[29px] leading-[1.01] tracking-[-0.035em] text-forest min-[350px]:text-[31px] min-[390px]:text-[34px] sm:text-5xl">
                <span className="block">Dog daycare in Košice</span>
                <span className="block">your dog will</span>
                <span className="block text-coral-dark">love</span>
              </h1>

              <div className="mx-auto mt-3.5 max-w-xl text-forest min-[390px]:mt-4">
                <p className="font-display text-[13px] font-bold tracking-[-0.02em] min-[350px]:text-[14px] sm:text-base">
                  Your dog does not have to spend the day home alone.
                </p>
                <p className="mx-auto mt-1.5 max-w-[34rem] text-sm font-medium leading-snug text-forest/90 min-[390px]:text-base min-[390px]:leading-relaxed">
                  Play, movement, rest and dog friends under all-day supervision.
                </p>
              </div>

              <div className="mx-auto mt-3 flex w-full max-w-[390px] flex-nowrap justify-center gap-1 min-[390px]:mt-4 min-[390px]:gap-1.5">
                {["All-day supervision", "Outdoor run", "Free first visit"].map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-forest px-1.5 py-1 text-[8px] font-bold tracking-[-0.01em] text-white shadow-card min-[350px]:px-2 min-[350px]:text-[8.5px] min-[390px]:gap-1 min-[390px]:px-2.5 min-[390px]:text-[9.5px]"
                  >
                    <CheckCircle2 className="size-3 shrink-0 text-white min-[390px]:size-3.5" />
                    {item}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => openInquiry("en_hero_mobile")}
                className="btn-coral mt-4 inline-flex min-w-[270px] items-center justify-center gap-2 px-7 py-3 text-[15px] min-[390px]:mt-5 sm:min-w-[330px] sm:px-9 sm:py-4 sm:text-lg"
              >
                Enquire about daycare
                <ArrowRight className="size-5" />
              </button>

              <InfoTicker language="en" className="mt-3 mb-0 w-screen mx-[calc((100%-100vw)/2)] min-[390px]:mt-4" compact />
            </div>

            <div className="hidden lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
              <div className="flex min-w-0 flex-col lg:py-2">
                <p className="order-1 mx-0 mb-3 mt-0 font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
                  Daytime care for medium and large dogs
                </p>

                <h1 className="order-2 text-[56px] leading-[1.01] tracking-[-0.035em] text-forest xl:text-[62px]">
                  <span className="block">Dog daycare</span>
                  <span className="block">in Košice your dog</span>
                  <span className="block text-coral-dark">will love</span>
                </h1>

                <div className="order-3 mx-0 mt-4 max-w-xl text-forest">
                  <p className="font-display text-lg font-bold">
                    Your dog does not have to spend the day home alone.
                  </p>
                  <p className="mt-1.5 max-w-lg text-base font-medium leading-relaxed text-forest/90">
                    Play, movement, rest and dog friends under all-day supervision.
                  </p>
                </div>

                <div className="order-4 mt-4 flex flex-wrap gap-2">
                  {["All-day supervision", "Outdoor run", "Free first visit"].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-xs font-bold text-white shadow-card"
                    >
                      <CheckCircle2 className="size-4 text-white" />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="order-5 mt-4 flex items-center gap-3">
                  <a
                    href={"tel:" + PHONE}
                    data-tracking-source="en_hero_desktop"
                    aria-label="Call Chvostíkovo"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-coral text-primary-foreground shadow-card transition-colors hover:bg-coral-dark"
                  >
                    <Phone className="size-5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => openInquiry("en_hero_desktop_cta")}
                    className="btn-coral inline-flex min-w-44 items-center justify-center gap-2 px-5 py-2.5 text-sm"
                  >
                    Enquire about daycare
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="min-w-0">
                <SchoolmatesFormCrown compact />
                <div className="rounded-4xl border border-white/50 bg-card/20 px-8 pt-9 pb-8 shadow-soft ring-1 ring-forest/8 backdrop-blur-[1px]">
                  <h2 className="text-center text-2xl text-forest">Enquire about daycare</h2>
                  <p className="mt-2 mb-4 text-center text-sm text-muted-foreground">
                    Leave your contact details. We will get in touch and happily answer your questions.
                  </p>
                  <EnglishInquiryForm trackingSource="en_hero_desktop" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="hidden lg:block">
          <InfoTicker language="en" />
        </div>

        <section className="relative overflow-hidden bg-forest pt-10 pb-10 text-cream sm:pt-12 sm:pb-12">
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

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => openInquiry("en_why_chvostikovo")}
                className="btn-coral inline-flex items-center justify-center px-6 py-3 text-center"
              >
                This sounds right for my dog
              </button>
            </div>
          </div>
        </section>

        <section id="reviews" className="relative scroll-mt-24 overflow-x-clip bg-secondary/50 pt-3 pb-9 sm:pt-8 sm:pb-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
            <h2 className="section-title whitespace-nowrap text-[clamp(14px,4.7vw,36px)] leading-tight">More than 100 happy dogs</h2>
            <p className="mt-0.5 text-sm text-forest/80 sm:text-base">⭐ 5.0 out of 5 on Google</p>
            <EnglishReviewCarousel />
          </div>
        </section>

        <DaycarePhotoCarousel language="en" />

        <Gallery language="en" />

        <VideoSection language="en" />

        <Care language="en" />

        <section className="relative overflow-hidden bg-card py-10 lg:hidden">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-2xl px-4">
            <div className="rounded-4xl bg-secondary/70 p-6 shadow-soft ring-1 ring-coral/15 sm:p-8">
              <h2 className="text-center text-2xl text-forest">Want to know if daycare is right for your dog?</h2>
              <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
                Leave your contact details. We will get in touch, talk about your dog and answer your questions. If you are interested, we will arrange a free introductory visit.
              </p>
              <EnglishInquiryForm trackingSource="en_care_inline_mobile" />
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

              <div className="mt-6 space-y-3 md:hidden">
                {WHY_EN.map(({ title, text, icon: Icon }) => (
                  <Collapse
                    key={title}
                    title={title}
                    tone="dark"
                    icon={
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral text-primary-foreground">
                        <Icon className="size-5" />
                      </span>
                    }
                  >
                    {text}
                  </Collapse>
                ))}
              </div>

              <div className="mt-8 hidden gap-6 md:grid md:grid-cols-3">
                {WHY_EN.map(({ title, text, icon: Icon }) => (
                  <div key={title} className="rounded-3xl bg-cream/10 p-6 ring-1 ring-cream/15 backdrop-blur-sm">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-coral text-primary-foreground">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mt-4 text-xl text-cream">{title}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-cream/85">{text}</p>
                  </div>
                ))}
              </div>

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

        <section className="relative overflow-hidden py-14 sm:py-18">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">How it works</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Starting daycare in 3 simple steps</h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ["1", "Get in touch", "Send us a short enquiry or call us. Tell us a little about your dog and we will arrange an introductory visit."],
                ["2", "Meet us", "The introductory visit is free. We get to know your dog, show you the daycare and see how they respond to the new environment."],
                ["3", "Plan the first daycare day", "If daycare is a good fit, we agree on the next visit. If your dog needs more time, we can recommend a gentler introduction."],
              ].map(([number, heading, copy]) => (
                <article key={number} className="relative rounded-4xl bg-card p-7 pt-9 shadow-card">
                  <span className="absolute -top-5 left-7 flex size-11 items-center justify-center rounded-full bg-coral font-display text-lg font-bold text-primary-foreground shadow-card">
                    {number}
                  </span>
                  <h3 className="text-xl text-forest">{heading}</h3>
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

        <section id="requirements" className="relative scroll-mt-24 overflow-hidden bg-secondary/45 py-14 sm:py-18">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Before joining</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">What your dog needs before daycare</h2>
            </div>

            <div className="mt-8 space-y-3 md:hidden">
              {REQUIREMENTS_EN.map(({ title, text, icon: Icon }) => (
                <Collapse
                  key={title}
                  title={title}
                  icon={
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-forest">
                      <Icon className="size-5" />
                    </span>
                  }
                >
                  {text}
                </Collapse>
              ))}
            </div>

            <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2">
              {REQUIREMENTS_EN.map(({ title, text, icon: Icon }) => (
                <article key={title} className="rounded-4xl bg-card p-7 shadow-card">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-forest">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-xl text-forest">{title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-forest/80">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <About language="en" />
        <PhotoStrip />
        <EnglishContact />
      </main>

      <Footer language="en" />

      <FormDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        title="Enquire about dog daycare"
        subtitle="Leave your contact details. We will get in touch, talk about your dog and answer your questions. If you are interested, we will arrange a free introductory visit."
      >
        <EnglishInquiryForm trackingSource="en_modal" />
      </FormDialog>
    </div>
  );
}
