import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Menu, Package, Phone, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { PHONE } from "@/content/site";
import { FormDialog } from "./FormDialog";
import { LongForm } from "./Forms";

const NAV_MOBILE_BEFORE_ABOUT = [
  { href: "#priestory", label: "Priestory" },
  { href: "#recenzie", label: "Recenzie" },
  { href: "#starostlivost", label: "Ako sa postaráme" },
  { href: "#preco", label: "Prečo škôlka" },
];

const NAV_MOBILE_AFTER_INFO = [
  { href: "#podmienky", label: "Podmienky" },
  { href: "#cennik", label: "Cenník" },
  { href: "#faq", label: "Časté otázky" },
  { href: "#kontakt", label: "Kontakt" },
];

const NAV_DESKTOP_BEFORE_ABOUT = [
  { href: "#starostlivost", label: "Ako sa postaráme" },
  { href: "#preco", label: "Prečo škôlka" },
];

const NAV_DESKTOP_AFTER_ABOUT = [
  { href: "#podmienky", label: "Podmienky" },
  { href: "#cennik", label: "Cenník" },
  { href: "#faq", label: "Časté otázky" },
];

export function Header({ homeSectionLinks = false }: { homeSectionLinks?: boolean }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const sectionHref = (href: string) => (homeSectionLinks ? `/${href}` : href);
  const logoHref = homeSectionLinks ? "/" : "#top";

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMobileMenu = () => {
    setMenuOpen(false);
    setAboutOpen(false);
    setProductsOpen(false);
    setInfoOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-soft backdrop-blur-md sm:px-6">
        <a href={logoHref} className="shrink-0">
          <img src={logo} alt="Chvostíkovo – psia škôlka Košice" className="h-5 w-auto sm:h-6" />
        </a>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex">
          {NAV_DESKTOP_BEFORE_ABOUT.map((item) => (
            <a key={item.href} href={sectionHref(item.href)} className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">
              {item.label}
            </a>
          ))}

          <div className="group relative">
            <a href={sectionHref("#o-nas")} className="flex items-center gap-1 font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">
              O nás <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
            </a>
            <div className="invisible absolute top-full left-1/2 z-50 w-40 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-2xl bg-card p-1.5 shadow-soft ring-1 ring-forest/5">
                <a href={sectionHref("#o-nas")} className="block rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral">O nás</a>
                <div className="group/products relative">
                  <a href="/produkty" className="flex items-center justify-between gap-1 rounded-xl px-3 py-2 font-display text-xs font-semibold whitespace-nowrap text-forest transition-colors hover:bg-secondary hover:text-coral">
                    <span>Naše produkty</span>
                    <ChevronRight className="size-3.5 shrink-0" />
                  </a>
                  <div className="invisible absolute top-0 left-full z-50 w-48 pl-2 opacity-0 transition group-hover/products:visible group-hover/products:opacity-100 group-focus-within/products:visible group-focus-within/products:opacity-100">
                    <div className="rounded-2xl bg-card p-1.5 shadow-soft ring-1 ring-forest/5">
                      <a href="/stojan-na-misky-pre-psa" className="block rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral">Stojany na misky</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {NAV_DESKTOP_AFTER_ABOUT.map((item) => (
            <a key={item.href} href={sectionHref(item.href)} className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral">{item.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <a href="/en/dog-daycare-kosice" lang="en" aria-label="English information" className="inline-flex rounded-full bg-secondary px-2.5 py-2 font-display text-[0.68rem] font-semibold text-forest transition-colors hover:bg-coral-soft sm:px-3 sm:text-xs">EN</a>
          <button type="button" onClick={() => setOpen(true)} className="btn-coral px-3 py-2 text-[0.65rem] leading-none whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm">Prihláška do škôlky</button>
          <button type="button" aria-label="Otvoriť menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-forest transition-colors hover:bg-coral-soft lg:hidden">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-2 max-h-[calc(100vh-5.5rem)] max-w-6xl overflow-y-auto rounded-3xl bg-card/98 p-3 shadow-soft backdrop-blur-md lg:hidden">
          <nav className="flex flex-col">
            {NAV_MOBILE_BEFORE_ABOUT.map((item) => (
              <a key={item.href} href={sectionHref(item.href)} onClick={closeMobileMenu} className="rounded-2xl px-4 py-3 font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral">{item.label}</a>
            ))}

            <button type="button" aria-expanded={aboutOpen} onClick={() => setAboutOpen((value) => !value)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral">
              O nás <ChevronDown className={`size-4 transition-transform ${aboutOpen ? "rotate-180" : ""}`} />
            </button>
            {aboutOpen && (
              <div className="mx-2 mb-2 rounded-2xl bg-secondary/45 p-2">
                <a href={sectionHref("#o-nas")} onClick={closeMobileMenu} className="block rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-forest hover:bg-card">O nás</a>
                <div className="flex items-center rounded-xl hover:bg-card">
                  <a href="/produkty" onClick={closeMobileMenu} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 font-display text-sm font-semibold text-forest"><Package className="size-4 shrink-0 text-coral" /> Naše produkty</a>
                  <button type="button" aria-label="Rozbaliť produkty" aria-expanded={productsOpen} onClick={() => setProductsOpen((value) => !value)} className="flex size-10 shrink-0 items-center justify-center text-forest">
                    <ChevronDown className={`size-4 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {productsOpen && (
                  <div className="ml-3 border-l-2 border-coral/20 pl-2">
                    <a href="/stojan-na-misky-pre-psa" onClick={closeMobileMenu} className="block rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-forest hover:bg-card">Stojany na misky</a>
                  </div>
                )}
              </div>
            )}

            <button type="button" aria-expanded={infoOpen} onClick={() => setInfoOpen((value) => !value)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral">
              Užitočné informácie <ChevronDown className={`size-4 transition-transform ${infoOpen ? "rotate-180" : ""}`} />
            </button>
            {infoOpen && (
              <div className="mx-2 mb-2 rounded-2xl bg-secondary/45 p-2">
                <a href="/psia-skolka-pre-steniatka" onClick={closeMobileMenu} className="block rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-forest hover:bg-card">Psia škôlka pre šteniatka</a>
                <a href="/strazenie-psov-kosice" onClick={closeMobileMenu} className="block rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-forest hover:bg-card">Stráženie psov Košice</a>
                <a href="/en/dog-daycare-kosice" lang="en" onClick={closeMobileMenu} className="block rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-forest hover:bg-card">English information</a>
              </div>
            )}

            {NAV_MOBILE_AFTER_INFO.map((item) => (
              <a key={item.href} href={sectionHref(item.href)} onClick={closeMobileMenu} className="rounded-2xl px-4 py-3 font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral">{item.label}</a>
            ))}
          </nav>
          <a href={`tel:${PHONE}`} onClick={closeMobileMenu} className="btn-coral mt-2 flex w-full items-center justify-center gap-2 py-3 text-sm"><Phone className="size-4" /> Zavolajte nám</a>
        </div>
      )}

      <FormDialog open={open} onOpenChange={setOpen} title="Prihlás svojho psíka ešte dnes" subtitle="Vyplňte formulár, v ktorom nám poviete viac o vašom psíkovi. Následne sa vám ozveme a dohodneme ďalší postup pri jeho prihlásení do škôlky.">
        <LongForm onSent={() => setTimeout(() => setOpen(false), 2200)} />
      </FormDialog>
    </header>
  );
}
