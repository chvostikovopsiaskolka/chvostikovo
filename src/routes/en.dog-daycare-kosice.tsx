import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Facebook,
  HeartHandshake,
  Instagram,
  MapPin,
  Menu,
  Moon,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";
import heroDogs from "@/assets/hero-dogs.jpg";
import teamDogs from "@/assets/team-dogs.jpg";
import { EnglishInquiryForm } from "@/components/site/EnglishInquiryForm";
import { FormDialog } from "@/components/site/FormDialog";
import { trackMarketingInteraction } from "@/lib/analytics";
import { Collapse } from "@/components/site/Collapse";
import { InfoTicker } from "@/components/site/InfoTicker";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ADDRESS,
  EMAIL,
  FACEBOOK,
  GALLERY,
  INSTAGRAM,
  MAP_LINK,
  PHONE,
  PHONE_PRETTY,
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
    <figure className="flex w-[82%] shrink-0 flex-col items-center justify-start rounded-3xl bg-card p-5 text-center shadow-card sm:w-[46%] sm:p-6 lg:w-[31%]">
      <div className="flex items-center justify-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-base font-bold text-forest sm:size-11">
          {name.charAt(0)}
        </span>
        <div className="text-left">
          <figcaption className="font-display text-sm font-bold text-forest">{name}</figcaption>
          <span className="text-sm tracking-tight text-[#F5B301]" aria-label="5 out of 5 stars">★★★★★</span>
        </div>
      </div>
      <blockquote
        ref={body}
        className={`mt-3 min-h-[4.5rem] text-[0.9rem] leading-relaxed text-forest/85 sm:min-h-[4.75rem] sm:text-[0.95rem] ${open ? "" : "line-clamp-3"}`}
      >
        “{text}”
      </blockquote>
      <div className="min-h-[2.25rem] sm:min-h-[2.5rem]">
        {(clamped || open) && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="mt-2 font-display text-sm font-semibold text-coral underline underline-offset-4"
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
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    const speed = 30;
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!paused.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft = el.scrollLeft >= half ? el.scrollLeft - half : el.scrollLeft + speed * dt;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);

  const pause = () => (paused.current = true);
  const resume = () => (paused.current = false);

  return (
    <div
      ref={track}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onTouchCancel={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      className="mt-10 flex w-full max-w-full items-stretch gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [touch-action:pan-x] sm:gap-5 [&::-webkit-scrollbar]:hidden"
    >
      {[...REVIEWS_EN, ...REVIEWS_EN].map((review, index) => (
        <EnglishReviewCard key={`${review.name}-${index}`} name={review.name} text={review.text} />
      ))}
    </div>
  );
}

const SPACE_PHOTOS = [
  {
    src: GALLERY[0]!.src,
    alt: "Indoor dog daycare area at Chvostíkovo in Košice",
    title: "Indoor daycare rooms",
    text: "Heated indoor space for supervised time, calmer moments and rest throughout the day.",
  },
  {
    src: GALLERY[6]!.src,
    alt: "Secure outdoor dog run at Chvostíkovo in Košice",
    title: "Secure outdoor run",
    text: "An outdoor run of approximately 80 m² gives dogs room to move, explore and spend time outside under supervision.",
  },
  {
    src: GALLERY[5]!.src,
    alt: "Dogs resting during the day at Chvostíkovo dog daycare",
    title: "Space to slow down",
    text: "Rest is part of the routine. Dogs also have time and space to settle, switch off and recover.",
  },
];

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


