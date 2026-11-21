import { useEffect, useState } from "react";
import { ArrowRight, Euro, FilePenLine, Heart, Package, Users, X } from "lucide-react";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { PRICING } from "@/content/site";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { FormDialog } from "./FormDialog";
import { LongForm } from "./Forms";

type Panel = "pricing" | "products" | null;
type Tab = "why" | "pricing" | "products" | "about";

const MAIN_SECTIONS: { tab: Tab; id: string }[] = [
  { tab: "why", id: "preco-chvostikovo" },
  { tab: "about", id: "o-nas" },
  { tab: "pricing", id: "cennik" },
  { tab: "products", id: "produkty" },
];

export function HomeAriaDock() {
  const [panel, setPanel] = useState<Panel>(null);
  const [active, setActive] = useState<Tab | null>(null);
  const [puppyNear, setPuppyNear] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const checkpoint = window.innerHeight * 0.46;
      const visible = MAIN_SECTIONS.map(({ tab, id }) => ({
        tab,
        rect: document.getElementById(id)?.getBoundingClientRect(),
      }));
      const selected = visible.find(({ rect }) => rect && rect.top <= checkpoint && rect.bottom >= checkpoint);
      setActive(selected?.tab ?? null);
      const puppy = document.getElementById("home-puppy-section")?.getBoundingClientRect();
      setPuppyNear(!!puppy && puppy.top < window.innerHeight * 0.8 && puppy.bottom > 0);
    };
    const request = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPanel(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const trackNav = (action: string) => void trackCookielessInteraction("nav_click", "home_aria_" + action, "sk");
  function jump(tab: Tab, id: string) {
    trackNav(tab);
    setActive(tab);
    setPanel(null);
    const target = document.getElementById(id);
    if (!target) return;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - 18);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }
  function toggle(next: Exclude<Panel, null>) {
    trackNav(next);
    const opening = panel !== next;
    if (opening && next === "pricing") trackMarketingInteraction("view_pricing", "home_aria_pricing");
    setActive(next);
    setPanel(opening ? next : null);
  }
  function openApplication() {
    trackNav("application");
    setPanel(null);
    setApplicationSent(false);
    setApplicationOpen(true);
  }

  const tabClass = (selected: boolean, apply = false) =>
    "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[11px] px-0.5 text-center font-display text-[9px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral " +
    (apply ? "bg-coral text-white" : selected ? "bg-forest/15 text-forest" : "text-forest hover:bg-secondary/70");

  return (
    <>
      <aside aria-label="Aria – mobilná navigácia Chvostíkova" data-home-aria-guide
        className="pointer-events-none fixed inset-x-0 bottom-[max(6px,env(safe-area-inset-bottom))] z-40 px-2 lg:hidden">
        <div className="relative mx-auto w-full max-w-[690px]">
          {panel && (
            <div role="dialog" aria-modal="false" aria-label={panel === "pricing" ? "Cenník škôlky" : "Naše produkty"}
              data-home-aria-panel={panel}
              className="pointer-events-auto absolute bottom-[calc(100%+10px)] left-0 right-0 max-h-[min(58dvh,480px)] overflow-y-auto overscroll-contain rounded-[24px] border border-white/80 bg-card/95 p-4 text-forest shadow-[0_12px_40px_rgba(18,68,43,.2)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold">{panel === "pricing" ? "Cenník škôlky" : "Naše produkty"}</h2>
                <button type="button" aria-label="Zavrieť okno" onClick={() => setPanel(null)}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary focus-visible:outline-2 focus-visible:outline-coral">
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              {panel === "pricing" ? (
                <div className="mt-3 space-y-2" data-home-aria-pricing>
                  {PRICING.map((item) => (
                    <article key={item.name} className={"rounded-2xl border p-3 " + (item.highlight ? "border-coral bg-forest text-white" : "border-forest/10 bg-white text-forest")}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          {item.highlight && <span className="mb-1 inline-block rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold">Najvýhodnejšie</span>}
                          <h3 className="font-display text-sm font-bold">{item.name}</h3>
                          <p className="mt-1 text-xs opacity-75">{item.highlight ? "10 vstupov · platnosť 2 mesiace" : "Jednorazový vstup"}</p>
                        </div>
                        <strong className="shrink-0 font-display text-2xl">{item.price}</strong>
                      </div>
                    </article>
                  ))}
                  <p className="rounded-2xl bg-secondary p-3 text-center text-xs font-semibold">Úvodná návšteva zadarmo · odvoz / vyzdvihnutie 5 € / jazda</p>
                  <button type="button" onClick={openApplication} className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-coral px-4 text-sm font-bold text-white">
                    Prihláška do škôlky <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2" data-home-aria-products>
                  <a href="/stojan-na-misky-pre-psa"
                    onClick={() => trackNav("product_stand")}
                    className="flex min-h-11 items-center justify-between gap-2 rounded-2xl border border-forest/10 bg-white p-3 text-sm font-semibold text-forest">
                    Drevený stojan na misky <ArrowRight className="size-4 shrink-0" aria-hidden />
                  </a>
                  <a href="/target-na-cvicenie-pre-psov"
                    onClick={() => trackNav("product_target")}
                    className="flex min-h-11 items-center justify-between gap-2 rounded-2xl border border-forest/10 bg-white p-3 text-sm font-semibold text-forest">
                    Drevený target na cvičenie <ArrowRight className="size-4 shrink-0" aria-hidden />
                  </a>
                  <a href="/produkty" onClick={() => trackNav("products_all")}
                    className="flex min-h-11 items-center justify-center rounded-full bg-secondary px-4 text-sm font-bold text-forest">Všetky produkty</a>
                </div>
              )}
            </div>
          )}
          {!panel && !applicationOpen && (
            <div data-home-aria-message className="pointer-events-none mb-2 flex w-full justify-start pl-[75px]">
              <div className="w-full max-w-[460px] rounded-2xl border border-forest/20 bg-card/95 px-3 py-2 shadow-card">
                {puppyNear ? (
                  <p className="font-display text-xs font-semibold leading-snug text-forest">Máte šteniatko? <strong className="text-coral-dark">Overte, či už spĺňa podmienky škôlky.</strong></p>
                ) : (
                  <p className="font-display text-xs font-semibold leading-snug text-forest">Ahoj, som <strong className="text-coral-dark">Aria.</strong> Čo vás zaujíma? <span className="block font-normal">Vyberte si z našej ponuky.</span></p>
                )}
              </div>
            </div>
          )}
          <div data-home-aria-dock className="pointer-events-auto relative ml-[83px] rounded-[16px] border border-forest/20 bg-card/95 px-1 py-0.5 shadow-[0_4px_18px_rgba(18,68,43,.13)]">
            <img src={ARIA_HEAD_DATA_URI} alt="Aria, psia pomocníčka" width={128} height={128}
              className="pointer-events-none absolute -bottom-1 -left-[86px] h-[84px] w-[84px] max-w-none object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,.25)]" />
            <nav className="flex h-[52px] items-center gap-0.5" aria-label="Spodná navigácia">
              <button type="button" aria-current={active === "why" ? "location" : undefined} onClick={() => jump("why", "preco-chvostikovo")} className={tabClass(active === "why")}>
                <Heart className="size-5" aria-hidden /><span>Prečo my?</span>
              </button>
              <button type="button" aria-current={active === "pricing" ? "location" : undefined} aria-expanded={panel === "pricing"} onClick={() => toggle("pricing")} className={tabClass(active === "pricing")}>
                <Euro className="size-5" aria-hidden /><span>Cenník</span>
              </button>
              <button type="button" aria-current={active === "products" ? "location" : undefined} aria-expanded={panel === "products"} onClick={() => toggle("products")} className={tabClass(active === "products")}>
                <Package className="size-5" aria-hidden /><span>Produkty</span>
              </button>
              <button type="button" aria-current={active === "about" ? "location" : undefined} onClick={() => jump("about", "o-nas")} className={tabClass(active === "about")}>
                <Users className="size-5" aria-hidden /><span>O nás</span>
              </button>
              <button type="button" onClick={openApplication} className={tabClass(false, true)}>
                <FilePenLine className="size-5" aria-hidden /><span>Prihláška</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>
      <FormDialog open={applicationOpen} hideHeader={applicationSent}
        onOpenChange={(open) => { setApplicationOpen(open); if (!open) setApplicationSent(false); }}
        title={applicationSent ? "Prihláška odoslaná" : "Prihlás svojho psíka ešte dnes"}
        subtitle="Vyplňte prihlášku do škôlky a ozveme sa vám s ďalším postupom.">
        <LongForm onSent={() => setApplicationSent(true)} />
      </FormDialog>
    </>
  );
}
