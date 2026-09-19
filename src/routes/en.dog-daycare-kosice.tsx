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

function EnglishHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const mobileItems = [
    ["#care", "How we care"],
    ["#reviews", "Reviews"],
    ["#safety", "Safety"],
    ["#spaces", "Our spaces"],
    ["#about", "About us"],
    ["#requirements", "Requirements"],
    ["#faq", "FAQ"],
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-soft backdrop-blur-md sm:px-6">
        <a href="/" className="shrink-0">
          <img src={logo} alt="Chvostíkovo dog daycare Košice" className="h-5 w-auto sm:h-6" />
        </a>
        <nav className="hidden items-center gap-6 lg:flex">
          <a href="#care" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">How we care</a>
          <a href="#reviews" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">Reviews</a>
          <a href="#safety" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">Safety</a>
          <a href="#about" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">About us</a>
          <a href="#faq" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/" className="rounded-full bg-secondary px-3 py-2 font-display text-xs font-semibold text-forest">SK</a>
          <a href="#enquiry" className="btn-coral px-3 py-2 text-[0.7rem] sm:px-5 sm:text-sm">Enquire</a>
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
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl bg-card/98 p-3 shadow-soft backdrop-blur-md lg:hidden">
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
          <a
            href={`tel:${PHONE}`}
            onClick={() => setMenuOpen(false)}
            className="btn-coral mt-2 flex w-full items-center justify-center gap-2 py-3 text-sm"
          >
            <Phone className="size-4" /> Call us
          </a>
        </div>
      )}
    </header>
  );
}

