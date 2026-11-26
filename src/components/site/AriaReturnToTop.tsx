import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

// Same mobile navigation behavior as MobileDock, scoped to the paid lead portrait.
export function AriaReturnToTop({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    if (!enabled) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    let lastY = Math.max(0, window.scrollY);
    let timer = 0;
    const eligible = () => mobile.matches && window.scrollY > 160 &&
      !document.querySelector('[data-form-dialog], [role="dialog"][data-state="open"]');
    const settle = () => {
      window.clearTimeout(timer);
      if (eligible()) timer = window.setTimeout(() => setVisible(eligible()), 350);
      else setVisible(false);
    };
    const scroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      lastY = y;
      if (!eligible() || delta > 0) setVisible(false);
      else if (delta < 0) setVisible(true);
      settle();
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", settle);
    mobile.addEventListener("change", settle);
    settle();
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", settle);
      mobile.removeEventListener("change", settle);
      window.clearTimeout(timer);
    };
  }, [enabled]);

  const back = () => {
    void trackCookielessInteraction("nav_click", "mobile_dock_lead_back_to_top", "sk");
    if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    // Jump before hiding the focused button, without CSS smooth-scroll interference.
    window.scrollTo({ top: 0, behavior: "instant" });
    setVisible(false);
  };
  return <button type="button" data-aria-back-top data-visible={enabled && visible ? "true" : "false"} disabled={!enabled || !visible} aria-label="Späť hore" title="Späť hore" onClick={back}><ArrowUp aria-hidden="true" size={18} strokeWidth={2} /></button>;
}
