import { useState, type FormEvent } from "react";
import { CheckCircle2, CircleHelp, Phone, ShieldCheck } from "lucide-react";
import { PHONE, PHONE_PRETTY } from "@/content/site";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

type Vaccine = "yes" | "no" | "unknown";
const QUESTIONS = [
  { id: "rabies", title: "Besnota" },
  { id: "dhppi", title: "Infekčné ochorenia DHPPi+L (kompletná schéma)" },
  { id: "kennel", title: "Kotercový kašeľ" },
] as const;

/** Local, non-AI eligibility guide. No values are transmitted or saved. */
export function AriaPuppyChecker({ onInterest }: { onInterest: () => void }) {
  const [age, setAge] = useState("");
  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [vaccines, setVaccines] = useState<Record<string, Vaccine>>({ rabies: "unknown", dhppi: "unknown", kennel: "unknown" });
  const [outcome, setOutcome] = useState<"eligible" | "not-yet" | "uncertain" | null>(null);

  function setVaccine(id: string, value: Vaccine) {
    setVaccines(current => ({ ...current, [id]: value }));
    setOutcome(null);
  }
  function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const months = Number(age);
    if (!Number.isFinite(months) || months < 0 || months > 240) return;
    if (months < 3 || Object.values(vaccines).includes("no")) setOutcome("not-yet");
    else if (Object.values(vaccines).includes("unknown")) setOutcome("uncertain");
    else setOutcome("eligible");
  }
  const field = "w-full min-h-11 rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm text-forest focus:outline-2 focus:outline-coral";
  return (
    <section id="aria-puppy-check" className="relative scroll-mt-24 overflow-hidden bg-secondary/35 py-10 sm:py-14">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <div className="mb-5 text-center">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-coral-dark">Máte šteniatko?</p>
          <h2 className="section-title mt-1 text-2xl sm:text-4xl">Zistite, či spĺňa základné podmienky</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-forest/75">Krátka orientačná kontrola bez AI. Definitívne prijatie závisí od očkovacieho preukazu, zdravia, povahy a bezplatnej úvodnej návštevy.</p>
        </div>
        <form onSubmit={check} className="rounded-3xl border border-forest/10 bg-card p-4 shadow-card sm:p-7">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-forest">Meno psíka (nepovinné)<input className={field + " mt-1"} value={dogName} onChange={e => setDogName(e.target.value)} maxLength={45} placeholder="Aria" /></label>
            <label className="text-xs font-semibold text-forest">Vek v mesiacoch *<input type="number" min="0" max="240" required className={field + " mt-1"} value={age} onChange={e => { setAge(e.target.value); setOutcome(null); }} placeholder="Napr. 5" /></label>
            <label className="text-xs font-semibold text-forest">Plemeno (nepovinné)<input className={field + " mt-1"} value={breed} onChange={e => setBreed(e.target.value)} maxLength={65} placeholder="Plemeno" /></label>
            <label className="text-xs font-semibold text-forest">Váha v kg (nepovinné)<input type="number" min="0" max="150" step="0.1" className={field + " mt-1"} value={weight} onChange={e => setWeight(e.target.value)} placeholder="Napr. 24" /></label>
          </div>
          <div className="mt-5 space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold text-forest"><ShieldCheck size={19} aria-hidden /> Má psík tieto platné očkovania?</p>
            {QUESTIONS.map(item => (
              <fieldset key={item.id} className="rounded-2xl border border-forest/10 bg-white p-3">
                <legend className="float-left w-full text-sm font-semibold text-forest">{item.title}</legend>
                <div className="clear-both flex gap-2 pt-2">
                  {([["yes","Áno"],["no","Nie"],["unknown","Neviem"]] as const).map(([value,label]) => (
                    <label key={value} className={"flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border px-1 text-sm font-semibold " + (vaccines[item.id]===value ? "border-coral bg-secondary text-forest" : "border-forest/10 bg-card text-forest/70")}>
                      <input className="sr-only" type="radio" name={item.id} checked={vaccines[item.id]===value} onChange={() => setVaccine(item.id,value)} />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <button type="submit" className="btn-coral mt-5 min-h-12 w-full text-sm font-bold">Vyhodnotiť základné podmienky</button>
          {outcome && (
            <div aria-live="polite" role="status" className="mt-4 rounded-2xl border border-forest/15 bg-secondary/50 p-4 text-sm leading-relaxed text-forest">
              <div className="flex items-start gap-2">
                {outcome === "eligible" ? <CheckCircle2 className="mt-0.5 shrink-0 text-forest" size={21} /> : <CircleHelp className="mt-0.5 shrink-0 text-coral-dark" size={21} />}
                <div>
                  <p className="font-display font-bold">{outcome === "eligible" ? "Predbežne spĺňa základné podmienky" : outcome === "uncertain" ? "Očkovania si treba ešte overiť" : "Niektoré základné podmienky ešte nie sú splnené"}</p>
                  <p className="mt-1">{outcome === "eligible" ? "To ešte nie je potvrdenie prijatia. Ozvite sa nám a dohodneme úvodnú návštevu." : "Môžete nám zavolať alebo napísať – poradíme, čo ďalej a kedy môže byť prvá návšteva vhodná."}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={onInterest} className="btn-coral min-h-11 px-4 text-sm font-semibold">{outcome === "eligible" ? "Mám záujem o škôlku" : "Chcem sa informovať"}</button>
                <a href={"tel:" + PHONE} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-forest/20 px-4 text-sm font-semibold"><Phone size={16} aria-hidden /> {PHONE_PRETTY}</a>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-forest/60">Údaje sa vyhodnocujú iba v tomto prehliadači, nikam sa neodosielajú. Minimálny orientačný vek je 3 mesiace; platné dokončené očkovania a úvodná návšteva sú nevyhnutné.</p>
        </form>
      </div>
    </section>
  );
}
