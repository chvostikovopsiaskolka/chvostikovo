import { useEffect, useRef, useState, type MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FilePenLine, Heart, House, Image as ImageIcon, Menu, Phone, Tag, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { PHONE } from "@/content/site";
import { trackMarketingInteraction } from "@/lib/analytics";

type DockLanguage = "sk" | "en";

type MobileDockProps = {
  language?: DockLanguage;
  onApplicationOpen: () => void;
};

export function MobileDock({ language = "sk", onApplicationOpen }: MobileDockProps) {
  const english = language === "en";
  const homePath = english ? "/en/dog-daycare-kosice" : "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigatingRef = useRef(false);

  const sections = english
    ? [{ id: "top", label: "Home", icon: House },
       { id: "spaces", label: "Spaces", icon: ImageIcon },
       { id: "care", label: "Care", icon: Heart },
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
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.34) active = section.id;
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
  }, [homePath]);

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string, fromMenu = false) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
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
    onApplicationOpen();
  };

  const menuEntries = english
    ? [
        { label: "Reviews", href: homePath + "#reviews" },
        { label: "About us", href: homePath + "#about" },
        { label: "Why Chvostíkovo", href: homePath + "#why-daycare" },
        { label: "Requirements", href: homePath + "#requirements" },
        { label: "FAQ", href: homePath + "#faq" },
        { label: "Products", href: "/produkty" },
        { label: "Contact", href: homePath + "#contact" },
        { label: "Puppy daycare", href: "/psia-skolka-pre-steniatka" },
        { label: "Dog sitting", href: "/strazenie-psov-kosice" },
      ]
    : [
        { label: "Recenzie", href: "/#recenzie" },
        { label: "O nás", href: "/#o-nas" },
        { label: "Prečo Chvostíkovo", href: "/#preco" },
        { label: "Podmienky", href: "/#podmienky" },
        { label: "Časté otázky", href: "/caste-otazky" },
        { label: "Produkty", href: "/produkty" },
        { label: "Kontakt", href: "/#kontakt" },
        { label: "Škôlka pre šteniatka", href: "/psia-skolka-pre-steniatka" },
        { label: "Stráženie psov", href: "/strazenie-psov-kosice" },
      ];

  return (
    <>
      <nav className="mobile-dock" data-hydrated={hydrated ? "true" : "false"} aria-label={english ? "Mobile navigation" : "Mobilná navigácia"}>
        <div className="mobile-dock-bar">
          {sections.map(({ id, icon: Icon, label }) => (
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
          <button type="button" className="mobile-dock-item mobile-dock-apply" onClick={openApplication}>
            <FilePenLine aria-hidden="true" size={19} strokeWidth={2} />
            <span>{english ? "Enquire" : "Prihláška"}</span>
          </button>
          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger asChild>
              <button ref={menuButtonRef} type="button" aria-label={english ? "Open menu" : "Otvoriť menu"} className="mobile-dock-item" aria-expanded={menuOpen}>
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
                  <DialogPrimitive.Title className="font-display text-xl font-bold text-forest">
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
                  <a href={"tel:" + PHONE} onClick={() => trackMarketingInteraction("phone_click", english ? "en_mobile_dock_menu" : "mobile_dock_menu")}>
                    <Phone aria-hidden="true" size={17} />
                    {english ? "Call us" : "Zavolajte nám"}
                  </a>
                  <a href={english ? "/" : "/en/dog-daycare-kosice"} lang={english ? "sk" : "en"}>
                    {english ? "SK" : "EN"}
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