function EnglishDogDaycarePage() {
  return (
    <div className="min-h-screen bg-background">
      <EnglishHeader />
      <main>
        <section id="top" className="relative overflow-hidden pt-20 pb-4 sm:pt-24 lg:pb-6">
          <div className="absolute inset-0 z-0">
            <img
              src={heroDogs}
              alt="Dogs at Chvostíkovo dog daycare in Košice"
              className="size-full object-cover object-[50%_35%]"
            />
            <div className="absolute inset-0 bg-cream/10" />
            <div className="absolute inset-0 bg-linear-to-r from-cream/95 via-cream/60 via-50% to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-cream to-transparent" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-4">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
              <div className="py-4 text-center lg:py-8 lg:text-left">
                <p className="mx-auto mb-3 max-w-fit rounded-full bg-white/95 px-4 py-1 font-display text-xs font-bold text-coral-dark shadow-soft lg:mx-0 sm:text-sm">
                  Dog daycare for medium and large dog breeds
                </p>
                <h1 className="text-4xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
                  <span className="text-coral-dark">Dog daycare</span> in Košice,
                  <br className="hidden sm:block" /> with care you can trust
                </h1>
                <div className="mx-auto mt-5 max-w-xl rounded-2xl bg-white/95 p-4 text-forest shadow-soft lg:mx-0">
                  <p className="font-display text-base font-bold sm:text-lg">
                    Your dog does not have to spend the day home alone.
                  </p>
                  <p className="mt-1 leading-relaxed text-forest/90">
                    Movement, supervised social time, calm breaks and rest — all in a safe, family-like environment with all-day supervision.
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                  <span className="rounded-full bg-card px-4 py-2 text-sm font-semibold text-forest shadow-card">Mon–Fri · 7:00–17:00</span>
                  <span className="rounded-full bg-card px-4 py-2 text-sm font-semibold text-forest shadow-card">Poľská 6 · Košice</span>
                </div>
                <a
                  href={`tel:${PHONE}`}
                  className="btn-coral mt-4 hidden items-center gap-2 px-4 py-2 text-sm lg:inline-flex"
                >
                  <Phone className="size-4" /> Call us
                </a>
              </div>

              <div id="enquiry" className="scroll-mt-28 rounded-4xl bg-card/95 p-6 shadow-soft backdrop-blur-sm sm:p-8">
                <h2 className="text-center text-2xl text-forest">Interested in daycare?</h2>
                <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
                  Fill in our short, no-obligation form. We will get back to you within 24 hours and gladly go through the details with you.
                </p>
                <EnglishInquiryForm />
                <a
                  href={`tel:${PHONE}`}
                  className="btn-coral mt-5 flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm lg:hidden"
                >
                  <Phone className="size-4" /> Call us
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="hidden lg:block">
          <InfoTicker language="en" />
        </div>

        <section className="py-10 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Clock3, "Daytime care", "Monday to Friday, 7:00–17:00"],
              [ShieldCheck, "All-day supervision", "At least two experienced caregivers"],
              [MapPin, "Košice", "Poľská 6, 040 01 Košice"],
              [HeartHandshake, "Introductory visit", "Every new dog starts with a free first visit"],
            ].map(([Icon, heading, text]) => {
              const CardIcon = Icon as typeof ShieldCheck;
              return (
                <article key={String(heading)} className="rounded-3xl bg-card p-5 shadow-card">
                  <CardIcon className="size-5 text-coral" />
                  <h2 className="mt-3 text-lg text-forest">{String(heading)}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-forest/75">{String(text)}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="reviews" className="scroll-mt-24 bg-secondary/50 pt-12 pb-16 sm:pt-14 sm:pb-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">What owners say</p>
            <h2 className="section-title mt-2 text-3xl sm:text-4xl">Happy dogs, calmer owners</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-forest/65">Selected reviews translated from Slovak.</p>
            <EnglishReviewCarousel />
          </div>
        </section>

        <section id="care" className="scroll-mt-24 bg-secondary/45 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">More than pet sitting</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">A meaningful day, not just somewhere to wait</h2>
              <p className="mt-4 leading-relaxed text-forest/80">
                Chvostíkovo is a daytime dog daycare in Košice. We combine supervised group care, movement, social contact, quieter moments and proper rest. Dogs are not simply left together to entertain themselves all day.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [ShieldCheck, "All-day supervision", "At least two experienced caregivers stay with the dogs throughout the day."],
                [Users, "Safe interactions", "We watch play and communication between dogs and step in before situations escalate."],
                [HeartHandshake, "Family-like environment", "We get to know our daycare dogs as individuals, including their personalities and needs."],
                [Moon, "Activity and rest", "A good daycare day is not eight hours of running. Active periods are balanced with calm and sleep."],
              ].map(([Icon, heading, text]) => {
                const CardIcon = Icon as typeof ShieldCheck;
                return (
                  <article key={String(heading)} className="rounded-4xl bg-card p-6 shadow-card">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-forest">
                      <CardIcon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-xl text-forest">{String(heading)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest/75">{String(text)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="safety" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-4xl bg-forest p-7 text-center text-cream shadow-soft sm:p-10">
              <ShieldCheck className="mx-auto size-8 text-coral-soft" />
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl text-cream sm:text-4xl">Safety is not an extra. It is the foundation of the day.</h2>
              <div className="mx-auto mt-5 max-w-3xl space-y-4 leading-relaxed text-cream/85">
                <p>
                  Safety starts before the first full daycare day. Every new dog has an introductory visit so we can observe how they respond to the environment, people and other dogs and whether group daycare is a good fit.
                </p>
                <p>
                  During the day we supervise interactions, energy levels, mood and the need for rest. If a dog needs a break, they get one. If play becomes too intense, a caregiver steps in before another dog has to.
                </p>
                <p className="font-semibold text-cream">
                  Vaccination, parasite prevention and good general health are part of our admission requirements.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="spaces" className="scroll-mt-24 bg-secondary/55 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Our daycare spaces</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Where will your dog spend the day?</h2>
              <p className="mt-4 leading-relaxed text-forest/80">
                Chvostíkovo combines indoor rooms with a secure outdoor run, so the day can naturally alternate between movement, social time, calmer moments and rest.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {SPACE_PHOTOS.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-4xl bg-card shadow-card">
                  <img src={item.src} alt={item.alt} loading="lazy" className="h-64 w-full object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl text-forest">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest/75">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-7 text-center">
              <a href={MAP_LINK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-forest shadow-card transition hover:bg-secondary">
                <MapPin className="size-4 text-coral" /> Poľská 6, Košice
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="overflow-hidden rounded-4xl shadow-soft">
              <img src={teamDogs} alt="Chvostíkovo dog daycare team and dogs" className="h-full min-h-80 w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Who we are</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">A small dog daycare with a personal approach</h2>
              <div className="mt-5 space-y-4 leading-relaxed text-forest/80">
                <p>
                  Chvostíkovo is an independent daytime dog daycare in Košice, created by two dog owners who know how important it is to find a place you genuinely trust with your dog.
                </p>
                <Collapse title="Read more about us">
                  <div className="space-y-4">
                    <p>
                      We wanted to create the kind of daycare we would feel comfortable leaving our own dogs in: a smaller group, constant supervision, enough room to move and a daily routine that also leaves space for calm time and proper rest.
                    </p>
                    <p>
                      At least two experienced caregivers are with the dogs throughout the day. We get to know each dog individually — their temperament, play style, energy level and when they need a break — rather than treating the group as one big pack.
                    </p>
                    <p className="font-semibold text-forest">
                      We mainly care for medium and large dogs and intentionally keep the number of dogs limited so we can maintain personal supervision and a comfortable atmosphere.
                    </p>
                  </div>
                </Collapse>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">How it works</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Starting daycare in 3 simple steps</h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ["Get in touch", "Fill in the form or call us and tell us a little about your dog."],
                ["Free introductory visit", "We meet your dog, show you the daycare and observe how they respond to the environment and other dogs."],
                ["First daycare day", "If daycare is a good fit, we agree on the next step and your dog can start attending."],
              ].map(([heading, text], index) => (
                <li key={heading} className="relative rounded-4xl bg-background p-7 pt-9 shadow-card">
                  <span className="absolute -top-5 left-7 flex size-11 items-center justify-center rounded-full bg-coral font-display text-lg font-bold text-primary-foreground shadow-card">{index + 1}</span>
                  <h3 className="text-xl text-forest">{heading}</h3>
                  <p className="mt-2 leading-relaxed text-forest/80">{text}</p>
                  {index === 1 && <p className="mt-4 flex gap-2 text-sm font-semibold text-forest"><Check className="size-5 text-coral" /> Introductory visit is free</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="requirements" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Admission requirements</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">What your dog needs before joining</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="rounded-4xl bg-card p-7 shadow-card">
                <ShieldCheck className="size-6 text-coral" />
                <h3 className="mt-4 text-xl text-forest">Vaccinations</h3>
                <p className="mt-2 leading-relaxed text-forest/80">A valid vaccination record is required, including rabies, core infectious diseases and kennel cough.</p>
              </article>
              <article className="rounded-4xl bg-card p-7 shadow-card">
                <Sparkles className="size-6 text-coral" />
                <h3 className="mt-4 text-xl text-forest">Parasite prevention</h3>
                <p className="mt-2 leading-relaxed text-forest/80">Dogs need regular internal and external parasite protection before attending daycare.</p>
              </article>
              <article className="rounded-4xl bg-card p-7 shadow-card">
                <HeartHandshake className="size-6 text-coral" />
                <h3 className="mt-4 text-xl text-forest">Suitable for group care</h3>
                <p className="mt-2 leading-relaxed text-forest/80">The introductory visit helps us decide whether our group daycare environment is comfortable and appropriate for your dog.</p>
              </article>
              <article className="rounded-4xl bg-card p-7 shadow-card">
                <Clock3 className="size-6 text-coral" />
                <h3 className="mt-4 text-xl text-forest">Daytime only</h3>
                <p className="mt-2 leading-relaxed text-forest/80">We are a dog daycare, not an overnight boarding facility. Dogs go home with their owners after the daycare day.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 bg-secondary/45 py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">FAQ</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Frequently asked questions</h2>
            </div>
            <div className="mt-10 space-y-3">
              {FAQ.map((item) => (
                <Collapse key={item.q} title={item.q}>{item.a}</Collapse>
              ))}
            </div>
          </div>
        </section>

        <section id="instagram" className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Instagram</p>
            <h2 className="section-title mt-2 text-3xl sm:text-4xl">See everyday life at Chvostíkovo</h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-forest/80">
              We regularly share photos and videos from our daycare days, so you can get a real feel for life at Chvostíkovo.
            </p>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              className="btn-coral mt-8 inline-flex items-center gap-2.5"
            >
              <Instagram className="size-4.5" /> Follow us on Instagram
            </a>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-4xl bg-forest p-7 text-center text-cream shadow-soft sm:p-10">
              <p className="font-display text-sm font-semibold tracking-wide text-coral-soft uppercase">Dog daycare in Košice</p>
              <h2 className="mt-2 text-3xl text-cream sm:text-4xl">Want to know if Chvostíkovo is right for your dog?</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-cream/80">Send us a short enquiry. We will get back to you within 24 hours and explain the next step.</p>
              <a href="#enquiry" className="btn-coral mt-6 inline-flex items-center gap-2">Enquire about daycare <ArrowRight className="size-4" /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-forest py-10 text-cream/80">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 text-center sm:grid-cols-[auto_1fr_auto] sm:items-start sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <img src={logo} alt="Chvostíkovo" className="h-8 w-auto brightness-0 invert opacity-90" />
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm">
              Chvostíkovo Dog Daycare · Poľská 6, Košice
              <a href={`tel:${PHONE}`} className="mt-1 block whitespace-nowrap font-semibold text-cream hover:text-coral-soft">{PHONE_PRETTY}</a>
            </p>
            <p className="text-xs">
              © {new Date().getFullYear()} Chvostíkovo ·{" "}
              <a href="/en/cookies" className="underline hover:text-cream">Cookies</a>{" "}
              ·{" "}
              <a href="/en/privacy" className="underline hover:text-cream">Privacy</a>{" "}
              ·{" "}
              <a href="/en/operator-details" className="underline hover:text-cream">Operator details</a>{" "}
              ·{" "}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("chvostikovo-open-cookie-settings"))}
                className="underline hover:text-cream"
              >
                Cookie settings
              </button>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              aria-label="Chvostíkovo on Instagram"
              className="flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral"
            >
              <Instagram className="size-5" />
            </a>
            <a
              href={FACEBOOK}
              target="_blank"
              rel="noreferrer"
              aria-label="Chvostíkovo on Facebook"
              className="flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral"
            >
              <Facebook className="size-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
