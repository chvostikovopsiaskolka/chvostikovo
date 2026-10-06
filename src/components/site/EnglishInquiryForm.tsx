import { useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";
import { PhoneField } from "./PhoneField";

function sourceRef() {
  if (typeof window === "undefined") return "/en/dog-daycare-kosice";
  return `${window.location.pathname}${window.location.search}` || "/en/dog-daycare-kosice";
}

function normalizedEnglishPhoneFromForm(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>("#en-phone");
  const prefix = input?.parentElement?.querySelector<HTMLSelectElement>("select")?.value || "+421";
  let digits = String(input?.value ?? "").split("").filter((ch) => ch >= "0" && ch <= "9").join("");
  const prefixDigits = prefix.slice(1);
  if (digits.startsWith(prefixDigits)) return `+${digits}`;
  if (prefix === "+421" && digits.startsWith("0")) digits = digits.slice(1);
  return digits ? `${prefix}${digits}` : "";
}

export function EnglishInquiryForm({
  trackingSource = "english_page",
}: {
  trackingSource?: string;
}) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);

  function onFormFocus() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource, "en");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const source_ref = sourceRef();
    const attribution = getTrafficAttribution();
    const interest = String(fd.get("interest") ?? "").trim();

    setLoading(true);
    setError(null);

    try {
      const submission = await submitInquiry({
        typ: "informacie",
        consent: true,
        source_ref,
        landing_page: attribution.landing_page,
        referrer: attribution.referrer,
        traffic_source: attribution.source,
        traffic_medium: attribution.medium,
        utm_campaign: attribution.campaign,
        utm_term: attribution.term,
        utm_content: attribution.content,
        cta_source: trackingSource,
        meno: String(fd.get("name") ?? "").trim(),
        telefon: normalizedEnglishPhoneFromForm(form) || String(fd.get("phone") ?? "").trim(),
        zaujem: `EN – Dog daycare enquiry | ${interest}`,
      });

      trackFormSubmit({
        formType: "informacie",
        sourceRef: source_ref,
        trafficSource: attribution.source,
        trafficMedium: attribution.medium,
        landingPage: attribution.landing_page,
        ctaSource: trackingSource,
      });
      trackMetaFormConversion("informacie", trackingSource, submission.metaEventId);
      void trackCookielessInteraction("form_submit", trackingSource, "en");

      setSent(true);
    } catch {
      void trackCookielessInteraction("form_error", trackingSource, "en");
      setError("Something went wrong. Please try again or call us.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-forest">
          <Check className="size-7" />
        </div>
        <h3 className="text-xl text-forest">Thank you!</h3>
        <p className="text-sm text-muted-foreground">We will get back to you as soon as possible.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onFocusCapture={onFormFocus} className="space-y-3 text-left sm:space-y-3.5">
      <div>
        <label className="label-sm" htmlFor="en-name">Your name *</label>
        <input id="en-name" name="name" required className="field" placeholder="Your name" />
      </div>
      <PhoneField id="en-phone" name="phone" label="Phone / WhatsApp *" language="en" />
      <div>
        <label className="label-sm" htmlFor="en-interest">What are you looking for? *</label>
        <select id="en-interest" name="interest" required className="field" defaultValue="">
          <option value="" disabled>Select an option</option>
          <option>Regular daycare visits</option>
          <option>Occasional daycare</option>
          <option>One-off daytime care</option>
          <option>I just want more information</option>
        </select>
      </div>
      <PrivacyConsentCheckbox language="en" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-coral w-full px-4 py-2.5 text-sm disabled:opacity-60"
      >
        {loading ? "Sending…" : "Enquire about daycare"}
      </button>
    </form>
  );
}
