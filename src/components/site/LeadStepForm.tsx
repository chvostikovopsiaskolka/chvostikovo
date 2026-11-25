import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { PuppyCheckInput } from "@/lib/inquiry";
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
import { InquiryDogFields } from "./InquiryDogFields";

// Shared Slovak two-step enquiry across the public website. The stored interest_reason
// intentionally matches the existing production Edge allowlist; route context stays in cta_source.
export const LEAD_STEP_INTERESTS = [
  { value: "Chcem sa informovať o škôlke", lines: ["Chcem sa", "informovať", "o škôlke"] },
  { value: "Mám záujem využívať škôlku pravidelne", lines: ["Mám záujem", "pravidelne", "využívať škôlku"] },
  { value: "Mám záujem využívať škôlku občasne", lines: ["Mám záujem", "občasne", "využívať škôlku"] },
] as const;

export function LeadStepForm({ trackingSource, onSent, questionInHeading = false, compact = false, chatReceipt = false, presetInterest, ariaPreview = true, puppyCheck, language = "sk" }: { trackingSource: string; onSent?: () => void; questionInHeading?: boolean; compact?: boolean; chatReceipt?: boolean; presetInterest?: string | undefined; ariaPreview?: boolean; puppyCheck?: PuppyCheckInput | undefined; language?: "sk" | "en" }) {
  const t = (sk:string,en:string) => language === "en" ? en : sk;
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(presetInterest ? 2 : 1);
  const [selectedInterest, setSelectedInterest] = useState(presetInterest ?? "");
  // Shared required breed and optional sex for information, regular, occasional and puppy leads.
  // Carry the puppy breed into contact, where owners may correct it.
  const [breed, setBreed] = useState(puppyCheck?.dog_breed ?? "");
  const [sent, setSent] = useState(false);
  const [receipt, setReceipt] = useState<{ phone: string; auth: { id: number; token: string } | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const progress = useFormProgress(trackingSource, language);

  // Only older engines need a class fallback for the scoped :has() rules.
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("selector(:has(*))")) return;
    const shell = formRef.current?.closest("[data-lead-form-shell]");
    if (!shell) return;
    shell.classList.toggle("lead-contact-step", step === 2 && !sent);
    return () => shell.classList.remove("lead-contact-step");
  }, [step, sent]);

  function trackStart() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource, language);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || step !== 2 || !selectedInterest) return;
    const form = event.currentTarget;
    // Read the actual form: browser autofill can omit the React onChange event.
    const breedValue = String(new FormData(form).get("plemeno") || "").trim();
    if (!breedValue) { setError(t("Vyplňte plemeno psíka.", "Enter your dog’s breed.")); return; }
    if (breedValue !== breed) setBreed(breedValue);
    const attemptId = language === "en" ? startFormAttempt(trackingSource, language) : startFormAttempt(trackingSource);
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
        plemeno: breedValue,
        ...(String(fields.get("pohlavie") || "") ? { pohlavie: String(fields.get("pohlavie")) as "male" | "female" } : {}),
        ...(puppyCheck ? { puppy_check: { ...puppyCheck, dog_breed: breedValue || undefined } } : {}),
      }, attemptId);
      void trackCookielessInteraction("form_submit", trackingSource, language, attemptId);
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
      void trackCookielessInteraction("form_error", `${trackingSource}:${diagnostic.stage}${inquiryDiagnosticSuffix(diagnostic)}`, language, attemptId);
      setError(cause instanceof InquirySubmissionError && cause.recoverySaved
        ? t("Odoslanie formulára zlyhalo, ale váš kontakt sme zachovali. Ozveme sa vám.","Submission failed, but we saved your contact details. We will get in touch.")
        : t("Odoslanie zlyhalo. Skúste to znova alebo nám zavolajte.","Submission failed. Try again or call us."));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className={(chatReceipt ? "flex flex-col items-center gap-2" : "flex min-h-75 flex-col items-center justify-center gap-3") + " text-center"} data-lead-step-success>
        {chatReceipt ? <p role="status" className="sr-only">{t("Ďakujeme za váš záujem.","Thank you for your enquiry.")}</p> : <>
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-forest">
          <Check className="size-7" aria-hidden="true" />
        </div>
        <h3 className="font-display text-xl font-bold text-forest">{t("Ďakujeme za váš záujem.","Thank you for your enquiry.")}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-forest/75">
          {t("Váš záujem sme prijali. Príde vám SMS potvrdenie o prijatí záujmu.","We received your enquiry. You will receive an SMS confirmation.")}
        </p>
        </>}
        {receipt && <LeadPhoneReceipt initialPhone={receipt.phone} correctionAuth={receipt.auth} language={language} />}
        {!chatReceipt && <div data-lead-success-links className="mt-2 flex flex-wrap justify-center gap-3 text-sm font-semibold text-forest">
          <a href={t("/#podmienky","/en/dog-daycare-kosice#requirements")} onClick={() => void trackCookielessInteraction("success_conditions_click", trackingSource, language)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-forest/20 bg-white px-4 py-2 text-forest shadow-sm hover:bg-secondary/55 focus-visible:outline-2 focus-visible:outline-coral">{t("Podmienky prijatia","Admission requirements")}</a>
          <a href={t("/#cennik","/en/dog-daycare-kosice#pricing")} onClick={() => void trackCookielessInteraction("success_pricing_click", trackingSource)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-forest/20 bg-white px-4 py-2 text-forest shadow-sm hover:bg-secondary/55 focus-visible:outline-2 focus-visible:outline-coral">{t("Cenník","Prices")}</a>
        </div>}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      data-lead-step-form
      data-lead-step={step}
      onSubmit={onSubmit}
      onInputCapture={progress.onInputCapture}
      onBlurCapture={progress.onBlurCapture}
      onInvalidCapture={progress.onInvalidCapture}
      onChangeCapture={(event) => { trackStart(); progress.onChangeCapture(event); }}
      className={(compact ? "space-y-3" : "space-y-5") + " text-left"}
    >
      <div className="space-y-2">
        <div className="flex justify-between gap-2 text-xs font-semibold text-forest/75" aria-live="polite">
          <span>{t("Krátky","Short")} <strong>{t("nezáväzný formulár","no-obligation enquiry")}</strong></span>
          <span>{language === "en" ? `Step ${step} of 2` : `Krok ${step} z 2`}</span>
        </div>
        <div role="progressbar" aria-label={t("Postup formulára","Enquiry progress")} aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} className="h-1.5 overflow-hidden rounded-full bg-forest/10">
          <div className={`h-full rounded-full bg-coral transition-all duration-300 ${step === 1 ? "w-1/2" : "w-full"}`} />
        </div>
      </div>

      <div className={step === 1 ? (compact ? "space-y-3" : "space-y-5") : "hidden"} aria-hidden={step !== 1}>
        <fieldset className="min-w-0">
          <legend className={questionInHeading ? "sr-only" : "mb-3 font-display text-lg font-bold leading-snug text-forest sm:text-xl"}>
            {t("Čo hľadáte pre svojho psíka?","What are you looking for for your dog?")}
          </legend>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {LEAD_STEP_INTERESTS.map((option) => (
              <label key={option.value} className="relative min-w-0 cursor-pointer [-webkit-tap-highlight-color:transparent]">
                <input type="radio" name="zaujem" value={option.value} required={step === 1} aria-label={language === "en" ? (["Learn more","Regular visits","Occasional visits"][LEAD_STEP_INTERESTS.indexOf(option)] ?? option.value) : option.value} defaultChecked={presetInterest === option.value}
                  onChange={() => setSelectedInterest(option.value)} className="peer sr-only" />
                <span className={`flex h-full min-w-0 flex-col items-center justify-center rounded-2xl border border-forest/15 bg-white px-1.5 text-center leading-[1.3] text-forest shadow-sm transition peer-checked:border-coral peer-checked:bg-secondary/55 peer-checked:ring-1 peer-checked:ring-coral/40 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral sm:px-3 ${compact ? "min-h-[72px] py-2 sm:min-h-24" : "min-h-24 py-3 sm:min-h-28"}`}>
                  {(language === "en" ? [["Learn more","about daycare"],["Regular","visits"],["Occasional","visits"]][LEAD_STEP_INTERESTS.indexOf(option)]! : option.lines).map((line, i) => (
                    <span key={line} className={`block max-w-full break-words text-[10.5px] [overflow-wrap:anywhere] sm:text-xs ${ariaPreview && (/informovať|pravidelne|občasne/i.test(line)) ? "font-extrabold" : i === 0 ? "font-bold" : "font-medium"}`}>
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
          {t("Pokračovať","Continue")}
        </button>
      </div>

      <div className={step === 2 ? "space-y-3.5" : "hidden"} aria-hidden={step !== 2}>
        <h3 className="font-display text-lg font-bold leading-snug text-forest sm:text-xl">{t("Kontaktné údaje","Contact details")}</h3>
        {puppyCheck && (
          <div data-puppy-check-summary className="rounded-2xl border border-forest/15 bg-secondary/50 p-3 text-xs leading-relaxed text-forest">
            <p className="font-display font-bold">{t("K záujmu pripojíme aj vyplnenú kontrolu šteniatka:","We will include your puppy readiness check:")}</p>
            <p className="mt-1">{puppyCheck.dog_name ? puppyCheck.dog_name + " · " : ""}{puppyCheck.age_months} {t("mesiacov","months")}{breed.trim() ? " · " + breed.trim() : ""}{puppyCheck.dog_weight_kg ? " · " + puppyCheck.dog_weight_kg + " kg" : ""}</p>
            <p className="mt-1">{t("Očkovania – besnota:","Vaccinations – rabies:")} {puppyCheck.vaccines.rabies === "yes" ? t("áno","yes") : puppyCheck.vaccines.rabies === "no" ? t("nie","no") : t("neviem","not sure")}; DHPPi+L: {puppyCheck.vaccines.dhppi === "yes" ? t("áno","yes") : puppyCheck.vaccines.dhppi === "no" ? t("nie","no") : t("neviem","not sure")}; {t("kotercový kašeľ:","kennel cough:")} {puppyCheck.vaccines.kennel === "yes" ? t("áno","yes") : puppyCheck.vaccines.kennel === "no" ? t("nie","no") : t("neviem","not sure")}.</p>
            <p className="mt-1 text-forest/70">{t("Údaje odošleme spolu s kontaktom až po vašom potvrdení formulára.","We send these details with your contact only when you confirm the form.")}</p>
          </div>
        )}
        <p className="text-sm leading-relaxed text-forest/70">
          {t("Nechajte nám kontakt a ozveme sa vám ohľadom vášho záujmu.","Leave your contact details and we will get in touch.")}
        </p>
        <div>
          <label className="label-sm" htmlFor={`lead-step-${formId}-meno`}>{t("Meno majiteľa *","Owner’s name *")}</label>
          <input id={`lead-step-${formId}-meno`} name="meno" autoComplete="name" required className="field" placeholder={t("Vaše meno","Your name")} />
        </div>
        <InquiryDogFields language={language} idPrefix={`lead-step-${formId}`} breed={breed} onBreedChange={(event) => setBreed(event.target.value)} />
        <PhoneField id={`lead-step-${formId}-tel`} name="telefon" language={language} label={t("Telefón *","Phone *")} />
        <div>
          <label className="label-sm" htmlFor={`lead-step-${formId}-email`}>{t("E-mail (nepovinné)","Email (optional)")}</label>
          <input id={`lead-step-${formId}-email`} name="email" type="email" autoComplete="email" maxLength={254} className="field" placeholder={t("vas@email.sk","you@example.com")} />
          <p className="mt-1 text-xs text-forest/65">{t("Pre prípad, že sa vám nebudeme vedieť dovolať.","In case we cannot reach you by phone.")}</p>
        </div>
        <PrivacyConsentCheckbox language={language} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className={puppyCheck ? "grid grid-cols-1 gap-2" : "grid grid-cols-[auto_minmax(0,1fr)] gap-2"}>
          {!puppyCheck && <button type="button" onClick={() => setStep(1)} disabled={loading}
            className="min-h-12 rounded-full border border-forest/20 px-4 font-semibold text-forest hover:bg-secondary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral">
            {t("Späť","Back")}
          </button>}
          <button type="submit" disabled={loading} className="btn-coral min-h-12 min-w-0 px-4 py-3 font-bold disabled:opacity-60">
            {loading ? t("Odosielam…","Sending…") : t("Odoslať záujem","Send enquiry")}
          </button>
        </div>
      </div>
    </form>
  );
}
