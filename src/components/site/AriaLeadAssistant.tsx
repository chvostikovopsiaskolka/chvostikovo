import { useEffect, useState } from "react";
import { BookOpen, Euro, Menu, PawPrint, ShieldCheck, X, ArrowRight } from "lucide-react";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { FAQ as SITE_FAQ, PRICING, REQUIREMENTS } from "@/content/site";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type Panel = "pricing" | "requirements" | "faq" | "menu" | null;

const FIRST_VISIT_ANSWER = SITE_FAQ.find((entry) => entry.q === "Ako prebieha prvá návšteva psíka v škôlke?")?.a ??
  "Úvodná návšteva je zadarmo. Spoznáme vášho psíka, jeho povahu a reakcie na nové prostredie. Podľa toho spoločne vyberieme ďalší postup.";

const QUESTIONS = [
  {
    title: "Pre koho je škôlka určená?",
    answer: "Najmä pre stredné a veľké psy, spravidla nad 20 kg. Prijímame aj šteniatka s dokončenými požadovanými očkovaniami. Okrem veku a veľkosti posudzujeme zdravie, povahu a vhodnosť do kolektívu. Rozhodujeme po bezplatnej úvodnej návšteve.",
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
}: {
  onOpenInfo: () => void;
  onOpenInterest: () => void;
  onOpenPuppyChecker: () => void;
  hidden?: boolean;
}) {
  const [intro, setIntro] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  function track(action: string) {
    void trackCookielessInteraction("nav_click", "aria_preview_v3_" + action, "sk");
  }

  function jump(id: string, action: string) {
    track(action);
    setPanel(null);
    const target = document.getElementById(id);
    if (!target) return;
    const top = window.scrollY + target.getBoundingClientRect().top - 86;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
  }

  function toggle(next: Exclude<Panel, null>) {
    track(next);
    setPanel(panel === next ? null : next);
  }

  function showFirstVisitFaq() {
    track("pricing_first_visit_faq");
    setFaqOpen(2);
    setPanel("faq");
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
  const itemClass = "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-center text-forest transition hover:bg-white/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";

  if (hidden) return null;

  return (
    <aside aria-label="Aria – sprievodkyňa Chvostíkovom" data-aria-guide data-intro={intro ? "true" : "false"}
      className="pointer-events-none fixed inset-x-0 bottom-[max(6px,env(safe-area-inset-bottom))] z-40 px-2 sm:bottom-4 sm:px-4">
      <div className="pointer-events-auto relative mx-auto w-full max-w-[690px]">
        {panel && (
          <div role="region" aria-label={"Aria: " + panel} data-aria-panel={panel}
            className="absolute bottom-[calc(100%+9px)] left-0 right-0 max-h-[min(63dvh,500px)] overflow-y-auto overscroll-contain rounded-[26px] border border-white/75 bg-card/95 p-3 text-forest shadow-[0_14px_45px_rgba(17,65,41,.22)] ring-1 ring-forest/10 backdrop-blur-2xl sm:p-4">
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
              <div className="mt-3 space-y-3" data-aria-pricing>
                <div className="grid grid-cols-2 items-stretch gap-2 sm:gap-3">
                  {PRICING.map((item) => (
                    <article key={item.name}
                      className={"flex min-h-[183px] flex-col items-center rounded-[20px] px-2.5 py-4 text-center shadow-sm sm:min-h-[200px] sm:p-5 " +
                        (item.highlight ? "bg-forest text-cream" : "bg-white text-forest")}>
                      <h3 className="min-h-[2rem] font-display text-[12px] font-bold leading-tight sm:text-base">{item.name}</h3>
                      <p className={"mt-0.5 text-[11px] font-semibold " + (item.highlight ? "text-cream/80" : "text-forest/65")}>
                        {item.highlight ? "10 vstupov" : "1 vstup"}
                      </p>
                      <p className={"mt-2 font-display text-3xl font-bold sm:text-4xl " + (item.highlight ? "text-cream" : "text-coral-dark")}>{item.price}</p>
                      <div className="mt-auto pt-3 text-[11px] leading-snug sm:text-xs">
                        {item.highlight ? (
                          <>
                            <strong className="block">Ušetríte 50 €</strong>
                            <span className="mt-1 block opacity-80">Platnosť 2 mesiace</span>
                          </>
                        ) : <span className="opacity-75">Celodenný pobyt</span>}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="rounded-2xl border border-coral/30 bg-secondary/60 px-3 py-3 text-center">
                  <p className="font-display text-sm font-bold">Úvodná návšteva zadarmo</p>
                  <button type="button" onClick={showFirstVisitFaq}
                    className="mt-1 min-h-10 text-sm font-semibold text-coral-dark underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
                    Ako prebieha úvodná návšteva?
                  </button>
                </div>
                <button type="button" className={ctaClass} onClick={openInterest}>Mám záujem <ArrowRight size={16} aria-hidden /></button>
              </div>
            )}

            {panel === "requirements" && (
              <div className="mt-3 space-y-2" data-aria-requirements>
                {REQUIREMENTS.map((item, index) => (
                  <article key={item.title} className="rounded-2xl border border-forest/10 bg-white/85 px-3 py-3">
                    <div className="flex items-start gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-forest">{index + 1}</span>
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-bold">{item.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-forest/75 sm:text-sm">{item.text}</p>
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
                        {entry.answer.split(/\n+/).map((paragraph, i) => <p key={i} className="text-xs leading-relaxed text-forest/80 sm:text-sm">{paragraph.trim()}</p>)}
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
                  <span><strong className="block text-sm">Máte šteniatko?</strong><small className="block whitespace-nowrap text-[clamp(9px,2.65vw,12px)] font-normal text-forest/65">Zistite, či vaše šteniatko spĺňa podmienky</small></span><ArrowRight size={16} aria-hidden />
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
          <div data-aria-message className="mb-1.5 flex min-h-9 items-center rounded-[18px] border border-white/80 bg-card/90 px-3 py-1.5 shadow-md ring-1 ring-forest/10 backdrop-blur-xl">
            {intro ? (
              <p className="w-full whitespace-nowrap text-center font-display text-[11px] font-bold tracking-tight text-forest min-[390px]:text-[12px] sm:text-sm">
                Ahoj! Volám sa Aria! Čo ťa zaujíma o škôlke?
              </p>
            ) : (
              <div className="flex w-full items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] font-semibold text-forest sm:text-sm">Máte šteniatko? Zistite, či spĺňa podmienky.</span>
                <button type="button" onClick={() => jump("aria-puppy-check", "scroll_puppy_cta")}
                  className="min-h-9 shrink-0 rounded-full bg-forest px-3 text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
                  Overiť
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative ml-[44px] rounded-[24px] border border-white/80 bg-card/85 px-1.5 py-1.5 text-forest shadow-[0_6px_30px_rgba(18,68,43,.22)] ring-1 ring-forest/10 backdrop-blur-2xl sm:ml-[65px] sm:px-3" data-aria-dock>
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <img src={ARIA_HEAD_DATA_URI} alt="Aria, psia pomocníčka" width={128} height={128}
            className="pointer-events-none absolute -bottom-1 -left-[46px] h-[77px] w-[77px] max-w-none object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,.22)] sm:-left-[70px] sm:h-[94px] sm:w-[94px]" />
          <div className="flex min-h-[57px] items-center gap-0.5">
            <button type="button" className={itemClass} aria-label="Cenník škôlky" aria-expanded={panel === "pricing"} onClick={() => toggle("pricing")}>
              <Euro size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">Cenník</span>
            </button>
            <button type="button" className={itemClass} aria-label="Podmienky prijatia" aria-expanded={panel === "requirements"} onClick={() => toggle("requirements")}>
              <ShieldCheck size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">Podmienky</span>
            </button>
            <button type="button" className={itemClass} aria-label="Časté otázky" aria-expanded={panel === "faq"} onClick={() => toggle("faq")}>
              <BookOpen size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">FAQ</span>
            </button>
            <button type="button" className={itemClass + " text-coral-dark"} aria-label="Mám záujem o škôlku" onClick={openInterest}>
              <PawPrint size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-bold sm:text-xs">Záujem</span>
            </button>
            <button type="button" className={itemClass} aria-label="Otvoriť menu" aria-expanded={panel === "menu"} onClick={() => toggle("menu")}>
              <Menu size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
