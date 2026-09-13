type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
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

  window.gtag?.("event", "generate_lead", eventParams);

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: "generate_lead",
      ...eventParams,
    });
  }
}
