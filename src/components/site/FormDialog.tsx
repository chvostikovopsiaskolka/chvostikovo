import { useEffect, useRef, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Visual contact CTA; inputs are only mounted in the existing open FormDialog. */
export function ContactRevealButton({
  onClick,
  language = "sk",
}: {
  onClick: () => void;
  language?: "sk" | "en";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-coral mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-1 px-4 py-3.5 text-center"
      aria-label={language === "en" ? "Open the no-obligation enquiry form" : "Otvoriť nezáväzný kontaktný formulár"}
    >
      <span className="font-display text-base font-bold">
        {language === "en" ? "Enquire about daycare" : "Chcem sa informovať"}
      </span>
      <span className="whitespace-nowrap text-[10px] font-medium leading-tight text-white/90 min-[380px]:text-[11px] sm:text-xs">
        {language === "en" ? "Tap to open a short form" : "Po stlačení sa otvorí krátky formulár"}
      </span>
    </button>
  );
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      // Pinch zoom must remain under the user's control. No focus/scroll reset.
      if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
      const content = contentRef.current;
      if (!content) return;
      content.style.setProperty("--form-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      content.style.setProperty("--form-viewport-top", `${viewport?.offsetTop ?? 0}px`);
      // v278: enforce native mobile coordinates on the actual portal element.
      // Unlike a CSS-only override, these important inline values cannot inherit
      // Radix's translate(-50%, -50%) or be lost to Tailwind layer ordering.
      const mobile = window.innerWidth <= 639;
      const propertyNames = ["position", "top", "bottom", "left", "right", "width", "max-width", "margin", "transform", "translate", "scale", "animation", "max-height"];
      if (mobile) {
        const values: Record<string, string> = {
          position: "fixed",
          top: "calc(var(--form-viewport-top, 0px) + 12px + env(safe-area-inset-top, 0px))",
          bottom: "auto",
          left: "12px",
          right: "12px",
          width: "auto",
          "max-width": "none",
          margin: "0",
          transform: "none",
          translate: "none",
          scale: "none",
          animation: "none",
          "max-height": "calc(var(--form-viewport-height, 100svh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
        };
        for (const [name, value] of Object.entries(values)) content.style.setProperty(name, value, "important");
      } else {
        for (const name of propertyNames) content.style.removeProperty(name);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    // Radix portals may mount their content just after the parent's effect.
    schedule();
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        positioning="form"
        data-form-dialog="stable-v278"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          // Announce the dialog without opening the keyboard or jumping to an input.
          titleRef.current?.focus({ preventScroll: true });
        }}
        className="form-dialog left-3 right-3 top-3 w-auto max-w-none max-h-[88vh] gap-4 overflow-hidden rounded-3xl border-none bg-card p-4 sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100%-1.5rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-7"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle ref={titleRef} tabIndex={-1} className="pr-6 text-left font-display text-base leading-snug text-forest outline-none sm:text-xl">
            {title}
          </DialogTitle>
          {subtitle && (
            <p className="pr-6 text-left text-sm text-forest/80">{subtitle}</p>
          )}
        </DialogHeader>
        <div className="form-dialog-scroll min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

