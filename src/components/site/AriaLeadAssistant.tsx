import { useEffect, useRef, useState } from "react";
import { BookOpen, Euro, Menu, PawPrint, ShieldCheck, X, ArrowRight } from "lucide-react";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { FAQ as SITE_FAQ, PRICING } from "@/content/site";
import { ARIA_PREVIEW_REQUIREMENTS, AriaHighlightedText } from "@/components/site/AriaPreviewText";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type Panel = "pricing" | "requirements" | "faq" | "menu" | null;

const FIRST_VISIT_ANSWER = SITE_FAQ.find((entry) => entry.q === "Ako prebieha prvá návšteva psíka v škôlke?")?.a ??
  "Úvodná návšteva je zadarmo. Spoznáme vášho psíka, jeho povahu a reakcie na nové prostredie. Podľa toho spoločne vyberieme ďalší postup.";

const QUESTIONS = [
  {
    title: "Pre koho je škôlka určená?",
    answer: "Najmä pre stredné a veľké psy, spravidla nad 20 kg. Prijímame aj očkované šteniatka, spravidla nad 15 kg, podľa veku a individuálnej pripravenosti. Vyžadujeme očkovania, dobrý zdravotný stav a vhodnosť do kolektívu. Rozhodujeme po bezplatnej úvodnej návšteve.",
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
}: {
  onOpenInfo: () => void;
  onOpenInterest: () => void;
  onOpenPuppyChecker: () => void;
  hidden?: boolean;
  trackingPrefix?: string;
}) {
  const [intro, setIntro] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [pricingVisitOpen, setPricingVisitOpen] = useState(false);

  const speechRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const [speechObscured, setSpeechObscured] = useState(false);
  const [speechGeometry, setSpeechGeometry] = useState({ width: 280, height: 42, tipX: -42, tipY: 68 });

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
        tipX: Math.round(head.left + head.width * 0.68 - bubble.left),
        tipY: Math.round(head.top + head.height * 0.43 - bubble.top),
      };
      setSpeechGeometry(prev =>
        Object.keys(next).every(key => prev[key as keyof typeof prev] === next[key as keyof typeof next]) ? prev : next);
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
  }, [hidden, intro]);

  // Yield to visible headings, form fields and CTAs instead of covering them.
  // Visibility keeps the layout measurable on the next scroll frame.
  useEffect(() => {
    if (hidden) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const bubble = speechRef.current?.getBoundingClientRect();
      if (!bubble || panel) {
        setSpeechObscured(false);
        return;
      }
      const important = document.querySelectorAll<HTMLElement>(
        "main h1, main h2, main label, main input, main select, main textarea, main button, main a[href]"
      );
      const overlaps = Array.from(important).some(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 &&
          rect.left < bubble.right + 8 && rect.right > bubble.left - 8 &&
          rect.top < bubble.bottom + 8 && rect.bottom > bubble.top - 8;
      });
      setSpeechObscured(prev => prev === overlaps ? prev : overlaps);
    };
    const requestCheck = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };
    const observer = new ResizeObserver(requestCheck);
    if (speechRef.current) observer.observe(speechRef.current);
    window.addEventListener("scroll", requestCheck, { passive: true });
    window.addEventListener("resize", requestCheck);
    requestCheck();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestCheck);
      window.removeEventListener("resize", requestCheck);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [hidden, intro, panel]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setIntro(window.scrollY < 125);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => { html.style.overflow = prevHtml; body.style.overflow = prevBody; };
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
    setPanel(null);
    const target = document.getElementById(id);
    if (!target) return;
    const top = window.scrollY + target.getBoundingClientRect().top - 86;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
    }));
  }

  function toggle(next: Exclude<Panel, null>) {
    track(next);
    setPanel(panel === next ? null : next);
  }


  function openInfo() {
    track("info");
    setPanel(null);
    onOpenInfo();
  }

  function openInterest() {
    track("interest");
    setPanel(null);
    onOpenInterest();
  }

  function openPuppy() {
    track("puppy_checker_modal");
    setPanel(null);
    onOpenPuppyChecker();
  }

  const optionClass = "flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border border-forest/10 bg-white/75 px-3 py-2.5 text-left text-sm font-semibold text-forest transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";
  const ctaClass = "flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-coral px-4 py-2.5 text-center font-display text-sm font-bold text-white shadow-sm transition hover:bg-coral-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest";
  const itemClass = "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[12px] bg-white/55 px-0.5 text-center text-forest shadow-[0_2px_7px_rgba(18,68,43,.10)] transition aria-expanded:bg-secondary/80 aria-expanded:ring-1 aria-expanded:ring-forest/15 hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";


  const { width: sw, height: sh, tipX, tipY } = speechGeometry;
  const speechPath = [
    "M 16 1",
    `L ${sw - 16} 1 Q ${sw - 1} 1 ${sw - 1} 16`,
    `L ${sw - 1} ${sh - 16} Q ${sw - 1} ${sh - 1} ${sw - 16} ${sh - 1}`,
    `L 45 ${sh - 1}`,
    `C 24 ${sh - 1} ${tipX + 17} ${tipY - 7} ${tipX} ${tipY}`,
    `C ${tipX + 18} ${tipY - 16} 5 ${sh - 9} 14 ${sh - 8}`,
    `Q 1 ${sh - 8} 1 ${sh - 18} L 1 16 Q 1 1 16 1 Z`,
  ].join(" ");

  if (hidden) return null;

  return (
    <aside aria-label="Aria – sprievodkyňa Chvostíkovom" data-aria-guide data-intro={intro ? "true" : "false"}
      className="pointer-events-none fixed inset-x-0 bottom-[max(6px,env(safe-area-inset-bottom))] z-40 px-2 sm:bottom-4 sm:px-4">
      <div className="pointer-events-none relative mx-auto w-full max-w-[690px]">
        {panel && (
          <div role="region" aria-label={"Aria: " + panel} data-aria-panel={panel}
            className="pointer-events-auto absolute bottom-[calc(100%+9px)] left-0 right-0 max-h-[min(63dvh,500px)] overflow-y-auto overscroll-contain rounded-[26px] border border-white/75 bg-card/95 p-3 text-forest shadow-[0_14px_45px_rgba(17,65,41,.22)] ring-1 ring-forest/10 backdrop-blur-2xl sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <img src={ARIA_HEAD_DATA_URI} alt="" width={48} height={48} className="size-11 shrink-0 object-contain drop-shadow-md" />
                <h2 className="font-display text-base font-bold">
                  {panel === "pricing" ? "Cenník škôlky" : panel === "requirements" ? "Podmienky prijatia" : panel === "faq" ? "Aria odpovedá" : "Menu Chvostíkova"}
                </h2>
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
                  <button type="button" aria-expanded={pricingVisitOpen} onClick={() => setPricingVisitOpen((v) => !v)}
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
                    <button type="button" onClick={() => setFaqOpen(faqOpen === index ? null : index)}
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
                <button type="button" className={optionClass} onClick={openInfo}>
                  <span><strong className="block text-sm">Chcem sa informovať</strong><small className="block text-[11px] font-normal text-forest/65">Nechajte nám kontakt a ozveme sa</small></span><ArrowRight size={16} aria-hidden />
                </button>
                <button type="button" className={optionClass} onClick={() => jump("lead-faq", "menu_all_faq")}>Všetky časté otázky <ArrowRight size={16} aria-hidden /></button>
              </nav>
            )}
          </div>
        )}

        {!panel && (
          <div data-aria-message data-aria-suppressed={speechObscured ? "true" : "false"} aria-hidden={speechObscured}
            className={`mb-2 flex w-full justify-start pl-[75px] sm:pl-[96px] ${speechObscured ? "invisible pointer-events-none" : "pointer-events-auto"}`}>
            <div ref={speechRef} data-aria-speech className="relative isolate inline-flex min-h-[42px] max-w-full -rotate-[0.5deg] items-center px-2.5 py-1.5 text-forest">
              <svg aria-hidden="true" data-aria-tail data-tip-x={tipX} data-tip-y={tipY}
                viewBox={`0 0 ${sw} ${sh}`} preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible text-forest/70">
                <path d={speechPath} fill="var(--card)" stroke="currentColor" strokeWidth="1.8"
                  strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
              {intro ? (
                <p className="relative z-10 font-display text-[11px] leading-tight font-semibold tracking-tight">
                  Ahoj, volám sa <strong className="font-extrabold text-coral-dark">Aria.</strong>{" "}
                  <strong className="font-extrabold text-forest">Čo ťa zaujíma o škôlke?</strong>
                </p>
              ) : (
                <div className="relative z-10 flex min-w-0 items-center gap-2">
                  <strong className="min-w-0 text-center font-display text-[clamp(9px,2.5vw,13px)] text-forest">
                    Máte šteniatko? <span className="font-extrabold text-coral-dark">Zistite, či spĺňa podmienky.</span>
                  </strong>
                  <button type="button" onClick={() => jump("aria-puppy-check", "scroll_puppy_cta")}
                    className="min-h-9 shrink-0 rounded-[11px] bg-coral px-3 text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest">
                    Overiť
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pointer-events-auto relative ml-[83px] rounded-[16px] border border-white/80 bg-card/85 px-1 py-0.5 text-forest shadow-[0_6px_30px_rgba(18,68,43,.22)] ring-1 ring-forest/10 backdrop-blur-2xl sm:ml-[104px] sm:px-2" data-aria-dock>
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <img ref={portraitRef} src={ARIA_HEAD_DATA_URI} alt="Aria, psia pomocníčka" width={128} height={128}
            className="pointer-events-none absolute -bottom-1 -left-[83px] h-[78px] w-[78px] max-w-none object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,.42)] sm:-left-[104px] sm:h-[95px] sm:w-[95px]" />
          <div className="flex min-h-[48px] items-center gap-0.5">
            <button type="button" className={itemClass} aria-label="Cenník škôlky" aria-expanded={panel === "pricing"} onClick={() => toggle("pricing")}>
              <Euro size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Cenník</span>
            </button>
            <button type="button" className={itemClass} aria-label="Podmienky prijatia" aria-expanded={panel === "requirements"} onClick={() => toggle("requirements")}>
              <ShieldCheck size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Podmienky</span>
            </button>
            <button type="button" className={itemClass} aria-label="Časté otázky" aria-expanded={panel === "faq"} onClick={() => toggle("faq")}>
              <BookOpen size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">FAQ</span>
            </button>
            <button type="button" className={itemClass} aria-label="Mám záujem o škôlku" onClick={openInterest}>
              <PawPrint size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-bold sm:text-xs">Záujem</span>
            </button>
            <button type="button" className={itemClass} aria-label="Otvoriť menu" aria-expanded={panel === "menu"} onClick={() => toggle("menu")}>
              <Menu size={20} strokeWidth={1.9} aria-hidden /><span className="text-[9px] font-semibold sm:text-xs">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
