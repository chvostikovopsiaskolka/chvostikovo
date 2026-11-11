import { useId, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { currentSourceRef } from "@/lib/tracking-sanitization";
import { useFormProgress } from "@/lib/form-progress";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { startFormAttempt, trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { InquirySubmissionError, reportInquiryError, runFormTelemetry, inquiryDiagnosticSuffix } from "@/lib/form-errors";
import { phoneFromForm } from "@/lib/phone";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";
import { PhoneField } from "./PhoneField";
import { LeadPhoneReceipt } from "./LeadPhoneReceipt";

// New LEAD landing pilot only. Existing ShortForm, EN and puppy data contracts remain untouched.
// UI label and stored interest_reason intentionally match; the server allowlist is additive.
export const LEAD_STEP_INTERESTS = [
  { value: "Chcem sa informovať o škôlke", lines: ["Chcem sa", "informovať", "o škôlke"] },
  { value: "Mám záujem využívať škôlku pravidelne", lines: ["Mám záujem", "pravidelne", "využívať škôlku"] },
  { value: "Mám záujem využívať škôlku občasne", lines: ["Mám záujem", "občasne", "využívať škôlku"] },
] as const;

export function LeadStepForm({ trackingSource, onSent }: { trackingSource: string; onSent?: () => void }) {
  const formId = useId();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedInterest, setSelectedInterest] = useState("");
  const [sent, setSent] = useState(false);
  const [receipt, setReceipt] = useState<{ phone: string; auth: { id: number; token: string } | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const progress = useFormProgress(trackingSource);

  function trackStart() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || step !== 2 || !selectedInterest) return;
    const form = event.currentTarget;
    const attemptId = startFormAttempt(trackingSource);
    progress.markAttempt();
    setLoading(true);
    setError(null);
    try {
      const fields = new FormData(form);
      const phone = phoneFromForm(form, `lead-step-${formId}-tel`);
      const attribution = getTrafficAttribution();
      const source_ref = currentSourceRef("/");
      const result = await submitInquiry({
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
        meno: String(fields.get("meno") || "").trim(),
        telefon: phone,
        email: String(fields.get("email") || "").trim() || undefined,
        zaujem: selectedInterest,
      }, attemptId);
      void trackCookielessInteraction("form_submit", trackingSource, "sk", attemptId);
      runFormTelemetry(() => {
        trackFormSubmit({
          formType: "informacie",
          sourceRef: source_ref,
          trafficSource: attribution.source,
          trafficMedium: attribution.medium,
          landingPage: attribution.landing_page,
          ctaSource: trackingSource,
        });
        trackMetaFormConversion("informacie", trackingSource, result.metaEventId);
      });
      progress.markSuccess();
      setReceipt({ phone, auth: result.phoneCorrection });
      setSent(true);
      runFormTelemetry(() => onSent?.());
    } catch (cause) {
      const diagnostic = reportInquiryError(cause);
      void trackCookielessInteraction("form_error", `${trackingSource}:${diagnostic.stage}${inquiryDiagnosticSuffix(diagnostic)}`, "sk", attemptId);
      setError(cause instanceof InquirySubmissionError && cause.recoverySaved
        ? "Odoslanie formulára zlyhalo, ale váš kontakt sme zachovali. Ozveme sa vám."
        : "Odoslanie zlyhalo. Skúste to znova alebo nám zavolajte.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-75 flex-col items-center justify-center gap-3 text-center" data-lead-step-success>
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-forest">
          <Check className="size-7" aria-hidden="true" />
        </div>
        <h3 className="font-display text-xl font-bold text-forest">Ďakujeme za váš záujem.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-forest/75">
          Váš záujem sme prijali. SMS potvrdenie plánujeme odoslať približne o 2 minúty.
        </p>
        {receipt && <LeadPhoneReceipt initialPhone={receipt.phone} correctionAuth={receipt.auth} />}
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm font-semibold text-forest">
          <a href="/#podmienky" onClick={() => void trackCookielessInteraction("success_conditions_click", trackingSource)} className="underline underline-offset-4">Podmienky prijatia</a>
          <a href="/#cennik" onClick={() => void trackCookielessInteraction("success_pricing_click", trackingSource)} className="underline underline-offset-4">Cenník</a>
        </div>
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
      onChangeCapture={(event) => { trackStart(); progress.onChangeCapture(event); }}
      className="space-y-5 text-left"
    >
      <div className="space-y-2">
        <div className="flex justify-between gap-2 text-xs font-semibold text-forest/75" aria-live="polite">
          <span>Krátky nezáväzný formulár</span>
          <span>Krok {step} z 2</span>
        </div>
        <div role="progressbar" aria-label="Postup formulára" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} className="h-1.5 overflow-hidden rounded-full bg-forest/10">
          <div className={`h-full rounded-full bg-coral transition-all duration-300 ${step === 1 ? "w-1/2" : "w-full"}`} />
        </div>
      </div>

      <div className={step === 1 ? "space-y-5" : "hidden"} aria-hidden={step !== 1}>
        <fieldset className="min-w-0">
          <legend className="mb-3 font-display text-lg font-bold leading-snug text-forest sm:text-xl">
            Čo hľadáte pre svojho psíka?
          </legend>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {LEAD_STEP_INTERESTS.map((option) => (
              <label key={option.value} className="relative min-w-0 cursor-pointer [-webkit-tap-highlight-color:transparent]">
                <input type="radio" name="zaujem" value={option.value} required aria-label={option.value}
                  onChange={() => setSelectedInterest(option.value)} className="peer sr-only" />
                <span className="flex h-full min-h-24 min-w-0 flex-col items-center justify-center rounded-2xl border border-forest/15 bg-white px-1.5 py-3 text-center leading-[1.3] text-forest shadow-sm transition peer-checked:border-coral peer-checked:bg-secondary/55 peer-checked:ring-1 peer-checked:ring-coral/40 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral sm:min-h-28 sm:px-3">
                  {option.lines.map((line, i) => (
                    <span key={line} className={`block max-w-full break-words text-[10.5px] [overflow-wrap:anywhere] sm:text-xs ${i === 0 ? "font-bold" : "font-medium"}`}>
                      {line}
                    </span>
                  ))}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" disabled={!selectedInterest} onClick={() => setStep(2)}
          className="btn-coral min-h-12 w-full px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50">
          Pokračovať
        </button>
      </div>

      <div className={step === 2 ? "space-y-3.5" : "hidden"} aria-hidden={step !== 2}>
        <h3 className="font-display text-lg font-bold leading-snug text-forest sm:text-xl">Kam sa vám môžeme ozvať?</h3>
        <p className="text-sm leading-relaxed text-forest/70">
          Nechajte nám kontakt a ozveme sa vám ohľadom vášho záujmu.
        </p>
        <div>
          <label className="label-sm" htmlFor={`lead-step-${formId}-meno`}>Meno majiteľa *</label>
          <input id={`lead-step-${formId}-meno`} name="meno" autoComplete="name" required className="field" placeholder="Vaše meno" />
        </div>
        <PhoneField id={`lead-step-${formId}-tel`} name="telefon" />
        <div>
          <label className="label-sm" htmlFor={`lead-step-${formId}-email`}>E-mail (nepovinné)</label>
          <input id={`lead-step-${formId}-email`} name="email" type="email" autoComplete="email" maxLength={254} className="field" placeholder="vas@email.sk" />
          <p className="mt-1 text-xs text-forest/65">Pre prípad, že sa vám nebudeme vedieť dovolať.</p>
        </div>
        <PrivacyConsentCheckbox />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <button type="button" onClick={() => setStep(1)} disabled={loading}
            className="min-h-12 rounded-full border border-forest/20 px-4 font-semibold text-forest hover:bg-secondary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
            Späť
          </button>
          <button type="submit" disabled={loading} className="btn-coral min-h-12 min-w-0 px-4 py-3 font-bold disabled:opacity-60">
            {loading ? "Odosielam…" : "Odoslať záujem"}
          </button>
        </div>
      </div>
    </form>
  );
}
