import { currentSourceRef } from "@/lib/tracking-sanitization";
import { useId, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { startFormAttempt, trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";
import { PhoneField } from "./PhoneField";
import { phoneFromForm } from "@/lib/phone";
import { reportInquiryError, runFormTelemetry, inquiryDiagnosticSuffix } from "@/lib/form-errors";

function sourceRef() { return currentSourceRef("/en/dog-daycare-kosice"); }

export function EnglishInquiryForm({
  trackingSource = "english_page",
}: {
  trackingSource?: string;
}) {
  const formId = useId();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);

  function onFormChange() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource, "en");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    const attemptId = startFormAttempt(trackingSource, "en");

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData(form);
      const source_ref = sourceRef();
      const attribution = getTrafficAttribution();
      const interest = String(fd.get("interest") ?? "").trim();
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
        telefon: phoneFromForm(form, `en-${formId}-phone`),
        zaujem: `EN – Dog daycare enquiry | ${interest}`,
      }, attemptId);

      void trackCookielessInteraction("form_submit", trackingSource, "en", attemptId);
      runFormTelemetry(() => {
        trackFormSubmit({
          formType: "informacie",
          sourceRef: source_ref,
          trafficSource: attribution.source,
          trafficMedium: attribution.medium,
          landingPage: attribution.landing_page,
          ...(trackingSource ? { ctaSource: trackingSource } : {}),
        });
        trackMetaFormConversion("informacie", trackingSource, submission.metaEventId);
      });
      setSent(true);
    } catch (error) {
      const diagnostic = reportInquiryError(error);
      void trackCookielessInteraction("form_error", `${trackingSource}:${diagnostic.stage}${inquiryDiagnosticSuffix(diagnostic)}`, "en", attemptId);
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
    <form onSubmit={onSubmit} onChangeCapture={onFormChange} className="space-y-3 text-left sm:space-y-3.5">
      <div>
        <label className="label-sm" htmlFor={`en-${formId}-name`}>Your name *</label>
        <input id={`en-${formId}-name`} name="name" autoComplete="name" required className="field" placeholder="Your name" />
      </div>
      <PhoneField id={`en-${formId}-phone`} name="phone" label="Phone / WhatsApp *" language="en" />
      <div>
        <label className="label-sm" htmlFor={`en-${formId}-interest`}>What are you looking for? *</label>
        <select id={`en-${formId}-interest`} name="interest" required className="field" defaultValue="">
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
