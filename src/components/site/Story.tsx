import { useState } from "react";
import { Home, Zap, Dog, Check } from "lucide-react";
import { FormDialog } from "./FormDialog";
import { Collapse } from "./Collapse";
import { LongForm, ShortForm } from "./Forms";
import { EnglishInquiryForm } from "./EnglishInquiryForm";
import { CARE, WHY, PHONE, GARDEN_PHOTO } from "@/content/site";
import teamPhoto from "@/assets/team-dogs.jpg";
import dogsPair from "@/assets/dogs-pair.jpg";
import certAdriana from "@/assets/cert-adriana.jpg";
import certMarek from "@/assets/cert-marek.png";
import wetpet from "@/assets/partner-wetpet.png";
import bellacord from "@/assets/partner-bellacord.png";
import coursing from "@/assets/partner-coursing.png";
import lolkio from "@/assets/partner-lolkio.png";
import { trackMarketingInteraction } from "@/lib/analytics";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

const whyIcons = [Home, Zap, Dog];

const ABOUT_MORE = [
  "Práve preto vzniklo Chvostíkovo – psia škôlka v Košiciach zameraná na stredné a veľké plemená, kde sú bezpečie, pohoda a individuálny prístup na prvom mieste. Máme dlhoročné skúsenosti s prácou so psami (práca v útulku, starostlivosť o psov v dočasnej opatere, výchova vlastných psíkov). Tieto skúsenosti nás naučili rozumieť ich potrebám, komunikácii aj správaniu v skupine.",
  "Chvostíkovo nie je len miesto na stráženie psov. Je to druhý domov, kde sa o každého člena svorky staráme s rovnakou zodpovednosťou a pozornosťou, akú venujeme našim vlastným psom.",
];

function renderText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}



