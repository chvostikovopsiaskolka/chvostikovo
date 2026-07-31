import { Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { PHONE, PHONE_PRETTY } from "@/content/site";

const links = [
  { href: "#priestory", label: "Priestory" },
  { href: "#o-nas", label: "O nás" },
  { href: "#podmienky", label: "Podmienky" },
  { href: "#cennik", label: "Cenník" },
  { href: "#kontakt", label: "Kontakt" },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2.5 shadow-soft backdrop-blur-md sm:px-6">
        <a href="#top" className="shrink-0">
          <img src={logo} alt="Chvostíkovo – psia škôlka Košice" className="h-7 w-auto sm:h-8" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-forest/80 transition-colors hover:text-coral"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={`tel:${PHONE}`}
            className="inline-flex items-center gap-2 rounded-full bg-coral-soft/50 px-3 py-2 font-display text-sm font-semibold text-coral transition-colors hover:bg-coral-soft sm:px-4"
          >
            <Phone className="size-4 shrink-0" />
            <span className="hidden sm:inline">{PHONE_PRETTY}</span>
          </a>
          <a
            href="#kontakt"
            className="btn-coral px-4 py-2.5 text-[0.82rem] sm:px-6 sm:text-sm"
          >
            Mám záujem o škôlku
          </a>
        </div>
      </div>
    </header>
  );
}
