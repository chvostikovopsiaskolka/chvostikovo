import { useId, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { startFormAttempt, trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";
import { PhoneField } from "./PhoneField";
import { phoneFromForm } from "@/lib/phone";
import { reportInquiryError, runFormTelemetry } from "@/lib/form-errors";

function sourceRef() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}` || "/";
}

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
  interestValue = "Informačný formulár – záujem o psiu škôlku",
}: {
  onSent?: () => void;
  trackingSource?: string;
  hideInterest?: boolean;
  interestValue?: string;
}) {
  const formId = useId();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
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
    const attemptId = startFormAttempt(trackingSource || "informational_form");
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(form);
      const source_ref = sourceRef();
      const attribution = attributionPayload();
      const submission = await submitInquiry({
        typ: "informacie",
        consent: true,
        source_ref,
        ...attribution,
        cta_source: trackingSource,
        meno: String(fd.get("meno") ?? "").trim(),
        telefon: phoneFromForm(form, `s-${formId}-tel`),
        zaujem: hideInterest ? interestValue : String(fd.get("zaujem") ?? ""),
      }, attemptId);
      void trackCookielessInteraction("form_submit", trackingSource || "informational_form", "sk", attemptId);
      runFormTelemetry(() => {
        trackFormSubmit({
          formType: "informacie",
          sourceRef: source_ref,
          trafficSource: attribution.traffic_source,
          trafficMedium: attribution.traffic_medium,
          landingPage: attribution.landing_page,
          ...(trackingSource ? { ctaSource: trackingSource } : {}),
        });
        trackMetaFormConversion("informacie", trackingSource, submission.metaEventId);
      });
      setSent(true);
      runFormTelemetry(() => onSent?.());
    } catch (error) {
      const diagnostic = reportInquiryError(error);
      void trackCookielessInteraction("form_error", `${trackingSource || "informational_form"}:${diagnostic.stage}${"status" in diagnostic ? `:${diagnostic.status}` : ""}`, "sk", attemptId);
      setError("Odoslanie zlyhalo. Skúste to znova alebo nám zavolajte.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-75 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-forest">
          <Check className="size-7" />
        </div>
        <h3 className="text-xl text-forest">Ďakujeme za váš záujem.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Ozveme sa vám späť do 24 hodín.
        </p>
        {isTrackedLanding && (
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
    <form onSubmit={onSubmit} onChangeCapture={onFormChange} className="space-y-3 text-left sm:space-y-3.5">
      <div>
        <label className="label-sm" htmlFor={`s-${formId}-meno`}>
          Meno majiteľa *
        </label>
        <input id={`s-${formId}-meno`} name="meno" autoComplete="name" required className="field" placeholder="Vaše meno" />
      </div>
      <PhoneField id={`s-${formId}-tel`} name="telefon" />
      {!hideInterest && (
        <div>
          <label className="label-sm" htmlFor={`s-${formId}-zaujem`}>
            O čo máte záujem? *
          </label>
          <select id={`s-${formId}-zaujem`} name="zaujem" required className="field" defaultValue="">
            <option value="" disabled>
              Vyberte možnosť
            </option>
            <option>Chcem sa dozvedieť viac o psej škôlke</option>
            <option>Mám záujem o pravidelné návštevy</option>
            <option>Potrebujem škôlku občas</option>
            <option>Potrebujem jednorazové stráženie</option>
          </select>
        </div>
      )}
      <PrivacyConsentCheckbox />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-coral w-full px-4 py-2.5 text-sm disabled:opacity-60"
      >
        {loading ? "Odosielam…" : "Chcem sa informovať"}
      </button>
    </form>
  );
}

export function LongForm({ onSent }: { onSent?: () => void }) {
  const formId = useId();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const trackingSource = "application_form";

  function onFormChange() {
    if (formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    const attemptId = startFormAttempt(trackingSource);
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(form);
      const source_ref = sourceRef();
      const attribution = attributionPayload();
      const submission = await submitInquiry({
        typ: "prihlaska",
        consent: true,
        source_ref,
        ...attribution,
        meno: String(fd.get("meno") ?? "").trim(),
        telefon: phoneFromForm(form, `l-${formId}-tel`),
        pes: String(fd.get("pes") ?? "").trim(),
        plemeno: String(fd.get("plemeno") ?? "").trim(),
        vaha: String(fd.get("vaha") ?? "").trim(),
        pohlavie: String(fd.get("pohlavie") ?? ""),
        vek: String(fd.get("vek") ?? "").trim(),
        kastrovana: String(fd.get("kastrovana") ?? ""),
        duvod: String(fd.get("duvod") ?? ""),
        viac: String(fd.get("viac") ?? "").trim(),
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
      setSent(true);
      runFormTelemetry(() => onSent?.());
    } catch (error) {
      const diagnostic = reportInquiryError(error);
      void trackCookielessInteraction("form_error", `${trackingSource}:${diagnostic.stage}${"status" in diagnostic ? `:${diagnostic.status}` : ""}`, "sk", attemptId);
      setError("Odoslanie zlyhalo. Skúste to znova alebo nám zavolajte.");
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
          Ozveme sa vám do 24 hodín a preberieme s vami detaily úvodnej návštevy.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onChangeCapture={onFormChange} className="space-y-3 text-left sm:space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-meno`}>
            Meno a priezvisko majiteľa *
          </label>
          <input id={`l-${formId}-meno`} name="meno" autoComplete="name" required className="field" placeholder="Vaše meno" />
        </div>
        <PhoneField id={`l-${formId}-tel`} name="telefon" />
      </div>
      <div>
          <label className="label-sm" htmlFor={`l-${formId}-pes`}>
            Meno psa *
          </label>
          <input id={`l-${formId}-pes`} name="pes" required className="field" placeholder="Rocky" />
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
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-pohlavie`}>
            Pohlavie psa *
          </label>
          <select id={`l-${formId}-pohlavie`} name="pohlavie" required className="field" defaultValue="">
            <option value="" disabled>
              Vyberte
            </option>
            <option>Pes</option>
            <option>Fenka</option>
          </select>
        </div>
        <div>
          <label className="label-sm" htmlFor={`l-${formId}-vek`}>
            Vek psa *
          </label>
          <input id={`l-${formId}-vek`} name="vek" required className="field" placeholder="2 roky" />
        </div>
      </div>
      <div>
        <label className="label-sm" htmlFor={`l-${formId}-kastrovana`}>
          Kastrovaný / sterilizovaná *
        </label>
        <select id={`l-${formId}-kastrovana`} name="kastrovana" required className="field" defaultValue="">
          <option value="" disabled>
            Vyberte
          </option>
          <option>Áno</option>
          <option>Nie</option>
        </select>
      </div>
      <div>
        <label className="label-sm" htmlFor={`l-${formId}-duvod`}>
          Ako plánujete využívať škôlku? *
        </label>
        <select id={`l-${formId}-duvod`} name="duvod" required className="field" defaultValue="">
          <option value="" disabled>
            Vyberte možnosť
          </option>
          <option>Pravidelne – 1 až 2× týždenne</option>
          <option>Občas podľa potreby</option>
          <option>Jednorazové stráženie</option>
        </select>
      </div>
      <div>
        <label className="label-sm" htmlFor={`l-${formId}-viac`}>
          Viac o psíkovi *
        </label>
        <textarea
          id={`l-${formId}-viac`}
          name="viac"
          required
          rows={4}
          className="field resize-none"
          placeholder="Povaha, skúsenosti s inými psami, zdravotný stav..."
        />
      </div>
      <PrivacyConsentCheckbox />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-coral w-full disabled:opacity-60">
        {loading ? "Odosielam…" : "Prihlásiť psíka"}
      </button>
    </form>
  );
}
