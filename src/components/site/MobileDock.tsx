import { LanguageSwitch } from "./LanguageSwitch";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Dog, Facebook, FilePenLine, Heart, House, Instagram, Menu, MessageCircle, Package, Phone, Tag, Users, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { PHONE, INSTAGRAM, FACEBOOK } from "@/content/site";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type DockLanguage = "sk" | "en";
type DockVariant = "main" | "lead" | "puppy" | "dog-sitting" | "en";

type MobileDockProps = {
  language?: DockLanguage;
  variant?: DockVariant;
  desktopHome?: boolean;
  onApplicationOpen?: () => void;
  onInterestOpen?: () => void;
};

export function MobileDock({ language = "sk", variant = "main", desktopHome = false, onApplicationOpen, onInterestOpen }: MobileDockProps) {
  const english = language === "en";
  const homeDock = variant === "main" || variant === "en";
  const marketing = !homeDock;
  const homePath = variant === "lead" ? "/psia-skolka-kosice"
    : variant === "puppy" ? "/psia-skolka-pre-steniatka"
    : variant === "dog-sitting" ? "/strazenie-psov-kosice"
    : english ? "/en/dog-daycare-kosice" : "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const desktopDockRef = useRef<HTMLElement>(null);
  const [desktopFloating, setDesktopFloating] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  // The desktop slot follows Hero reviews in normal flow. Keep its reserved
  // height when the bar floats so the next section never jumps.
  useEffect(() => {
    if (!desktopHome || !homeDock) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const slot = desktopDockRef.current;
      if (!slot || window.innerWidth < 1024) { setDesktopFloating(false); return; }
      const rect = slot.getBoundingClientRect();
      setDesktopFloating(window.scrollY > 24 && rect.bottom <= window.innerHeight - 8);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : undefined;
    if (desktopDockRef.current) observer?.observe(desktopDockRef.current);
    observer?.observe(document.documentElement);
    update();
    window.addEventListener("scroll", schedule, {passive:true});
    window.addEventListener("resize", schedule);
    return () => { observer?.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); if(frame) cancelAnimationFrame(frame); };
  }, [desktopHome, homeDock]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigatingRef = useRef(false);

  // Keep the prominent enquiry as the middle slot on landing pages.
  // Other links follow the actual section order on each route.
  const sections = variant === "lead"
    ? [{ id: "lead-benefits", label: "Prečo my?", icon: Heart },
       { id: "lead-pricing", label: "Cenník", icon: Tag },
       { id: "interest", label: "Mám záujem o škôlku", icon: FilePenLine },
       { id: "lead-first-visit", label: "Prvá návšteva", icon: House }]
    : variant === "puppy"
    ? [{ id: "puppy-benefits", label: "Prečo my?", icon: Heart },
       { id: "puppy-pricing", label: "Cenník", icon: Tag },
       { id: "interest", label: "Mám záujem o škôlku", icon: FilePenLine },
       { id: "puppy-first-visit", label: "Prvá návšteva", icon: House }]
    : variant === "dog-sitting"
    ? [{ id: "dog-sitting-why", label: "Prečo my?", icon: Heart },
       { id: "dog-sitting-first-visit", label: "Prvá návšteva", icon: House },
       { id: "interest", label: "Mám záujem o škôlku", icon: FilePenLine },
       { id: "dog-sitting-pricing", label: "Cenník", icon: Tag }]
    : english
    ? [{ id: "top", label: "Home", icon: House },
       { id: "about", label: "About", icon: Users },
       { id: "pricing", label: "Prices", icon: Tag },
       { id: "requirements", label: "Rules", icon: Heart }]
    : [{ id: "top", label: "Domov", icon: House },
       { id: "o-nas", label: "O nás", icon: Users },
       { id: "cennik", label: "Cenník", icon: Tag },
       { id: "podmienky", label: "Podmienky", icon: Heart },
       { id: "produkty", label: "Produkty", icon: Package }];

  // Return arrow: hide while moving down; show on upward scroll or after stopping.
  // Reuse the existing section listener without adding a second scroll subscription.
  useEffect(() => {
    let frame = 0;
    let idleTimer = 0;
    let anchorY = Math.max(0, window.scrollY);
    const updateActiveSection = () => {
      if (window.location.pathname.replace(/\/$/, "") !== homePath.replace(/\/$/, "")) {
        setActiveSection("");
        return;
      }
      let active = homeDock ? "" : "top";
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
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY); // iOS overscroll cannot trigger the arrow
      const delta = y - anchorY;
      const eligible = !homeDock && window.location.pathname.replace(/\/$/, "") === homePath.replace(/\/$/, "") &&
        y > Math.max(420, window.innerHeight * 0.75) &&
        !document.querySelector('[data-form-dialog], [role="dialog"][data-state="open"]');
      if (Math.abs(delta) >= 6) {
        anchorY = y;
        window.clearTimeout(idleTimer);
        if (!eligible) {
          setShowBackToTop(false);
        } else if (delta > 0) {
          // Hide during downward motion, then reveal after the user stops.
          setShowBackToTop(false);
          idleTimer = window.setTimeout(() => {
            const stillEligible = window.scrollY > Math.max(420, window.innerHeight * 0.75) &&
              !document.querySelector('[data-form-dialog], [role="dialog"][data-state="open"]');
            setShowBackToTop(stillEligible);
          }, 350);
        } else {
          // Immediately available on upward scrolling, then stays visible at rest.
          setShowBackToTop(true);
        }
      } else if (!eligible) {
        window.clearTimeout(idleTimer);
        setShowBackToTop(false);
      }
      updateActiveSection();
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const onResize = () => {
      anchorY = Math.max(0, window.scrollY);
      setShowBackToTop(false);
      onScroll();
    };
    updateActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
    };
  }, [homePath, variant, homeDock]);

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string, fromMenu = false) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const destination = new URL(href, window.location.href);
    const samePage = destination.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "");
    if (homeDock && samePage && !destination.search) destination.search = window.location.search;
    const targetId = (destination.hash.slice(1) || (destination.pathname.replace(/\/$/, "") === homePath.replace(/\/$/, "") ? "top" : destination.pathname.split("/").filter(Boolean).join("_")))
      .replace(/[^a-z0-9_-]/gi, "").slice(0, 70);
    const desktop = desktopHome && window.innerWidth >= 1024;
    const source = desktop ? `desktop_nav_${variant}_${targetId}` : `mobile_${fromMenu ? "menu" : "dock"}_${variant}_${targetId}`;
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
      if (destination.pathname.replace(/\/$/, "") !== window.location.pathname.replace(/\/$/, "") || destination.search !== window.location.search) {
        window.location.assign(destination.pathname + destination.search + destination.hash);
        return;
      }
      const target = document.getElementById(destination.hash.slice(1) || "top");
      if (homeDock && !destination.hash) window.history.replaceState(window.history.state, "", destination.pathname + destination.search);
      else window.history.pushState(window.history.state, "", destination.pathname + destination.search + destination.hash);
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      if (target) {
        const top = destination.hash ? window.scrollY + target.getBoundingClientRect().top - 8 : 0;
        window.scrollTo({ top: Math.max(0, top), behavior });
      } else {
        window.scrollTo({ top: 0, behavior });
      }
      navigatingRef.current = false;
    };
    // Restore Radix's background scroll lock before navigating.
    if (fromMenu) window.requestAnimationFrame(() => window.requestAnimationFrame(execute));
    else execute();
  };

  const backToTop = () => {
    // A navigation click, not a Lead or form submission. Historical Domov events remain separate.
    void trackCookielessInteraction("nav_click", `mobile_dock_${variant}_back_to_top`, language);
    setShowBackToTop(false);
    // Clear an existing section hash so refresh does not return to the old anchor.
    if (window.location.hash) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const openApplication = () => {
    if (menuOpen) setMenuOpen(false);
    if (english && onApplicationOpen) {
      void trackCookielessInteraction("nav_click", desktopHome && window.innerWidth >= 1024 ? "desktop_nav_en_application" : "mobile_dock_en_application", language);
      onApplicationOpen();
    } else if (marketing) {
      // SK landing pages already track enquiries in their route callback.
      if (english) void trackCookielessInteraction("inquiry_cta", "en_mobile_dock", "en");
      onInterestOpen?.();
    } else {
      void trackCookielessInteraction("nav_click", desktopHome && window.innerWidth >= 1024 ? "desktop_nav_main_application" : "mobile_dock_main_application", language);
      onApplicationOpen?.();
    }
  };

  // Marketing landings keep their conversion actions and section links locally.
  const marketingExtra = variant === "lead"
    ? [{ label: "Prvá návšteva", href: homePath + "#lead-first-visit" }]
    : variant === "puppy"
    ? [{ label: "Prvá návšteva", href: homePath + "#puppy-first-visit" }]
    : variant === "dog-sitting"
    ? [{ label: "Prvá návšteva", href: homePath + "#dog-sitting-first-visit" }]
    : [{ label: "First visit", href: homePath + "#en-first-visit" }];

  // Keep the main menu short; no duplicated dock links or footer actions.
  const homeMenuEntries = [
    {label:english ? "Have a puppy?" : "Máte šteniatko?", icon:Dog, href:homePath+"#aria-puppy-check"},
    ...(desktopHome ? [{label:english ? "Why choose us?" : "Prečo si vybrať nás?", icon:Heart, href:homePath+(english ? "#en-benefits" : "#preco-chvostikovo"), desktopOnly:true}] : []),
    ...(desktopHome ? [{label:english ? "Facilities" : "Priestory škôlky", icon:House, href:homePath+(english ? "#spaces" : "#priestory"), desktopOnly:true}] : []),
    {label:english ? "FAQ" : "Časté otázky", icon:MessageCircle, href:homePath+"#faq"},
  ];
  const menuEntries = [
    ...marketingExtra,
    { label: "Podmienky", href: variant === "lead" ? homePath + "#lead-requirements" : "/#podmienky" },
    { label: "O nás", href: "/#o-nas" },
    { label: "Produkty", href: "/produkty" },
    { label: "Časté otázky", href: "/#faq" },
    { label: "Kontakt", href: "/#kontakt" },
    { label: "Škôlka pre šteniatka", href: "/psia-skolka-pre-steniatka" },
  ];


  return (
    <>
      <nav ref={desktopDockRef} className="mobile-dock" data-variant={variant} data-home-dock={homeDock || undefined} data-desktop-home-dock={desktopHome && homeDock || undefined} data-desktop-floating={desktopFloating ? "true" : "false"} data-hydrated={hydrated ? "true" : "false"} aria-label={english ? "Main navigation" : "Hlavná navigácia"}>
        {!homeDock && <button
            type="button"
            className="mobile-dock-back-top"
            data-visible={hydrated && showBackToTop && !menuOpen ? "true" : "false"}
            disabled={!hydrated || !showBackToTop || menuOpen}
            aria-label={english ? "Back to top" : "Späť hore"}
            title={english ? "Back to top" : "Späť hore"}
            onClick={backToTop}
          >
            <ArrowUp aria-hidden="true" size={21} strokeWidth={2.1} />
          </button>}
        <div className="mobile-dock-bar">
          {desktopHome && homeDock && <img data-desktop-dock-logo src={logo} alt="Chvostíkovo" className="hidden lg:block" />}
          {homeDock && <div className="mobile-dock-compact-menu" data-home-menu>
            <div className="mobile-dock-compact-links">
              {homeMenuEntries.map(({href,label,icon:Icon,...entry}) => <a key={href} href={href} data-desktop-only-shortcut={"desktopOnly" in entry ? true : undefined} onClick={event => go(event, href)}><Icon size={17} strokeWidth={1.9} aria-hidden="true" /><span>{label}</span></a>)}
            </div>
            <a data-home-dock-phone className="mobile-dock-compact-phone" href={"tel:" + PHONE} aria-label={english ? "Call Chvostíkovo" : "Zavolať do Chvostíkova"} data-tracking-source={english ? "en_mobile_dock_phone" : "home_mobile_dock_phone"} onClick={() => void trackCookielessInteraction("phone_click", english ? "en_mobile_dock_phone" : "home_mobile_dock_phone", language)}><Phone size={19} strokeWidth={1.9} aria-hidden="true" /></a>
            <LanguageSwitch language={language} source={"mobile_dock_" + variant + "_language"} />
          </div>}
          {sections.map(({ id, icon: Icon, label }) => id === "interest" ? (
            <button key={id} type="button" className="mobile-dock-item mobile-dock-apply" onClick={openApplication}>
              <Icon aria-hidden="true" size={19} strokeWidth={2} />
              <span>{label}</span>
            </button>
          ) : (
            <a
              href={id === "produkty" && !marketing ? "/produkty" : homePath + (id === "top" ? "" : "#" + id)}
              key={id}
              aria-current={activeSection === id ? "location" : undefined}
              aria-label={id === "starostlivost" ? label : undefined}
              className={"mobile-dock-item" + (activeSection === id ? " is-active" : "")}
              onClick={(event) => go(event, id === "produkty" && !marketing ? "/produkty" : homePath + (id === "top" ? "" : "#" + id))}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
              <span>
                {id === "starostlivost" ? (
                  <>
                    <span className="mobile-dock-label-long">{label}</span>
                    <span className="mobile-dock-label-short" aria-hidden="true">Starostl.</span>
                  </>
                ) : label}
              </span>
            </a>
          ))}
          {!marketing && (
            <button type="button" className="mobile-dock-item mobile-dock-apply" onClick={openApplication}>
              <FilePenLine aria-hidden="true" size={19} strokeWidth={2} />
              <span>{english ? "Apply" : "Prihláška"}</span>
            </button>
          )}
          {!homeDock && <DialogPrimitive.Root open={menuOpen} onOpenChange={(open) => { if (open) navigatingRef.current = false; setMenuOpen(open); }}>
            <DialogPrimitive.Trigger asChild>
              <button ref={menuButtonRef} type="button" aria-label={english ? "Open menu" : "Otvoriť menu"} className={"mobile-dock-item" + (menuOpen ? " is-active" : "")} aria-expanded={menuOpen}
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
                <div className="mobile-dock-menu-actions" aria-label={english ? "Contact and social links" : "Kontakt a sociálne siete"}>
                  <a
                    href={"tel:" + PHONE}
                    aria-label={english ? "Call Chvostíkovo" : "Zavolať Chvostíkovu"}
                    title={english ? "Call us" : "Zavolajte nám"}
                    data-tracking-source={english ? "en_mobile_dock_menu" : "mobile_dock_menu"}
                    onClick={() => {
                      void trackCookielessInteraction("phone_click", english ? "en_mobile_dock_menu" : "mobile_dock_menu", language);
                      void trackCookielessInteraction("nav_click", "mobile_menu_" + variant + "_phone", language);
                    }}
                  >
                    <Phone aria-hidden="true" size={20} />
                  </a>
                  <LanguageSwitch language={language} source={"mobile_menu_" + variant + "_language"} onNavigate={() => { navigatingRef.current = true; setMenuOpen(false); }} />
                  <a
                    href={INSTAGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={english ? "Chvostíkovo on Instagram (new tab)" : "Chvostíkovo na Instagrame (nová karta)"}
                    title="Instagram"
                    onClick={() => {
                      void trackCookielessInteraction("nav_click", "mobile_menu_" + variant + "_instagram", language);
                    }}
                  >
                    <Instagram aria-hidden="true" size={20} />
                  </a>
                  <a
                    href={FACEBOOK}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={english ? "Chvostíkovo on Facebook (new tab)" : "Chvostíkovo na Facebooku (nová karta)"}
                    title="Facebook"
                    onClick={() => {
                      void trackCookielessInteraction("nav_click", "mobile_menu_" + variant + "_facebook", language);
                    }}
                  >
                    <Facebook aria-hidden="true" size={20} />
                  </a>
                </div>
                <a href={homePath} aria-label="Chvostíkovo" className="mobile-dock-menu-logo" onClick={() => { void trackCookielessInteraction("nav_click", "mobile_menu_" + variant + "_top", language); }}>
                  <img src={logo} alt="Chvostíkovo" />
                </a>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>}
        </div>
      </nav>
    </>
  );
}
