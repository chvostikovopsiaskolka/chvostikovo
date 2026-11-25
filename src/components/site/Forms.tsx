import { currentSourceRef } from "@/lib/tracking-sanitization";
import { HOME_FAQ_CONTACT_SOURCE, type PuppyCheckInput } from "@/lib/inquiry";
import { useFormProgress } from "@/lib/form-progress";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackAriaQuestionSubmit, trackFaqContactSubmit, trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { startFormAttempt, trackCookielessInteraction, trackAriaChatAction } from "@/lib/cookieless-interactions";
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
      if (!breed) {
        if (trackingSource === "lead_landing_aria_chat_puppy_contact") trackAriaChatAction("form_error", "puppy_contact", attemptId);
        setError("Vyplňte plemeno psíka."); setLoading(false); return;
      }
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
    const container = formRef.current?.closest<HTMLElement>("[data-aria-chat-history]");
    if (container && formRef.current) {
      container.scrollTop += formRef.current.getBoundingClientRect().top -
        container.getBoundingClientRect().top - 12;
    }
  }, [step, isAria]);
  function trackStart() {
    if (started.current) return;
    started.current = true;
    if (isAria) {
      if (source === "lead_landing_aria_chat_other") trackAriaChatAction("form_start", "other");
      onStarted?.();
    }
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
      if (source === "lead_landing_aria_chat_other") attemptId = startFormAttempt(source);
      const phone = phoneFromForm(form, id + "-tel");
      if (source !== "lead_landing_aria_chat_other") attemptId = startFormAttempt(source);
      await submitInquiry({
        typ: "informacie", consent: true,
        source_ref: sourceRef(), ...attributionPayload(), cta_source: source,
        meno: name, telefon: phone, email,
        zaujem: "Chcem sa informovať o škôlke", otazka: question.trim(),
      }, attemptId);
      setSent(true);
      runFormTelemetry(() => {
        if (isAria) {
          if (source === "lead_landing_aria_chat_other") trackAriaChatAction("form_submit", "other", attemptId);
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
  language = "sk",
}: {
  label: string;
  name: string;
  options: readonly [string, string];
  language?: "sk" | "en";
}) {
  const display = (option: string) => language === "en" ? ({ Pes: "Male", Suka: "Female", Áno: "Yes", Nie: "No" } as Record<string, string>)[option] ?? option : option === "Suka" ? "Fena" : option;
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
              aria-label={display(option)}
              required
              className="peer sr-only"
            />
            <span className="flex min-h-11 items-center justify-center rounded-[0.85rem] border border-border bg-white px-2 py-2.5 text-center text-base font-semibold text-forest transition-colors peer-checked:border-coral peer-checked:bg-secondary/55">
              {display(option)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function LongForm({ onSent, collapsible = false, onExpand, language = "sk" }: { onSent?: () => void; collapsible?: boolean; onExpand?: () => void; language?: "sk" | "en" }) {
  const t = (sk: string, en: string) => language === "en" ? en : sk;
  const formId = useId();
  const [sent, setSent] = useState(false);
  const [expanded, setExpanded] = useState(!collapsible);
  const [receipt, setReceipt] = useState<{ phone: string; auth: { id: number; token: string } | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dogCount, setDogCount] = useState<1 | 2>(1);
  const [step, setStep] = useState<1 | 2>(1);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const trackingSource = "application_form";
  const progress = useFormProgress(trackingSource, language);

  function onFormChange() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource, language);
  }

  function goToStep(next: 1 | 2) {
    setStep(next);
    window.requestAnimationFrame(() => {
      const heading = stepHeading.current;
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }

  function invalidField(group: Element | null) {
    return Array.from(group?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea") ?? [])
      .find((field) => field.willValidate && !field.validity.valid);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A collapsed preview must never submit incomplete registration data.
    if (!expanded) return;
    if (loading) return;
    const form = e.currentTarget;
    const invalidDog = invalidField(form.querySelector("[data-application-dog-step]"));
    if (invalidDog) {
      if (step === 2) {
        setStep(1);
        window.requestAnimationFrame(() => invalidDog.reportValidity());
      } else invalidDog.reportValidity();
      return;
    }
    if (step === 1) { goToStep(2); return; }
    const invalidOwner = invalidField(form.querySelector("[data-application-owner-step]"));
    if (invalidOwner) { invalidOwner.reportValidity(); return; }
    progress.markAttempt();
    const attemptId = startFormAttempt(trackingSource, language);
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

      void trackCookielessInteraction("form_submit", trackingSource, language, attemptId);
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
      void trackCookielessInteraction("form_error", `${trackingSource}:${diagnostic.stage}${inquiryDiagnosticSuffix(diagnostic)}`, language, attemptId);
      setError(error instanceof InquirySubmissionError && error.recoverySaved ? t("Odoslanie formulára zlyhalo, ale váš kontakt sme zachovali. Ozveme sa vám.", "Submission failed, but we have saved your contact details. We will get in touch.") : t("Odoslanie zlyhalo. Skúste to znova alebo nám zavolajte.", "Submission failed. Please try again or call us."));
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
        <h3 className="text-xl text-forest">{t("Prihláška odoslaná", "Application submitted")}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t("O úspešnom prijatí prihlášky vás budeme informovať SMS.", "You will receive an SMS confirming receipt of your application.")}
        </p>
        {receipt && <LeadPhoneReceipt initialPhone={receipt.phone} correctionAuth={receipt.auth} language={language} />}
      </div>
    );
  }

  const details = (
    <>
      {dogCount === 2 && <h4 className="mt-4 border-b border-coral/20 pb-2 text-base font-bold text-forest">{t("1. psík", "Dog 1")}</h4>}
      <div className="grid min-w-0 grid-cols-1 items-end gap-3.5 @min-[350px]:grid-cols-2" data-application-dog-row="identity">
        <div className="min-w-0">
          <label className="label-sm" htmlFor={`l-${formId}-pes`}>
            {t("Meno psa *", "Dog's name *")}
          </label>
          <input id={`l-${formId}-pes`} name="pes" autoComplete="off" required className="field" placeholder="Rocky" />
      </div>
        <div className="min-w-0">
          <label className="label-sm" htmlFor={`l-${formId}-plemeno`}>
            {t("Plemeno *", "Breed *")}
          </label>
          <input
            id={`l-${formId}-plemeno`}
            name="plemeno"
            required
            className="field"
            placeholder="Labrador"
          />
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 items-end gap-3.5 @min-[350px]:grid-cols-2" data-application-dog-row="age-weight">
        <div className="min-w-0">
          <label className="label-sm" htmlFor={`l-${formId}-vek`}>
            {t("Vek psa *", "Age *")}
          </label>
          <input id={`l-${formId}-vek`} name="vek" required className="field" placeholder={t("2 roky", "2 years")} />
        </div>
        <div className="min-w-0">
          <label className="label-sm" htmlFor={`l-${formId}-vaha`}>{t("Váha psa *", "Weight *")}</label>
          <input id={`l-${formId}-vaha`} name="vaha" inputMode="decimal" required className="field" placeholder="25 kg" />
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 items-end gap-3.5 @min-[350px]:grid-cols-2" data-application-dog-row="sex-neuter">
        <DogBinaryChoice language={language} label={t("Pohlavie psa", "Sex")} name="pohlavie" options={["Pes", "Suka"]} />
        <DogBinaryChoice language={language} label={t("Kastrovaný / sterilizovaná", "Neutered / spayed")} name="kastrovana" options={["Áno", "Nie"]} />
      </div>
      <fieldset className="min-w-0">
        <legend className="label-sm">{t("Ako plánujete využívať škôlku? *", "How often will your dog attend daycare? *")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "Pravidelne – 1× alebo viackrát týždenne", lines: ["Pravidelne", "1× alebo viackrát", "týždenne"], enLines: ["Regularly", "Once or more", "per week"], enLabel: "Regularly – once or more per week" },
            { value: "Občas podľa potreby", lines: ["Občas", "podľa potreby"], enLines: ["Occasionally", "as needed"], enLabel: "Occasionally as needed" },
          ] as const).map((option) => (
            <label key={option.value} className="relative min-w-0 cursor-pointer [-webkit-tap-highlight-color:transparent]">
              <input type="radio" name="duvod" value={option.value} aria-label={t(option.value, option.enLabel)} required className="peer sr-only" />
              <span className="flex h-full min-h-20 min-w-0 flex-col items-center justify-center rounded-[0.85rem] border border-border bg-white px-1 py-2 text-center text-[11px] leading-[1.25] font-semibold text-forest transition-colors peer-checked:border-coral peer-checked:bg-secondary/55 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral sm:text-xs">
                {(language === "en" ? option.enLines : option.lines).map((line, index) => (
                  <span key={line} className={`block max-w-full break-words [overflow-wrap:anywhere] ${index === 0 || option.value === "Občas podľa potreby" ? "text-xs font-bold sm:text-[13px]" : "text-[10px] font-normal sm:text-[11px]"}`}>{line}</span>
                ))}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label-sm" htmlFor={`l-${formId}-alergie`}>
          {t("Alergie a zdravotné obmedzenia", "Allergies and health conditions")}
        </label>
        <textarea
          id={`l-${formId}-alergie`}
          name="alergie"
          maxLength={3000}
          rows={3}
          className="field resize-none"
          placeholder={t("Alergie, lieky alebo zdravotné obmedzenia...", "Allergies, medication or health conditions...")}
        />
      </div>
      <div>
        <label className="label-sm" htmlFor={`l-${formId}-povaha`}>
          {t("Povaha a ďalšie informácie *", "Temperament and other information *")}
        </label>
        <textarea
          id={`l-${formId}-povaha`}
          name="povaha"
          required
          maxLength={3000}
          rows={4}
          className="field resize-none"
          placeholder={t("Povaha, skúsenosti s inými psami, zvyky a čo by sme ešte mali vedieť...", "Temperament, experience with other dogs, habits and anything else we should know...")}
        />
      </div>
      {dogCount === 2 && (
        <section aria-label={t("Údaje druhého psíka", "Second dog details")} className="@container mt-5 min-w-0 space-y-3.5 rounded-2xl border border-coral/20 bg-card/60 p-3.5 sm:p-4">
          <h4 className="border-b border-coral/20 pb-2 text-base font-bold text-forest">{t("2. psík", "Dog 2")}</h4>
          <div className="grid min-w-0 grid-cols-1 items-end gap-3.5 @min-[350px]:grid-cols-2" data-application-dog-row="identity">
            <div className="min-w-0">
            <label className="label-sm" htmlFor={`l-${formId}-pes2`}>{t("Meno druhého psa *", "Second dog's name *")}</label>
            <input id={`l-${formId}-pes2`} name="pes2" autoComplete="off" required maxLength={200} className="field" placeholder="Beny" />
          </div>
            <div className="min-w-0">
              <label className="label-sm" htmlFor={`l-${formId}-plemeno2`}>{t("Plemeno *", "Breed *")}</label>
              <input id={`l-${formId}-plemeno2`} name="plemeno2" required maxLength={200} className="field" placeholder={t("Zlatý retriever", "Golden retriever")} />
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-1 items-end gap-3.5 @min-[350px]:grid-cols-2" data-application-dog-row="age-weight">
            <div className="min-w-0">
              <label className="label-sm" htmlFor={`l-${formId}-vek2`}>{t("Vek psa *", "Age *")}</label>
              <input id={`l-${formId}-vek2`} name="vek2" required maxLength={100} className="field" placeholder={t("3 roky", "3 years")} />
            </div>
            <div className="min-w-0">
              <label className="label-sm" htmlFor={`l-${formId}-vaha2`}>{t("Váha psa *", "Weight *")}</label>
              <input id={`l-${formId}-vaha2`} name="vaha2" required inputMode="decimal" className="field" placeholder="25 kg" />
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-1 items-end gap-3.5 @min-[350px]:grid-cols-2" data-application-dog-row="sex-neuter">
            <DogBinaryChoice language={language} label={t("Pohlavie psa", "Sex")} name="pohlavie2" options={["Pes", "Suka"]} />
            <DogBinaryChoice language={language} label={t("Kastrovaný / sterilizovaná", "Neutered / spayed")} name="kastrovana2" options={["Áno", "Nie"]} />
          </div>
          <div>
            <label className="label-sm" htmlFor={`l-${formId}-alergie2`}>{t("Alergie a zdravotné obmedzenia", "Allergies and health conditions")}</label>
            <textarea id={`l-${formId}-alergie2`} name="alergie2" maxLength={3000} rows={3} className="field resize-none" placeholder={t("Alergie, lieky alebo zdravotné obmedzenia...", "Allergies, medication or health conditions...")} />
          </div>
          <div>
            <label className="label-sm" htmlFor={`l-${formId}-povaha2`}>{t("Povaha a ďalšie informácie *", "Temperament and other information *")}</label>
            <textarea id={`l-${formId}-povaha2`} name="povaha2" required maxLength={3000} rows={4} className="field resize-none" placeholder={t("Povaha, skúsenosti s inými psami, zvyky...", "Temperament, experience with other dogs, habits...")} />
          </div>
        </section>
      )}
    </>
  );

  return (
    <form noValidate data-application-form data-application-step={step} onSubmit={onSubmit} onInputCapture={progress.onInputCapture} onBlurCapture={progress.onBlurCapture} onInvalidCapture={progress.onInvalidCapture} onChangeCapture={(e) => { onFormChange(); progress.onChangeCapture(e); }} className="@container min-w-0 space-y-3 text-left sm:space-y-3.5">
      {collapsible && (
        <button id="home-friendship-application" type="button"
          aria-expanded={expanded} aria-controls={`l-${formId}-details`}
          className="btn-coral w-full" onClick={() => {
            if (!expanded) onExpand?.();
            setExpanded(!expanded);
          }}>
          {expanded ? t("Zobraziť menej", "Show less") : t("Zobraziť celú prihlášku", "Show full application")}
        </button>
      )}
      <fieldset id={`l-${formId}-details`} hidden={!expanded} disabled={!expanded} className="min-w-0 space-y-3.5 border-0 p-0">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-forest/75">
            <span>{t("Prihláška do škôlky", "Daycare application")}</span><span>{language === "en" ? `Step ${step} of 2` : `Krok ${step} z 2`}</span>
          </div>
          <div role="progressbar" aria-label={t("Postup prihlášky", "Application progress")} aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} className="h-1.5 overflow-hidden rounded-full bg-forest/10">
            <div className={`h-full rounded-full bg-coral transition-all duration-300 ${step === 1 ? "w-1/2" : "w-full"}`} />
          </div>
        </div>
        <h3 ref={stepHeading} tabIndex={-1} className="font-display text-lg font-bold text-forest outline-none">{step === 1 ? t("Údaje o psíkovi", "Dog details") : t("Údaje majiteľa", "Owner details")}</h3>
        <div data-application-dog-step hidden={step !== 1} className="space-y-3.5">
      <fieldset className="rounded-2xl border border-coral/25 bg-secondary/30 p-3.5">
        <legend className="px-1 text-sm font-bold text-forest">{t("Koľkých psíkov chcete prihlásiť?", "How many dogs would you like to register?")}</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {([1, 2] as const).map((count) => (
            <label key={count} className={`flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition sm:px-3 sm:text-sm ${dogCount === count ? "border-coral bg-white text-forest" : "border-forest/15 bg-card text-forest/75"}`}>
              <input type="radio" name="pocet_psikov" value={count} checked={dogCount === count} onChange={() => setDogCount(count)} aria-label={count === 1 ? t("Chcem prihlásiť jedného psíka", "Register one dog") : t("Chcem prihlásiť dvoch psíkov", "Register two dogs")} className="shrink-0 accent-orange-500" />
              <span className="whitespace-nowrap sm:hidden">{count === 1 ? t("1 psík", "1 dog") : t("2 psíkov", "2 dogs")}</span>
              <span className="hidden whitespace-nowrap sm:inline">{count === 1 ? t("Prihlásiť jedného psíka", "Register one dog") : t("Prihlásiť dvoch psíkov", "Register two dogs")}</span>
            </label>
          ))}
        </div>
      </fieldset>
          {details}
          <button type="submit" className="btn-coral w-full">{t("Pokračovať", "Continue")}</button>
        </div>
        <div data-application-owner-step hidden={step !== 2} className="space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-meno`}>
            {t("Meno a priezvisko majiteľa *", "Owner's full name *")}
          </label>
          <input id={`l-${formId}-meno`} name="meno" autoComplete="name" required className="field" placeholder={t("Vaše meno", "Your full name")} />
        </div>
        <PhoneField id={`l-${formId}-tel`} name="telefon" language={language} label={t("Telefón *", "Phone *")} />
      </div>
      <PrivacyConsentCheckbox language={language} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-coral w-full disabled:opacity-60">
        {loading ? t("Odosielam…", "Sending…") : t("Prihlásiť psíka", "Submit application")}
      </button>
          <button type="button" disabled={loading} onClick={() => goToStep(1)} className="min-h-11 w-full rounded-full border border-forest/20 px-4 font-semibold text-forest hover:bg-secondary/50">{t("Späť", "Back")}</button>
        </div>
      </fieldset>
    </form>
  );
}
