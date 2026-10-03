import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackMarketingInteraction } from "@/lib/analytics";
import { clearMarketingCookies, hasMarketingConsent } from "@/lib/consent";

const PIXEL_ID = "1592305991362085";

function loadPixelBaseCode(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const w = window as unknown as Record<string, unknown>;
  if (w["fbq"] && document.getElementById("facebook-pixel-script")) return true;
  if (document.getElementById("facebook-pixel-script")) return true;

  const script = document.createElement("script");
  script.id = "facebook-pixel-script";
  script.async = true;
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);
  return true;
}

function initPixel(onReady?: () => void) {
  if (typeof window === "undefined") return;
  loadPixelBaseCode();

  const w = window as unknown as Record<string, unknown>;
  const tryInit = (attempts = 0) => {
    const fbq = w["fbq"] as ((...args: unknown[]) => void) | undefined;
    if (fbq) {
      fbq("consent", "grant");
      fbq("init", PIXEL_ID);
      fbq("set", "autoConfig", false, PIXEL_ID);
      fbq("track", "PageView");
      onReady?.();
      return;
    }
    if (attempts < 10) setTimeout(() => tryInit(attempts + 1), 100);
  };
  tryInit();
}

function clickSource(anchor: HTMLAnchorElement) {
  if (anchor.dataset.trackingSource) return anchor.dataset.trackingSource;
  if (anchor.closest("#informujte-sa")) return "inquiry_section";
  if (anchor.closest("#top")) return "hero";
  if (anchor.closest("#prva-navsteva")) return "first_visit";
  if (anchor.closest("#preco")) return "why_daycare";
  if (anchor.closest("#kontakt")) return "contact";
  if (anchor.closest("header")) return "header";
  if (anchor.closest("footer")) return "footer";
  return "site";
}

function handleTrackedClick(event: MouseEvent) {
  if (!hasMarketingConsent()) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) return;

  const href = anchor.getAttribute("href") ?? "";
  const explicitEvent = anchor.dataset.marketingEvent;

  if (explicitEvent === "inquiry_cta") {
    trackMarketingInteraction("inquiry_cta", clickSource(anchor));
    return;
  }
  if (explicitEvent === "view_pricing") {
    trackMarketingInteraction("view_pricing", clickSource(anchor));
    return;
  }
  if (href.startsWith("tel:")) {
    trackMarketingInteraction("phone_click", clickSource(anchor));
    return;
  }
  if (href === "#informujte-sa" || href === "/#informujte-sa") {
    trackMarketingInteraction("inquiry_cta", clickSource(anchor));
    return;
  }
  if ((href === "#cennik" || href === "/#cennik") && anchor.closest("header")) {
    trackMarketingInteraction("view_pricing", "header_menu");
  }
}

export function MetaPixel() {
  const initializedRef = useRef(false);
  const firstRouteRef = useRef(true);
  const routeHref = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    function applyConsent() {
      const allowed = hasMarketingConsent();
      const fbq = (window as unknown as Record<string, unknown>)["fbq"] as
        ((...args: unknown[]) => void) | undefined;

      if (allowed) {
        if (!initializedRef.current) {
          initPixel(() => {
            initializedRef.current = true;
          });
        } else {
          fbq?.("consent", "grant");
          fbq?.("track", "PageView");
        }
      } else {
        fbq?.("consent", "revoke");
        clearMarketingCookies();
      }
    }

    applyConsent();
    window.addEventListener("chvostikovo-consent-changed", applyConsent);
    document.addEventListener("click", handleTrackedClick);

    return () => {
      window.removeEventListener("chvostikovo-consent-changed", applyConsent);
      document.removeEventListener("click", handleTrackedClick);
    };
  }, []);

  useEffect(() => {
    if (firstRouteRef.current) {
      firstRouteRef.current = false;
      return;
    }
    if (!initializedRef.current || !hasMarketingConsent()) return;

    const fbq = (window as unknown as Record<string, unknown>)["fbq"] as
      ((...args: unknown[]) => void) | undefined;
    fbq?.("track", "PageView");
  }, [routeHref]);

  return null;
}
