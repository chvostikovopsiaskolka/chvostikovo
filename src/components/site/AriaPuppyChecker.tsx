import { useState, type CSSProperties } from "react";
import type { PuppyCheckInput } from "@/lib/inquiry";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { ArrowLeft, ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { PHONE, PHONE_PRETTY } from "@/content/site";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

type Vaccine = "yes" | "no" | "unknown";
type Step = "age" | "vaccines";
const VACCINES = [
  { id: "rabies", label: "Besnota" },
  { id: "dhppi", label: "DHPPi+L – kompletná schéma" },
  { id: "kennel", label: "Kotercový kašeľ" },
] as const;
const AGE_MINIMUM = 4; // Explicit preview guidance; final admission is decided individually.

export function AriaPuppyChecker({
  onInterest,
  onInfo,
  embedded = false,
  trackingSource,
  initialAnswers,
}: {
  onInterest: (details: PuppyCheckInput) => void;
  onInfo?: (details: PuppyCheckInput) => void;
  embedded?: boolean;
  trackingSource?: string;
  initialAnswers?: PuppyCheckInput;
}) {
  const [step, setStep] = useState<Step>(initialAnswers ? "vaccines" : "age");
  const [age, setAge] = useState(initialAnswers?.age_months ?? 4);
  const [vaccines, setVaccines] = useState<Record<string, Vaccine>>(initialAnswers?.vaccines ?? {
    rabies: "unknown", dhppi: "unknown", kennel: "unknown",
  });
  const allVaccinated = VACCINES.every(({ id }) => vaccines[id] === "yes");
  const mayContinue = age >= AGE_MINIMUM;
  const primaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest";
  const Container = embedded ? "div" : "section";

  // Keep the three separately reported vaccination answers; do not imply an
  // unselected/unknown vaccine is confirmed. No submission occurs in this checker.
  function snapshot(): PuppyCheckInput {
    // Age and three explicit vaccination answers move to the existing contact.
    // Breed is entered once, in that shared contact form.
    return {
      age_months: age,
      vaccines: {
        rabies: vaccines["rabies"] ?? "unknown",
        dhppi: vaccines["dhppi"] ?? "unknown",
        kennel: vaccines["kennel"] ?? "unknown",
      },
    };
  }

  function moreInfo() {
    if (onInfo) onInfo(snapshot());
    else onInterest(snapshot());
  }

  return (
    <Container id={embedded ? undefined : "aria-puppy-check"}
      data-aria-puppy-embedded={embedded ? "true" : undefined}
      className={embedded ? "bg-transparent pb-2" : "relative scroll-mt-24 overflow-hidden bg-secondary/35 py-10 sm:py-14"}>
      {!embedded && <SectionAmbientPaws />}
      <div className={embedded ? "relative z-10" : "relative z-10 mx-auto max-w-3xl px-4"}>
        <div className="mb-5 text-center">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-coral-dark">Máte šteniatko?</p>
          <h2 className="section-title mt-1 text-2xl sm:text-3xl">Spĺňa základné podmienky?</h2>
          <p className="mt-2 text-sm leading-relaxed text-forest/70">
            Rýchle orientačné overenie. Definitívne prijatie potvrdíme až po kontrole očkovania a úvodnej návšteve.
          </p>
        </div>

        <div className="rounded-[26px] border border-forest/10 bg-card p-4 shadow-card sm:p-6">
          <div className="mb-5 flex items-center justify-center gap-2" aria-label="Postup overenia">
            {(["age", "vaccines"] as const).map((item, i) => (
              <span key={item} className={"h-1.5 w-12 rounded-full " + (
                (["age", "vaccines"] as const).indexOf(step) >= i ? "bg-coral" : "bg-forest/15"
              )} />
            ))}
          </div>

          {step === "age" && (
            <div data-aria-puppy-step="age" className="space-y-4">
              <label htmlFor={embedded ? "aria-modal-age" : "aria-inline-age"} className="block text-center font-display text-lg font-bold text-forest">
                Koľko mesiacov má vaše šteniatko?
              </label>
              <output htmlFor={embedded ? "aria-modal-age" : "aria-inline-age"}
                className={"mx-auto block w-fit rounded-2xl px-7 py-2 font-display text-2xl font-bold sm:text-3xl " + (mayContinue ? "bg-secondary text-forest" : "bg-red-50 text-red-700")}>
                {age} {age === 1 ? "mesiac" : age < 5 ? "mesiace" : "mesiacov"}
              </output>
              <input id={embedded ? "aria-modal-age" : "aria-inline-age"} type="range" min="1" max="12" step="1" value={age}
                onChange={(event) => setAge(Number(event.target.value))}
                className="aria-puppy-range w-full cursor-pointer" style={{ "--aria-puppy-progress": `${((age - 1) / 11) * 100}%` } as CSSProperties} aria-label="Vek šteniatka v mesiacoch" />
              <div className="flex justify-between text-xs text-forest/60"><span>1 mesiac</span><span>12 mesiacov</span></div>
              <p role="status" className={"rounded-2xl p-3 text-sm leading-relaxed " + (mayContinue ? "bg-secondary/60 text-forest" : "bg-red-50 text-red-700")}>
                {mayContinue
                  ? "Vekovo môže pokračovať v predbežnej kontrole. Ďalej preveríme očkovania."
                  : "Zatiaľ nespĺňa orientačnú vekovú podmienku 4 mesiacov. Radi vám poradíme, kedy bude vhodné prísť."}
              </p>
              {mayContinue ? (
                <button type="button" onClick={() => {
                  if (trackingSource) void trackCookielessInteraction("explore_daycare", trackingSource + "_age_complete");
                  setStep("vaccines");
                }} className={primaryClass + " w-full"}>
                  Pokračovať na očkovania <ArrowRight size={17} aria-hidden />
                </button>
              ) : <ContactFallback onInfo={moreInfo} />}
            </div>
          )}

          {step === "vaccines" && (
            <div data-aria-puppy-step="vaccines" className="space-y-4">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-forest"><ShieldCheck aria-hidden size={22} /> Má šteniatko platné očkovania?</h3>
              {VACCINES.map(({ id, label }) => (
                <fieldset key={id} className="rounded-2xl border border-forest/10 bg-white/75 p-3">
                  <legend className="float-left w-full text-sm font-bold text-forest">{label}</legend>
                  <div className="clear-both grid grid-cols-3 gap-2 pt-2">
                    {([["yes", "Áno"], ["no", "Nie"], ["unknown", "Neviem"]] as const).map(([val, text]) => (
                      <label key={val} className={"flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold " +
                        (vaccines[id] === val ? "border-coral bg-secondary text-forest" : "border-forest/15 text-forest/70")}>
                        <input type="radio" className="sr-only" name={(embedded ? "modal-" : "inline-") + id} checked={vaccines[id] === val}
                          onChange={() => setVaccines((prev) => ({ ...prev, [id]: val }))} />{text}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              {!allVaccinated && (
                <p role="status" className="rounded-xl bg-secondary/50 p-3 text-sm text-forest/75">
                  Pokračovať môžete po potvrdení všetkých troch očkovaní. Ak ich ešte nemáte alebo si nie ste istí, ozvite sa nám.
                </p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep("age")} className="grid size-11 shrink-0 place-items-center rounded-full border border-forest/20" aria-label="Späť na vek">
                  <ArrowLeft size={20} aria-hidden />
                </button>
                <button type="button" className={primaryClass + " flex-1 disabled:cursor-not-allowed disabled:opacity-45"}
                  disabled={!allVaccinated} onClick={() => onInterest(snapshot())}>Pokračovať na kontakt <ArrowRight size={17} aria-hidden /></button>
              </div>
              {allVaccinated && (
                <p role="status" className="text-xs leading-relaxed text-forest/70">
                  Orientačné overenie je splnené. Finálne prijatie potvrdíme po kontrole očkovacieho preukazu a úvodnej návšteve. Plemeno zadáte až v nasledujúcom kontakte.
                </p>
              )}
              {!allVaccinated && <ContactFallback onInfo={moreInfo} />}
            </div>
          )}

        </div>
      </div>
    </Container>
  );
}

function ContactFallback({ onInfo }: { onInfo: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={onInfo} className="min-h-11 rounded-full border border-forest/20 bg-white px-4 text-sm font-semibold text-forest">
        Chcem sa informovať
      </button>
      <a href={"tel:" + PHONE} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-4 text-sm font-semibold text-white">
        <Phone size={16} aria-hidden /> {PHONE_PRETTY}
      </a>
    </div>
  );
}
