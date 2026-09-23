type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

type EventParams = Record<string, string | number | boolean>;

function pagePath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}` || "/";
}

function pushAnalyticsEvent(eventName: string, params: EventParams) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", eventName, params);

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }
}

function trackMetaStandard(eventName: string, params: EventParams) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as Record<string, unknown>)["fbq"] as
    ((...args: unknown[]) => void) | undefined;
  fbq?.("track", eventName, params);
}

function trackMetaCustom(eventName: string, params: EventParams) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as Record<string, unknown>)["fbq"] as
    ((...args: unknown[]) => void) | undefined;
  fbq?.("trackCustom", eventName, params);
}

export function trackMarketingInteraction(
  kind: "inquiry_cta" | "phone_click" | "view_pricing",
  source: string,
) {
  const params = {
    source,
    page_path: pagePath(),
  };

  if (kind === "phone_click") {
    trackMetaStandard("Contact", {
      ...params,
      content_name: "phone_click",
    });
    pushAnalyticsEvent("phone_click", params);
    return;
  }

  if (kind === "inquiry_cta") {
    trackMetaCustom("InquiryCTA", {
      ...params,
      content_name: "informacie",
    });
    pushAnalyticsEvent("inquiry_cta_click", params);
    return;
  }

  trackMetaCustom("ViewPricing", {
    ...params,
    content_name: "cennik",
  });
  pushAnalyticsEvent("view_pricing", params);
}

export function trackMetaFormConversion(formType: "informacie" | "prihlaska") {
  const params = {
    content_name: formType,
    page_path: pagePath(),
  };

  trackMetaStandard("Lead", params);

  if (formType === "prihlaska") {
    trackMetaStandard("CompleteRegistration", params);
    pushAnalyticsEvent("application_submit", {
      form_type: formType,
      page_path: params.page_path,
    });
  }
}

export function trackFormSubmit(params: {
  formType: "informacie" | "prihlaska";
  sourceRef: string;
  trafficSource?: string;
  trafficMedium?: string;
  landingPage?: string;
}) {
  if (typeof window === "undefined") return;

  const eventParams = {
    form_type: params.formType,
    source_ref: params.sourceRef,
    traffic_source: params.trafficSource || "unknown",
    traffic_medium: params.trafficMedium || "unknown",
    landing_page: params.landingPage || "",
  };

  pushAnalyticsEvent("generate_lead", eventParams);
}
