import { useEffect } from "react";

const STORAGE_KEY = "chvostikovo-cookies";
const PIXEL_ID = "1592305991362085";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const consent = JSON.parse(raw) as Consent;
    return consent.marketing === true;
  } catch {
    return false;
  }
}

function initPixel() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (!w["fbq"]) return;

  const fbq = w["fbq"] as (...args: unknown[]) => void;
  fbq("init", PIXEL_ID);
  fbq("track", "PageView");
}

export function MetaPixel() {
  useEffect(() => {
    if (hasMarketingConsent()) {
      initPixel();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY && hasMarketingConsent()) {
        initPixel();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
