import { useEffect } from "react";

const STORAGE_KEY = "chvostikovo-cookies";
const PIXEL_ID = "1344636107865047";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

function loadPixel() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w["fbq"]) return;

  const script = document.createElement("script");
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  const noscript = document.createElement("noscript");
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" />`;
  document.head.appendChild(noscript);
}

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

export function MetaPixel() {
  useEffect(() => {
    if (hasMarketingConsent()) {
      loadPixel();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY && hasMarketingConsent()) {
        loadPixel();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
