import { currentSourceRef } from "@/lib/tracking-sanitization";
import { useFormProgress } from "@/lib/form-progress";
import { useId, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { startFormAttempt, trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";
import { PhoneField } from "./PhoneField";
import { LeadPhoneReceipt } from "./LeadPhoneReceipt";
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
  const [receipt, setReceipt] = useState<{ phone: string; auth: { id: number; token: string } | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const progress = useFormProgress(trackingSource, "en");

  function onFormChange() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource, "en");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    progress.markAttempt();
    const attemptId = startFormAttempt(trackingSource, "en");

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData(form);
      const source_ref = sourceRef();
      const attribution = getTrafficAttribution();
      const interest = String(fd.get("interest") ?? "").trim();
      const submittedPhone = phoneFromForm(form, `en-${formId}-phone`);
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
        telefon: submittedPhone,
        email: String(fd.get("email") ?? "").trim() || undefined,
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
      progress.markSuccess();
      setReceipt({ phone: submittedPhone, auth: submission.phoneCorrection });
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
        <p className="text-sm text-muted-foreground">We have received your enquiry. We plan to send your SMS confirmation in about 2 minutes.</p>
        {receipt && <LeadPhoneReceipt initialPhone={receipt.phone} correctionAuth={receipt.auth} language="en" />}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onInputCapture={progress.onInputCapture} onBlurCapture={progress.onBlurCapture} onInvalidCapture={progress.onInvalidCapture} onChangeCapture={(e) => { onFormChange(); progress.onChangeCapture(e); }} className="space-y-3 text-left sm:space-y-3.5">
      <div>
        <label className="label-sm" htmlFor={`en-${formId}-name`}>Your name *</label>
        <input id={`en-${formId}-name`} name="name" autoComplete="name" required className="field" placeholder="Your name" />
      </div>
      <PhoneField id={`en-${formId}-phone`} name="phone" label="Phone / WhatsApp *" language="en" />
      <div>
        <label className="label-sm" htmlFor={`en-${formId}-email`}>Email (optional)</label>
        <input id={`en-${formId}-email`} name="email" type="email" autoComplete="email" maxLength={254} className="field" placeholder="you@example.com" />
        <p className="mt-1 text-xs text-forest/65">In case we cannot reach you by phone.</p>
      </div>
      <fieldset className="min-w-0">
        <legend className="label-sm">What are you looking for? *</legend>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {([
            { value: "I just want more information", lines: ["Learn more", "about daycare"] },
            { value: "Regular daycare visits", lines: ["Regular", "visits"] },
            { value: "Occasional daycare", lines: ["Occasional", "visits"] },
          ] as const).map((option) => (
            <label key={option.value} className="relative min-w-0 cursor-pointer [-webkit-tap-highlight-color:transparent]">
              <input type="radio" name="interest" value={option.value} aria-label={option.value} required className="peer sr-only" />
              <span className="flex h-full min-h-16 min-w-0 flex-col items-center justify-center rounded-[0.85rem] border border-border bg-white px-1 py-2 text-center text-[11px] leading-[1.25] font-semibold text-forest transition-colors peer-checked:border-coral peer-checked:bg-secondary/55 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral sm:text-xs">
                {option.lines.map((line) => (
                  <span key={line} className="block max-w-full break-words [overflow-wrap:anywhere]">{line}</span>
                ))}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
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
