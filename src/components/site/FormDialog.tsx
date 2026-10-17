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

/**
 * Simple modal (v298): one scroll owner, no keyboard/visualViewport listeners,
 * no programmatic scroll corrections and no keyboard-dependent geometry.
 * Radix owns focus/overlay; background is locked once for the whole session.
 */
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
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;

    // iOS can still scroll the page underneath a Radix modal when the native
    // keyboard pans the visual viewport. Freeze the BODY at its current offset.
    // This runs once on open/close, never during typing or keyboard resizing.
    const body = document.body;
    const html = document.documentElement;
    // Change ONLY our six owned properties. Radix may independently write
    // body pointer-events and scrollbar offsets: cssText replacement here
    // would overwrite those unrelated changes on dialog cleanup.
    const owned = ["position", "top", "left", "right", "width", "overflow"] as const;
    const previous = owned.map(name => ({
      name, value: body.style.getPropertyValue(name), priority: body.style.getPropertyPriority(name),
    }));
    const originalOverscroll = html.style.overscrollBehavior;
    const originalScrollY = window.scrollY;

    body.style.position = "fixed";
    body.style.top = `-${originalScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    return () => {
      for (const { name, value, priority } of previous) {
        if (value) body.style.setProperty(name, value, priority);
        else body.style.removeProperty(name);
      }
      html.style.overscrollBehavior = originalOverscroll;
      window.scrollTo(0, originalScrollY);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        positioning="form"
        data-form-dialog="simple-v298"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus({ preventScroll: true });
        }}
        className="form-dialog left-3 right-3 top-3 w-auto max-w-none max-h-[88svh] gap-4 overflow-hidden rounded-3xl border-none bg-card p-4 sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100%-1.5rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-7"
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
