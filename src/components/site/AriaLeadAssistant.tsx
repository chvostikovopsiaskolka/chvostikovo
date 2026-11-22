import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Euro, Menu, PawPrint, ShieldCheck, UsersRound, X, ArrowRight } from "lucide-react";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
// Split the preview-only chat from the paid lead bundle and preserve state after first open.
const AriaGuidedChat = lazy(() => import("./AriaGuidedChat").then((module) => ({ default: module.AriaGuidedChat })));
import brandWordmark from "@/assets/logo.png";
import { DAYCARE_ELIGIBILITY_ANSWER } from "@/content/daycare-eligibility";
import { FAQ as SITE_FAQ, PRICING } from "@/content/site";
import { ARIA_PREVIEW_REQUIREMENTS, AriaHighlightedText } from "@/components/site/AriaPreviewText";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { trackMarketingInteraction } from "@/lib/analytics";

// Isolate a failed lazy chat chunk (e.g. an outdated iOS page after a deploy).
// The rest of the lead landing and its floating menu must stay usable.
class AriaChatBoundary extends Component<
  { open: boolean; onClose: () => void; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (this.state.failed) {
      if (!this.props.open) return null;
      return (
        <section role="alert" data-aria-chat-load-error
          className="pointer-events-auto fixed inset-x-4 bottom-[max(82px,calc(env(safe-area-inset-bottom)+68px))] z-[120] mx-auto max-w-sm rounded-2xl border border-forest/15 bg-card p-4 text-forest shadow-2xl">
          <h2 className="font-display text-base font-bold">Chat sa nepodarilo otvoriť</h2>
          <p className="mt-1 text-sm leading-relaxed">Skúste stránku obnoviť. Ostatné možnosti škôlky zostávajú dostupné.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => window.location.reload()}
              className="min-h-11 flex-1 rounded-xl bg-coral px-3 text-sm font-bold text-white">Obnoviť stránku</button>
            <button type="button" onClick={this.props.onClose}
              className="min-h-11 rounded-xl border border-forest/20 px-3 text-sm font-bold">Zavrieť</button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

type Panel = "pricing" | "requirements" | "faq" | "menu" | null;

const FIRST_VISIT_ANSWER = SITE_FAQ.find((entry) => entry.q === "Ako prebieha prvá návšteva psíka v škôlke?")?.a ??
  "Úvodná návšteva je zadarmo. Spoznáme vášho psíka, jeho povahu a reakcie na nové prostredie. Podľa toho spoločne vyberieme ďalší postup.";

const QUESTIONS = [
  {
    title: "Pre koho je škôlka určená?",
    answer: DAYCARE_ELIGIBILITY_ANSWER,
  },
  {
    title: "Prijímate aj šteniatka?",
    answer: "Áno. Potrebujú platné očkovania proti besnote, DHPPi+L podľa požadovanej schémy a kotercovému kašľu. Vek a pripravenosť na kolektív posudzujeme individuálne.",
  },
  {
    title: "Ako prebieha prvá návšteva?",
    answer: FIRST_VISIT_ANSWER,
  },
] as const;

export function AriaLeadAssistant({
  onOpenInfo,
  onOpenInterest,
  onOpenPuppyChecker,
  hidden = false,
  trackingPrefix = "aria_preview_v3",
  requirementsSectionId = "lead-requirements",
  puppyStartSectionId,
  anchorOverrides,
  guidedChatPreview = false,
  portraitOnRight = false,
  sectionNavigation = false,
}: {
  onOpenInfo: () => void;
  onOpenInterest: () => void;
  onOpenPuppyChecker: () => void;
  hidden?: boolean;
  trackingPrefix?: string;
  requirementsSectionId?: string;
  /** Starts the puppy speech only once the visitor reaches this section. */
  puppyStartSectionId?: string;
  anchorOverrides?: Record<string, string>;
  /** Enables the guided Aria on the lead landing and its QA twin. */
  guidedChatPreview?: boolean;
  /** Reuse the preview\'s right-side speech outline without enabling its chatbot. */
  portraitOnRight?: boolean;
  /** Paid LEAD shortcuts stay separate from preview chatbot. */
  sectionNavigation?: boolean;
}) {
  const rightAlignedBubble = guidedChatPreview || portraitOnRight;
  const [stage, setStage] = useState<"intro" | "puppy" | "contact">("intro");
  const stageRef = useRef<"intro" | "puppy" | "contact">("intro");
  const [panel, setPanel] = useState<Panel>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatActivated, setChatActivated] = useState(false);
  const [requestedChatQuestion, setRequestedChatQuestion] = useState<"pricing" | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [pricingVisitOpen, setPricingVisitOpen] = useState(false);

  const speechRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  // Avoid fake SVG tail coordinates in SSR and before the first measurement.
  const [speechGeometry, setSpeechGeometry] = useState<{
    width: number; height: number; tipX: number; tipY: number;
  } | null>(null);

  // One path owns both the speech balloon and its tail. The tip follows
  // the portrait itself rather than nominal dock padding.
  useEffect(() => {
    if (hidden) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bubble = speechRef.current?.getBoundingClientRect();
      const head = portraitRef.current?.getBoundingClientRect();
      if (!bubble?.width || !bubble.height || !head?.width || !head.height) return;
      const next = {
        width: Math.round(bubble.width),
        height: Math.round(bubble.height),
        tipX: Math.round(head.left + head.width * (rightAlignedBubble ? 0.32 : 0.68) - bubble.left),
        tipY: Math.round(head.top + head.height * (rightAlignedBubble ? 0.65 : 0.43) - bubble.top),
      };
      setSpeechGeometry(prev =>
        prev && Object.keys(next).every(key => prev[key as keyof typeof next] === next[key as keyof typeof next]) ? prev : next);
    };
    const requestMeasure = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(requestMeasure);
    if (speechRef.current) observer.observe(speechRef.current);
    if (portraitRef.current) observer.observe(portraitRef.current);
    window.addEventListener("resize", requestMeasure);
    window.visualViewport?.addEventListener("resize", requestMeasure);
    requestMeasure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", requestMeasure);
      window.visualViewport?.removeEventListener("resize", requestMeasure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [hidden, stage, guidedChatPreview, rightAlignedBubble, chatOpen, panel]);

  // Stable sections rather than flipping a bubble on every scroll pixel.
  // Hysteresis keeps iOS browser chrome resizing from thrashing the dock.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const previous = stageRef.current;
      const endOfRequirements = document.getElementById(requirementsSectionId)?.getBoundingClientRect().bottom ?? Infinity;
      const transition = Math.round(window.innerHeight * 0.4);
      let next: typeof previous;
      if (previous === "contact" ? endOfRequirements < transition + 36 : endOfRequirements < transition - 18) {
        next = "contact";
      } else if (puppyStartSectionId) {
        const caretakerTop = document.getElementById(puppyStartSectionId)?.getBoundingClientRect().top;
        // Only switch when the caretaker heading has entered the central
        // part of the screen, not while the first enquiry form is being read.
        const entryLine = window.innerHeight * 0.5;
        // Enter when the caretakers section actually reaches the viewport,
        // not merely after a few scroll pixels. The small hysteresis avoids
        // oscillating speech during iOS browser chrome resizing.
        const beforeCaretakers = caretakerTop === undefined ||
          caretakerTop > entryLine + (previous === "intro" ? 0 : 32);
        next = beforeCaretakers ? "intro" : "puppy";
      } else if (previous === "intro" ? window.scrollY < 170 : window.scrollY < 80) {
        // Preserve the puppy-focused organic page's existing schedule.
        next = "intro";
      } else {
        next = "puppy";
      }
      if (previous !== next) {
        stageRef.current = next;
        setStage(next);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [requirementsSectionId, puppyStartSectionId]);

  useEffect(() => {
    // Reserve the desktop scrollbar gutter while this assistant is mounted.
    const html = document.documentElement;
    const previous = html.style.scrollbarGutter;
    html.style.scrollbarGutter = "stable";
    return () => { html.style.scrollbarGutter = previous; };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevBodyPadding = body.style.paddingRight;
    // Fallback for Safari versions that do not support scrollbar-gutter.
    const supportsGutter = CSS.supports("scrollbar-gutter", "stable");
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    if (!supportsGutter && scrollbarWidth > 0) {
      body.style.paddingRight = (parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth) + "px";
    }
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.style.paddingRight = prevBodyPadding;
    };
  }, [panel]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  function track(action: string) {
    void trackCookielessInteraction("nav_click", trackingPrefix + "_" + action, "sk");
  }

  function jump(id: string, action: string) {
    track(action);
    if (guidedChatPreview && id === "lead-pricing")
      trackMarketingInteraction("view_pricing", trackingPrefix + "_pricing");
    setPanel(null);
    const target = document.getElementById(anchorOverrides?.[id] ?? id);
    if (!target) return;
    const top = window.scrollY + target.getBoundingClientRect().top - 86;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
    }));
  }

  function goToLeadSection(id: string, action: string) {
    // Preserve the existing pricing-view signal while replacing the paid
    // above-dock pricing popup with navigation to the real pricing section.
    if (id === "lead-pricing") {
      trackMarketingInteraction("view_pricing", trackingPrefix + "_pricing");
    }
    jump(id, action);
  }

  function toggle(next: Exclude<Panel, null>) {
    if (guidedChatPreview) setChatOpen(false);
    track(next);
    // Keep the previous dock's GA4 / Meta pricing-view signal, separate from
    // the cookieless nav_click and any later, successful Lead conversion.
    if (next === "pricing" && panel !== "pricing") {
      trackMarketingInteraction("view_pricing", trackingPrefix + "_pricing");
    }
    setPanel(panel === next ? null : next);
  }


  function openInfo() {
    setChatOpen(false);
    track("info");
    setPanel(null);
    onOpenInfo();
  }

  function openInterest() {
    setChatOpen(false);
    track("interest");
    setPanel(null);
    onOpenInterest();
  }

  function openPuppy() {
    setChatOpen(false);
    track("puppy_checker_modal");
    setPanel(null);
    onOpenPuppyChecker();
  }

  const optionClass = "flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border border-forest/10 bg-white/75 px-3 py-2.5 text-left text-sm font-semibold text-forest transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";
  const ctaClass = "flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-coral px-4 py-2.5 text-center font-display text-sm font-bold text-white shadow-sm transition hover:bg-coral-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest";
  const itemClass = "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-0.5 text-center text-forest transition-colors aria-expanded:bg-secondary/75 hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";


  function openChat(questionId?: "pricing") {
    if (!guidedChatPreview) return;
    setPanel(null);
    setRequestedChatQuestion(questionId ?? null);
    setChatActivated(true);
    setChatOpen(true);
    void trackCookielessInteraction("explore_daycare", trackingPrefix + "_chat_open", "sk");
    if (questionId) void trackCookielessInteraction("explore_daycare", trackingPrefix + "_chat_bubble_" + questionId, "sk");
  }

  const outlineReady = speechGeometry !== null;
  const { width: sw, height: sh, tipX, tipY } =
    speechGeometry ?? { width: 0, height: 0, tipX: 0, tipY: 0 };
  // The preview portrait stays ABOVE the centered floating menu.
  // Keep the balloon's full rounded bottom border. Its right edge opens into
  // a short pair of Bezier curves: broad at the balloon, tapering to Aria's face.
  // Clamping both attachment heights keeps the tail away from the corner even
  // when the intro copy wraps differently on narrow iPhones.
  const tailTopY = Math.max(18, Math.min(sh - 37, tipY + 10));
  const tailBottomY = Math.min(sh - 16, Math.max(tailTopY + 24, tipY + 34));
  const rightSpeechPath = [
    "M 16 1",
    `L ${sw - 16} 1 Q ${sw - 1} 1 ${sw - 1} 16`,
    `L ${sw - 1} ${tailTopY}`,
    `C ${sw + 7} ${tailTopY - 5} ${tipX - 13} ${tipY + 2} ${tipX} ${tipY}`,
    `C ${tipX - 15} ${tipY + 12} ${sw - 1} ${tailBottomY - 7} ${sw - 1} ${tailBottomY}`,
    `L ${sw - 1} ${sh - 16} Q ${sw - 1} ${sh - 1} ${sw - 16} ${sh - 1}`,
    `L 16 ${sh - 1} Q 1 ${sh - 1} 1 ${sh - 16}`,
    "L 1 16 Q 1 1 16 1 Z",
  ].join(" ");
  // APP-01: the portrait is consistently anchored above/right of the dock.
  // A tail attached to the measured portrait tip folded into a spike when
  // the speech height changed. Keep the preview tail short, smooth and
  // *inside the side contour*, while the entire bottom remains rounded.
  // This is independent of viewport-induced portrait geometry/tipY.
  const previewBaseTop = Math.max(16, Math.min(sh - 36, Math.round(sh * 0.3)));
  const previewBaseBottom = Math.min(sh - 16, previewBaseTop + 20);
  const previewTipX = sw + 24;
  const previewTipY = Math.round((previewBaseTop + previewBaseBottom) / 2);
  const stablePreviewSpeechPath = [
    "M 16 1",
    `L ${sw - 16} 1 Q ${sw - 1} 1 ${sw - 1} 16`,
    `L ${sw - 1} ${previewBaseTop}`,
    `C ${sw + 5} ${previewBaseTop} ${sw + 16} ${previewTipY - 6} ${previewTipX} ${previewTipY}`,
    `C ${sw + 16} ${previewTipY + 6} ${sw + 5} ${previewBaseBottom} ${sw - 1} ${previewBaseBottom}`,
    `L ${sw - 1} ${sh - 16} Q ${sw - 1} ${sh - 1} ${sw - 16} ${sh - 1}`,
    `L 16 ${sh - 1} Q 1 ${sh - 1} 1 ${sh - 16}`,
    "L 1 16 Q 1 1 16 1 Z",
  ].join(" ");
  const leftSpeechPath = [
    "M 16 1",
    `L ${sw - 16} 1 Q ${sw - 1} 1 ${sw - 1} 16`,
    `L ${sw - 1} ${sh - 16} Q ${sw - 1} ${sh - 1} ${sw - 16} ${sh - 1}`,
    `L 30 ${sh - 1}`,
    `C 11 ${sh - 1} ${tipX + 15} ${tipY - 15} ${tipX} ${tipY}`,
    `C ${tipX + 12} ${tipY - 13} 2 ${sh - 11} 1 ${sh - 19}`,
    `L 1 16 Q 1 1 16 1 Z`,
  ].join(" ");
  const speechPath = guidedChatPreview ? stablePreviewSpeechPath : rightAlignedBubble ? rightSpeechPath : leftSpeechPath;

  if (hidden) return null;

  return (
    <aside aria-label="Aria – sprievodkyňa Chvostíkovom" data-aria-guide data-intro={stage === "intro" ? "true" : "false"} data-aria-stage={stage}
      className="pointer-events-none fixed inset-x-0 bottom-[max(94px,calc(env(safe-area-inset-bottom)+78px))] z-40 px-2 sm:bottom-4 sm:px-4">
      <div className="pointer-events-none relative mx-auto w-full max-w-[690px] pb-0">
        {panel && (
          <div role="region" aria-label={"Aria: " + panel} data-aria-panel={panel}
            className="pointer-events-auto absolute bottom-[calc(100%+9px)] left-0 right-0 z-20 max-h-[min(63dvh,500px)] overflow-y-auto overscroll-contain rounded-[26px] border border-white/75 bg-card/95 p-3 text-forest shadow-[0_14px_45px_rgba(17,65,41,.22)] ring-1 ring-forest/10 backdrop-blur-2xl sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {panel === "menu" ? (
                  <>
                    <img data-aria-menu-head src={ARIA_HEAD_DATA_URI} alt="" width={36} height={36} className="size-8 shrink-0 object-contain sm:size-9" />
                    <h2 className="shrink-0 font-display text-[11px] font-bold min-[390px]:text-sm sm:text-base">Menu Chvostíkova</h2>
                    <img data-aria-menu-logo src={brandWordmark} alt="Chvostíkovo" width={120} height={24}
                      className="ml-1 h-4 w-auto max-w-[58px] min-w-0 object-contain min-[390px]:max-w-[82px] sm:max-w-[104px]" />
                  </>
                ) : (
                  <>
                    <img src={ARIA_HEAD_DATA_URI} alt="" width={48} height={48} className="size-11 shrink-0 object-contain drop-shadow-md" />
                    <h2 className="font-display text-base font-bold">
                      {panel === "pricing" ? "Cenník škôlky" : panel === "requirements" ? "Podmienky prijatia" : "Aria odpovedá"}
                    </h2>
                  </>
                )}
              </div>
              <button type="button" aria-label="Zavrieť panel Arie" onClick={() => setPanel(null)}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
                <X size={20} aria-hidden />
              </button>
            </div>

            {panel === "pricing" && (
              <div className="mt-3 space-y-2" data-aria-pricing>
                {PRICING.map((item) => (
                  <article key={item.name} className="rounded-[18px] border border-forest/10 bg-white/85 px-3 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-sm font-bold text-forest">{item.highlight ? "Permanentka – 10 vstupov" : item.name}</h3>
                        <p className="mt-1 text-xs text-forest/65">{item.highlight ? "Platnosť 2 mesiace" : "1 vstup"}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-2xl font-bold text-coral-dark">{item.price}</p>
                        {item.highlight && <p className="mt-1 text-xs font-bold text-forest">Ušetríte 50 €</p>}
                      </div>
                    </div>
                  </article>
                ))}
                <div className="rounded-[18px] border border-forest/10 bg-secondary/60 p-3">
                  <p className="text-center font-display text-sm font-bold text-forest">Úvodná návšteva je zadarmo.</p>
                  <button type="button" aria-expanded={pricingVisitOpen} onClick={() => {
                      if (!pricingVisitOpen) void trackCookielessInteraction("explore_daycare", trackingPrefix + "_first_visit_pricing_details");
                      setPricingVisitOpen((v) => !v);
                    }}
                    className="mt-2 flex min-h-11 w-full items-center justify-between rounded-2xl border border-forest/15 bg-white/80 px-3 text-left text-sm font-semibold">
                    Ako prebieha návšteva? <span className="text-coral">{pricingVisitOpen ? "−" : "+"}</span>
                  </button>
                  {pricingVisitOpen && <div data-aria-first-visit className="mt-2 space-y-2 rounded-2xl bg-white/80 p-3">
                    {FIRST_VISIT_ANSWER.split(/\n+/).filter(Boolean).map((paragraph, i) =>
                      <p key={i} className="text-xs leading-relaxed text-forest/80"><AriaHighlightedText text={paragraph.trim()} /></p>)}
                    <button type="button" onClick={() => jump("lead-first-visit", "pricing_visit_steps")}
                      className="mx-auto mt-3 flex min-h-11 w-fit items-center justify-center rounded-full border border-coral/30 bg-card px-4 text-center text-sm font-bold text-coral-dark shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
                      Pozrieť 3 kroky prvej návštevy
                    </button>
                  </div>}
                </div>
                <button type="button" className={ctaClass} onClick={openInterest}>Mám záujem <ArrowRight size={16} aria-hidden /></button>
              </div>
            )}

            {panel === "requirements" && (
              <div className="mt-3 space-y-2" data-aria-requirements>
                {ARIA_PREVIEW_REQUIREMENTS.map((item, index) => (
                  <article key={item.title} className="rounded-2xl border border-forest/10 bg-white/85 px-3 py-3">
                    <div className="flex items-start gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-forest">{index + 1}</span>
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-bold">{item.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-forest/75 sm:text-sm"><AriaHighlightedText text={item.text} /></p>
                      </div>
                    </div>
                  </article>
                ))}
                <button type="button" className={ctaClass} onClick={openInfo}>Chcem sa informovať o škôlke</button>
              </div>
            )}

            {panel === "faq" && (
              <div className="mt-3 space-y-2" data-aria-faq>
                {QUESTIONS.map((entry, index) => (
                  <div key={entry.title} className="overflow-hidden rounded-2xl border border-forest/10 bg-white/80">
                    <button type="button" onClick={() => {
                        if (faqOpen !== index) {
                          const topic = index === 2 ? "faq_first_visit" : "faq_" + (index + 1);
                          void trackCookielessInteraction("explore_daycare", trackingPrefix + "_" + topic);
                        }
                        setFaqOpen(faqOpen === index ? null : index);
                      }}
                      aria-expanded={faqOpen === index}
                      className="flex min-h-11 w-full items-center justify-between gap-2 p-3 text-left text-sm font-bold">
                      {entry.title}<span className="text-coral">{faqOpen === index ? "−" : "+"}</span>
                    </button>
                    {faqOpen === index && (
                      <div className="space-y-3 border-t border-forest/10 px-3 py-3">
                        {entry.answer.split(/\n+/).map((paragraph, i) => <p key={i} className="text-xs leading-relaxed text-forest/80 sm:text-sm"><AriaHighlightedText text={paragraph.trim()} /></p>)}
                        {index === 1 && (
                          <button type="button" className={ctaClass} onClick={openPuppy}>
                            Overiť vhodnosť šteniatka <ArrowRight size={16} aria-hidden />
                          </button>
                        )}
                        {index === 2 && <button type="button" className={optionClass} onClick={() => jump("lead-first-visit", "visit_steps")}>Pozrieť 3 kroky prvej návštevy</button>}
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" className={optionClass} onClick={() => jump("lead-faq", "all_faq")}>Ďalšie otázky na stránke <ArrowRight size={16} aria-hidden /></button>
              </div>
            )}

            {panel === "menu" && (
              <nav aria-label="Rozšírené menu Arie" className="mt-3 space-y-2" data-aria-menu>
                <button type="button" className={optionClass} onClick={() => jump("lead-benefits", "why")}>
                  <span><strong className="block text-sm">Prečo Chvostíkovo</strong><small className="block text-[11px] font-normal text-forest/65">3 dôvody, prečo si vybrať nás</small></span><ArrowRight size={16} aria-hidden />
                </button>
                <button type="button" className={optionClass} onClick={() => jump("aria-mosaic", "gallery")}>
                  <span><strong className="block text-sm">Fotogaléria</strong><small className="block text-[11px] font-normal text-forest/65">Nahliadnite do života škôlkarov</small></span><ArrowRight size={16} aria-hidden />
                </button>
                <button type="button" className={optionClass} onClick={() => jump("lead-first-visit", "first_visit")}>
                  <span><strong className="block text-sm">Prvá návšteva zadarmo</strong><small className="block text-[11px] font-normal text-forest/65">Ako fungujú naše tri kroky</small></span><ArrowRight size={16} aria-hidden />
                </button>
                <button type="button" className={optionClass} onClick={() => jump("aria-puppy-check", "puppy_section")}>
                  <span><strong className="block text-sm">Máte šteniatko?</strong><small className="block whitespace-nowrap text-[clamp(8px,2.3vw,10.5px)] font-normal tracking-[-0.02em] text-forest/65">Zistite, či vaše šteniatko spĺňa podmienky</small></span><ArrowRight size={16} aria-hidden />
                </button>
                <button type="button" className={optionClass} onClick={() => guidedChatPreview ? jump("aria-first-visit-form", "menu_interest_scroll") : openInfo()}>
                  <span><strong className="block text-sm">Chcem sa informovať</strong><small className="block text-[11px] font-normal text-forest/65">Nechajte nám kontakt a ozveme sa</small></span><ArrowRight size={16} aria-hidden />
                </button>
                <button type="button" className={optionClass} onClick={() => jump("lead-faq", "menu_all_faq")}>Všetky časté otázky <ArrowRight size={16} aria-hidden /></button>
              </nav>
            )}
          </div>
        )}

        {!panel && !chatOpen && (
          <div data-aria-message data-aria-suppressed="false"
            className={rightAlignedBubble ? "pointer-events-none mb-3 flex w-full justify-end pr-[85px] sm:pr-[110px]" : "pointer-events-none mb-2 flex w-full justify-start pl-[75px] sm:pl-[96px]"}>
            <div ref={speechRef} data-aria-speech data-aria-outline-ready={outlineReady}
              className={"relative isolate inline-flex min-h-[48px] w-fit max-w-[min(75vw,390px)] items-center px-3 py-2 text-forest sm:max-w-[390px]" +
                (outlineReady ? "" : " rounded-[16px] bg-card ring-2 ring-forest/70")}>
              {outlineReady && <svg aria-hidden="true" data-aria-tail data-tip-x={guidedChatPreview ? previewTipX : tipX} data-tip-y={guidedChatPreview ? previewTipY : tipY}
                data-tail-base-top={rightAlignedBubble ? (guidedChatPreview ? previewBaseTop : tailTopY) : undefined}
                data-tail-base-bottom={rightAlignedBubble ? (guidedChatPreview ? previewBaseBottom : tailBottomY) : undefined}
                viewBox={`0 0 ${sw} ${sh}`} preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible text-forest/70">
                <path d={speechPath} fill="var(--card)" stroke="currentColor" strokeWidth="1.8"
                  strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>}
              {stage === "intro" ? (
                guidedChatPreview ? (
                  <div className="pointer-events-auto relative z-10 min-w-0">
                    <p className="font-display text-[11px] font-semibold leading-[1.4] tracking-normal sm:text-[13px]">
                      Ahoj, volám sa <strong className="font-extrabold text-coral-dark">Aria.</strong>{" "}
                      <strong className="font-extrabold text-forest">Čo ťa zaujíma o škôlke?</strong>
                    </p>
                    <button type="button" data-aria-bubble-chat-cta onClick={() => openChat()}
                      className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffa414] px-3 py-2 text-center text-[11px] font-extrabold leading-snug text-[#26322b] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9e336f] sm:text-xs">
                      Klikni a zisti viac <ArrowRight aria-hidden size={15} className="shrink-0" />
                    </button>
                  </div>
                ) : (
                  <p className="relative z-10 font-display text-[12px] leading-[1.4] font-semibold tracking-normal sm:text-[13px]">
                    Ahoj, volám sa <strong className="font-extrabold text-coral-dark">Aria.</strong>{" "}
                    <strong className="font-extrabold text-forest">Čo ťa zaujíma o škôlke?</strong>
                    <span className="mt-1.5 block text-[11px] font-medium leading-[1.35] text-forest/85 sm:text-xs">Zisti viac z našej ponuky nižšie.</span>
                  </p>
                )
              ) : stage === "puppy" ? (
                <div className="relative z-10 flex min-w-0 items-center justify-between gap-2">
                  <strong className="min-w-0 font-display text-[11px] font-semibold leading-tight text-forest">
                    Máte šteniatko? <span className="font-bold text-coral-dark">Zistite, či spĺňa podmienky.</span>
                  </strong>
                  <button type="button" onClick={() => jump("aria-puppy-check", "scroll_puppy_cta")}
                    className="pointer-events-auto ml-auto min-h-9 shrink-0 rounded-[11px] bg-coral px-3 text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest">
                    Overiť
                  </button>
                </div>
              ) : (
                <div className="relative z-10 flex min-w-0 items-center justify-between gap-2">
                  <strong className="min-w-0 font-display text-[11px] font-semibold leading-tight text-forest">
                    Chcete sa informovať? <span className="text-coral-dark">Vyplňte nezáväzný formulár.</span>
                  </strong>
                  <button type="button" onClick={() => guidedChatPreview ? jump("aria-first-visit-form", "bubble_contact_scroll") : openInfo()}
                    className="pointer-events-auto ml-auto min-h-9 shrink-0 rounded-[11px] bg-coral px-2.5 text-[11px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest">
                    Vyplniť
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={"pointer-events-auto relative rounded-[16px] border border-forest/20 bg-card/95 px-1 py-0.5 text-forest shadow-[0_4px_18px_rgba(18,68,43,.13)] sm:px-2 " + (rightAlignedBubble ? "mx-auto w-[calc(100%-12px)] max-w-[440px] sm:max-w-[500px]" : "ml-[83px] sm:ml-[104px]")} data-aria-dock>
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          {guidedChatPreview ? (
            <button type="button" aria-label="Porozprávať sa s Ariou" aria-expanded={chatOpen}
              data-aria-chat-trigger onClick={() => openChat()} style={{ WebkitTapHighlightColor: "transparent" }}
              className={"aria-chat-portrait pointer-events-auto absolute bottom-[calc(100%+12px)] -right-1 h-[92px] w-[92px] max-w-none rounded-full bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:bottom-[calc(100%+12px)] sm:right-0 sm:h-[104px] sm:w-[104px] " + (panel ? "z-0" : "z-30")}> 
              <img ref={portraitRef} src={ARIA_HEAD_DATA_URI} alt="Aria, psia pomocníčka" width={128} height={128}
                className="pointer-events-none h-full w-full object-contain contrast-[1.1] saturate-[1.05] drop-shadow-[0_3px_5px_rgba(0,0,0,.23)]" />
            </button>
          ) : (
            <img ref={portraitRef} src={ARIA_HEAD_DATA_URI} alt="Aria, psia pomocníčka" width={128} height={128}
              className={portraitOnRight ? "pointer-events-none absolute bottom-[calc(100%+12px)] right-1 h-[92px] w-[92px] max-w-none object-contain contrast-[1.07] saturate-[1.03] drop-shadow-[0_3px_5px_rgba(0,0,0,.25)] sm:right-0 sm:h-[104px] sm:w-[104px]" : "pointer-events-none absolute -bottom-1 -left-[86px] h-[84px] w-[84px] max-w-none object-contain contrast-[1.07] saturate-[1.03] drop-shadow-[0_3px_5px_rgba(0,0,0,.25)] sm:-left-[106px] sm:h-[99px] sm:w-[99px]"} />
          )}
          <div data-aria-section-navigation={sectionNavigation || undefined} className="flex h-[52px] items-center gap-0.5">
            {sectionNavigation ? (
              <>
                <button type="button" className={itemClass} aria-label="O nás" onClick={() => goToLeadSection("aria-about", "about")}><UsersRound size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">O nás</span></button>
                <button type="button" className={itemClass} aria-label="Cenník škôlky" onClick={() => goToLeadSection("lead-pricing", "pricing")}><Euro size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Cenník</span></button>
                <button type="button" className={itemClass} aria-label="Podmienky prijatia" onClick={() => goToLeadSection("lead-requirements", "requirements")}><ShieldCheck size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Podmienky</span></button>
                <button type="button" className={itemClass} aria-label="Mám záujem o škôlku" onClick={() => goToLeadSection("aria-hero-form", "interest")}><PawPrint size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-bold sm:text-xs">Záujem</span></button>
                <button type="button" className={itemClass} aria-label="Otvoriť menu" onClick={() => goToLeadSection("lead-section-menu", "menu")}><Menu size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Menu</span></button>
              </>
            ) : (
              <>
            <button type="button" className={itemClass} aria-label="Cenník škôlky" aria-expanded={guidedChatPreview ? undefined : panel === "pricing"} onClick={() => guidedChatPreview ? jump("lead-pricing", "pricing_scroll") : toggle("pricing")}>
              <Euro size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Cenník</span>
            </button>
            <button type="button" className={itemClass} aria-label="Podmienky prijatia" aria-expanded={guidedChatPreview ? undefined : panel === "requirements"} onClick={() => guidedChatPreview ? jump("lead-requirements", "requirements_scroll") : toggle("requirements")}>
              <ShieldCheck size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Podmienky</span>
            </button>
            <button type="button" className={itemClass}
              aria-label={guidedChatPreview ? "O nás" : "Časté otázky"}
              aria-expanded={guidedChatPreview ? undefined : panel === "faq"}
              onClick={() => guidedChatPreview ? jump("aria-about", "about_scroll") : toggle("faq")}>
              {guidedChatPreview
                ? <UsersRound size={20} strokeWidth={1.9} aria-hidden />
                : <BookOpen size={20} strokeWidth={1.9} aria-hidden />}
              <span className="text-[9px] font-semibold sm:text-xs">{guidedChatPreview ? "O nás" : "FAQ"}</span>
            </button>
            <button type="button" className={itemClass} aria-label="Mám záujem o škôlku" onClick={() => guidedChatPreview ? jump("aria-first-visit-form", "interest_scroll") : openInterest()}>
              <PawPrint size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-bold sm:text-xs">Záujem</span>
            </button>
            <button type="button" className={itemClass} aria-label="Otvoriť menu" aria-expanded={panel === "menu"} onClick={() => toggle("menu")}>
              <Menu size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Menu</span>
            </button>

              </>
            )}
          </div>
        </div>
        {guidedChatPreview && chatActivated && (
          <AriaChatBoundary open={chatOpen} onClose={() => setChatOpen(false)}>
            <Suspense fallback={null}>
              <AriaGuidedChat open={chatOpen} initialQuestionId={requestedChatQuestion}
                trackingPrefix={trackingPrefix === "lead_landing_aria" ? "lead_landing_aria_chat" : "aria_preview_v3_chat"}
                formPrefix={trackingPrefix === "lead_landing_aria" ? "lead_landing_aria_chat" : "aria_preview_chat"}
                onClose={() => setChatOpen(false)} />
            </Suspense>
          </AriaChatBoundary>
        )}
      </div>
    </aside>
  );
}
