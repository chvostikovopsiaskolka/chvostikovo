import { Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { PHONE, PHONE_PRETTY } from "@/content/site";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-soft backdrop-blur-md sm:px-6">
        <a href="#top" className="shrink-0">
          <img src={logo} alt="Chvostíkovo – psia škôlka Košice" className="h-6 w-auto sm:h-7" />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={`tel:${PHONE}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-coral-soft/50 px-2.5 py-1.5 font-display text-xs font-semibold text-coral transition-colors hover:bg-coral-soft sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <Phone className="size-3.5 shrink-0 sm:size-4" />
            <span className="hidden sm:inline">{PHONE_PRETTY}</span>
          </a>
          <a
            href="#kontakt"
            className="btn-coral px-3 py-2 text-[0.7rem] leading-none whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm"
          >
            Mám záujem o škôlku
          </a>

        </div>
      </div>
    </header>
  );
}