export function Care({ language = "sk" }: { language?: "sk" | "en" }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const isEnglish = language === "en";
  const careEn = [
    {
      img: CARE[0]!.img,
      pos: CARE[0]!.pos,
      alt: "Active day at Chvostíkovo dog daycare",
      title: "Active day",
      text: "**While you are at work** or taking care of everyday responsibilities, your dog can enjoy an **active day** full of movement, games and contact with other dogs. There is time for the outdoor run, fresh air and plenty of opportunities to use both **physical and mental energy**. Of course, the day also includes **rest** and **lots of affection**.",
    },
    {
      img: CARE[1]!.img,
      pos: CARE[1]!.pos,
      alt: "All-day supervision at Chvostíkovo dog daycare in Košice",
      title: "All-day supervision",
      text: "Chvostíkovo is a **second home** for your dog. That is why the **safety and comfort** of our daycare dogs come first. Throughout the day, the dogs are **supervised by at least two experienced caregivers**, helping maintain a calm environment for play, rest and safe interactions.",
    },
    {
      img: CARE[2]!.img,
      pos: CARE[2]!.pos,
      alt: "Individual care for dogs at Chvostíkovo",
      title: "Individual approach",
      text: "**Every dog is unique**, so we approach each one **individually**, with **patience and respect** for their needs. As dog owners ourselves, we understand the trust you place in us — every daycare dog receives the same care and attention we would want for **our own dogs**.",
    },
  ];
  const items = isEnglish ? careEn : CARE;

  return (
    <section id={isEnglish ? "care" : "starostlivost"} className="relative scroll-mt-24 overflow-hidden py-12 sm:py-16">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">
          {isEnglish ? "How we care for your dog" : "Ako sa postaráme o psíka"}
        </h2>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map((c) => (
            <article
              key={c.title}
              className="flex flex-col overflow-hidden rounded-4xl bg-card shadow-card"
            >
              <img
                src={c.img}
                alt={c.alt}
                loading="lazy"
                className={`h-56 w-full object-cover ${c.pos}`}
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl text-forest">{c.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-forest/80">{renderText(c.text)}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => {
              trackMarketingInteraction("inquiry_cta", isEnglish ? "en_care_cta" : "care_cta");
              setInfoOpen(true);
            }}
            className="btn-coral inline-flex min-w-[250px] items-center justify-center px-7 py-3.5 text-[15px] sm:min-w-[330px] sm:px-10 sm:py-4 sm:text-lg"
          >
            {isEnglish ? "This is what I want for my dog" : "Toto chcem pre svojho psíka"}
          </button>
        </div>
      </div>

      <FormDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        title={isEnglish ? "Enquire about dog daycare" : "Informujte sa o škôlke"}
        subtitle={
          isEnglish
            ? "Fill in the short, non-binding form. We will get back to you and talk through the options for your dog."
            : "Vyplňte nezáväzný formulár. Ozveme sa vám späť do 24 hodín a radi s vami preberieme viac informácií."
        }
      >
        {isEnglish ? (
          <EnglishInquiryForm trackingSource="en_care_cta" />
        ) : (
          <ShortForm
            trackingSource="care_cta"
            onSent={() => setTimeout(() => setInfoOpen(false), 2200)}
          />
        )}
      </FormDialog>
    </section>
  );
}

export function Why() {
  const [open, setOpen] = useState(false);

  return (
    <section id="preco" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-4xl bg-forest px-6 py-10 text-cream sm:px-12 sm:py-12">
          <SectionAmbientPaws tone="dark" />
          <div className="relative z-10">
          <h2 className="text-center font-display text-3xl text-cream sm:text-4xl">
            Prečo využiť psiu škôlku?
          </h2>

          {/* Mobil – rozbaľovacie karty */}
          <div className="mt-6 space-y-3 md:hidden">
            {WHY.map((w, i) => {
              const Icon = whyIcons[i]!;
              return (
                <Collapse
                  key={w.title}
                  title={w.title}
                  tone="dark"
                  icon={
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                  }
                >
                  {w.text}
                </Collapse>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="mt-8 hidden gap-6 md:grid md:grid-cols-3">
            {WHY.map((w, i) => {
              const Icon = whyIcons[i]!;
              return (
                <div
                  key={w.title}
                  className="rounded-3xl bg-cream/10 p-6 ring-1 ring-cream/15 backdrop-blur-sm"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-coral text-primary-foreground">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-xl text-cream">{w.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-cream/85">{w.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="btn-coral">
              Prihláška do škôlky
            </button>
            <a
              href={`tel:${PHONE}`}
              className="inline-flex items-center justify-center rounded-full border-2 border-cream/60 px-6 py-3 font-display font-semibold text-cream transition-colors hover:bg-cream hover:text-forest"
            >
              Zavolajte nám
            </a>
          </div>
          </div>
        </div>
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Prihlás svojho psíka ešte dnes"
        subtitle="Vyplňte prihlášku do škôlky, v ktorej nám poviete viac o vašom psíkovi. Následne sa vám ozveme a dohodneme ďalší postup pri jeho prihlásení do škôlky."
      >
        <LongForm onSent={() => setTimeout(() => setOpen(false), 15_000)} />
      </FormDialog>
    </section>
  );
}

export function About({ language = "sk" }: { language?: "sk" | "en" }) {
  const isEnglish = language === "en";

  return (
    <section id={isEnglish ? "about" : "o-nas"} className="relative scroll-mt-24 overflow-hidden py-12 sm:py-16">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
        <div>
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            {isEnglish ? "About us" : "O nás"}
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">
            {isEnglish ? "Who is behind Chvostíkovo?" : "Kto stojí za Chvostíkovom?"}
          </h2>
          <div className="mt-5 space-y-4 text-forest/85">
            <p>
              {isEnglish
                ? "We are a caring young couple brought together by our love of dogs, especially medium and large breeds."
                : "Sme starostlivá mladá dvojica, ktorú spája láska k psom, najmä k stredným a veľkým plemenám."}
            </p>
            <p>
              {isEnglish
                ? "As owners of larger dogs ourselves, we realised how difficult it can be to find a place where we would leave our four-legged companions with complete confidence during a workday or unexpected responsibilities."
                : "Ako majitelia väčších psíkov sme si uvedomili, aké náročné môže byť nájsť miesto, kde by sme svojich štvornohých spoločníkov nechali s úplnou dôverou počas pracovného dňa či nečakaných povinností."}
            </p>

            <div className="md:hidden">
              <Collapse title={isEnglish ? "Read more about us" : "Čítať viac o nás"}>
                <div className="space-y-4">
                  <p>
                    {isEnglish
                      ? "That is why Chvostíkovo was created — a dog daycare in Košice focused on medium and large breeds, where safety, wellbeing and an individual approach come first. We have years of experience working with dogs, including shelter work, temporary foster care and raising our own dogs. These experiences taught us to understand their needs, communication and behaviour in a group."
                      : ABOUT_MORE[0]}
                  </p>
                  <p>
                    {isEnglish
                      ? "Chvostíkovo is more than a place for daytime care. It is a second home where every member of the pack receives the same responsibility, attention and care we give our own dogs."
                      : ABOUT_MORE[1]}
                  </p>
                </div>
              </Collapse>
            </div>

            <div className="hidden space-y-4 md:block">
              <p>
                {isEnglish
                  ? "That is why Chvostíkovo was created — a dog daycare in Košice focused on medium and large breeds, where safety, wellbeing and an individual approach come first. We have years of experience working with dogs, including shelter work, temporary foster care and raising our own dogs. These experiences taught us to understand their needs, communication and behaviour in a group."
                  : ABOUT_MORE[0]}
              </p>
              <p>
                {isEnglish
                  ? "Chvostíkovo is more than a place for daytime care. It is a second home where every member of the pack receives the same responsibility, attention and care we give our own dogs."
                  : ABOUT_MORE[1]}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <img
            src={teamPhoto}
            alt={isEnglish ? "The owners of Chvostíkovo dog daycare with their dogs" : "Majitelia psej škôlky Chvostíkovo so svojimi psíkmi"}
            loading="lazy"
            className="h-60 w-full rounded-4xl object-cover shadow-card sm:h-72"
          />
          <div className="grid grid-cols-2 gap-3">
            <img
              src={dogsPair}
              alt={isEnglish ? "Our Irish Wolfhounds" : "Naši psíci – írske vlkodavy"}
              loading="lazy"
              className="h-36 w-full rounded-3xl object-cover shadow-card sm:h-44"
            />
            <img
              src={GARDEN_PHOTO}
              alt={isEnglish ? "Our dogs relaxing in the garden" : "Naši psíci oddychujú v záhrade"}
              loading="lazy"
              className="h-36 w-full rounded-3xl object-cover shadow-card sm:h-44"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-8 max-w-6xl px-4">
        <div className="grid items-center gap-8 rounded-4xl bg-secondary p-7 sm:p-10 md:text-center lg:grid-cols-[1fr_auto] lg:text-left">
          <div className="md:flex md:flex-col md:items-center lg:items-start">
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 font-display font-semibold text-forest shadow-card">
              <Check className="size-5 text-coral" />
              {isEnglish
                ? "Your dog's health and safety come first!"
                : "Zdravie a bezpečie vášho psíka je pre nás na prvom mieste!"}
            </p>
            <p className="mt-4 max-w-lg text-forest/80 md:mx-auto lg:mx-0">
              {isEnglish
                ? "We have both completed a canine first-aid workshop, so if needed we know how to respond quickly and appropriately."
                : "Obaja sme absolvovali workshop prvej pomoci pre psov, takže v prípade potreby vieme zareagovať rýchlo a správne."}
            </p>
          </div>

          <div className="grid grid-cols-2 place-items-center gap-3 sm:gap-5">
            {[
              {
                src: certAdriana,
                alt: isEnglish
                  ? "Canine first-aid workshop certificate – Adriana Konkoľová"
                  : "Certifikát – workshop prvej pomoci pre psov, Adriana Konkoľová",
              },
              {
                src: certMarek,
                alt: isEnglish
                  ? "Canine first-aid workshop certificate – Marek Leder"
                  : "Certifikát – workshop prvej pomoci pre psov, Marek Leder",
              },
            ].map((c) => (
              <img
                key={c.src}
                src={c.src}
                alt={c.alt}
                loading="lazy"
                className="w-full max-w-36 rounded-2xl object-contain shadow-card sm:max-w-44"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PARTNERS = [
  {
    name: "wetPet – rehabilitácia pre psov a mačky",
    logo: wetpet,
    href: "https://wetpet.sk/",
  },
  {
    name: "Bellacord – handmade vodítka a obojky",
    logo: bellacord,
    href: "https://instagram.com/bellacord_handmade",
  },
  {
    name: "Coursing Košice",
    logo: coursing,
    href: "https://www.facebook.com/groups/631834420173973/",
  },
  { name: "Lolkio – tréner psov", logo: lolkio, href: null },
];

export function Partners() {
  return (
    <section className="relative overflow-hidden py-10 sm:py-14">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-base font-semibold tracking-widest text-forest/60 uppercase sm:text-lg">
          Spolupracujeme
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:flex-nowrap sm:items-center sm:justify-center sm:gap-4 lg:gap-5">
          {PARTNERS.map((p) => {
            const inner = (
              <img
                src={p.logo}
                alt={p.name}
                loading="lazy"
                className="max-h-10 w-auto max-w-[80%] object-contain opacity-80 transition group-hover:opacity-100 sm:max-h-12 lg:max-h-16"
              />
            );
            return p.href ? (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-20 w-full flex-1 items-center justify-center rounded-2xl bg-card px-5 shadow-card transition hover:-translate-y-0.5 sm:min-w-0 sm:max-w-40 sm:px-7 lg:max-w-44"
              >
                {inner}
              </a>
            ) : (
              <div
                key={p.name}
                className="group flex h-20 w-full flex-1 items-center justify-center rounded-2xl bg-card px-5 shadow-card sm:min-w-0 sm:max-w-40 sm:px-7 lg:max-w-44"
              >
                {inner}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

