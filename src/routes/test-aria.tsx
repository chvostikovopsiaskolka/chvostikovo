import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import leadHeroPhotoOne from "@/assets/lead-hero-user-1.jpg";
import leadHeroPhotoTwo from "@/assets/lead-hero-user-2.jpg";
import type { PuppyCheckInput } from "@/lib/inquiry";
import {
  Car,
  CheckCircle2,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { LeadStepForm, LEAD_STEP_INTERESTS } from "@/components/site/LeadStepForm";
import { AriaLeadAssistant } from "@/components/site/AriaLeadAssistant";
import { SchoolmatesFormCrown } from "@/components/site/SchoolmatesFormCrown";
import { FormDialog } from "@/components/site/FormDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Reviews } from "@/components/site/Reviews";
import { DaycarePhotoCarousel, LEAD_REVIEW_GAP_PHOTOS } from "@/components/site/DaycarePhotoCarousel";
import { PhotoLightbox } from "@/components/site/PhotoLightbox";
import { AriaMosaicGallery } from "@/components/site/AriaMosaicGallery";
import { AriaPuppyChecker } from "@/components/site/AriaPuppyChecker";
import { AriaHighlightedText } from "@/components/site/AriaPreviewText";
import { FriendshipFeature } from "@/components/site/FriendshipFeature";
import { FirstVisitPhoto } from "@/components/site/FirstVisitPhoto";
import { EditorialBenefits } from "@/components/site/EditorialBenefits";
import { Requirements, FIRST_VISIT_STEPS } from "@/components/site/Info";
import { Footer } from "@/components/site/Contact";
import { ABOUT_MORE, SafetyCertificates } from "@/components/site/Story";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { DAYCARE_GALLERY_EXTRAS, GALLERY, FAQ, PRICING } from "@/content/site";
import { DAYCARE_ELIGIBILITY_ANSWER } from "@/content/daycare-eligibility";
import teamPhoto from "@/assets/team-dogs.jpg";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

const BASE_URL = "https://chvostikovo.sk";
const URL = `${BASE_URL}/test-aria`;
const title = "Aria – testovací náhľad psiej škôlky | Chvostíkovo";
const description =
  "Kým ste v práci, váš psík môže mať aktívny deň plný pohybu, hier, kamarátov a oddychu. Chvostíkovo – psia škôlka v Košiciach s celodenným dohľadom.";

const LANDING_FAQ_QUESTIONS = new Set([
  "Ako prebieha prvá návšteva psíka v škôlke?",
  "Čo ak môj psík ešte nikdy nebol v kolektíve psov?",
  "Prijímate aj šteniatka?",
  "Zabezpečujete aj vyzdvihnutie a odvoz psíka?",
  "Aký je cenník služieb?",
]);

const EARLY_FAQ = [
  { q: "Pre koho je škôlka určená?", a: DAYCARE_ELIGIBILITY_ANSWER },
  ...FAQ.filter(({ q }) => q === "Bude môj psík počas dňa niekedy sám bez dozoru?"),
];

const LANDING_FAQ = FAQ.filter((item) => LANDING_FAQ_QUESTIONS.has(item.q));

const BENEFITS = [
  {
    icon: PawPrint,
    title: "Spoločnosť namiesto čakania",
    content: (
      <>
        Váš psík má počas dňa <strong className="font-bold text-forest">kamošov, pozornosť a príležitosti na hru</strong>.
        <span className="mt-1 block">Vy sa môžete <strong className="font-bold text-forest">venovať práci alebo svojim povinnostiam</strong>.</span>
      </>
    ),
  },
  {
    icon: PawPrint,
    title: "Pohyb, aktivity, ale aj oddych",
    content: (
      <>
        Psík má dostatok priestoru na <strong className="font-bold text-forest">fyzické aj mentálne vyžitie</strong>. S kamošmi sa vyšantí vo výbehu aj vo vnútri, no dbáme aj na jeho <strong className="font-bold text-forest">oddych</strong>.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Ľudia, ktorí ho spoznajú",
    content: (
      <>
        Zaujíma nás jeho <strong className="font-bold text-forest">povaha, zvyky</strong> aj to, čo mu vyhovuje. Počas celého pobytu na psíkov dohliadajú <strong className="font-bold text-forest">minimálne dvaja opatrovatelia</strong>.
      </>
    ),
  },
];

export const Route = createFileRoute("/test-aria")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:image", content: `${BASE_URL}/og-image.png` },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${BASE_URL}/og-image.png` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/psia-skolka-kosice` }],
  }),
  component: AriaPreviewPage,
});

