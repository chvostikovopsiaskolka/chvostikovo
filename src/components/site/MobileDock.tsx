import { useEffect, useRef, useState, type MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FilePenLine, Heart, House, Image as ImageIcon, Menu, Phone, Tag, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { PHONE } from "@/content/site";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type DockLanguage = "sk" | "en";
type DockVariant = "main" | "lead" | "puppy" | "dog-sitting" | "en";

type MobileDockProps = {
  language?: DockLanguage;
  variant?: DockVariant;
  onApplicationOpen?: () => void;
  onInterestOpen?: () => void;
};

export function MobileDock({ language = "sk", variant = "main", onApplicationOpen, onInterestOpen }: MobileDockProps) {
  const english = language === "en";
  const marketing = variant !== "main";
  const homePath = variant === "lead" ? "/psia-skolka-kosice"
    : variant === "puppy" ? "/psia-skolka-pre-steniatka"
    : variant === "dog-sitting" ? "/strazenie-psov-kosice"
    : english ? "/en/dog-daycare-kosice" : "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigatingRef = useRef(false);

  const sections = variant === "lead"
    ? [{ id: "top", label: "Domov", icon: House },
       { id: "lead-benefits", label: "Prečo my?", icon: Heart },
       { id: "interest", label: "Mám záujem o škôlku", icon: FilePenLine },
       { id: "lead-pricing", label: "Cenník", icon: Tag }]
    : variant === "puppy"
    ? [{ id: "top", label: "Domov", icon: House },
       { id: "puppy-benefits", label: "Prečo my?", icon: Heart },
       { id: "interest", label: "Mám záujem o škôlku", icon: FilePenLine },
       { id: "puppy-pricing", label: "Cenník", icon: Tag }]
    : variant === "dog-sitting"
    ? [{ id: "top", label: "Domov", icon: House },
       { id: "dog-sitting-why", label: "Prečo my?", icon: Heart },
       { id: "interest", label: "Mám záujem o škôlku", icon: FilePenLine },
       { id: "dog-sitting-pricing", label: "Cenník", icon: Tag }]
    : english
    ? [{ id: "top", label: "Home", icon: House },
       { id: "why-daycare", label: "Why us?", icon: Heart },
       { id: "interest", label: "Interested in daycare", icon: FilePenLine },
       { id: "pricing", label: "Prices", icon: Tag }]
    : [{ id: "top", label: "Domov", icon: House },
       { id: "priestory", label: "Priestory", icon: ImageIcon },
       { id: "starostlivost", label: "Starostlivosť", icon: Heart },
       { id: "cennik", label: "Cenník", icon: Tag }];

  // Only the active icon/label changes; the dock dimensions never change.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.location.pathname !== homePath) {
        setActiveSection("");
        return;
      }
      let active = "top";
      let lastTop = -Infinity;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        const top = el?.getBoundingClientRect().top;
        if (top !== undefined && top <= window.innerHeight * 0.34 && top >= lastTop) {
          active = section.id;
          lastTop = top;
        }
      }
      setActiveSection(active);
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
  }, [homePath, variant]);

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string, fromMenu = false) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const destination = new URL(href, window.location.href);
    const targetId = (destination.hash.slice(1) || "top").replace(/[^a-z0-9_-]/gi, "").slice(0, 70);
    const source = `mobile_${fromMenu ? "menu" : "dock"}_${variant}_${targetId}`;
    void trackCookielessInteraction("nav_click", source, language);
    // Keep Pixel/GA4 interests separate from cookieless navigation and from successful leads.
    // The old header pricing link was measured, but the new dock lives outside <header>.
    if (!fromMenu && (targetId === "cennik" || targetId.endsWith("-pricing") || targetId === "pricing")) {
      trackMarketingInteraction("view_pricing", source);
    } else if (!fromMenu && targetId === "starostlivost") {
      trackMarketingInteraction("view_care", source);
    }
    if (fromMenu) {
      navigatingRef.current = true;
      setMenuOpen(false);
    }
    const execute = () => {
      const destination = new URL(href, window.location.href);
      if (destination.pathname !== window.location.pathname || destination.search !== window.location.search) {
        window.location.assign(destination.pathname + destination.search + destination.hash);
        return;
      }
      const target = document.getElementById(destination.hash.slice(1) || "top");
      window.history.pushState(null, "", destination.pathname + destination.search + destination.hash);
      if (target) {
        const top = destination.hash ? window.scrollY + target.getBoundingClientRect().top - 8 : 0;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      navigatingRef.current = false;
    };
    // Restore Radix's background scroll lock before navigating.
    if (fromMenu) window.requestAnimationFrame(() => window.requestAnimationFrame(execute));
    else execute();
  };

  const openApplication = () => {
    if (menuOpen) setMenuOpen(false);
    if (marketing) onInterestOpen?.();
    else onApplicationOpen?.();
  };

  // Marketing landings keep their conversion actions and section links locally.
  const marketingExtra = variant === "lead"
    ? [{ label: "Prvá návšteva", href: homePath + "#lead-first-visit" }]
    : variant === "puppy"
    ? [{ label: "Prvá návšteva", href: homePath + "#puppy-first-visit" }]
    : variant === "dog-sitting"
    ? [{ label: "Prvá návšteva", href: homePath + "#dog-sitting-first-visit" }]
    : [{ label: "First visit", href: homePath + "#en-first-visit" }];

  const menuEntries = english
    ? [
        ...(marketing ? marketingExtra : [{ label: "Reviews", href: homePath + "#reviews" }]),
        { label: "About us", href: homePath + "#about" },
        ...(!marketing ? [{ label: "Why Chvostíkovo", href: homePath + "#why-daycare" }] : []),
        { label: "Requirements", href: homePath + "#requirements" },
        { label: "FAQ", href: homePath + "#faq" },
        { label: "Products", href: "/produkty" },
        { label: "Contact", href: homePath + "#contact" },
        { label: "Puppy daycare", href: "/psia-skolka-pre-steniatka" },
      ]
    : [
        ...(marketing ? marketingExtra : [{ label: "Recenzie", href: "/#recenzie" }]),
        { label: "O nás", href: "/#o-nas" },
        ...(!marketing ? [{ label: "Prečo Chvostíkovo", href: "/#preco" }] : []),
        { label: "Podmienky", href: "/#podmienky" },
        { label: "Časté otázky", href: "/caste-otazky" },
        { label: "Produkty", href: "/produkty" },
        { label: "Kontakt", href: "/#kontakt" },
        { label: "Škôlka pre šteniatka", href: "/psia-skolka-pre-steniatka" },
      ];


  return (
    <>
      <nav className="mobile-dock" data-variant={variant} data-hydrated={hydrated ? "true" : "false"} aria-label={english ? "Mobile navigation" : "Mobilná navigácia"}>
        <div className="mobile-dock-bar">
          {sections.map(({ id, icon: Icon, label }) => id === "interest" ? (
            <button key={id} type="button" className="mobile-dock-item mobile-dock-apply" onClick={openApplication}>
              <Icon aria-hidden="true" size={19} strokeWidth={2} />
              <span>{label}</span>
            </button>
          ) : (
            <a
              href={homePath + (id === "top" ? "" : "#" + id)}
              key={id}
              aria-current={activeSection === id ? "location" : undefined}
              className={"mobile-dock-item" + (activeSection === id ? " is-active" : "")}
              onClick={(event) => go(event, homePath + (id === "top" ? "" : "#" + id))}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
              <span>{label}</span>
            </a>
          ))}
          {!marketing && (
            <button type="button" className="mobile-dock-item mobile-dock-apply" onClick={openApplication}>
              <FilePenLine aria-hidden="true" size={19} strokeWidth={2} />
              <span>Prihláška</span>
            </button>
          )}
          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger asChild>
              <button ref={menuButtonRef} type="button" aria-label={english ? "Open menu" : "Otvoriť menu"} className="mobile-dock-item" aria-expanded={menuOpen}
                  onClick={() => {
                    if (!menuOpen) void trackCookielessInteraction("nav_click", `mobile_dock_${variant}_menu_open`, language);
                  }}>
                <Menu aria-hidden="true" size={19} strokeWidth={2} />
                <span>{english ? "Menu" : "Menu"}</span>
              </button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="mobile-dock-overlay" />
              <DialogPrimitive.Content
                className="mobile-dock-menu"
                onCloseAutoFocus={(event) => {
                  if (navigatingRef.current) event.preventDefault();
                }}
              >
                <div className="mobile-dock-menu-heading">
                  <DialogPrimitive.Title className="mobile-dock-menu-title font-display text-xl font-bold text-forest">
                    {english ? "Menu" : "Menu"}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Close type="button" aria-label={english ? "Close menu" : "Zavrieť menu"} className="mobile-dock-menu-close">
                    <X aria-hidden="true" size={22} />
                  </DialogPrimitive.Close>
                </div>
                <DialogPrimitive.Description className="sr-only">
                  {english ? "Other pages and contact options" : "Ďalšie stránky a kontaktné možnosti"}
                </DialogPrimitive.Description>
                <div className="mobile-dock-menu-links">
                  {menuEntries.map((entry) => (
                    <a key={entry.href} href={entry.href} onClick={(event) => go(event, entry.href, true)}>{entry.label}</a>
                  ))}
                </div>
                <div className="mobile-dock-menu-actions">
                  <a href={"tel:" + PHONE}
                    data-tracking-source={english ? "en_mobile_dock_menu" : "mobile_dock_menu"}
                    onClick={() => {
                      void trackCookielessInteraction("phone_click", english ? "en_mobile_dock_menu" : "mobile_dock_menu", language);
                    }}>
                    <Phone aria-hidden="true" size={17} />
                    {english ? "Call us" : "Zavolajte nám"}
                  </a>
                  <a href={english ? "/" : "/en/dog-daycare-kosice"} lang={english ? "sk" : "en"}>
                    {english ? "Slovak version" : "English version"}
                  </a>
                </div>
                <a href="/" aria-label="Chvostíkovo" className="mobile-dock-menu-logo">
                  <img src={logo} alt="Chvostíkovo" />
                </a>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </nav>
    </>
  );
}
