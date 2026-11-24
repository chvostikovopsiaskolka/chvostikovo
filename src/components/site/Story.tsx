import { useState } from "react";
import { BookOpen, Check, CheckCircle2 } from "lucide-react";
import { FormDialog } from "./FormDialog";
import { Collapse } from "./Collapse";
import { ContextFaq } from "./ContextFaq";
import { LeadStepForm } from "./LeadStepForm";
import { LongForm } from "./Forms";
import { EnglishInquiryForm } from "./EnglishInquiryForm";
import { CARE, DAYCARE_GALLERY_EXTRAS, WHY, GARDEN_PHOTO, APPLICATION_TITLE } from "@/content/site";
import teamPhoto from "@/assets/team-dogs.jpg";
import dogsPair from "@/assets/dogs-pair.jpg";
import certAdriana from "@/assets/cert-adriana.jpg";
import certMarek from "@/assets/cert-marek.png";
import wetpet from "@/assets/partner-wetpet.png";
import bellacord from "@/assets/partner-bellacord.png";
import coursing from "@/assets/partner-coursing.png";
import lolkio from "@/assets/partner-lolkio.png";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { SectionAmbientPaws } from "./SectionAmbientPaws";
import { FriendshipFeature } from "./FriendshipFeature";
import { EditorialBenefits } from "./EditorialBenefits";
import careSupervisionOriginal from "@/assets/care-supervision-original.webp";
import careIndividualOriginal from "@/assets/care-individual-original.webp";
import { CarePhotoSlideshow } from "./CarePhotoSlideshow";

