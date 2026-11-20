import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, Euro, Menu, PawPrint, ShieldCheck, X } from "lucide-react";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import logo from "@/assets/logo.png";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type Panel = "faq" | "menu" | null;

const FAQ = [
  {
    title: "Pre koho je škôlka určená?",
    answer: "Najmä pre stredné a veľké psy, spravidla nad 20 kg. Prijímame aj šteniatka s dokončenými požadovanými očkovaniami. Okrem veľkosti a veku posudzujeme zdravie, povahu a správanie v kolektíve; definitívne rozhodnutie padne po bezplatnej úvodnej návšteve.",
  },
  {
    title: "Prijímate aj šteniatka?",
    answer: "Áno. Potrebujú platné očkovanie proti besnote, DHPPi+L podľa požadovanej schémy a kotercovému kašľu. Vek a pripravenosť na kolektív posudzujeme individuálne pri úvodnej návšteve.",
  },
  {
    title: "Ako prebieha prvá návšteva?",
    answer: "Úvodná návšteva je zdarma. Spoznáme vášho psíka, prejdeme jeho potreby a sledujeme, ako sa cíti medzi ľuďmi a psami.",
  },
] as const;

export function AriaLeadAssistant({
  onOpenInfo,
  onOpenInterest,
}: {
  onOpenInfo: () => void;
  onOpenInterest: () => void;
}) {
  const [intro, setIntro] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [faqOpen, setFaqOpen] = useState(0);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      setIntro(window.scrollY < 115);
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [panel]);

  function track(action: string) {
    void trackCookielessInteraction("nav_click", "aria_preview_v2_" + action, "sk");
  }

  function jump(id: string, action: string) {
    setPanel(null);
    track(action);
    const target = document.getElementById(id);
    if (!target) return;
    const top = window.scrollY + target.getBoundingClientRect().top - 82;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
  }

  function toggle(next: Exclude<Panel, null>) {
    track(next);
    setPanel(panel === next ? null : next);
  }

  const itemClass = "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-center text-forest transition hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";
  const optionClass = "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-forest/10 bg-white/75 px-3 text-left text-sm font-semibold text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";

  return (
    <aside aria-label="Aria – sprievodkyňa Chvostíkovom" data-aria-guide data-intro={intro ? "true" : "false"}
      className="pointer-events-none fixed inset-x-0 bottom-[max(6px,env(safe-area-inset-bottom))] z-40 px-2 sm:bottom-4 sm:px-4">
      <div className="pointer-events-auto relative mx-auto w-full max-w-[640px]">
        {panel && (
          <div data-aria-panel className="absolute bottom-[calc(100%+9px)] left-0 right-0 max-h-[min(60dvh,360px)] overflow-y-auto overscroll-contain rounded-[24px] border border-white/65 bg-card/95 p-3 text-forest shadow-[0_12px_40px_rgba(17,65,41,.20)] backdrop-blur-2xl sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <img src={ARIA_HEAD_DATA_URI} alt="" width={44} height={44} className="size-11 object-contain drop-shadow-md" />
                <p className="font-display text-base font-bold">{panel === "faq" ? "Aria odpovedá" : "Menu Chvostíkova"}</p>
              </div>
              <button type="button" aria-label="Zavrieť menu Arie" onClick={() => setPanel(null)}
                className="grid size-11 place-items-center rounded-full bg-secondary/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"><X size={19} aria-hidden /></button>
            </div>
            {panel === "faq" ? (
              <div className="mt-3 space-y-2">
                {FAQ.map((entry, i) => (
                  <div key={entry.title} className="rounded-2xl border border-forest/10 bg-white/70">
                    <button type="button" onClick={() => setFaqOpen(i === faqOpen ? -1 : i)} aria-expanded={faqOpen === i}
                      className="flex min-h-11 w-full items-center justify-between gap-3 p-3 text-left text-sm font-bold">
                      {entry.title}<span className="text-coral">{faqOpen === i ? "−" : "+"}</span>
                    </button>
                    {faqOpen === i && <p className="border-t border-forest/10 px-3 py-3 text-sm leading-relaxed text-forest/80">{entry.answer}</p>}
                  </div>
                ))}
                <button type="button" onClick={() => jump("lead-faq", "more_faq")} className={optionClass}>Viac otázok na stránke <ChevronLeft className="rotate-180" size={16} /></button>
              </div>
            ) : (
              <nav aria-label="Rozšírené menu Arie" className="mt-3 grid gap-2">
                <button type="button" className={optionClass} onClick={() => jump("lead-benefits", "why")}>Prečo Chvostíkovo</button>
                <button type="button" className={optionClass} onClick={() => jump("aria-mosaic", "gallery")}>Fotogaléria</button>
                <button type="button" className={optionClass} onClick={() => jump("lead-first-visit", "first_visit")}>Prvá návšteva zdarma</button>
                <button type="button" className={optionClass} onClick={() => jump("aria-puppy-check", "puppy_checker")}>Máte šteniatko?</button>
                <button type="button" className={optionClass} onClick={() => { track("info"); setPanel(null); onOpenInfo(); }}>Chcem sa informovať</button>
                <a className={optionClass} href="/caste-otazky">Všetky časté otázky</a>
                <button type="button" className={optionClass} onClick={() => { setPanel(null); window.dispatchEvent(new Event("chvostikovo-open-cookie-settings")); }}>Nastavenia cookies</button>
                <a className={optionClass} href="/">Prejsť na hlavný web</a>
              </nav>
            )}
          </div>
        )}

        <div className="relative overflow-visible rounded-[26px] border border-white/80 bg-card/85 px-1.5 pb-1.5 pt-1.5 text-forest shadow-[0_6px_30px_rgba(18,68,43,.22)] ring-1 ring-forest/10 backdrop-blur-2xl sm:px-3">
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className={"overflow-hidden transition-[max-height,opacity,margin] duration-300 motion-reduce:transition-none " + (intro ? "mb-1 max-h-16 opacity-100" : "max-h-0 opacity-0")}>
            <p className="pl-[64px] pr-2 pt-1 font-display text-[12px] font-semibold leading-snug text-forest sm:text-sm">
              <strong>Ahoj! Som Aria.</strong> 🐾 Vitaj v Chvostíkove. Čo ťa zaujíma?
            </p>
          </div>
          <div className="flex min-h-[58px] items-center gap-0.5">
            <div className="relative flex w-[56px] shrink-0 items-center justify-center self-stretch sm:w-[70px]">
              <img src={ARIA_HEAD_DATA_URI} alt="Aria, psia pomocníčka" width={128} height={128}
                className="h-[62px] w-[62px] max-w-none object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,.22)] sm:h-[72px] sm:w-[72px]" />
            </div>
            <div className="h-9 w-px shrink-0 bg-forest/10" />
            <button type="button" className={itemClass} aria-label="Cenník škôlky" onClick={() => jump("lead-pricing", "pricing")}>
              <Euro size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">Cenník</span>
            </button>
            <button type="button" className={itemClass} aria-label="Podmienky prijatia" onClick={() => jump("lead-requirements", "requirements")}>
              <ShieldCheck size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">Podmienky</span>
            </button>
            <button type="button" className={itemClass} aria-label="Časté otázky" aria-expanded={panel === "faq"} onClick={() => toggle("faq")}>
              <BookOpen size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">FAQ</span>
            </button>
            <button type="button" className={itemClass + " text-coral-dark"} aria-label="Mám záujem o škôlku" onClick={() => { track("interest"); setPanel(null); onOpenInterest(); }}>
              <PawPrint size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-bold sm:text-xs">Záujem</span>
            </button>
            <button type="button" className={itemClass} aria-label="Otvoriť menu" aria-expanded={panel === "menu"} onClick={() => toggle("menu")}>
              <Menu size={20} strokeWidth={1.9} aria-hidden /><span className="text-[10px] font-semibold sm:text-xs">Menu</span>
            </button>
            <img src={logo} alt="Chvostíkovo" className="ml-2 hidden h-5 w-auto max-w-[95px] object-contain lg:block" />
          </div>
        </div>
      </div>
    </aside>
  );
}
