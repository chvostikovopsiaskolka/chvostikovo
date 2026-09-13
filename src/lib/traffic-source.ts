export type TrafficAttribution = {
  landing_page: string;
  referrer: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
};

const STORAGE_KEY = "chvostikovo_traffic_attribution";

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function inferSource(referrer: string) {
  const host = hostnameFromUrl(referrer);
  if (!host) return { source: "direct", medium: "none" };

  if (host.includes("google.")) return { source: "google", medium: "organic" };
  if (host.includes("bing.com")) return { source: "bing", medium: "organic" };
  if (host.includes("facebook.com") || host.includes("fb.com")) return { source: "facebook", medium: "referral" };
  if (host.includes("instagram.com")) return { source: "instagram", medium: "referral" };
  if (host.includes("tiktok.com")) return { source: "tiktok", medium: "referral" };

  return { source: host, medium: "referral" };
}

export function captureTrafficAttribution() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (stored) return;

  const referrer = document.referrer || "";
  const inferred = inferSource(referrer);

  const attribution: TrafficAttribution = {
    landing_page: `${window.location.pathname}${window.location.search}` || "/",
    referrer,
    source: params.get("utm_source") || inferred.source,
    medium: params.get("utm_medium") || inferred.medium,
    campaign: params.get("utm_campaign") || "",
    term: params.get("utm_term") || "",
    content: params.get("utm_content") || "",
  };

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
}

export function getTrafficAttribution(): TrafficAttribution {
  if (typeof window === "undefined") {
    return {
      landing_page: "/",
      referrer: "",
      source: "unknown",
      medium: "unknown",
      campaign: "",
      term: "",
      content: "",
    };
  }

  captureTrafficAttribution();

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as TrafficAttribution;
  } catch {
    // Fall through to safe defaults.
  }

  const inferred = inferSource(document.referrer || "");
  return {
    landing_page: `${window.location.pathname}${window.location.search}` || "/",
    referrer: document.referrer || "",
    source: inferred.source,
    medium: inferred.medium,
    campaign: "",
    term: "",
    content: "",
  };
}