const CARE_EN = [
  {
    src: GALLERY[3]!.src,
    alt: "Dogs enjoying an active day at Chvostíkovo dog daycare",
    title: "An active, balanced day",
    text: "Movement, play, fresh air and social contact are balanced with calmer periods, so the day is fun without becoming overwhelming.",
  },
  {
    src: GALLERY[2]!.src,
    alt: "Dogs under supervision at Chvostíkovo dog daycare",
    title: "All-day supervision",
    text: "At least two experienced caregivers are with the dogs during the day. We watch play, interactions, energy levels and when someone needs a break.",
  },
  {
    src: GALLERY[5]!.src,
    alt: "A dog resting during the day at Chvostíkovo",
    title: "Individual approach",
    text: "Every dog is different. We adjust activity, introductions and rest to the dog in front of us instead of forcing every dog into the same routine.",
  },
];

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
    ["#requirements", "Requirements"],
    ["#about", "About us"],
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
        <section id="top" className="relative overflow-hidden pt-20 pb-0 sm:pt-24 lg:pt-28 lg:pb-4">
          <div className="absolute inset-0 z-0">
            <img
              src={heroDogs}
              alt="Dogs at Chvostíkovo dog daycare in Košice"
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
            <div className="lg:hidden">
              <p className="mx-auto mb-4 max-w-fit rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-coral-dark shadow-soft sm:text-sm">
                🐾 New daycare dogs are welcome
              </p>

              <h1 className="text-[34px] leading-[1.05] text-forest sm:text-5xl">
                <span className="text-coral-dark">Dog daycare</span>
                <br />
                in Košice your dog
                <br />
                can look forward to
              </h1>

              <p className="mx-auto mt-4 max-w-fit rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-coral-dark shadow-soft sm:text-sm">
                Daytime care for medium and large dogs
              </p>

              <div className="mx-auto mt-5 max-w-xl rounded-2xl bg-white/95 p-4 text-forest shadow-soft">
                <p className="font-display text-base font-bold sm:text-lg">
                  Your dog does not have to spend the day home alone.
                </p>
                <p className="mt-2 text-base font-medium leading-relaxed text-forest/90">
                  Movement, rest and dog friends — with all-day supervision and a personal approach.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openInquiry("en_hero_mobile")}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-coral bg-coral px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-coral-dark"
              >
                Enquire about daycare
                <ArrowRight className="size-4" />
              </button>

              <InfoTicker language="en" className="mt-5 mb-0 w-screen mx-[calc((100%-100vw)/2)]" />
            </div>

            <div className="hidden lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
              <div className="flex min-w-0 flex-col lg:py-6">
                <h1 className="order-2 text-6xl leading-[1.05] text-forest">
                  <span className="text-coral-dark">Dog daycare</span>{" "}
                  <span className="whitespace-nowrap">in Košice,</span>
                  <br />
                  your dog can
                  <br />
                  look forward to
                </h1>

                <p className="order-1 mx-0 mb-2 mt-0 max-w-fit rounded-full bg-white/95 px-4 py-1 text-sm font-bold text-coral-dark shadow-soft">
                  Daytime care for medium and large dogs
                </p>

                <div className="order-3 mx-0 mt-3 max-w-md rounded-2xl bg-white/95 p-4 text-forest shadow-soft">
                  <p className="font-display text-base font-bold lg:text-lg">
                    Your dog does not have to spend the day home alone.
                  </p>
                  <p className="mt-1 text-base font-medium text-forest/90">
                    Movement, rest and dog friends — with all-day supervision and a personal approach.
                  </p>
                </div>

                <a
                  href={"tel:" + PHONE}
                  data-tracking-source="en_hero_desktop"
                  className="btn-coral order-4 mt-4 inline-flex min-w-44 items-center justify-center gap-2 self-start px-4 py-2 text-sm"
                >
                  <Phone className="size-4" /> Call us
                </a>
              </div>

              <div className="min-w-0 rounded-4xl bg-card/95 p-8 shadow-soft backdrop-blur-sm">
                <h2 className="text-center text-2xl text-forest">Enquire about daycare</h2>
                <p className="mt-2 mb-4 text-center text-sm text-muted-foreground">
                  Fill in the short, non-binding form. We will get back to you and talk through the options for your dog.
                </p>
                <EnglishInquiryForm trackingSource="en_hero_desktop" />
              </div>
            </div>
          </div>
        </section>

        <div className="hidden lg:block">
          <InfoTicker language="en" />
        </div>

        <section className="bg-forest pt-10 pb-10 text-cream sm:pt-12 sm:pb-12">
          <div className="mx-auto max-w-6xl px-4">
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

        <section id="reviews" className="scroll-mt-24 bg-secondary/50 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="section-title text-3xl sm:text-4xl">150+ happy daycare dogs</h2>
            <p className="mt-3 text-forest/80">⭐ 5.0 on Google</p>
            <EnglishReviewCarousel />
          </div>
        </section>

        <section id="spaces" className="scroll-mt-24 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-title text-3xl sm:text-4xl">Where will your dog spend the day?</h2>
                <p className="mt-3 max-w-2xl text-forest/80">
                  Heated indoor rooms and a secure outdoor run of approximately 80 m² give dogs space for activity, calmer moments and rest.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end">
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-forest"
                >
                  <MapPin className="size-4" /> Poľská 6, Košice
                </a>
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-forest">
                  <Check className="size-4 text-coral" /> Free parking by the daycare
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {SPACE_PHOTOS.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-4xl bg-card shadow-card">
                  <img src={item.src} alt={item.alt} loading="lazy" className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <h3 className="text-xl text-forest">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest/80">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="care" className="scroll-mt-24 bg-card py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="section-title text-center text-3xl sm:text-4xl">How we care for your dog</h2>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {CARE_EN.map((item) => (
                <article key={item.title} className="flex flex-col overflow-hidden rounded-4xl bg-background shadow-card">
                  <img src={item.src} alt={item.alt} loading="lazy" className="h-56 w-full object-cover" />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl text-forest">{item.title}</h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-forest/80">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-7 hidden justify-center lg:flex">
              <button
                type="button"
                onClick={() => openInquiry("en_care_desktop")}
                className="btn-coral"
              >
                I want to know more
              </button>
            </div>
          </div>
        </section>

        <section className="bg-card py-10 lg:hidden">
          <div className="mx-auto max-w-2xl px-4">
            <div className="rounded-4xl bg-secondary/70 p-6 shadow-soft ring-1 ring-coral/15 sm:p-8">
              <h2 className="text-center text-2xl text-forest">Want to know if daycare is right for your dog?</h2>
              <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
                Fill in the short, non-binding form. We will get back to you and talk through the options.
              </p>
              <EnglishInquiryForm trackingSource="en_care_inline_mobile" />
            </div>
          </div>
        </section>

        <section id="why-daycare" className="scroll-mt-24 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="overflow-hidden rounded-4xl bg-forest px-6 py-10 text-cream sm:px-12 sm:py-12">
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
        </section>

        <section id="faq" className="scroll-mt-24 bg-card py-14 sm:py-18">
          <div className="mx-auto max-w-4xl px-4">
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

        <section className="py-14 sm:py-18">
          <div className="mx-auto max-w-6xl px-4">
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

        <section id="requirements" className="scroll-mt-24 bg-secondary/45 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Before joining</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">What your dog needs before daycare</h2>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {[
                [ShieldCheck, "Required vaccinations", "A valid vaccination record is required, including rabies, core infectious diseases and kennel cough."],
                [Sparkles, "Parasite prevention", "Dogs should be regularly dewormed and protected against external parasites before joining the group."],
                [HeartHandshake, "Group suitability", "The introductory visit helps us assess whether a group daycare environment is comfortable and appropriate for your dog."],
                [Moon, "Health and comfort", "Please tell us about allergies, health needs or anything that can help us care for your dog safely and comfortably."],
              ].map(([Icon, heading, copy]) => {
                const CardIcon = Icon as typeof ShieldCheck;
                return (
                  <article key={String(heading)} className="rounded-4xl bg-card p-7 shadow-card">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-forest">
                      <CardIcon className="size-6" />
                    </span>
                    <h3 className="mt-4 text-xl text-forest">{String(heading)}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-forest/80">{String(copy)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 py-14 sm:py-18">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">About Chvostíkovo</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">A small daycare with a personal approach</h2>
              <div className="mt-5 space-y-4 text-forest/85">
                <p>
                  Chvostíkovo was created because, as owners of larger dogs ourselves, we know how important it is to have a place where you can leave your dog with real confidence.
                </p>
                <p>
                  We focus on medium and large breeds and keep the daycare personal. We want to know the dogs who come to us — their personalities, needs, friendships and the things that help them feel comfortable.
                </p>
                <p>
                  Safety, movement, rest and respectful handling matter more to us than simply filling the day with constant activity.
                </p>
              </div>
            </div>

            <img
              src={teamDogs}
              alt="The people and dogs behind Chvostíkovo dog daycare"
              loading="lazy"
              className="h-72 w-full rounded-4xl object-cover shadow-card sm:h-96"
            />
          </div>
        </section>

        <section className="bg-card pb-14 sm:pb-18">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-4xl bg-forest p-7 text-center text-cream shadow-soft sm:p-10">
              <h2 className="text-3xl text-cream sm:text-4xl">Want to know if Chvostíkovo is right for your dog?</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-cream/85">
                Send us a short enquiry or call us. We will be happy to explain how daycare works and arrange a free introductory visit.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => openInquiry("en_final_cta")} className="btn-coral">
                  Enquire about daycare
                </button>
                <a
                  href={"tel:" + PHONE}
                  data-tracking-source="en_final_cta"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-cream/60 px-6 py-3 font-display font-semibold text-cream transition-colors hover:bg-cream hover:text-forest"
                >
                  <Phone className="size-4" /> {PHONE_PRETTY}
                </a>
              </div>

              <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
                <a href={MAP_LINK} target="_blank" rel="noreferrer" className="rounded-2xl bg-cream/10 p-4 text-cream hover:bg-cream/15">
                  <MapPin className="mb-2 size-5 text-coral-soft" />
                  <span className="block text-xs text-cream/65">Address</span>
                  <strong className="text-sm">{ADDRESS.street}, {ADDRESS.city}</strong>
                </a>
                <div className="rounded-2xl bg-cream/10 p-4">
                  <Clock3 className="mb-2 size-5 text-coral-soft" />
                  <span className="block text-xs text-cream/65">Opening hours</span>
                  <strong className="text-sm">Mon–Fri · 7:00–17:00</strong>
                </div>
                <div className="rounded-2xl bg-cream/10 p-4">
                  <Check className="mb-2 size-5 text-coral-soft" />
                  <span className="block text-xs text-cream/65">First meeting</span>
                  <strong className="text-sm">Free introductory visit</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-forest py-10 text-cream/80">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 text-center sm:grid-cols-[auto_1fr_auto] sm:items-start sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <img src={logo} alt="Chvostíkovo dog daycare" className="h-8 w-auto brightness-0 invert opacity-90" />
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm">
              Chvostíkovo dog daycare · Poľská 6, Košice ·{" "}
              <a href={"tel:" + PHONE} data-tracking-source="en_footer" className="font-semibold text-cream hover:text-coral-soft">
                {PHONE_PRETTY}
              </a>
            </p>
            <p className="text-xs">
              © {new Date().getFullYear()} Chvostíkovo ·{" "}
              <a href="/en/cookies" className="underline hover:text-cream">Cookies</a>{" "}·{" "}
              <a href="/en/privacy" className="underline hover:text-cream">Privacy</a>{" "}·{" "}
              <a href="/en/operator-details" className="underline hover:text-cream">Operator details</a>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" aria-label="Instagram Chvostíkovo" className="flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral">
              <Instagram className="size-5" />
            </a>
            <a href={FACEBOOK} target="_blank" rel="noreferrer" aria-label="Facebook Chvostíkovo" className="flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral">
              <Facebook className="size-5" />
            </a>
          </div>
        </div>
      </footer>

      <FormDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        title="Enquire about dog daycare"
        subtitle="Fill in the short, non-binding form. We will get back to you and talk through the options for your dog."
      >
        <EnglishInquiryForm trackingSource="en_modal" />
      </FormDialog>
    </div>
  );
}
