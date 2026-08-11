import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { FormDialog } from "./FormDialog";
import { LongForm } from "./Forms";

const NAV_MOBILE = [
  { href: "#priestory", label: "Priestory" },
  { href: "#recenzie", label: "Recenzie" },
  { href: "#starostlivost", label: "Ako sa postaráme" },
  { href: "#preco", label: "Prečo škôlka" },
  { href: "#o-nas", label: "O nás" },
  { href: "#podmienky", label: "Podmienky" },
  { href: "#cennik", label: "Cenník" },
  { href: "#faq", label: "Časté otázky" },
  { href: "#kontakt", label: "Kontakt" },
];

const NAV_DESKTOP = [
  { href: "#starostlivost", label: "Ako sa postaráme" },
  { href: "#preco", label: "Prečo škôlka" },
  { href: "#o-nas", label: "O nás" },
  { href: "#podmienky", label: "Podmienky" },
  { href: "#cennik", label: "Cenník" },
  { href: "#faq", label: "Časté otázky" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-soft backdrop-blur-md sm:px-6">
        <a href="#top" className="shrink-0">
          <img src={logo} alt="Chvostíkovo – psia škôlka Košice" className="h-5 w-auto sm:h-6" />
        </a>

        <nav className="hidden min-w-0 items-center gap-6 lg:flex">
          {NAV_DESKTOP.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-display text-xs font-semibold whitespace-nowrap text-forest/80 transition-colors hover:text-coral"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-coral px-3 py-2 text-[0.65rem] leading-none whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm"
          >
            Prihláška do škôlky
          </button>
          <button
            type="button"
            aria-label="Otvoriť menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-forest transition-colors hover:bg-coral-soft lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl bg-card/98 p-3 shadow-soft backdrop-blur-md lg:hidden">
          <nav className="flex flex-col">
            {NAV_MOBILE.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 font-display text-sm font-semibold text-forest transition-colors hover:bg-secondary hover:text-coral"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Prihlás svojho psíka ešte dnes"
        subtitle="Vyplňte formulár, v ktorom nám poviete viac o vašom psíkovi. Následne sa vám ozveme a dohodneme ďalší postup pri jeho prihlásení do škôlky."
      >
        <LongForm onSent={() => setTimeout(() => setOpen(false), 2200)} />
      </FormDialog>
    </header>
  );
}
