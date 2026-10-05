import { useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { getTrafficAttribution } from "@/lib/traffic-source";
import { trackFormSubmit, trackMetaFormConversion } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";
import { PhoneField } from "./PhoneField";

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
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formStarted = useRef(false);
  const isTrackedLanding =
    trackingSource?.startsWith("lead_landing_") === true ||
    trackingSource?.startsWith("puppy_landing_") === true;

  function onFormFocus() {
    if (!isTrackedLanding || formStarted.current) return;
    formStarted.current = true;
    void trackCookielessInteraction("form_start", trackingSource || "landing_form");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const source_ref = sourceRef();
    const attribution = attributionPayload();
    setLoading(true);
    setError(null);
    try {
      const submission = await submitInquiry({
        typ: "informacie",
        consent: true,
        source_ref,
        ...attribution,
        cta_source: trackingSource,
        meno: String(fd.get("meno") ?? "").trim(),
        telefon: String(fd.get("telefon") ?? "").trim(),
        zaujem: hideInterest ? interestValue : String(fd.get("zaujem") ?? ""),
      });
      trackFormSubmit({
        formType: "informacie",
        sourceRef: source_ref,
        trafficSource: attribution.traffic_source,
        trafficMedium: attribution.traffic_medium,
        landingPage: attribution.landing_page,
        ctaSource: trackingSource,
      });
      trackMetaFormConversion("informacie", trackingSource, submission.metaEventId);
      if (isTrackedLanding) {
        void trackCookielessInteraction("form_submit", trackingSource || "landing_form");
      }
      setSent(true);
      onSent?.();
    } catch {
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
        <h3 className="text-xl text-forest">Ďakujeme!</h3>
        <p className="text-sm text-muted-foreground">
          Váš záujem sme prijali. Ozveme sa vám čo najskôr.
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
                Podmienky prijatia
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
    <form onSubmit={onSubmit} onFocusCapture={onFormFocus} className="space-y-3 text-left sm:space-y-3.5">
      <div>
        <label className="label-sm" htmlFor="s-meno">
          Meno majiteľa *
        </label>
        <input id="s-meno" name="meno" required className="field" placeholder="Vaše meno" />
      </div>
      <PhoneField id="s-tel" name="telefon" />
      {!hideInterest && (
        <div>
          <label className="label-sm" htmlFor="s-zaujem">
            O čo máte záujem? *
          </label>
          <select id="s-zaujem" name="zaujem" required className="field" defaultValue="">
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
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const fd = new FormData(e.currentTarget);
    const source_ref = sourceRef();
    const attribution = attributionPayload();
    setLoading(true);
    setError(null);
    try {
      const submission = await submitInquiry({
        typ: "prihlaska",
        consent: true,
        source_ref,
        ...attribution,
        meno: String(fd.get("meno") ?? "").trim(),
        telefon: String(fd.get("telefon") ?? "").trim(),
        pes: String(fd.get("pes") ?? "").trim(),
        plemeno_vaha: String(fd.get("plemeno_vaha") ?? "").trim(),
        pohlavie: String(fd.get("pohlavie") ?? ""),
        vek: String(fd.get("vek") ?? "").trim(),
        kastrovana: String(fd.get("kastrovana") ?? ""),
        duvod: String(fd.get("duvod") ?? ""),
        viac: String(fd.get("viac") ?? "").trim(),
      });

      trackFormSubmit({
        formType: "prihlaska",
        sourceRef: source_ref,
        trafficSource: attribution.traffic_source,
        trafficMedium: attribution.traffic_medium,
        landingPage: attribution.landing_page,
      });
      trackMetaFormConversion("prihlaska", undefined, submission.metaEventId);
      setSent(true);
      onSent?.();
    } catch {
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
        <p className="text-sm text-muted-foreground">
          Ozveme sa vám a dohodneme zoznamovaciu návštevu.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left sm:space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
        <div>
          <label className="label-sm" htmlFor="l-meno">
            Meno a priezvisko majiteľa *
          </label>
          <input id="l-meno" name="meno" required className="field" placeholder="Vaše meno" />
        </div>
        <PhoneField id="l-tel" name="telefon" />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label-sm" htmlFor="l-pes">
            Meno psa *
          </label>
          <input id="l-pes" name="pes" required className="field" placeholder="Rocky" />
        </div>
        <div>
          <label className="label-sm" htmlFor="l-plemeno-vaha">
            Plemeno a váha psa *
          </label>
          <input
            id="l-plemeno-vaha"
            name="plemeno_vaha"
            required
            className="field"
            placeholder="Labrador, cca 25 kg"
          />
        </div>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label-sm" htmlFor="l-pohlavie">
            Pohlavie psa *
          </label>
          <select id="l-pohlavie" name="pohlavie" required className="field" defaultValue="">
            <option value="" disabled>
              Vyberte
            </option>
            <option>Pes</option>
            <option>Fenka</option>
          </select>
        </div>
        <div>
          <label className="label-sm" htmlFor="l-vek">
            Vek psa *
          </label>
          <input id="l-vek" name="vek" required className="field" placeholder="2 roky" />
        </div>
      </div>
      <div>
        <label className="label-sm" htmlFor="l-kastrovana">
          Kastrovaný / sterilizovaná *
        </label>
        <select id="l-kastrovana" name="kastrovana" required className="field" defaultValue="">
          <option value="" disabled>
            Vyberte
          </option>
          <option>Áno</option>
          <option>Nie</option>
        </select>
      </div>
      <div>
        <label className="label-sm" htmlFor="l-duvod">
          Ako plánujete využívať škôlku? *
        </label>
        <select id="l-duvod" name="duvod" required className="field" defaultValue="">
          <option value="" disabled>
            Vyberte možnosť
          </option>
          <option>Pravidelne – 1 až 2× týždenne</option>
          <option>Občas podľa potreby</option>
          <option>Jednorazové stráženie</option>
        </select>
      </div>
      <div>
        <label className="label-sm" htmlFor="l-viac">
          Viac o psíkovi *
        </label>
        <textarea
          id="l-viac"
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