const LEAD_HERO_PHOTOS = [
  { src: leadHeroPhotoOne, alt: "Spokojný psík pri hre v Chvostíkove", width: 1021, height: 1280 },
  { src: leadHeroPhotoTwo, alt: "Psí kamaráti oddychujú v priestoroch Chvostíkova", width: 959, height: 1280 },
];

export function AriaPreviewPage() {
  const isLiveLead = useRouterState({ select: (state) => state.location.pathname.replace(/\/$/, "") === "/psia-skolka-kosice" });
  const heroFormIntro = (
    <div data-lead-form-intro className={isLiveLead ? "mb-5" : undefined}>
      <h2 className="section-title mt-2 text-center text-xl sm:text-2xl">Chceli by ste sa informovať o škôlke?</h2>
      <p className="mt-2 text-center text-sm leading-relaxed text-forest/70 sm:text-base">
        Radi vám odpovieme na otázky o škôlke.
      </p>
    </div>
  );
  const visitFormIntro = (
    <div data-lead-form-intro className={isLiveLead ? "mb-5" : undefined}>
      <h2 className="section-title text-center text-2xl sm:text-3xl">Máte záujem o návštevu?</h2>
      <p className="mt-2 text-center text-sm text-forest/70">Vyberte si, čo hľadáte. Ozveme sa vám.</p>
    </div>
  );
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadHeroFormOpen, setLeadHeroFormOpen] = useState(false);
  const [puppyModalOpen, setPuppyModalOpen] = useState(false);
  const [reviewPhotoOpen, setReviewPhotoOpen] = useState<number | null>(null);
  const [leadModalSource, setLeadModalSource] = useState("lead_landing_modal");
  const [ariaPreset, setAriaPreset] = useState<string | undefined>(undefined);
  const [puppyCheck, setPuppyCheck] = useState<PuppyCheckInput | undefined>(undefined);

  // The paid landing keeps the existing two-step form directly below Hero,
  // but mounts its visual section only after an explicit interest action.
  // Preserve attribution and the original form submit events.
  function revealLeadHeroForm(source: string) {
    trackMarketingInteraction("inquiry_cta", source);
    void trackCookielessInteraction("inquiry_cta", source);
    setLeadHeroFormOpen(true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = document.getElementById("aria-hero-form");
      if (!target) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }));
  }

  function openLeadModal(source: string) {
    trackMarketingInteraction("inquiry_cta", source);
    void trackCookielessInteraction("inquiry_cta", source);
    setAriaPreset(undefined);
    setPuppyCheck(undefined);
    setLeadModalSource(source);
    setLeadModalOpen(true);
  }

  function openAriaForm(infoOnly: boolean) {
    const source = isLiveLead ? (infoOnly ? "lead_landing_aria_info" : "lead_landing_aria_interest") : (infoOnly ? "aria_preview_more_info" : "aria_preview_interest");
    trackMarketingInteraction("inquiry_cta", source);
    void trackCookielessInteraction("inquiry_cta", source);
    setAriaPreset(infoOnly ? LEAD_STEP_INTERESTS[0].value : undefined);
    setPuppyCheck(undefined);
    setLeadModalSource(source);
    setLeadModalOpen(true);
  }

  function openPuppyContact(details: PuppyCheckInput, infoOnly = false) {
    const source = isLiveLead
      ? (infoOnly ? "lead_landing_aria_puppy_info" : "lead_landing_aria_puppy_check")
      : (infoOnly ? "aria_puppy_check_info" : "aria_puppy_check_eligible");
    trackMarketingInteraction("inquiry_cta", source);
    void trackCookielessInteraction("inquiry_cta", source);
    setPuppyCheck(details);
    // Keep the production allowlist value; do not concatenate vaccination details
    // into interest_reason, because it would be rejected by the existing Edge API.
    setAriaPreset(infoOnly ? LEAD_STEP_INTERESTS[0].value : "Mám záujem o škôlku pre šteniatko");
    setLeadModalSource(source);
    setPuppyModalOpen(false);
    setLeadModalOpen(true);
  }

  const benefitsSection = (
        <section id="lead-benefits" className="relative overflow-hidden bg-card py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
              Prečo Chvostíkovo
            </p>
            <h2 className="section-title mx-auto mt-2 max-w-3xl text-3xl sm:text-4xl">
              Aktívny deň pre psíka. Pokojnejšia hlava pre vás.
            </h2>

            {/* Mobile: one real photo paired with each benefit, with no overlapping rows. */}
            <div className="mt-7 space-y-5 sm:hidden">
              {BENEFITS.map(({ title: benefitTitle, content }, i) => {
                const photo = [DAYCARE_GALLERY_EXTRAS[2]!, DAYCARE_GALLERY_EXTRAS[1]!, DAYCARE_GALLERY_EXTRAS[0]!][i]!;
                return (
                  <div key={benefitTitle} className="grid grid-cols-[minmax(0,0.97fr)_minmax(0,1.03fr)] items-stretch gap-3">
                    <figure className="relative min-h-40 min-w-0 overflow-hidden rounded-[20px] bg-secondary shadow-card">
                      <img src={photo.src} alt={photo.alt} width={720} height={720} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                    </figure>
                    <article className="min-w-0 py-1 text-left">
                      <h3 className="font-display text-[14px] font-bold leading-snug text-forest min-[390px]:text-[16px]">{benefitTitle}</h3>
                      <p className="mt-2 text-[12px] leading-[1.55] text-forest/80 min-[390px]:text-[13px]">{content}</p>
                    </article>
                  </div>
                );
              })}
            </div>

            {/* Desktop/tablet: retain the established editorial composition. */}
            <div className="mt-7 hidden sm:block">
              <EditorialBenefits image={DAYCARE_GALLERY_EXTRAS[2]!.src} alt={DAYCARE_GALLERY_EXTRAS[2]!.alt} secondImage={DAYCARE_GALLERY_EXTRAS[1]!.src} secondAlt={DAYCARE_GALLERY_EXTRAS[1]!.alt}>
                {BENEFITS.map(({ icon: Icon, title: benefitTitle, content }, i) => (
                  <article key={benefitTitle} className={`py-3 first:pt-0 last:pb-0 sm:py-5 ${i ? "border-t border-forest/15" : ""}`}>
                    <Icon className="mb-2 hidden size-7 text-coral sm:block" aria-hidden />
                    <h3 className="font-display text-[14px] font-bold leading-snug text-forest min-[390px]:text-[16px] sm:text-xl">{benefitTitle}</h3>
                    <p className="mt-1 text-[12px] leading-[1.5] text-forest/80 min-[390px]:text-[13px] sm:text-base sm:leading-relaxed">{content}</p>
                  </article>
                ))}
              </EditorialBenefits>
            </div>

          </div>
        </section>
  );

  return (
    <div className={"aria-brand-experiment min-h-screen overflow-x-clip bg-background" + (isLiveLead ? " lead-brand-live" : "")} data-aria-brand-experiment="orange-rose">
      {/* Keep Aria floating in the viewport throughout the lead journey.
          The paid lead hero stays visually unchanged; the menu no longer
          participates in the document layout. */}
      <AriaLeadAssistant trackingPrefix={isLiveLead ? "lead_landing_aria" : "aria_preview_v3"} onOpenInfo={() => openAriaForm(true)} onOpenInterest={() => openAriaForm(false)} onOpenPuppyChecker={() => setPuppyModalOpen(true)} puppyStartSectionId="aria-caretakers" guidedChatPreview={!isLiveLead} portraitOnRight={false} sectionNavigation={isLiveLead} onRevealInlineForm={isLiveLead ? () => revealLeadHeroForm("lead_landing_aria_dock_interest") : undefined} hidden={leadModalOpen || puppyModalOpen} />

      <main>
        <section className={isLiveLead ? "hero-safe-top relative flex min-h-[calc(100svh-20px)] flex-col justify-center sm:min-h-[100svh] sm:justify-start sm:pt-16 lg:pt-8" : "hero-safe-top relative flex min-h-[100svh] flex-col overflow-hidden pt-14 sm:pt-16 lg:pt-8"}>
          <PawTrailBackground landingBottomPaws />

          {/* Mobile paid LEAD content is vertically centered in the part of
              the viewport above floating Aria. Keep the fixed dock out of
              document flow, with space reserved in scoped CSS below. */}
          <div aria-hidden="true" data-aria-intro-top-space className={isLiveLead ? "h-0" : "min-h-2 flex-[0.2] sm:min-h-5 lg:min-h-3 lg:flex-[0.2]"} />
          <div data-aria-hero-content className="relative z-10 w-full shrink-0">
            <div className={isLiveLead ? "mx-auto w-full max-w-4xl px-4 pb-1 pt-1 sm:pb-4 sm:pt-5 lg:pt-7" : "mx-auto w-full max-w-4xl px-4 pb-3 pt-4 sm:pb-4 sm:pt-5 lg:pt-7"}>
            <div className="w-full min-w-0 text-center">
              {/* Screenshot hierarchy: H1, four schoolmates, badge, liquid copy, reviews. */}
              <div aria-hidden="true" data-aria-hero-heading-spacer className={isLiveLead ? "h-1 sm:h-5" : "h-[14px] sm:h-5"} />
              <h1 className={(isLiveLead ? "mt-3 translate-y-0 " : "mt-3 ") + "text-[38px] leading-[1.07] tracking-[-0.03em] text-forest sm:text-5xl sm:leading-[1.06] lg:mt-1 lg:text-[58px] lg:leading-[1.05]"}>
                Miesto, ktoré si váš
                <span className="block text-coral-dark">psík zamiluje</span>
              </h1>

              <div data-aria-service-group className={isLiveLead ? "relative mx-auto mt-4 w-fit max-w-full sm:mt-5" : "relative mx-auto mt-[64px] w-fit max-w-full sm:mt-[72px] lg:mt-[110px]"}>
                {/* Four schoolmates rest directly above the badge as in the reference. */}
                {!isLiveLead && <div data-aria-hero-dogs className="pointer-events-none absolute inset-x-0 bottom-full z-10 lg:inset-x-auto lg:left-1/2 lg:w-[460px] lg:-translate-x-1/2">
                  <SchoolmatesFormCrown compact desktopWide />
                </div>}
                <p data-aria-service-badge className="inline-flex max-w-full items-center justify-center rounded-full bg-coral px-2.5 py-2 text-center font-display text-[8px] font-bold uppercase leading-tight tracking-[0.015em] text-white shadow-card min-[390px]:px-3 min-[390px]:text-[9.5px] sm:px-5 sm:py-2.5 sm:text-sm">
                  Denné stráženie stredných a veľkých psíkov
                </p>
              </div>

              {isLiveLead ? (
                <div data-lead-hero-photos className="mx-auto mt-4 grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:mt-5 sm:gap-4">
                  {LEAD_HERO_PHOTOS.map((photo, index) => (
                    <button key={photo.src} data-lead-hero-photo={index + 1} type="button"
                      aria-label={"Zobraziť fotografiu: " + photo.alt} onClick={() => setReviewPhotoOpen(index)}
                      className="group h-[144px] min-w-0 overflow-hidden rounded-[20px] bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral min-[390px]:h-40 sm:h-56 lg:h-64">
                      <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="eager"
                        fetchPriority={index === 0 ? "high" : "auto"} decoding="async"
                        className="size-full object-cover object-[50%_45%] transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
                    </button>
                  ))}
                </div>
              ) : (
              <p data-aria-hero-description className="relative mx-auto mt-4 max-w-[320px] overflow-hidden rounded-[31px_23px_33px_25px] border border-coral/20 bg-coral/[0.08] bg-[radial-gradient(ellipse_at_12%_6%,rgba(255,171,115,0.25),transparent_66%),radial-gradient(ellipse_at_90%_93%,rgba(237,119,57,0.15),transparent_70%)] px-3.5 py-3 text-[15px] font-medium leading-[1.55] text-forest/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_24px_rgba(238,119,61,0.08)] backdrop-blur-[2px] min-[390px]:max-w-[360px] sm:mt-5 sm:max-w-[540px] sm:px-5 sm:py-4 sm:text-lg lg:max-w-[590px]">
                <strong className="font-extrabold text-forest">Kým vy pracujete</strong>, váš psík môže <strong className="font-extrabold text-forest">tráviť deň s kamošmi</strong>, užije si <strong className="font-extrabold text-forest">pohyb, hry, oddych</strong> aj pozornosť pod <strong className="font-extrabold text-forest">celodenným dohľadom</strong>.
              </p>
              )}
              {isLiveLead && (
                <div className="mx-auto mt-4 flex w-full max-w-[294px] justify-center">
                  <button type="button" data-aria-lead-hero-cta aria-controls="aria-hero-form"
                    aria-expanded={leadHeroFormOpen}
                    onClick={() => revealLeadHeroForm("lead_landing_hero_orange_cta")}
                    className="inline-flex min-h-[46px] w-full items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-2 text-center font-display text-[clamp(11px,3.35vw,15px)] font-bold leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
                    Chcem sa informovať o škôlke
                  </button>
                </div>
              )}
            </div>
          </div>
            <div data-aria-lead-review-spacing className={isLiveLead ? "mt-8 sm:mt-4 lg:mt-2" : "mt-0 sm:mt-2 lg:mt-2"}>
              <Reviews variant="hero" />
            </div>
          </div>
          {!isLiveLead && (
          <>{/* Fill the former empty Aria breathing room with two real photos from
              the moving gallery. Keep the enquiry below the initial viewport,
              while leaving Aria fixed above the bottom dock. Desktop now also shows the photos. */}
          <div data-aria-intro-space className={isLiveLead ? "relative z-10 mx-auto flex min-h-[245px] w-full max-w-3xl flex-[0.45] items-end px-4 pb-3 pt-12 sm:min-h-[285px] sm:px-0 sm:pb-3 sm:pt-12 lg:max-w-4xl lg:min-h-[385px] lg:flex-[0.3]" : "relative z-10 mx-auto flex min-h-[178px] max-h-[198px] w-full max-w-3xl flex-[0.45] items-end px-4 pb-2 pt-8 sm:min-h-[135px] sm:max-h-[175px] sm:px-0 sm:pb-0 sm:pt-5 lg:max-w-4xl lg:min-h-[268px] lg:max-h-[286px] lg:flex-[0.3]"}>
            <div data-aria-review-gap-photos className="grid w-full grid-cols-2 gap-2.5 sm:gap-4">
              {LEAD_REVIEW_GAP_PHOTOS.map((photo, index) => (
                <button type="button" key={photo.src} data-aria-review-photo={index + 1}
                  aria-label={`Zobraziť fotografiu: ${photo.alt}`}
                  onClick={() => setReviewPhotoOpen(index)}
                  className={isLiveLead ? "group relative h-[190px] min-w-0 overflow-hidden rounded-[20px] bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-coral min-[390px]:h-[220px] sm:h-[260px] lg:h-[340px]" : "group relative h-[122px] min-w-0 overflow-hidden rounded-[20px] bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-coral min-[390px]:h-[138px] lg:h-[260px]"}>
                  <img src={photo.src} alt={photo.alt} width={672} height={896} loading="lazy" decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                </button>
              ))}
            </div>
          </div>
          </>
          )}
        </section>

        <section id="aria-hero-form" hidden={isLiveLead && !leadHeroFormOpen} className={"relative z-10 overflow-hidden bg-white pb-8 pt-4 sm:pb-12 sm:pt-6 " + (isLiveLead ? "scroll-mt-2" : "scroll-mt-24")}>
          <SectionAmbientPaws />
          {/* Same verified title -> dog crown -> liquid form card layout as the lower visit form. */}
          <div data-lead-form-shell={!isLiveLead || undefined} className="relative z-10 mx-auto max-w-2xl px-4">
            {!isLiveLead && heroFormIntro}
            <div data-aria-hero-form-dogs className="relative z-10 mx-auto mt-7 mb-[-18px] w-full max-w-sm">
              <SchoolmatesFormCrown compact groundAccent />
            </div>
            <div data-lead-form-shell={isLiveLead || undefined} data-lead-inline-card className="form-liquid-surface relative z-0 mt-0 rounded-3xl border border-forest/10 bg-white p-5 pt-8 shadow-card sm:p-6 sm:pt-9">
              {isLiveLead && heroFormIntro}
              <LeadStepForm questionInHeading ariaPreview={!isLiveLead} trackingSource={isLiveLead ? "lead_landing_aria_hero_inline" : "aria_preview_hero_inline"} />
            </div>
          </div>
        </section>

        {/* Keep the SAME existing moving gallery below the inline form on paid LEAD; keep
            its swipe/autoscroll/lightbox behavior and append the two unique
            former hero teaser photos without adding unrelated images. */}
        {isLiveLead && (
          <div id="lead-photo-carousel" data-aria-lead-photos data-aria-intro-space className="scroll-mt-24">
            <DaycarePhotoCarousel includeLeadHighlights />
          </div>
        )}

        <section id="aria-caretakers" className="relative scroll-mt-24 overflow-hidden bg-white py-9 sm:py-12">
          <SectionAmbientPaws />
          <div id={isLiveLead ? "aria-about" : undefined} className="relative z-10 mx-auto max-w-5xl px-4">
            <h2 className={isLiveLead ? "section-title mb-5 text-center text-[clamp(24px,6vw,38px)] leading-tight tracking-[-0.025em]" : "section-title mb-4 text-center text-[clamp(22px,4.5vw,38px)] leading-tight tracking-[-0.025em]"}>Kto sa bude starať o vášho psíka?</h2>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 sm:gap-6">
              <div className="w-full max-w-[440px] lg:max-w-[560px]">
                <img
                  src={teamPhoto}
                  alt="Majitelia psej škôlky Chvostíkovo so svojimi psíkmi"
                  loading="lazy"
                  className="h-60 w-full rounded-3xl object-cover shadow-card sm:h-72 lg:h-[340px]"
                />
                <div data-hero-benefits className="mx-auto mt-3 flex w-full max-w-[390px] flex-nowrap justify-center gap-1 sm:gap-2 lg:max-w-none lg:flex-nowrap lg:gap-2">
                  {["Celodenný dohľad", "Vlastný výbeh", "Úvodná návšteva zadarmo"].map((item) => (
                    <span
                      key={item}
                      className="inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-forest px-1.5 py-1 text-[8px] font-bold tracking-[-0.01em] text-white shadow-card min-[350px]:px-2 min-[350px]:text-[8.5px] min-[390px]:gap-1 min-[390px]:px-2.5 min-[390px]:text-[9.5px] lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-xs"
                    >
                      <CheckCircle2 className="size-3 shrink-0 text-white min-[390px]:size-3.5 lg:size-4" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {isLiveLead ? (
                <div className="mx-auto max-w-[680px] space-y-4 text-left text-[15px] leading-[1.7] text-forest/80 sm:text-base">
                  <p>Aj my sme <strong className="font-extrabold text-forest">majitelia veľkých psíkov</strong>, a preto poznáme ten pocit, keď ich máte zveriť niekomu inému.</p>
                  <p><strong className="font-extrabold text-forest">Práve preto vzniklo Chvostíkovo</strong> — psia škôlka v Košiciach zameraná na <strong className="font-extrabold text-forest">stredné a veľké plemená</strong>, kde sú bezpečie, pohoda a individuálny prístup na prvom mieste.</p>
                  <p>Máme <strong className="font-extrabold text-forest">dlhoročné skúsenosti</strong> s prácou so psami: <strong className="font-extrabold text-forest">práca v útulku, starostlivosť o psov v dočasnej opatere a výchova vlastných psíkov</strong>. Tieto skúsenosti nás naučili rozumieť ich potrebám, komunikácii aj správaniu v skupine.</p>
                  <p>Chvostíkovo nie je len miesto na stráženie psov. <strong className="font-extrabold text-forest">Je to druhý domov</strong>, kde sa o každého člena svorky staráme s rovnakou zodpovednosťou a pozornosťou, akú venujeme našim vlastným psom.</p>
                </div>
              ) : (
                <p className="mx-auto max-w-[680px] text-center text-sm leading-relaxed text-forest/75 sm:text-base">
                  Aj my sme <strong className="font-bold text-forest">majitelia veľkých psíkov</strong>, a preto poznáme ten pocit, keď ich máte zveriť niekomu inému. Aj preto vzniklo Chvostíkovo — miesto, kde psíkov <strong className="font-bold text-forest">spoznávame, rešpektujeme ich potreby</strong> a staráme sa o nich tak, ako by sme chceli pre svojich vlastných.
                </p>
              )}
            </div>
            {isLiveLead && <SafetyCertificates homeLayout />}
          </div>
        </section>

        {!isLiveLead && <section id="aria-about" className="relative bg-card pb-9 pt-5 sm:pb-12 sm:pt-6">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="section-title text-center text-lg sm:text-xl">Viac o nás a našej škôlke</h2>
            <div className="mx-auto mt-5 max-w-3xl space-y-4 text-center text-sm leading-relaxed text-forest/80 sm:text-base">
              {ABOUT_MORE.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </section>}

        <section id="aria-early-faq" className="relative scroll-mt-24 overflow-hidden bg-secondary/30 pb-5 pt-8 sm:pb-7 sm:pt-10">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-4xl px-4">
            <h2 className="section-title text-center text-2xl sm:text-3xl">Čo je dobré vedieť o škôlke?</h2>
            <div className="mt-5 space-y-3">
              {EARLY_FAQ.map((item) => (
                <details key={item.q} className="group rounded-3xl border border-forest/10 bg-card p-4 shadow-card">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-left font-display text-sm font-bold text-forest sm:text-base">
                    {item.q}<span className="text-lg text-coral group-open:rotate-45">+</span>
                  </summary>
                  <div className="mt-2 border-t border-forest/10 pt-3 text-sm leading-relaxed text-forest/80"><AriaHighlightedText text={item.a} /></div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {!isLiveLead && <AriaMosaicGallery />}

        {!isLiveLead && benefitsSection}

        <section id="lead-pricing" className="relative scroll-mt-24 overflow-hidden bg-secondary/35 py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h2 className="section-title text-3xl sm:text-4xl">Koľko stojí deň v škôlke?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-forest/75 sm:text-base">
              Pohyb, hry, oddych aj celodenný dohľad sú súčasťou každého vstupu. Pri pravidelných návštevách môžete využiť výhodnejšiu permanentku.
            </p>
            <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 items-stretch gap-2 sm:gap-4">
              {PRICING.map((item) => (
                <article key={item.name} className={"relative flex h-full min-h-[108px] flex-col items-center rounded-3xl px-3 py-3 text-center shadow-card sm:min-h-[136px] sm:p-4 " + (item.highlight ? "bg-forest text-cream ring-2 ring-coral" : "bg-card text-forest")}>
                  <h3 className="font-display text-[13px] font-bold leading-snug sm:text-xl">{item.name}</h3>
                  <p aria-hidden={!item.highlight} className={"mt-0.5 text-[11px] font-semibold " + (item.highlight ? "text-cream/85" : "invisible")}>10 vstupov</p>
                  <p data-lead-price className={"mt-1 font-display text-2xl font-bold sm:text-4xl " + (item.highlight ? "text-cream" : "text-coral-dark")}>{item.price}</p>
                  <div className="mt-auto pt-1 text-[11px] leading-snug sm:text-sm">
                    {item.highlight ? <strong>Permanentka platí 2 mesiace.</strong> : <span className="opacity-75">Celodenný pobyt</span>}
                  </div>
                  {item.highlight && <span data-lead-best-value className={(isLiveLead ? "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 " : "mt-2 ")+"inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full bg-coral px-1.5 py-1 font-display text-[clamp(8px,2.15vw,12px)] font-bold tracking-[-0.025em] text-white shadow-sm"}>Najvýhodnejšie. Ušetríte 50 €</span>}
                </article>
              ))}
            </div>
            <div data-lead-pricing-extras={isLiveLead || undefined} className={isLiveLead ? "mx-auto mt-7 grid w-full max-w-2xl grid-cols-2 items-stretch gap-2 sm:gap-4" : undefined}>
            <p data-aria-taxi className={isLiveLead ? "order-2 flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-3xl bg-forest px-2 py-3 text-center font-display text-xs font-semibold leading-snug text-cream sm:gap-2 sm:px-4 sm:text-sm" : "mx-auto mt-5 flex w-fit max-w-full items-center justify-center gap-2 rounded-2xl bg-forest px-3 py-3 text-center font-display text-xs font-semibold leading-tight text-cream sm:rounded-full sm:px-5 sm:text-sm"}>
              <Car className="size-4 shrink-0 text-cream sm:size-5" aria-hidden="true" />
              <span>Odvoz / vyzdvihnutie {isLiveLead ? <br /> : ": "}<strong>5 € / jazda</strong></span>
            </p>
            <div data-first-visit-group data-lead-visit-compact={isLiveLead || undefined}
              className={(isLiveLead ? "order-1 flex min-w-0 items-center justify-center " : "mx-auto mt-5 w-full max-w-2xl ")+"rounded-3xl border border-coral/50 bg-coral/10 px-2 py-3 shadow-card sm:px-5"}>
              <div className={isLiveLead ? "flex min-w-0 flex-col items-center justify-center gap-1.5 text-center sm:gap-2" : "flex items-center justify-center gap-2 text-center"}>
                <CheckCircle2 className="size-5 shrink-0 text-coral-dark" aria-hidden="true" />
                <p className={"font-display font-bold text-forest "+(isLiveLead ? "text-xs leading-snug sm:text-base" : "text-base sm:text-lg")}>{isLiveLead ? <>Úvodná návšteva <br />zadarmo</> : "Úvodná návšteva zadarmo"}</p>
              </div>
              {!isLiveLead && <details data-aria-visit-details
                onToggle={(event) => {
                  if (event.currentTarget.open) {
                    void trackCookielessInteraction("explore_daycare",
                      isLiveLead ? "lead_landing_first_visit_details" : "aria_preview_first_visit_details");
                  }
                }}
                className="group mx-auto mt-2 w-full max-w-[560px] rounded-2xl border border-coral/20 bg-card/65 px-3 py-2 text-left">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-display text-sm font-bold text-forest">
                  Ako prebieha úvodná návšteva? <span className="text-coral group-open:rotate-45">+</span>
                </summary>
                <div className="space-y-3 border-t border-coral/15 pt-3 text-xs leading-relaxed text-forest/80">
                  {(FAQ.find(({ q }) => q === "Ako prebieha prvá návšteva psíka v škôlke?")?.a || "").split(/\n+/).filter(Boolean).map((text, i) => <p key={i}><AriaHighlightedText text={text.trim()} /></p>)}
                  <div className="flex justify-center">
                    <a href="#lead-first-visit"
                      onClick={() => void trackCookielessInteraction("nav_click",
                        isLiveLead ? "lead_landing_first_visit_steps" : "aria_preview_first_visit_steps")}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-coral/25 bg-card px-4 text-right text-sm font-bold text-coral-dark shadow-sm">
                      Pozrieť 3 kroky prvej návštevy
                    </a>
                  </div>
                </div>
              </details>}
            </div>
            </div>

          </div>
        </section>

        <Requirements id="lead-requirements" ariaPreview hideEyebrow />

        {isLiveLead && benefitsSection}
        {/* Restored approved two-column photo mosaic directly below Prečo Chvostíkovo,
            without replacing or duplicating the original moving Hero carousel. */}
        {isLiveLead && <AriaMosaicGallery paidLead />}

        <section id="lead-faq" className="relative scroll-mt-24 overflow-hidden bg-secondary/40 py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-4xl px-4">
            <div className="text-center">
              <h2 className="section-title text-3xl sm:text-4xl">Najčastejšie otázky</h2>
              <p className="mt-2 text-sm text-forest/65 sm:text-base">
                Najdôležitejšie informácie pred prvou návštevou.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {LANDING_FAQ.map((item) => (
                <details key={item.q} className="group rounded-3xl bg-card px-5 py-4 shadow-card sm:px-6">
                  <summary className="cursor-pointer list-none font-display text-base font-bold text-forest marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span data-aria-faq-icon className="text-xl text-coral transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-forest/75">
                    {item.q === "Aký je cenník služieb?" ? (
                      <p>
                        Aktuálne ceny nájdete vyššie v sekcii{" "}
                        <a href="#lead-pricing" className="font-semibold text-coral underline underline-offset-2">
                          Cenník
                        </a>
                        {" "}na tejto stránke.
                      </p>
                    ) : (
                      item.a
                        .split(/\n+/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => <p key={index}><AriaHighlightedText text={paragraph} /></p>)
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <AriaPuppyChecker onInterest={(details) => openPuppyContact(details)} onInfo={(details) => openPuppyContact(details, true)} />

        <section id="lead-first-visit" className="relative scroll-mt-24 overflow-hidden bg-forest py-10 text-cream sm:py-14">
          <SectionAmbientPaws tone="dark" />
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-soft">
              Ako to funguje
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Prvá návšteva v 3 krokoch</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-cream/80 sm:text-base">
              Najprv sa spoznáme a spolu zistíme, či sa váš psík bude u nás cítiť dobre.
            </p>



                        <div className="mt-10 grid gap-9 text-center md:grid-cols-3 md:gap-8">
              {FIRST_VISIT_STEPS.map((step, i) => (
                <article key={step.title} data-first-visit-step={i + 1} className="min-w-0">
                  <FirstVisitPhoto number={i + 1} image={GALLERY[[2, 0, 5][i]!]!.src} alt={GALLERY[[2, 0, 5][i]!]!.alt} />
                  <h3 className="font-display text-lg font-bold text-cream">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/85">{step.content}</p>
                  {step.note && <p className="mt-3 text-sm font-bold text-cream">{step.note}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="aria-first-visit-form" className="relative overflow-hidden bg-card py-10 sm:py-14">
          <SectionAmbientPaws />
          <div data-lead-form-shell={!isLiveLead || undefined} className="relative z-10 mx-auto max-w-2xl px-4">
            {!isLiveLead && visitFormIntro}
            <div data-aria-first-visit-dogs className="relative z-10 mx-auto mt-7 mb-[-18px] w-full max-w-sm">
              <SchoolmatesFormCrown compact groundAccent />
            </div>
            <div data-lead-form-shell={isLiveLead || undefined} className="form-liquid-surface relative z-0 mt-0 rounded-3xl border border-forest/10 bg-white p-5 pt-8 shadow-card sm:p-6 sm:pt-9">
              {isLiveLead && visitFormIntro}
              <LeadStepForm questionInHeading trackingSource={isLiveLead ? "lead_landing_aria_first_visit_inline" : "aria_preview_first_visit_inline"} />
            </div>
          </div>
        </section>

        <FriendshipFeature ctaLabel="Toto hľadám pre svojho psíka" onCtaClick={() => openLeadModal("lead_landing_friendship_20261028")} />

        {!isLiveLead && <DaycarePhotoCarousel />}



      </main>

      <Footer />

      <Dialog open={puppyModalOpen} onOpenChange={setPuppyModalOpen}>
        <DialogContent className={(isLiveLead ? "" : "aria-preview-modal ") + "form-liquid-surface max-h-[min(87dvh,780px)] w-[calc(100%-24px)] overflow-y-auto overscroll-contain rounded-3xl border border-forest/10 bg-card p-4 text-forest shadow-2xl sm:max-w-xl sm:p-6"} aria-describedby={undefined}>
          <DialogTitle className="font-display text-lg font-bold text-forest">Kontrola vhodnosti šteniatka</DialogTitle>
          <AriaPuppyChecker embedded onInterest={(details) => openPuppyContact(details)} onInfo={(details) => openPuppyContact(details, true)} />
        </DialogContent>
      </Dialog>

      <PhotoLightbox photos={isLiveLead ? LEAD_HERO_PHOTOS : LEAD_REVIEW_GAP_PHOTOS} active={reviewPhotoOpen}
        onChange={setReviewPhotoOpen} onClose={() => setReviewPhotoOpen(null)} />

      <FormDialog
        previewBrand
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        title="Čo hľadáte pre svojho psíka?"
        subtitle="Vyplňte krátky nezáväzný formulár. Ozveme sa vám."
      >
        <LeadStepForm key={leadModalSource} questionInHeading ariaPreview trackingSource={leadModalSource} presetInterest={ariaPreset} puppyCheck={puppyCheck} />
      </FormDialog>
    </div>
  );
}
