import { useEffect, useRef, type FocusEvent, type ReactNode } from "react";
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
  hideHeader = false,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  /** Keep an accessible dialog title, hide the pre-submission intro on success. */
  hideHeader?: boolean;
  children: ReactNode;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const autofillRestoreFrame = useRef<number | null>(null);
  const autofillRestoreTimer = useRef<number | null>(null);
  const restoreToken = useRef(0);

  function cancelAutofillRestore() {
    restoreToken.current += 1;
    if (autofillRestoreFrame.current !== null) cancelAnimationFrame(autofillRestoreFrame.current);
    if (autofillRestoreTimer.current !== null) clearTimeout(autofillRestoreTimer.current);
    autofillRestoreFrame.current = null;
    autofillRestoreTimer.current = null;
  }

  function onOwnerNameBlur(event: FocusEvent<HTMLDivElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "meno" || input.autocomplete !== "name") return;
    // This is an iOS Safari-specific Done/autofill workaround only. Keep the
    // normal scrolling behavior of every other field and on other platforms.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS || window.innerWidth > 639) return;
    // When the user moves directly into the next field, don't override Safari.
    if (event.relatedTarget instanceof Element && event.currentTarget.contains(event.relatedTarget)) return;
    const scroll = contentScrollRef.current;
    if (!scroll) return;
    cancelAutofillRestore();
    const token = restoreToken.current;
    const restoreIfIdle = () => {
      if (restoreToken.current !== token || !scroll.isConnected) return;
      if (scroll.contains(document.activeElement)) return;
      scroll.scrollTop = 0;
    };
    autofillRestoreFrame.current = requestAnimationFrame(restoreIfIdle);
    // Native iOS keyboard collapse can scroll again after the first frame.
    // One late correction, cancelled on any further touch/focus, is enough.
    autofillRestoreTimer.current = window.setTimeout(() => {
      restoreIfIdle();
      autofillRestoreTimer.current = null;
    }, 320);
  }

  useEffect(() => () => cancelAutofillRestore(), []);


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
    const originalRootOverflow = html.style.overflow;
    const originalScrollY = window.scrollY;

    body.style.position = "fixed";
    body.style.top = `-${originalScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    // Safari may still rubber-band the root scrolling element while a
    // textarea near the bottom of the form holds native keyboard focus.
    // Lock ONLY the root overflow; the modal inner scroller stays available.
    html.style.overflow = "hidden";

    return () => {
      for (const { name, value, priority } of previous) {
        if (value) body.style.setProperty(name, value, priority);
        else body.style.removeProperty(name);
      }
      html.style.overscrollBehavior = originalOverscroll;
      html.style.overflow = originalRootOverflow;
      window.scrollTo(0, originalScrollY);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        positioning="form"
        data-form-dialog="simple-v300"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus({ preventScroll: true });
        }}
        className="form-dialog left-3 right-3 top-3 w-auto max-w-none max-h-[88svh] gap-4 overflow-hidden rounded-3xl border-none bg-card p-4 sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100%-1.5rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-7"
      >
        {hideHeader ? (
          <DialogTitle ref={titleRef} tabIndex={-1} className="sr-only">{title}</DialogTitle>
        ) : (
          <DialogHeader className="shrink-0">
            <DialogTitle ref={titleRef} tabIndex={-1} className="pr-6 text-left font-display text-base leading-snug text-forest outline-none sm:text-xl">{title}</DialogTitle>
            {subtitle && <p className="pr-6 text-left text-sm text-forest/80">{subtitle}</p>}
          </DialogHeader>
        )}
        <div
          ref={contentScrollRef}
          className="form-dialog-scroll min-h-0 overflow-y-auto overscroll-contain"
          onBlurCapture={onOwnerNameBlur}
          onFocusCapture={cancelAutofillRestore}
          onPointerDownCapture={cancelAutofillRestore}
          onTouchStartCapture={cancelAutofillRestore}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
