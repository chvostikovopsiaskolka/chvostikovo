import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendInquiry } from "@/lib/send-inquiry.functions";

function collect(form: HTMLFormElement, labels: Record<string, string>) {
  const fd = new FormData(form);
  return Object.entries(labels).map(([name, label]) => ({
    label,
    value: String(fd.get(name) ?? ""),
  }));
}

export function ShortForm({ onSent }: { onSent?: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useServerFn(sendInquiry);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    try {
      await send({
        data: {
          typ: "informacie",
          fields: collect(form, {
            meno: "Meno majiteľa",
            telefon: "Telefón",
            plemeno: "Plemeno psíka",
            info: "Otázky",
          }),
        },
      });
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
          Ozveme sa vám čo najskôr.
        </p>
      </div>
    );
  }


  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label-sm" htmlFor="s-meno">
            Meno majiteľa *
          </label>
          <input id="s-meno" name="meno" required className="field" placeholder="Vaše meno" />
        </div>
        <div>
          <label className="label-sm" htmlFor="s-tel">
            Telefón *
          </label>
          <input
            id="s-tel"
            name="telefon"
            type="tel"
            required
            className="field"
            placeholder="+421"
          />
        </div>
      </div>
      <div>
        <label className="label-sm" htmlFor="s-plemeno">
          Plemeno psíka *
        </label>
        <input
          id="s-plemeno"
          name="plemeno"
          required
          className="field"
          placeholder="Weimarský stavač"
        />
      </div>
      <div>
        <label className="label-sm" htmlFor="s-info">
          Vaše otázky ohľadom škôlky…
        </label>
        <textarea
          id="s-info"
          name="info"
          required
          rows={3}
          className="field resize-none"
          placeholder="Napíšte nám, čo by ste chceli vedieť…"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-forest/80">
        <input type="checkbox" required className="mt-1 accent-[oklch(0.72_0.108_40)]" />
        Súhlasím so spracovaním osobných údajov.
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-coral w-full px-4 py-2.5 text-sm disabled:opacity-60">
        {loading ? "Odosielam…" : "Chcem sa informovať"}
      </button>

    </form>
  );
}

export function LongForm({ onSent }: { onSent?: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useServerFn(sendInquiry);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    try {
      await send({
        data: {
          typ: "prihlaska",
          fields: collect(form, {
            meno: "Meno a priezvisko majiteľa",
            telefon: "Telefón",
            pes: "Meno psa",
            pohlavie: "Pohlavie psa",
            vek: "Vek psa",
            duvod: "Ako plánuje využívať škôlku",
            viac: "Viac o psíkovi",
          }),
        },
      });
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
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label-sm" htmlFor="l-meno">
            Meno a priezvisko majiteľa *
          </label>
          <input id="l-meno" name="meno" required className="field" placeholder="Vaše meno" />
        </div>
        <div>
          <label className="label-sm" htmlFor="l-tel">
            Telefón *
          </label>
          <input id="l-tel" name="telefon" type="tel" required className="field" placeholder="+421" />
        </div>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div>
          <label className="label-sm" htmlFor="l-pes">
            Meno psa *
          </label>
          <input id="l-pes" name="pes" required className="field" placeholder="Rocky" />
        </div>
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
      <label className="flex items-start gap-2 text-sm text-forest/80">
        <input type="checkbox" required className="mt-1 accent-[oklch(0.72_0.108_40)]" />
        Súhlasím so spracovaním osobných údajov.
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-coral w-full disabled:opacity-60">
        {loading ? "Odosielam…" : "Prihlásiť psíka"}
      </button>
    </form>
  );
}
