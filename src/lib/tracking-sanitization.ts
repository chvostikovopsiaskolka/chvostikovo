/** Optional attribution must never invalidate a customer's contact details. */
export const TRACKING_LIMITS = {
  source_ref: 300, landing_page: 500, referrer: 1000,
  traffic_source: 200, traffic_medium: 200,
  utm_campaign: 300, utm_term: 300, utm_content: 300, cta_source: 200,
} as const;

export function safeTrackingString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function safeAttributionUrl(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, "https://chvostikovo.sk");
    const params = new URLSearchParams();
    // Preserve existing short parameters and UTMs, but never persist Meta's
    // unbounded click ID in form URLs. CAPI reads the original browser URL.
    for (const [key, raw] of url.searchParams) {
      if (key.toLowerCase() === "fbclid" || key.length > 80) continue;
      const limited = safeTrackingString(raw, 300);
      const candidate = new URLSearchParams(params);
      candidate.append(key, limited);
      if (`${url.pathname}?${candidate}`.length <= max) params.append(key, limited);
    }
    return safeTrackingString(`${url.pathname}${params.size ? `?${params}` : ""}`, max);
  } catch {
    // Malformed optional URLs are discarded, never submitted verbatim.
    return "";
  }
}

export function sanitizeTracking<T extends object>(input: T): T {
  const result = { ...input } as Record<string, unknown>;
  for (const [field, max] of Object.entries(TRACKING_LIMITS)) {
    result[field] = field === "source_ref" || field === "landing_page"
      ? safeAttributionUrl(result[field], max)
      : safeTrackingString(result[field], max);
  }
  return result as T;
}

export function currentSourceRef(fallback = "/"): string {
  try {
    if (typeof window === "undefined") return fallback;
    return safeAttributionUrl(window.location.href, TRACKING_LIMITS.source_ref) || fallback;
  } catch {
    return fallback;
  }
}
