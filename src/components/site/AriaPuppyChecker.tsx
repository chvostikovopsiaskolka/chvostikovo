import { useState } from "react";
import { ArrowLeft, ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { PHONE, PHONE_PRETTY } from "@/content/site";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

type Vaccine = "yes" | "no" | "unknown";
type Step = "age" | "vaccines" | "dog" | "result";
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
}: {
  onInterest: () => void;
  onInfo?: () => void;
  embedded?: boolean;
}) {
  const [step, setStep] = useState<Step>("age");
  const [age, setAge] = useState(4);
  const [breed, setBreed] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [vaccines, setVaccines] = useState<Record<string, Vaccine>>({
    rabies: "unknown", dhppi: "unknown", kennel: "unknown",
  });
  const allVaccinated = VACCINES.every(({ id }) => vaccines[id] === "yes");
  const mayContinue = age >= AGE_MINIMUM;
  const fieldClass = "mt-1 w-full min-h-11 rounded-xl border border-forest/20 bg-white px-3 py-2 text-sm text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral";
  const primaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest";
  const Container = embedded ? "div" : "section";

  function moreInfo() {
    if (onInfo) onInfo();
    else onInterest();
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
            Rýchle orientačné overenie bez AI. Definitívne prijatie potvrdíme až po kontrole očkovaní a úvodnej návšteve.
          </p>
        </div>

        <div className="rounded-[26px] border border-forest/10 bg-card p-4 shadow-card sm:p-6">
          <div className="mb-5 flex items-center justify-center gap-2" aria-label="Postup overenia">
            {(["age", "vaccines", "dog", "result"] as const).map((item, i) => (
              <span key={item} className={"h-1.5 w-12 rounded-full " + (
                (["age", "vaccines", "dog", "result"] as const).indexOf(step) >= i ? "bg-coral" : "bg-forest/15"
              )} />
            ))}
          </div>

          {step === "age" && (
            <div data-aria-puppy-step="age" className="space-y-4">
              <label htmlFor={embedded ? "aria-modal-age" : "aria-inline-age"} className="block text-center font-display text-lg font-bold text-forest">
                Koľko mesiacov má vaše šteniatko?
              </label>
              <output htmlFor={embedded ? "aria-modal-age" : "aria-inline-age"}
                className={"mx-auto block w-fit rounded-2xl px-7 py-2 font-display text-4xl font-bold " + (mayContinue ? "bg-secondary text-forest" : "bg-red-50 text-red-700")}>
                {age} {age === 1 ? "mesiac" : age < 5 ? "mesiace" : "mesiacov"}
              </output>
              <input id={embedded ? "aria-modal-age" : "aria-inline-age"} type="range" min="1" max="12" step="1" value={age}
                onChange={(event) => setAge(Number(event.target.value))}
                className="w-full cursor-pointer accent-coral" aria-label="Vek šteniatka v mesiacoch" />
              <div className="flex justify-between text-xs text-forest/60"><span>1 mesiac</span><span>12 mesiacov</span></div>
              <p role="status" className={"rounded-2xl p-3 text-sm leading-relaxed " + (mayContinue ? "bg-secondary/60 text-forest" : "bg-red-50 text-red-700")}>
                {mayContinue
                  ? "Vekovo môže pokračovať v predbežnej kontrole. Ďalej preveríme očkovania."
                  : "Zatiaľ nespĺňa orientačnú vekovú podmienku 4 mesiacov. Radi vám poradíme, kedy bude vhodné prísť."}
              </p>
              {mayContinue && (
                <label className="block text-sm font-semibold text-forest">
                  Plemeno (voliteľné)
                  <input className={fieldClass} maxLength={80} value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Napr. írsky vlkodav" />
                </label>
              )}
              {mayContinue ? (
                <button type="button" onClick={() => setStep("vaccines")} className={primaryClass + " w-full"}>
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
                  disabled={!allVaccinated} onClick={() => setStep("dog")}>Pokračovať <ArrowRight size={17} aria-hidden /></button>
              </div>
              {!allVaccinated && <ContactFallback onInfo={moreInfo} />}
            </div>
          )}

          {step === "dog" && (
            <form data-aria-puppy-step="dog" onSubmit={(event) => { event.preventDefault(); setStep("result"); }} className="space-y-4">
              <h3 className="font-display text-lg font-bold text-forest">Povedzte nám o šteniatku</h3>
              <label className="block text-sm font-semibold text-forest">Meno psíka
                <input className={fieldClass} required maxLength={70} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ako sa volá?" />
              </label>
              <label className="block text-sm font-semibold text-forest">Plemeno
                <input className={fieldClass} required maxLength={80} value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Plemeno alebo kríženec" />
              </label>
              <label className="block text-sm font-semibold text-forest">Váha v kg (nepovinné)
                <input type="number" min="0.1" max="150" step="0.1" className={fieldClass} value={weight}
                  onChange={(e) => setWeight(e.target.value)} placeholder="Napr. 12,5" />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep("vaccines")} className="grid size-11 shrink-0 place-items-center rounded-full border border-forest/20" aria-label="Späť na očkovania"><ArrowLeft size={20} aria-hidden /></button>
                <button type="submit" className={primaryClass + " flex-1"}>Zobraziť výsledok <ArrowRight size={17} aria-hidden /></button>
              </div>
            </form>
          )}

          {step === "result" && (
            <div data-aria-puppy-step="result" className="space-y-4 text-center">
              <div className="rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed text-forest">
                <strong className="block font-display text-lg">Predbežne spĺňate základné podmienky</strong>
                <p className="mt-2">{name} ({age} mesiacov){breed ? ", " + breed : ""} – vek a uvedené očkovania vyhovujú orientačnej kontrole.</p>
                <p className="mt-2">Prijatie závisí od preverenia očkovacieho preukazu, povahy a úvodnej návštevy zadarmo.</p>
              </div>
              <button type="button" className={primaryClass + " w-full"} onClick={onInterest}>
                Mám záujem – vyplniť kontakt <ArrowRight size={17} aria-hidden />
              </button>
              <p className="text-xs leading-relaxed text-forest/60">
                Následne sa otvorí existujúci kontaktný formulár. Údaje o psíkovi sa zatiaľ nikam neodosielajú, kým ich nepodporuje kontaktný backend.
              </p>
              <button type="button" className="min-h-11 text-sm font-semibold text-coral-dark underline" onClick={() => setStep("dog")}>Upraviť údaje o psíkovi</button>
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
