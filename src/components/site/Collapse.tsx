import { useState, type ReactNode } from "react";
import { Plus, Minus } from "lucide-react";

/**
 * Rozbaľovacia karta v štýle sekcie "Časté otázky".
 * Používa sa iba v mobilnom zobrazení.
 */
export function Collapse({
  title,
  children,
  tone = "light",
  icon,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  tone?: "light" | "dark";
  icon?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const dark = tone === "dark";

  return (
    <div
      className={`overflow-hidden rounded-3xl shadow-card ${
        dark ? "bg-cream/10 ring-1 ring-cream/15" : "bg-card"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 p-5 text-left font-display text-base font-semibold ${
          dark ? "text-cream" : "text-forest"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon}
          <span className="min-w-0">{title}</span>
        </span>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
            dark ? "bg-cream/15 text-cream" : "bg-secondary text-forest"
          }`}
        >
          {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </span>
      </button>
      {open && (
        <div
          className={`px-5 pb-5 text-[0.95rem] leading-relaxed ${
            dark ? "text-cream/85" : "text-forest/80"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
