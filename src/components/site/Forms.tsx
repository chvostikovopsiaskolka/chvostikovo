import { currentSourceRef } from "@/lib/tracking-sanitization";
import { HOME_FAQ_CONTACT_SOURCE, type PuppyCheckInput } from "@/lib/inquiry";
import { useFormProgress } from "@/lib/form-progress";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackAriaQuestionSubmit, trackFaqContactSubmit, trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { startFormAttempt, trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";
import { PhoneField } from "./PhoneField";
import { LeadPhoneReceipt } from "./LeadPhoneReceipt";
import { InquiryDogFields } from "./InquiryDogFields";
import { phoneFromForm } from "@/lib/phone";
import { InquirySubmissionError, reportInquiryError, runFormTelemetry, inquiryDiagnosticSuffix } from "@/lib/form-errors";

function sourceRef() { return currentSourceRef("/"); }

function attributionPayload() {
  const attribution = getTrafficAttribution();
  return {
    landing_page: attribution.landing_page,
    referrer: attribution.referrer,
    traffic_source: attribution.source,
    traffic_medium: attribution.medium,
    utm_campaign: attribution.campaign,
    utm_term: attribution.term,
    utm_content: attribution.content,
  };
}

export function ShortForm({
  onSent,
  trackingSource,
  hideInterest = false,
  showChatDogFields = false,
  showQuestionField = false,
  puppyCheck,
  interestValue = "Informačný formulár – záujem o psiu škôlku",
}: {
  onSent?: () => void;
  trackingSource?: string;
  hideInterest?: boolean;
  showChatDogFields?: boolean;
  showQuestionField?: boolean;
  puppyCheck?: PuppyCheckInput;
  interestValue?: string;
}) {
  const formId = useId();
  const [sent, setSent] = useState(false);
  const [receipt, setReceipt] = useState<{ phone: string; auth: { id: number; token: string } | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const progress = useFormProgress(trackingSource || "informational_form");
  const shouldTrackForm = Boolean(trackingSource);
  const isTrackedLanding =
    trackingSource?.startsWith("lead_landing_") === true ||
    trackingSource?.startsWith("puppy_landing_") === true;

  function onFormChange() {
    if (!shouldTrackForm || formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource || "informational_form");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    progress.markAttempt();
    const attemptId = startFormAttempt(trackingSource || "informational_form");
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(form);
      const source_ref = sourceRef();
      const attribution = attributionPayload();
      const submittedPhone = phoneFromForm(form, `s-${formId}-tel`);
      const dogName = showChatDogFields ? String(fd.get("pes_meno") || "").trim() : "";
      const breed = String(fd.get("plemeno") || "").trim();
      if (!breed) { setError("Vyplňte plemeno psíka."); setLoading(false); return; }
      const submission = await submitInquiry({
        typ: "informacie",
        consent: true,
        source_ref,
        ...attribution,
        cta_source: trackingSource,
        meno: String(fd.get("meno") ?? "").trim(),
        telefon: submittedPhone,
        email: String(fd.get("email") ?? "").trim() || undefined,
        ...(showQuestionField ? { otazka: String(fd.get("otazka") ?? "").trim() } : {}),
        zaujem: hideInterest ? interestValue + (dogName && !puppyCheck ? " – Meno psíka: " + dogName : "") : String(fd.get("zaujem") ?? ""),
        plemeno: breed,
        ...(String(fd.get("pohlavie") || "") ? { pohlavie: String(fd.get("pohlavie")) as "male" | "female" } : {}),
        ...(puppyCheck ? { puppy_check: { ...puppyCheck, ...(dogName ? { dog_name: dogName } : {}), ...(breed ? { dog_breed: breed } : {}) } } : {}),
      }, attemptId);
      if (showQuestionField) {
        void trackCookielessInteraction("explore_daycare", trackingSource?.startsWith("lead_landing_")
          ? "lead_landing_aria_chat_other_question_submitted" : "aria_preview_v3_chat_other_question_submitted", "sk");
      } else {
        void trackCookielessInteraction("form_submit", trackingSource || "informational_form", "sk", attemptId);
      }
      runFormTelemetry(() => {
        if (showQuestionField) {
          // Contact only: measure separately, never count as GA4 generate_lead
          // nor Meta Pixel Lead. The backend also excludes Meta CAPI.
          trackAriaQuestionSubmit(trackingSource || "aria_preview_chat_other");
        } else {
          trackFormSubmit({
            formType: "informacie",
            sourceRef: source_ref,
            trafficSource: attribution.traffic_source,
            trafficMedium: attribution.traffic_medium,
            landingPage: attribution.landing_page,
            ...(trackingSource ? { ctaSource: trackingSource } : {}),
          });
          trackMetaFormConversion("informacie", trackingSource, submission.metaEventId);
        }
      });
      progress.markSuccess();
      setReceipt({ phone: submittedPhone, auth: submission.phoneCorrection });
      setSent(true);
      runFormTelemetry(() => onSent?.());
    } catch (error) {
      const diagnostic = reportInquiryError(error);
      void trackCookielessInteraction("form_error", `${trackingSource || "informational_form"}:${diagnostic.stage}${inquiryDiagnosticSuffix(diagnostic)}`, "sk", attemptId);
      setError(error instanceof InquirySubmissionError && error.recoverySaved ? "Odoslanie formulára zlyhalo, ale váš kontakt sme zachovali. Ozveme sa vám." : "Odoslanie zlyhalo. Skúste to znova alebo nám zavolajte.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div data-aria-chat-contact-success={showChatDogFields ? "true" : undefined} className="flex min-h-75 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-forest">
          <Check className="size-7" />
        </div>
        <h3 className="text-xl text-forest">{showQuestionField ? "Ďakujeme za otázku." : "Ďakujeme za váš záujem."}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {showQuestionField ? "Otázku sme prijali. Ozveme sa vám na uvedený kontakt, keď to bude možné." : "Váš záujem sme prijali. Príde vám SMS potvrdenie o prijatí záujmu."}
        </p>
        {receipt && <LeadPhoneReceipt initialPhone={receipt.phone} correctionAuth={receipt.auth} />}
        {isTrackedLanding && !showChatDogFields && !showQuestionField && (
          <div className="mt-2 w-full max-w-sm rounded-2xl bg-secondary/55 p-4">
            <p className="text-sm leading-relaxed text-forest/75">
              Kým sa vám ozveme, môžete si pozrieť podmienky prijatia psíka alebo náš cenník.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a
                href="/#podmienky"
                onClick={() => void trackCookielessInteraction("success_conditions_click", trackingSource || "lead_landing_form")}
                className="rounded-xl border border-forest/15 bg-card px-3 py-2 text-sm font-bold text-forest transition hover:border-coral/40"
              >
                Pozrieť podmienky
              </a>
              <a
                href="/#cennik"
                onClick={() => void trackCookielessInteraction("success_pricing_click", trackingSource || "lead_landing_form")}
                className="rounded-xl border border-forest/15 bg-card px-3 py-2 text-sm font-bold text-forest transition hover:border-coral/40"
              >
                Pozrieť cenník
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onInputCapture={progress.onInputCapture} onBlurCapture={progress.onBlurCapture} onInvalidCapture={progress.onInvalidCapture} onChangeCapture={(e) => { onFormChange(); progress.onChangeCapture(e); }} className="space-y-3 text-left sm:space-y-3.5">
      <div>
        <label className="label-sm" htmlFor={`s-${formId}-meno`}>
          Meno majiteľa *
        </label>
        <input id={`s-${formId}-meno`} name="meno" autoComplete="name" required className="field" placeholder="Vaše meno" />
      </div>
      <InquiryDogFields idPrefix={`s-${formId}`} />
      {showChatDogFields && (
        <>
          <div>
            <label className="label-sm" htmlFor={`s-${formId}-pes_meno`}>Meno psíka (nepovinné)</label>
            <input id={`s-${formId}-pes_meno`} name="pes_meno" type="text" maxLength={70}
              className="field" autoComplete="off" placeholder="Napr. Bella" />
          </div>
        </>
      )}
      {!showQuestionField && <PhoneField id={`s-${formId}-tel`} name="telefon" />}
      <div>
        <label className="label-sm" htmlFor={`s-${formId}-email`}>{showQuestionField ? "E-mail *" : "E-mail (nepovinné)"}</label>
        <input id={`s-${formId}-email`} name="email" type="email" autoComplete="email" maxLength={254} className="field" placeholder="vas@email.sk" required={showQuestionField} />
        <p className="mt-1 text-xs text-forest/65">{showQuestionField ? "Na tento e-mail vám odpovieme." : "Pre prípad, že sa vám nebudeme vedieť dovolať."}</p>
      </div>
      {!hideInterest && (
        <fieldset className="min-w-0">
          <legend className="label-sm">O čo máte záujem? *</legend>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {([
              { value: "Chcem sa dozvedieť viac o psej škôlke", lines: ["Chcem zistiť", "viac o škôlke"] },
              { value: "Mám záujem o pravidelné návštevy", lines: ["Pravidelné", "návštevy"] },
              { value: "Potrebujem škôlku občas", lines: ["Občas podľa", "potreby"] },
            ] as const).map((option) => (
              <label key={option.value} className="relative min-w-0 cursor-pointer [-webkit-tap-highlight-color:transparent]">
                <input type="radio" name="zaujem" value={option.value} aria-label={option.value} required className="peer sr-only" />
                <span className="flex h-full min-h-16 min-w-0 flex-col items-center justify-center rounded-[0.85rem] border border-border bg-white px-1 py-2 text-center text-[11px] leading-[1.25] font-semibold text-forest transition-colors peer-checked:border-coral peer-checked:bg-secondary/55 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral sm:text-xs">
                  {option.lines.map((line, index) => (
                    <span key={line} className={`block max-w-full break-words [overflow-wrap:anywhere] ${index === 0 || option.value === "Potrebujem škôlku občas" ? "text-xs font-bold sm:text-[13px]" : "text-[10px] font-normal sm:text-[11px]"}`}>{line}</span>
                  ))}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {showQuestionField && <PhoneField id={`s-${formId}-tel`} name="telefon" />}
      {showQuestionField && (
        <div data-aria-other-question-field>
          <label className="label-sm" htmlFor={`s-${formId}-otazka`}>Vaša otázka *</label>
          <textarea id={`s-${formId}-otazka`} name="otazka" rows={4}
            minLength={5} maxLength={600} required
            className="field w-full resize-y" placeholder="Napíšte nám, čo vás zaujíma…" />
        </div>
      )}
      <PrivacyConsentCheckbox />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-coral w-full px-4 py-2.5 text-sm disabled:opacity-60"
      >
        {loading ? "Odosielam…" : showQuestionField ? "Odoslať otázku" : showChatDogFields ? "Odoslať záujem" : "Chcem sa informovať"}
      </button>
    </form>
  );
}

/** Shared two-step contact question for homepage and Aria, never a paid Lead conversion. */
export function HomeFaqContactForm({
  source = HOME_FAQ_CONTACT_SOURCE, compact = false, onStarted, onSent,
}: {
  source?: typeof HOME_FAQ_CONTACT_SOURCE | "aria_preview_chat_other" | "lead_landing_aria_chat_other";
  compact?: boolean;
  onStarted?: () => void;
  onSent?: () => void;
}) {
  const isAria = source !== HOME_FAQ_CONTACT_SOURCE;
  const formRef = useRef<HTMLFormElement>(null);
  const startPrefix = source === "aria_preview_chat_other" ? "aria_preview_v3_chat"
    : "lead_landing_aria_chat";
  const id = useId();
  const [step, setStep] = useState<1 | 2>(1);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const started = useRef(false);
  // Only the Aria internal scroll owner moves; the homepage/LEAD forms keep
  // their existing page scroll and browser autofill behavior.
  useEffect(() => {
    if (!isAria) return;
    const container = formRef.current?.closest<HTMLElement>("[data-aria-chat-form-scroll]");
    if (container) container.scrollTop = 0;
  }, [step, isAria]);
  function trackStart() {
    if (started.current) return;
    started.current = true;
    if (isAria) onStarted?.();
    else void trackCookielessInteraction("explore_daycare", source + "_started");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      if (question.trim().length < 5 || question.trim().length > 600) {
        setError("Napíšte otázku v dĺžke 5 až 600 znakov.");
        return;
      }
      trackStart();
      setError(null);
      setStep(2);
      return;
    }
    if (inFlight.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const name = String(data.get("meno") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!name || !email || question.trim().length < 5) {
      setError("Vyplňte otázku a všetky kontaktné údaje.");
      return;
    }
    inFlight.current = true;
    setLoading(true);
    setError(null);
    let attemptId: string | undefined;
    try {
      const phone = phoneFromForm(form, id + "-tel");
      attemptId = startFormAttempt(source);
      await submitInquiry({
        typ: "informacie", consent: true,
        source_ref: sourceRef(), ...attributionPayload(), cta_source: source,
        meno: name, telefon: phone, email,
        zaujem: "Chcem sa informovať o škôlke", otazka: question.trim(),
      }, attemptId);
      setSent(true);
      runFormTelemetry(() => {
        if (isAria) {
          trackAriaQuestionSubmit(source);
          onSent?.();
        } else {
          void trackCookielessInteraction("explore_daycare", source + "_submitted", "sk", attemptId);
          trackFaqContactSubmit(source);
        }
      });
    } catch (cause) {
      const diagnostic = reportInquiryError(cause);
      void trackCookielessInteraction("form_error", source + ":" + diagnostic.stage + inquiryDiagnosticSuffix(diagnostic), "sk", attemptId);
      setError(cause instanceof InquirySubmissionError && cause.stage === "phone_normalization"
        ? "Skontrolujte telefónne číslo."
        : "Správu sa nepodarilo odoslať. Skúste to znova alebo nám zavolajte.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }
  if (sent) return (
    <div data-home-faq-contact-success role="status" className="py-5 text-center">
      <Check className="mx-auto mb-3 size-8 text-forest" aria-hidden="true" />
      <h3 className="font-display text-xl font-bold text-forest">Ďakujeme!</h3>
      <p className="mt-2 text-sm leading-relaxed text-forest/80">Vašu správu sme prijali a odpovieme vám čo najskôr, ako to bude možné.</p>
    </div>
  );
  return (
    <form ref={formRef} data-home-faq-contact-form data-aria-contact-wizard={isAria ? "true" : undefined}
      data-step={step} onSubmit={submit}
      className={compact ? "space-y-3 text-left" : "space-y-4 text-left"}>
      <div>
        <p className="mb-2 text-xs font-semibold text-forest/75">Krok {step} z 2</p>
        <div role="progressbar" aria-label="Postup kontaktného formulára" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step} className="h-1.5 overflow-hidden rounded-full bg-forest/10">
          <div className={"h-full rounded-full bg-coral " + (step === 1 ? "w-1/2" : "w-full")} />
        </div>
      </div>
      <fieldset hidden={step !== 1} disabled={step !== 1} className="min-w-0 space-y-3">
        <label className="label-sm" htmlFor={id + "-question"}>Vaša otázka *</label>
        <textarea id={id + "-question"} name="otazka" value={question} onChange={event => { setQuestion(event.target.value); trackStart(); }}
          rows={compact ? 3 : 4} required minLength={5} maxLength={600} className="field w-full resize-y" placeholder="Napíšte nám, čo vás zaujíma…" />
        <button type="submit" className="btn-coral min-h-12 w-full px-4 py-3 font-bold">Pokračovať</button>
      </fieldset>
      <fieldset hidden={step !== 2} disabled={step !== 2 || loading} className="min-w-0 space-y-3">
        <h4 className="font-display font-bold text-forest">Kontaktné údaje</h4>
        <div>
          <label className="label-sm" htmlFor={id + "-name"}>Meno *</label>
          <input id={id + "-name"} name="meno" required maxLength={200} autoComplete="name" className="field" placeholder="Vaše meno" />
        </div>
        <PhoneField id={id + "-tel"} name="telefon" />
        <div>
          <label className="label-sm" htmlFor={id + "-email"}>E-mail *</label>
          <input id={id + "-email"} name="email" type="email" required maxLength={254} autoComplete="email" className="field" placeholder="vas@email.sk" />
        </div>
        <PrivacyConsentCheckbox />
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <button type="button" onClick={() => { setStep(1); setError(null); }} className="min-h-12 rounded-full border border-forest/20 px-4 font-semibold text-forest">Späť</button>
          <button type="submit" disabled={loading} className="btn-coral min-h-12 min-w-0 px-4 py-3 font-bold disabled:opacity-60">{loading ? "Odosielam…" : "Poslať"}</button>
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

/** Inline binary choices avoid the dark iOS native picker sheet in the application. */
function DogBinaryChoice({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly [string, string];
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="label-sm">{label} *</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label key={option} className="form-binary-choice-v292 relative min-w-0 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              aria-label={option === "Suka" ? "Fena" : option}
              required
              className="peer sr-only"
            />
            <span className="flex min-h-11 items-center justify-center rounded-[0.85rem] border border-border bg-white px-2 py-2.5 text-center text-base font-semibold text-forest transition-colors peer-checked:border-coral peer-checked:bg-secondary/55">
              {option === "Suka" ? "Fena" : option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function LongForm({ onSent }: { onSent?: () => void }) {
  const formId = useId();
  const [sent, setSent] = useState(false);
  const [receipt, setReceipt] = useState<{ phone: string; auth: { id: number; token: string } | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dogCount, setDogCount] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const trackingSource = "application_form";
  const progress = useFormProgress(trackingSource);

  function onFormChange() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    progress.markAttempt();
    const attemptId = startFormAttempt(trackingSource);
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(form);
      const source_ref = sourceRef();
      const attribution = attributionPayload();
      const submittedPhone = phoneFromForm(form, `l-${formId}-tel`);
      const submission = await submitInquiry({
        typ: "prihlaska",
        consent: true,
        source_ref,
        ...attribution,
        meno: String(fd.get("meno") ?? "").trim(),
        telefon: submittedPhone,
        dog_count: String(dogCount) as "1" | "2",
        ...(dogCount === 2 ? {
          pes2: String(fd.get("pes2") ?? "").trim(),
          plemeno2: String(fd.get("plemeno2") ?? "").trim(),
          vaha2: String(fd.get("vaha2") ?? "").trim(),
          pohlavie2: String(fd.get("pohlavie2") ?? ""),
          vek2: String(fd.get("vek2") ?? "").trim(),
          kastrovana2: String(fd.get("kastrovana2") ?? ""),
          alergie2: String(fd.get("alergie2") ?? "").trim(),
          povaha2: String(fd.get("povaha2") ?? "").trim(),
        } : {}),
        pes: String(fd.get("pes") ?? "").trim(),
        plemeno: String(fd.get("plemeno") ?? "").trim(),
        vaha: String(fd.get("vaha") ?? "").trim(),
        pohlavie: String(fd.get("pohlavie") ?? ""),
        vek: String(fd.get("vek") ?? "").trim(),
        kastrovana: String(fd.get("kastrovana") ?? ""),
        duvod: String(fd.get("duvod") ?? ""),
        alergie: String(fd.get("alergie") ?? "").trim(),
        povaha: String(fd.get("povaha") ?? "").trim(),
      }, attemptId);

      void trackCookielessInteraction("form_submit", trackingSource, "sk", attemptId);
      runFormTelemetry(() => {
        trackFormSubmit({
          formType: "prihlaska",
          sourceRef: source_ref,
          trafficSource: attribution.traffic_source,
          trafficMedium: attribution.traffic_medium,
          landingPage: attribution.landing_page,
        });
        trackMetaFormConversion("prihlaska", undefined, submission.metaEventId);
      });
      progress.markSuccess();
      setReceipt({ phone: submittedPhone, auth: submission.phoneCorrection });
      setSent(true);
      runFormTelemetry(() => onSent?.());
    } catch (error) {
      const diagnostic = reportInquiryError(error);
      void trackCookielessInteraction("form_error", `${trackingSource}:${diagnostic.stage}${inquiryDiagnosticSuffix(diagnostic)}`, "sk", attemptId);
      setError(error instanceof InquirySubmissionError && error.recoverySaved ? "Odoslanie formulára zlyhalo, ale váš kontakt sme zachovali. Ozveme sa vám." : "Odoslanie zlyhalo. Skúste to znova alebo nám zavolajte.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-forest">
          <Check className="size-7" />
        </div>
        <h3 className="text-xl text-forest">Prihláška odoslaná</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          O úspešnom prijatí prihlášky vás budeme informovať SMS.
        </p>
        {receipt && <LeadPhoneReceipt initialPhone={receipt.phone} correctionAuth={receipt.auth} />}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onInputCapture={progress.onInputCapture} onBlurCapture={progress.onBlurCapture} onInvalidCapture={progress.onInvalidCapture} onChangeCapture={(e) => { onFormChange(); progress.onChangeCapture(e); }} className="space-y-3 text-left sm:space-y-3.5">
      <fieldset className="rounded-2xl border border-coral/25 bg-secondary/30 p-3.5">
        <legend className="px-1 text-sm font-bold text-forest">Koľkých psíkov chcete prihlásiť?</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {([1, 2] as const).map((count) => (
            <label key={count} className={`flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition sm:px-3 sm:text-sm ${dogCount === count ? "border-coral bg-white text-forest" : "border-forest/15 bg-card text-forest/75"}`}>
              <input type="radio" name="pocet_psikov" value={count} checked={dogCount === count} onChange={() => setDogCount(count)} aria-label={count === 1 ? "Chcem prihlásiť jedného psíka" : "Chcem prihlásiť dvoch psíkov"} className="shrink-0 accent-orange-500" />
              <span className="whitespace-nowrap sm:hidden">{count === 1 ? "1 psík" : "2 psíkov"}</span>
              <span className="hidden whitespace-nowrap sm:inline">{count === 1 ? "Prihlásiť jedného psíka" : "Prihlásiť dvoch psíkov"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-meno`}>
            Meno a priezvisko majiteľa *
          </label>
          <input id={`l-${formId}-meno`} name="meno" autoComplete="name" required className="field" placeholder="Vaše meno" />
        </div>
        <PhoneField id={`l-${formId}-tel`} name="telefon" />
      </div>
      {dogCount === 2 && <h4 className="mt-4 border-b border-coral/20 pb-2 text-base font-bold text-forest">1. psík</h4>}
      <div>
          <label className="label-sm" htmlFor={`l-${formId}-pes`}>
            Meno psa *
          </label>
          <input id={`l-${formId}-pes`} name="pes" autoComplete="off" required className="field" placeholder="Rocky" />
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-plemeno`}>
            Plemeno *
          </label>
          <input
            id={`l-${formId}-plemeno`}
            name="plemeno"
            required
            className="field"
            placeholder="Labrador"
          />
        </div>
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-vaha`}>Váha psa *</label>
          <input id={`l-${formId}-vaha`} name="vaha" inputMode="decimal" required className="field" placeholder="25 kg" />
        </div>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <DogBinaryChoice label="Pohlavie psa" name="pohlavie" options={["Pes", "Suka"]} />
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-vek`}>
            Vek psa *
          </label>
          <input id={`l-${formId}-vek`} name="vek" required className="field" placeholder="2 roky" />
        </div>
      </div>
      <DogBinaryChoice label="Kastrovaný / sterilizovaná" name="kastrovana" options={["Áno", "Nie"]} />
      <fieldset className="min-w-0">
        <legend className="label-sm">Ako plánujete využívať škôlku? *</legend>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {([
            { value: "Pravidelne – 1× alebo viackrát týždenne", lines: ["Pravidelne", "1× alebo viackrát", "týždenne"] },
            { value: "Občas podľa potreby", lines: ["Občas", "podľa potreby"] },
            { value: "Jednorazové stráženie", lines: ["Jednorazové", "stráženie"] },
          ] as const).map((option) => (
            <label key={option.value} className="relative min-w-0 cursor-pointer [-webkit-tap-highlight-color:transparent]">
              <input type="radio" name="duvod" value={option.value} aria-label={option.value} required className="peer sr-only" />
              <span className="flex h-full min-h-20 min-w-0 flex-col items-center justify-center rounded-[0.85rem] border border-border bg-white px-1 py-2 text-center text-[11px] leading-[1.25] font-semibold text-forest transition-colors peer-checked:border-coral peer-checked:bg-secondary/55 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral sm:text-xs">
                {option.lines.map((line, index) => (
                  <span key={line} className={`block max-w-full break-words [overflow-wrap:anywhere] ${index === 0 || option.value === "Občas podľa potreby" ? "text-xs font-bold sm:text-[13px]" : "text-[10px] font-normal sm:text-[11px]"}`}>{line}</span>
                ))}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label-sm" htmlFor={`l-${formId}-alergie`}>
          Alergie a zdravotné obmedzenia
        </label>
        <textarea
          id={`l-${formId}-alergie`}
          name="alergie"
          maxLength={3000}
          rows={3}
          className="field resize-none"
          placeholder="Alergie, lieky alebo zdravotné obmedzenia..."
        />
      </div>
      <div>
        <label className="label-sm" htmlFor={`l-${formId}-povaha`}>
          Povaha a ďalšie informácie *
        </label>
        <textarea
          id={`l-${formId}-povaha`}
          name="povaha"
          required
          maxLength={3000}
          rows={4}
          className="field resize-none"
          placeholder="Povaha, skúsenosti s inými psami, zvyky a čo by sme ešte mali vedieť..."
        />
      </div>
      {dogCount === 2 && (
        <section aria-label="Údaje druhého psíka" className="mt-5 space-y-3.5 rounded-2xl border border-coral/20 bg-card/60 p-3.5 sm:p-4">
          <h4 className="border-b border-coral/20 pb-2 text-base font-bold text-forest">2. psík</h4>
          <div>
            <label className="label-sm" htmlFor={`l-${formId}-pes2`}>Meno druhého psa *</label>
            <input id={`l-${formId}-pes2`} name="pes2" autoComplete="off" required maxLength={200} className="field" placeholder="Beny" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="label-sm" htmlFor={`l-${formId}-plemeno2`}>Plemeno *</label>
              <input id={`l-${formId}-plemeno2`} name="plemeno2" required maxLength={200} className="field" placeholder="Zlatý retriever" />
            </div>
            <div>
              <label className="label-sm" htmlFor={`l-${formId}-vaha2`}>Váha psa *</label>
              <input id={`l-${formId}-vaha2`} name="vaha2" required inputMode="decimal" className="field" placeholder="25 kg" />
            </div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <DogBinaryChoice label="Pohlavie psa" name="pohlavie2" options={["Pes", "Suka"]} />
            <div>
              <label className="label-sm" htmlFor={`l-${formId}-vek2`}>Vek psa *</label>
              <input id={`l-${formId}-vek2`} name="vek2" required maxLength={100} className="field" placeholder="3 roky" />
            </div>
          </div>
          <DogBinaryChoice label="Kastrovaný / sterilizovaná" name="kastrovana2" options={["Áno", "Nie"]} />
          <div>
            <label className="label-sm" htmlFor={`l-${formId}-alergie2`}>Alergie a zdravotné obmedzenia</label>
            <textarea id={`l-${formId}-alergie2`} name="alergie2" maxLength={3000} rows={3} className="field resize-none" placeholder="Alergie, lieky alebo zdravotné obmedzenia..." />
          </div>
          <div>
            <label className="label-sm" htmlFor={`l-${formId}-povaha2`}>Povaha a ďalšie informácie *</label>
            <textarea id={`l-${formId}-povaha2`} name="povaha2" required maxLength={3000} rows={4} className="field resize-none" placeholder="Povaha, skúsenosti s inými psami, zvyky..." />
          </div>
        </section>
      )}
      <PrivacyConsentCheckbox />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-coral w-full disabled:opacity-60">
        {loading ? "Odosielam…" : "Prihlásiť psíka"}
      </button>
    </form>
  );
}
