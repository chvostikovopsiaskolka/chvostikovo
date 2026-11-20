import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type Screen = "home" | "faq" | "menu";

const QUESTIONS = [
  {
    q: "Pre koho je škôlka určená?",
    a: "Zameriavame sa najmä na stredných a veľkých psíkov, spravidla nad 20 kg. Dôležitá je aj povaha, zdravotný stav a vhodnosť do kolektívu. Konečné rozhodnutie robíme až po bezplatnej úvodnej návšteve.",
  },
  {
    q: "Prijímate aj šteniatka?",
    a: "Áno, keď majú splnené požadované očkovania vrátane besnoty, DHPPi+L a kotercového kašľa. Vhodnosť vždy posúdime individuálne pri úvodnom zoznámení.",
  },
  {
    q: "Ako prebieha úvodná návšteva?",
    a: "Prvá návšteva je zadarmo. Spoznáme vášho psíka, porozprávame sa o jeho potrebách a pozrieme sa, ako reaguje na prostredie, ľudí a ostatných psov.",
  },
] as const;

export function AriaLeadAssistant({
  onOpenInfo,
  onOpenInterest,
}: {
  onOpenInfo: () => void;
  onOpenInterest: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [screen, setScreen] = useState<Screen>("home");
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function track(action: string) {
    void trackCookielessInteraction("nav_click", "aria_preview_" + action, "sk");
  }

  function scrollTo(id: string, action: string) {
    track(action);
    setOpen(false);
    const element = document.getElementById(id);
    if (!element) return;
    const top = window.scrollY + element.getBoundingClientRect().top - 90;
    window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function show(screenToShow: Screen) {
    track(screenToShow);
    setScreen(screenToShow);
    setExpanded(screenToShow === "faq" ? 0 : null);
  }

  function openCookieSettings() {
    track("cookie_settings");
    setOpen(false);
    window.dispatchEvent(new Event("chvostikovo-open-cookie-settings"));
  }

  const actionClass = "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-forest/10 bg-white px-3 py-2.5 text-left text-[13px] font-semibold text-forest transition hover:border-coral/40 hover:bg-secondary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";
  return (
    <aside aria-label="Aria – sprievodkyňa po webe Chvostíkova" data-aria-guide className="pointer-events-none fixed inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-[60] flex justify-end px-3 sm:bottom-5 sm:right-4 sm:left-auto sm:px-0">
      <div className="pointer-events-auto w-full max-w-[365px]">
        {open && (
          <div data-aria-panel className="mb-2 max-h-[min(72dvh,560px)] overflow-y-auto overscroll-contain rounded-3xl border border-forest/10 bg-card p-3 shadow-2xl ring-1 ring-forest/5 sm:p-4">
            <div className="flex items-start gap-2">
              <div className="relative size-16 shrink-0 rounded-2xl bg-secondary/45">
                <img src={ARIA_HEAD_DATA_URI} alt="Aria, psia pomocníčka Chvostíkova" width={128} height={128} className="absolute -top-1 -left-1 size-[72px] object-contain drop-shadow-[0_7px_7px_rgba(0,0,0,0.23)]" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <p className="font-display text-[19px] font-bold leading-tight text-forest">Ahoj! 🐾</p>
                <p className="mt-1 text-xs leading-relaxed text-forest/75">Vitaj na webe psej škôlky Chvostíkovo. Som Aria a rada ťa prevediem.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Zavrieť sprievodkyňu" className="flex size-8 shrink-0 items-center justify-center rounded-full text-forest/70 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
                <X size={18} aria-hidden />
              </button>
            </div>

            {screen !== "home" && (
              <button type="button" onClick={() => show("home")} className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-forest/75 hover:text-coral">
                <ChevronLeft size={15} aria-hidden /> Späť na výber
              </button>
            )}
            {screen === "home" && (
              <div className="mt-3 space-y-2">
                <p className="mb-2 font-display text-sm font-bold text-forest">Čo ťa zaujíma?</p>
                <button className={actionClass} type="button" onClick={() => show("faq")}>Pre koho je škôlka určená? <ChevronRight size={17} aria-hidden /></button>
                <button className={actionClass} type="button" onClick={() => scrollTo("lead-pricing", "pricing")}>Cenník škôlky <ChevronRight size={17} aria-hidden /></button>
                <button className={actionClass} type="button" onClick={() => scrollTo("lead-requirements", "requirements")}>Podmienky prijatia <ChevronRight size={17} aria-hidden /></button>
                <button className={actionClass} type="button" onClick={() => show("faq")}>Časté otázky (FAQ) <ChevronRight size={17} aria-hidden /></button>
                <button className={actionClass + " !border-coral/25 !bg-coral/10"} type="button" onClick={() => { track("info"); setOpen(false); onOpenInfo(); }}>Chcem zistiť viac <ArrowRight size={17} aria-hidden /></button>
                <button className={actionClass} type="button" onClick={() => { track("interest"); setOpen(false); onOpenInterest(); }}>Mám záujem o škôlku <ChevronRight size={17} aria-hidden /></button>
                <button className="flex min-h-10 w-full items-center justify-center gap-2 text-xs font-bold text-forest/75 underline underline-offset-4 hover:text-coral" type="button" onClick={() => show("menu")}><Menu size={16} aria-hidden /> Menu a ďalšie stránky</button>
              </div>
            )}
            {screen === "faq" && (
              <div className="mt-3 space-y-2" data-aria-faq>
                <p className="font-display text-sm font-bold text-forest">Najčastejšie otázky</p>
                {QUESTIONS.map((item, i) => (
                  <div key={item.q} className="overflow-hidden rounded-xl border border-forest/10 bg-white">
                    <button type="button" className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-bold text-forest" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? null : i)}>
                      {item.q}<span className="text-coral">{expanded === i ? "−" : "+"}</span>
                    </button>
                    {expanded === i && <p className="border-t border-forest/10 px-3 py-3 text-xs leading-relaxed text-forest/80">{item.a}</p>}
                  </div>
                ))}
                <button className={actionClass} type="button" onClick={() => scrollTo("lead-faq", "all_faq")}>Ďalšie odpovede na stránke <ChevronRight size={17} aria-hidden /></button>
              </div>
            )}
            {screen === "menu" && (
              <nav aria-label="Menu Arie" className="mt-3 space-y-2">
                <p className="font-display text-sm font-bold text-forest">Menu</p>
                <button type="button" className={actionClass} onClick={() => scrollTo("lead-benefits", "benefits")}>Prečo Chvostíkovo <ChevronRight size={17} aria-hidden /></button>
                <button type="button" className={actionClass} onClick={() => scrollTo("lead-pricing", "menu_pricing")}>Cenník <ChevronRight size={17} aria-hidden /></button>
                <button type="button" className={actionClass} onClick={() => scrollTo("lead-requirements", "menu_requirements")}>Podmienky <ChevronRight size={17} aria-hidden /></button>
                <a className={actionClass} href="/caste-otazky">Všetky časté otázky <ChevronRight size={17} aria-hidden /></a>
                <a className={actionClass} href="/">Hlavný web <ChevronRight size={17} aria-hidden /></a>
              </nav>
            )}
            <p className="mt-3 border-t border-forest/10 pt-2 text-[11px] leading-relaxed text-forest/65">
              Používame aj voliteľné cookies. O ich povolení rozhoduješ ty.{" "}
              <button type="button" onClick={openCookieSettings} className="font-bold underline underline-offset-2 hover:text-coral">Nastavenia cookies</button>
            </p>
          </div>
        )}
        <button data-aria-launcher type="button" onClick={() => { setOpen(!open); if (!open) track("open"); }} aria-expanded={open} aria-label={open ? "Zavrieť pomocníčku Ariu" : "Otvoriť pomocníčku Ariu"} className="ml-auto flex min-h-[64px] items-center gap-2 rounded-full border border-forest/10 bg-card py-1 pr-4 pl-1.5 text-sm font-bold text-forest shadow-xl transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
          <img src={ARIA_HEAD_DATA_URI} alt="" width={128} height={128} className="size-12 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.2)]" />
          <span>{open ? "Skryť Ariu" : "Ahoj! Som Aria"}</span>
        </button>
      </div>
    </aside>
  );
}