export const ABOUT_MORE = [
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



export function Care({ language = "sk", showEmbeddedFriendship = true, showInterest = true, showContextFaq = true, homeCombined = false }: { language?: "sk" | "en"; showEmbeddedFriendship?: boolean; showInterest?: boolean; showContextFaq?: boolean; homeCombined?: boolean }) {
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
  const combinedCopy = [
    { title: "Aktívny deň s kamošmi", text: "Aj keď má váš psík **energie na rozdávanie**, u nás si užije pohyb, hry, nové podnety a spoločnosť ostatných psíkov. Aktivity pravidelne striedame s **oddychom**." },
    { title: "Celodenná starostlivosť a dohľad", text: "Kým pracujete alebo si vybavujete povinnosti, váš psík nie je sám. Počas celého pobytu naňho dohliadajú **minimálne dvaja opatrovatelia**." },
    { title: "Individuálny prístup", text: "Každý psík má svoje tempo. Spoznávame jeho **povahu, zvyky a potreby**, aby sme mu dopriali bezpečný a príjemný deň v kolektíve." },
  ];
  const items = isEnglish ? careEn : homeCombined ? CARE.map((item, index) => ({ ...item, ...combinedCopy[index]! })) : CARE;
  const mobilePhotos = [
    {
      src: CARE[0]!.img,
      alt: isEnglish ? "Dogs enjoying an active day at Chvostíkovo" : "Psíkovia si užívajú aktívny deň v Chvostíkove",
      size: 900,
      position: CARE[0]!.pos,
    },
    {
      src: careSupervisionOriginal,
      alt: isEnglish ? "Two dogs sitting together at Chvostíkovo daycare" : "Dvaja psíkovia sedia spolu v škôlke Chvostíkovo",
      size: 1200,
      height: 1600,
      position: "object-[50%_35%]",
    },
    {
      src: careIndividualOriginal,
      alt: isEnglish ? "Happy Weimaraner at Chvostíkovo daycare" : "Usmiaty weimarský stavač v škôlke Chvostíkovo",
      size: 1200,
      height: 1600,
      position: "object-[50%_35%]",
    },
  ];


  return (
    <section id={isEnglish ? "care" : "starostlivost"} className="relative scroll-mt-24 overflow-hidden py-12 sm:py-16">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <h2 className="section-title text-center text-3xl sm:text-4xl">
          {isEnglish ? "How we care for your dog" : "Ako sa postaráme o psíka"}
        </h2>

        {/* Mobile: each photo shares a row with its complete benefit text. */}
        <div className="mt-8 space-y-4 sm:hidden">
          {items.map((item, i) => {
            const photo = mobilePhotos[i]!;
            return (
              <div key={item.title} className="grid grid-cols-[minmax(0,0.97fr)_minmax(0,1.03fr)] items-stretch gap-3">
                <figure className="relative min-h-40 min-w-0 overflow-hidden rounded-[20px] bg-secondary shadow-card">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.size}
                    height={photo.height ?? photo.size}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 size-full object-cover ${photo.position}`}
                  />
                </figure>
                <article className="min-w-0">
                  <h3 className="font-display text-[14px] leading-snug text-forest min-[390px]:text-[16px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.55] text-forest/80 min-[390px]:text-[14px]">
                    {renderText(item.text)}
                  </p>
                </article>
              </div>
            );
          })}
        </div>
        <div className="mt-8 hidden grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch gap-7 sm:grid lg:gap-12">
          {/* Desktop/tablet: rotate the same three photos; mobile keeps its paired rows. */}
          <CarePhotoSlideshow photos={mobilePhotos} language={language} />
          <div className="flex min-w-0 flex-col justify-between sm:justify-center">
            {items.map((item, i) => (
              <article
                key={item.title}
                className={`min-w-0 py-3 first:pt-0 last:pb-0 sm:py-5 ${i === 0 ? "" : "border-t border-forest/15"}`}
              >
                <h3 className="font-display text-[14px] leading-snug text-forest min-[390px]:text-[16px] sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-forest/80 min-[390px]:text-[14px] sm:text-base sm:leading-relaxed">
                  {renderText(item.text)}
                </p>
              </article>
            ))}
          </div>
        </div>

        {homeCombined && !isEnglish && (
          <div id="preco" className="mt-7 scroll-mt-24 text-center">
            <a href="/blog/je-psia-skolka-vhodna-pre-kazdeho-psa/"
              onClick={() => void trackCookielessInteraction("nav_click", "home_why_suitability_article")}
              className="inline-flex min-h-11 items-center justify-center gap-2 text-center font-display text-sm font-semibold leading-snug text-forest underline underline-offset-4 transition hover:text-coral-dark sm:text-base">
              <BookOpen className="size-5 shrink-0 text-coral" aria-hidden="true" />
              Prečítajte si viac o výhodách a vhodnosti psej škôlky
            </a>
          </div>
        )}
        {!isEnglish && showContextFaq && (
          <div className="mt-7 w-full space-y-3">
            <ContextFaq question="Ako zabezpečujete bezpečnosť psíkov v škôlke?" label="Ako dbáme na bezpečnosť psíkov?" source="home_care_safety" />
            <ContextFaq question="Hrajú sa psíkovia v škôlke celý deň?" source="home_care_daily_rhythm" />
          </div>
        )}

        {showEmbeddedFriendship && <FriendshipFeature language={language} embedded />}

        {showInterest && <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => {
              trackMarketingInteraction("inquiry_cta", isEnglish ? "en_care_cta" : "care_cta");
              setInfoOpen(true);
            }}
            className="btn-coral inline-flex min-w-[250px] items-center justify-center px-7 py-3.5 text-[15px] sm:min-w-[330px] sm:px-10 sm:py-4 sm:text-lg"
          >
            {isEnglish ? "This is what I’m looking for" : "Toto hľadám pre svojho psíka"}
          </button>
        </div>}
      </div>

      <FormDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        title={isEnglish ? "Enquire about dog daycare" : "Čo hľadáte pre svojho psíka?"}
        subtitle={
          isEnglish
            ? "Leave your contact details. We will get in touch, talk about your dog and answer your questions. If you are interested, we will arrange a free introductory visit."
            : "Nechajte nám kontakt. Ozveme sa vám, porozprávame sa o vašom psíkovi a odpovieme na vaše otázky. Ak budete mať záujem, dohodneme bezplatnú úvodnú návštevu."
        }
      >
        {isEnglish ? (
          <EnglishInquiryForm trackingSource="en_care_cta" />
        ) : (
          <LeadStepForm questionInHeading trackingSource="care_cta" />
        )}
      </FormDialog>
    </section>
  );
}

/** Existing friendship photo and card now serve the full application, not a second lead form. */
export function FriendshipApplication() {
  return (
    <section id="psie-priatelstva" className="relative bg-card pb-10 sm:pb-12">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <FriendshipFeature embedded applicationMode />
        <div data-home-friendship-form className="form-liquid-surface mx-auto mt-6 w-full max-w-4xl rounded-3xl bg-card p-4 shadow-card sm:p-6 lg:p-8">
          <h3 className="mb-5 text-center font-display text-xl font-bold text-forest sm:text-2xl">{APPLICATION_TITLE}</h3>
          <LongForm collapsible onExpand={() => void trackCookielessInteraction("nav_click", "home_friendship_application")} />
        </div>
      </div>
    </section>
  );
}

export function Why() {
  return (
    <section id="preco" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-4xl bg-forest px-6 py-10 text-cream sm:px-12 sm:py-12">
          <SectionAmbientPaws tone="dark" />
          <div className="relative z-10">
          <h2 className="text-center font-display text-3xl text-cream sm:text-4xl">
            Kedy môže škôlka pomôcť vám a vášmu psíkovi?
          </h2>

          <div className="mt-8">
            <EditorialBenefits mobileTextOnly image={DAYCARE_GALLERY_EXTRAS[2]!.src} alt={DAYCARE_GALLERY_EXTRAS[2]!.alt} secondImage={DAYCARE_GALLERY_EXTRAS[1]!.src} secondAlt={DAYCARE_GALLERY_EXTRAS[1]!.alt}>
              {WHY.map((w, i) => {
                return (
                  <article key={w.title} className={`py-4 first:pt-0 last:pb-0 sm:py-5 ${i ? "border-t border-cream/25" : ""}`}>
                    <h3 className="font-display text-lg font-bold leading-snug text-cream sm:text-xl">{w.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-cream/90 sm:text-base">{w.text}</p>
                  </article>
                );
              })}
            </EditorialBenefits>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/blog/je-psia-skolka-vhodna-pre-kazdeho-psa/"
              onClick={() => void trackCookielessInteraction("nav_click", "home_why_suitability_article")}
              className="inline-flex min-h-11 items-center justify-center gap-2 text-center font-display text-sm font-semibold leading-snug text-cream underline decoration-cream/60 underline-offset-4 transition hover:decoration-cream sm:text-base"
            >
              <BookOpen className="size-5 shrink-0 text-coral" aria-hidden="true" />
              Prečítajte si viac o výhodách a vhodnosti psej škôlky
            </a>
          </div>
          </div>
        </div>
      </div>

    </section>
  );
}

export function About({ language = "sk", homeLayout = false }: { language?: "sk" | "en"; homeLayout?: boolean }) {
  const isEnglish = language === "en";

  return (
    <section id={isEnglish ? "about" : "o-nas"} className="relative scroll-mt-24 overflow-hidden py-12 sm:py-16">
      <SectionAmbientPaws />
      {homeLayout && !isEnglish && (
        <h2 className="section-title relative z-10 mx-auto mb-7 px-2 text-center text-[clamp(13px,4vw,32px)] leading-tight tracking-[-0.04em] whitespace-nowrap">
          Kto sa bude starať o vášho psíka?
        </h2>
      )}
      <div className={"relative z-10 mx-auto max-w-6xl px-4 " + (homeLayout && !isEnglish ? "flex flex-col gap-7" : "grid items-center gap-10 lg:grid-cols-2")}>
        <div className={homeLayout && !isEnglish ? "order-2 mx-auto w-full max-w-[680px]" : ""}>
          {(!homeLayout || isEnglish) && <>
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            {isEnglish ? "About us" : "O nás"}
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">
            {isEnglish ? "Who is behind Chvostíkovo?" : "Kto stojí za Chvostíkovom?"}
          </h2>
          </>}
          {homeLayout && !isEnglish ? (
            <div data-about-expanded className="space-y-5 text-left text-base leading-relaxed text-forest/85 [text-wrap:pretty]">
              <p>Aj my sme <strong className="font-extrabold text-forest">majitelia veľkých psíkov</strong>, a preto poznáme ten pocit, keď ich máte zveriť niekomu inému.</p>
              <p><strong className="font-extrabold text-forest">Práve preto vzniklo Chvostíkovo</strong> — psia škôlka v Košiciach zameraná na <strong className="font-extrabold text-forest">stredné a veľké plemená</strong>, kde sú bezpečie, pohoda a individuálny prístup na prvom mieste.</p>
              <p>Máme <strong className="font-extrabold text-forest">dlhoročné skúsenosti</strong> s prácou so psami: <strong className="font-extrabold text-forest">práca v útulku, starostlivosť o psov v dočasnej opatere a výchova vlastných psíkov</strong>. Tieto skúsenosti nás naučili rozumieť ich potrebám, komunikácii aj správaniu v skupine.</p>
              <p>Chvostíkovo nie je len miesto na stráženie psov. <strong className="font-extrabold text-forest">Je to druhý domov</strong>, kde sa o každého člena svorky staráme s rovnakou zodpovednosťou a pozornosťou, akú venujeme našim vlastným psom.</p>
            </div>
          ) : (
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
          )}
        </div>

        <div className={homeLayout && !isEnglish ? "order-1 mx-auto w-full max-w-[810px] space-y-4" : "space-y-4"}>
          <img
            src={teamPhoto}
            alt={isEnglish ? "The owners of Chvostíkovo dog daycare with their dogs" : "Majitelia psej škôlky Chvostíkovo so svojimi psíkmi"}
            loading="lazy"
            className="h-60 w-full rounded-4xl object-cover shadow-card sm:h-72 lg:h-80"
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
          {homeLayout && <div data-hero-benefits className="flex w-full flex-nowrap items-center justify-center gap-1 pt-2 sm:gap-2 lg:gap-3">
            {["Celodenný dohľad", "Vlastný výbeh", "Úvodná návšteva zadarmo"].map(item => (
              <span key={item} className="inline-flex min-w-0 items-center justify-center gap-0.5 whitespace-nowrap rounded-full bg-[#2d764b] px-1.5 py-1.5 text-[clamp(8px,2.1vw,11px)] font-bold leading-tight text-white shadow-card min-[350px]:px-2 min-[390px]:gap-1 min-[390px]:px-2.5 sm:gap-1.5 sm:px-3 sm:py-2 lg:px-4 lg:text-xs">
                <CheckCircle2 className="size-3 shrink-0 sm:size-4" aria-hidden="true" />{item}
              </span>
            ))}
          </div>}
        </div>
      </div>

      <SafetyCertificates language={language} homeLayout={homeLayout && !isEnglish} />
    </section>
  );
}


/** The same certified canine first-aid evidence on homepage and paid LEAD. */
export function SafetyCertificates({ language = "sk", homeLayout = false }: { language?: "sk" | "en"; homeLayout?: boolean }) {
  const isEnglish = language === "en";
  const heading = isEnglish ? "Your dog's health and safety come first!" : "Zdravie a bezpečie vášho psíka je pre nás na prvom mieste!";
  return (
      <div data-safety-certificates data-home-safety-layout={homeLayout || undefined} className={"relative z-10 mx-auto mt-8 w-full max-w-[760px] " + (homeLayout ? "px-4" : "px-0")}>
        <div className={"grid items-center gap-6 rounded-4xl bg-secondary px-4 py-7 sm:gap-8 sm:p-9 " + (homeLayout ? "grid-cols-1 text-center" : "md:text-center lg:grid-cols-[1fr_auto] lg:text-left")}>
          <div className={homeLayout ? "flex w-full flex-col items-center" : "md:flex md:flex-col md:items-center lg:items-start"}>
            <p data-safety-heading className={"flex w-full items-center gap-2.5 rounded-full bg-card px-3 py-3 font-display font-semibold leading-[1.3] text-forest shadow-card sm:gap-3 sm:px-5 sm:text-base " + (homeLayout ? "text-[13px] min-[390px]:text-[14px]" : "text-[12px] min-[390px]:text-[13px]")}>
              <Check className="size-7 shrink-0 text-[#2d764b] sm:size-8" aria-hidden="true" />
              {homeLayout ? <span data-safety-heading-copy className="min-w-0 flex-1">{heading}</span> : heading}
            </p>
            <p data-safety-copy className={"mt-4 max-w-lg text-forest/80 " + (homeLayout ? "mx-auto" : "md:mx-auto lg:mx-0")}>
              {isEnglish
                ? "We have both completed a canine first-aid workshop, so if needed we know how to respond quickly and appropriately."
                : "Obaja sme absolvovali workshop prvej pomoci pre psov, takže v prípade potreby vieme zareagovať rýchlo a správne."}
            </p>
          </div>

          <div data-safety-diplomas className={"grid grid-cols-2 place-items-center gap-3 sm:gap-5 " + (homeLayout ? "mx-auto w-full max-w-md" : "")}>
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

