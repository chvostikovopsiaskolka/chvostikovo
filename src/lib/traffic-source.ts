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

function hostMatches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

function isGoogleHost(host: string) {
  return host === "google.com" || host.endsWith(".google.com") || host.startsWith("google.") || host.startsWith("www.google.");
}

function inferSource(referrer: string) {
  const host = hostnameFromUrl(referrer);
  if (!host) return { source: "direct", medium: "none" };

  if (hostMatches(host, "chvostikovo.sk") || hostMatches(host, "chvostikovopsiaskolka.github.io")) {
    return { source: "internal", medium: "internal" };
  }

  if (isGoogleHost(host)) return { source: "google", medium: "organic" };
  if (hostMatches(host, "bing.com")) return { source: "bing", medium: "organic" };
  if (hostMatches(host, "search.yahoo.com") || hostMatches(host, "yahoo.com")) return { source: "yahoo", medium: "organic" };
  if (hostMatches(host, "duckduckgo.com")) return { source: "duckduckgo", medium: "organic" };
  if (hostMatches(host, "ecosia.org")) return { source: "ecosia", medium: "organic" };
  if (hostMatches(host, "seznam.cz")) return { source: "seznam", medium: "organic" };
  if (hostMatches(host, "search.brave.com")) return { source: "brave", medium: "organic" };
  if (hostMatches(host, "startpage.com")) return { source: "startpage", medium: "organic" };
  if (hostMatches(host, "qwant.com")) return { source: "qwant", medium: "organic" };
  if (hostMatches(host, "yandex.com") || hostMatches(host, "yandex.ru")) return { source: "yandex", medium: "organic" };

  if (hostMatches(host, "facebook.com") || hostMatches(host, "fb.com")) return { source: "facebook", medium: "social" };
  if (hostMatches(host, "instagram.com")) return { source: "instagram", medium: "social" };
  if (hostMatches(host, "threads.net")) return { source: "threads", medium: "social" };
  if (hostMatches(host, "tiktok.com")) return { source: "tiktok", medium: "social" };
  if (hostMatches(host, "youtube.com") || hostMatches(host, "youtu.be")) return { source: "youtube", medium: "social" };
  if (hostMatches(host, "linkedin.com")) return { source: "linkedin", medium: "social" };
  if (hostMatches(host, "reddit.com")) return { source: "reddit", medium: "social" };
  if (hostMatches(host, "pinterest.com")) return { source: "pinterest", medium: "social" };
  if (hostMatches(host, "x.com") || hostMatches(host, "twitter.com")) return { source: "x", medium: "social" };

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

  try {
    captureTrafficAttribution();
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
