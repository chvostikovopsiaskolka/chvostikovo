import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Clock3,
  HeartHandshake,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import logo from "@/assets/logo.png";
import heroDogs from "@/assets/hero-dogs.jpg";
import teamDogs from "@/assets/team-dogs.jpg";
import { EnglishInquiryForm } from "@/components/site/EnglishInquiryForm";
import { Collapse } from "@/components/site/Collapse";
import {
  ADDRESS,
  EMAIL,
  FACEBOOK,
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
    q: "Is my dog supervised all day?",
    a: "Yes. At least two experienced caregivers are with the dogs during the day. We supervise play, interactions, rest and changes in energy or mood.",
  },
  {
    q: "Does my dog have to play all day?",
    a: "No. A good daycare day includes movement and social time, but also calm periods and rest. We do not let dogs play continuously until they are exhausted.",
  },
  {
    q: "What happens before the first daycare day?",
    a: "Every new dog first has a free introductory visit. We get to know the dog, observe how they respond to the environment, people and other dogs, and then recommend the next step.",
  },
  {
    q: "Which dogs can attend?",
    a: "We mainly care for medium and large dogs. Dogs must meet our vaccination and parasite-prevention requirements and the group setting must be suitable for them.",
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
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-soft backdrop-blur-md sm:px-6">
        <a href="/" className="shrink-0">
          <img src={logo} alt="Chvostíkovo dog daycare Košice" className="h-5 w-auto sm:h-6" />
        </a>
        <nav className="hidden items-center gap-6 lg:flex">
          <a href="#care" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">How we care</a>
          <a href="#safety" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">Safety</a>
          <a href="#about" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">About us</a>
          <a href="#requirements" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">Requirements</a>
          <a href="#faq" className="font-display text-xs font-semibold text-forest/80 hover:text-coral">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/" className="rounded-full bg-secondary px-3 py-2 font-display text-xs font-semibold text-forest">SK</a>
          <a href="#enquiry" className="btn-coral px-3 py-2 text-[0.7rem] sm:px-5 sm:text-sm">Enquire</a>
        </div>
      </div>
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
                  Dog daycare & daytime dog sitting in Košice
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
              </div>

              <div id="enquiry" className="scroll-mt-28 rounded-4xl bg-card/95 p-6 shadow-soft backdrop-blur-sm sm:p-8">
                <p className="text-center font-display text-sm font-semibold tracking-wide text-coral uppercase">No obligation</p>
                <h2 className="mt-2 text-center text-2xl text-forest">Interested in daycare?</h2>
                <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
                  Fill in the short form. We will get back to you within 24 hours and gladly answer your questions.
                </p>
                <EnglishInquiryForm />
                <a
                  href={`tel:${PHONE}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 font-display text-sm font-semibold text-coral"
                >
                  <Phone className="size-4" /> Call us: {PHONE_PRETTY}
                </a>
              </div>
            </div>
          </div>
        </section>

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
            <div className="rounded-4xl bg-forest p-7 text-cream shadow-soft sm:p-10">
              <ShieldCheck className="size-8 text-coral-soft" />
              <h2 className="mt-5 text-3xl text-cream sm:text-4xl">Safety is not an extra. It is the foundation of the day.</h2>
              <div className="mt-5 space-y-4 leading-relaxed text-cream/85">
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

        <section className="bg-secondary/55 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">A day at Chvostíkovo</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Play, company and calm moments</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <Sparkles className="size-6 text-coral" />
                <h3 className="mt-4 text-2xl text-forest">Movement & play</h3>
                <p className="mt-3 leading-relaxed text-forest/80">Dogs have space to move, play and spend time with suitable canine friends.</p>
              </article>
              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <Users className="size-6 text-coral" />
                <h3 className="mt-4 text-2xl text-forest">Social time</h3>
                <p className="mt-3 leading-relaxed text-forest/80">We supervise group dynamics and do not expect every dog to interact with every other dog.</p>
              </article>
              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <Moon className="size-6 text-coral" />
                <h3 className="mt-4 text-2xl text-forest">Rest</h3>
                <p className="mt-3 leading-relaxed text-forest/80">Rest is part of the programme, not an afterthought. Dogs need time to switch off and recover.</p>
              </article>
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
                  Chvostíkovo is an independent daytime dog daycare in Košice. We created it as a place where dogs can spend the day safely, with people who notice the individual dog rather than treating the group as one big pack.
                </p>
                <p>
                  During the day, at least two experienced caregivers supervise the dogs. We focus on safe interactions, individual needs, movement, rest and a calm routine that makes sense for the dogs in front of us.
                </p>
                <p className="font-semibold text-forest">
                  We mainly care for medium and large dogs and keep the number of dogs limited so we can maintain personal supervision.
                </p>
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

      <footer className="bg-forest py-10 text-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
          <div>
            <img src={logo} alt="Chvostíkovo" className="h-7 w-auto" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/75">Daytime dog daycare in Košice with all-day supervision, safe social contact, movement and rest.</p>
          </div>
          <div>
            <h2 className="text-lg text-cream">Contact</h2>
            <div className="mt-3 space-y-2 text-sm text-cream/80">
              <p><a href={`tel:${PHONE}`} className="hover:text-coral-soft">{PHONE_PRETTY}</a></p>
              <p><a href={`mailto:${EMAIL}`} className="hover:text-coral-soft">{EMAIL}</a></p>
              <p><a href={MAP_LINK} target="_blank" rel="noreferrer" className="hover:text-coral-soft">{ADDRESS.street}, {ADDRESS.city}</a></p>
            </div>
          </div>
          <div>
            <h2 className="text-lg text-cream">Opening hours</h2>
            <p className="mt-3 text-sm text-cream/80">Monday–Friday<br />7:00–17:00</p>
            <div className="mt-4 flex gap-4 text-sm">
              <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="text-coral-soft hover:underline">Instagram</a>
              <a href={FACEBOOK} target="_blank" rel="noreferrer" className="text-coral-soft hover:underline">Facebook</a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t border-cream/15 px-4 pt-5 text-xs text-cream/60">© Chvostíkovo · Košice, Slovakia</div>
      </footer>
    </div>
  );
}
