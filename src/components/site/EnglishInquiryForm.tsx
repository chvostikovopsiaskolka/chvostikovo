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
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedInterest, setSelectedInterest] = useState("");
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
    if (loading || step !== 2 || !selectedInterest) return;

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
        <p className="text-sm text-muted-foreground">We have received your enquiry. You will receive an SMS confirmation.</p>
        {receipt && <LeadPhoneReceipt initialPhone={receipt.phone} correctionAuth={receipt.auth} language="en" />}
      </div>
    );
  }

  return (
    <form
      data-lead-step-form
      onSubmit={onSubmit}
      onInputCapture={progress.onInputCapture}
      onBlurCapture={progress.onBlurCapture}
      onInvalidCapture={progress.onInvalidCapture}
      onChangeCapture={(event) => { onFormChange(); progress.onChangeCapture(event); }}
      className="space-y-5 text-left"
    >
      <div className="space-y-2">
        <div className="flex justify-between gap-2 text-xs font-semibold text-forest/75" aria-live="polite">
          <span>Quick, no-obligation enquiry</span>
          <span>Step {step} of 2</span>
        </div>
        <div role="progressbar" aria-label="Enquiry progress" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}
          className="h-1.5 overflow-hidden rounded-full bg-forest/10">
          <div className={`h-full rounded-full bg-coral transition-all duration-300 ${step === 1 ? "w-1/2" : "w-full"}`} />
        </div>
      </div>
      <div className={step === 1 ? "space-y-5" : "hidden"} aria-hidden={step !== 1}>
        <fieldset className="min-w-0">
          <legend className="mb-3 font-display text-lg font-bold leading-snug text-forest sm:text-xl">
            What are you looking for for your dog?
          </legend>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {([
              { value: "I just want more information", lines: ["Learn more", "about daycare"] },
              { value: "Regular daycare visits", lines: ["Regular", "visits"] },
              { value: "Occasional daycare", lines: ["Occasional", "visits"] },
            ] as const).map((option) => (
              <label key={option.value} className="relative min-w-0 cursor-pointer [-webkit-tap-highlight-color:transparent]">
                <input type="radio" name="interest" value={option.value} required aria-label={option.value}
                  onChange={() => setSelectedInterest(option.value)} className="peer sr-only" />
                <span className="flex h-full min-h-24 min-w-0 flex-col items-center justify-center rounded-2xl border border-forest/15 bg-white px-1.5 py-3 text-center leading-[1.3] text-forest shadow-sm transition peer-checked:border-coral peer-checked:bg-secondary/55 peer-checked:ring-1 peer-checked:ring-coral/40 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral sm:min-h-28 sm:px-3">
                  {option.lines.map((line, i) => (
                    <span key={line} className={`block max-w-full break-words text-[10.5px] [overflow-wrap:anywhere] sm:text-xs ${i === 0 ? "font-bold" : "font-medium"}`}>{line}</span>
                  ))}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" disabled={!selectedInterest} onClick={() => setStep(2)}
          className="btn-coral min-h-12 w-full px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50">
          Continue
        </button>
      </div>
      <div className={step === 2 ? "space-y-3.5" : "hidden"} aria-hidden={step !== 2}>
        <h3 className="font-display text-lg font-bold text-forest sm:text-xl">How can we contact you?</h3>
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
        <PrivacyConsentCheckbox language="en" />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <button type="button" disabled={loading} onClick={() => setStep(1)}
            className="min-h-12 rounded-full border border-forest/20 px-4 font-semibold text-forest hover:bg-secondary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
            Back
          </button>
          <button type="submit" disabled={loading} className="btn-coral min-h-12 min-w-0 px-4 py-3 font-bold disabled:opacity-60">
            {loading ? "Sending…" : "Send enquiry"}
          </button>
        </div>
      </div>
    </form>
  );
}
