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
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    // Capture the unoccluded viewport when the dialog first opens. On Android
    // window.innerHeight may also shrink when the keyboard opens; this baseline
    // must not shrink with it.
    const baseHeight = Math.max(window.innerHeight, document.documentElement.clientHeight, viewport?.height ?? 0);
    let frame = 0;
    let focusFrame = 0;
    let touchStartY = 0;
    const keepFocusedFieldVisible = () => {
      if (window.innerWidth > 639) return;
      const scroller = scrollRef.current;
      const content = contentRef.current;
      const active = document.activeElement;
      if (!scroller || !content || !active || !content.contains(active)) return;
      if (!active.matches("input:not([type=radio]):not([type=checkbox]), textarea")) return;
      const field = active.getBoundingClientRect();
      const area = scroller.getBoundingClientRect();
      const top = area.top + 12;
      const bottom = area.bottom - 16;
      if (bottom <= top || !field.height) return;
      if (field.top < top || field.height > bottom - top) {
        scroller.scrollTop += field.top - top;
      } else if (field.bottom > bottom) {
        scroller.scrollTop += field.bottom - bottom;
      }
    };
    const update = () => {
      if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
      const content = contentRef.current;
      if (!content) return;
      const mobile = window.innerWidth <= 639;
      const available = Math.max(200, viewport?.height ?? window.innerHeight);
      const keyboard = mobile && baseHeight - available > 150;
      content.style.setProperty("--form-viewport-height", `${available}px`);
      content.dataset.formKeyboard = keyboard ? "open" : "closed";
      // In iOS Safari, a focused input can pan the *visual* viewport while a
      // fixed dialog remains in layout-viewport coordinates. v292 ignored this
      // offset entirely, leaving the dialog high above the keyboard. Use it
      // ONLY with a confirmed keyboard, clamped to the actual occluded region.
      // Without the keyboard, retain a constant 12px/safe-area top.
      const visualOffset = keyboard
        ? Math.min(Math.max(0, viewport?.offsetTop ?? 0), Math.max(0, baseHeight - available))
        : 0;
      content.style.setProperty("--form-keyboard-top", `${Math.round(visualOffset)}px`);
      const propertyNames = ["position", "top", "bottom", "left", "right", "width", "max-width", "margin", "transform", "translate", "scale", "animation", "max-height", "height"];
      if (mobile) {
        const values: Record<string, string> = {
          position: "fixed",
          top: "calc(var(--form-keyboard-top, 0px) + 12px + env(safe-area-inset-top, 0px))",
          bottom: "auto",
          left: keyboard ? "0px" : "12px",
          right: keyboard ? "0px" : "12px",
          width: "auto",
          "max-width": "none",
          margin: "0",
          transform: "none",
          translate: "none",
          scale: "none",
          animation: "none",
          "max-height": "calc(var(--form-viewport-height, 100svh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
        };
        if (keyboard) {
          // A full-height sheet ends at the keyboard, rather than a short card
          // floating above a large exposed band of the background page.
          const sheetHeight = "calc(var(--form-viewport-height, 100svh) - 12px - env(safe-area-inset-top, 0px))";
          values.height = sheetHeight;
          values["max-height"] = sheetHeight;
        }
        for (const [name, value] of Object.entries(values)) content.style.setProperty(name, value, "important");
        if (!keyboard) content.style.removeProperty("height");
      } else {
        for (const name of propertyNames) content.style.removeProperty(name);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      frame = requestAnimationFrame(() => {
        update();
        focusFrame = requestAnimationFrame(keepFocusedFieldVisible);
      });
    };
    const onFocus = () => schedule();
    // Safari's rubber-band overscroll can move the page BEHIND a modal despite
    // Radix's body scroll-lock. Block background touch gestures, but keep the
    // sole inner form scroller independently scrollable.
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!event.cancelable || window.innerWidth > 639) return;
      const scroller = scrollRef.current;
      const target = event.target;
      if (!scroller || !(target instanceof Node) || !scroller.contains(target)) {
        event.preventDefault();
        return;
      }
      const currentY = event.touches[0]?.clientY ?? touchStartY;
      const delta = currentY - touchStartY;
      const end = scroller.scrollHeight - scroller.clientHeight;
      if ((scroller.scrollTop <= 0 && delta > 0) ||
          (scroller.scrollTop >= end - 1 && delta < 0) || end <= 0) {
        event.preventDefault();
      }
    };
    const content = contentRef.current;
    update();
    schedule();
    content?.addEventListener("focusin", onFocus);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      content?.removeEventListener("focusin", onFocus);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("touchmove", onTouchMove, true);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        positioning="form"
        data-form-dialog="stable-v293"
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
        <div ref={scrollRef} className="form-dialog-scroll min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

