import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";

export function ShortForm({ onSent }: { onSent?: () => void }) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
    onSent?.();
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
          Informácie o psíkovi *
        </label>
        <textarea
          id="s-info"
          name="info"
          required
          rows={3}
          className="field resize-none"
          placeholder="Vek, povaha, potreby..."
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-forest/80">
        <input type="checkbox" required className="mt-1 accent-[oklch(0.72_0.108_40)]" />
        Súhlasím so spracovaním osobných údajov.
      </label>
      <button type="submit" className="btn-coral w-full px-4 py-2.5 text-sm">
        Chcem sa informovať
      </button>

    </form>
  );
}

export function LongForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
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
          <input id="l-meno" required className="field" placeholder="Vaše meno" />
        </div>
        <div>
          <label className="label-sm" htmlFor="l-tel">
            Telefón *
          </label>
          <input id="l-tel" type="tel" required className="field" placeholder="+421" />
        </div>
      </div>
      <div>
        <label className="label-sm" htmlFor="l-email">
          Email *
        </label>
        <input id="l-email" type="email" required className="field" placeholder="vas@email.sk" />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div>
          <label className="label-sm" htmlFor="l-pes">
            Meno psa *
          </label>
          <input id="l-pes" required className="field" placeholder="Rocky" />
        </div>
        <div>
          <label className="label-sm" htmlFor="l-pohlavie">
            Pohlavie psa *
          </label>
          <select id="l-pohlavie" required className="field" defaultValue="">
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
          <input id="l-vek" required className="field" placeholder="2 roky" />
        </div>
      </div>
      <div>
        <label className="label-sm" htmlFor="l-duvod">
          Čo vás privádza do Chvostíkova? *
        </label>
        <select id="l-duvod" required className="field" defaultValue="">
          <option value="" disabled>
            Vyberte možnosť
          </option>
          <option>Psík býva sám doma</option>
          <option>Nadbytok energie</option>
          <option>Deň s psími kamarátmi</option>
          <option>Robím si prieskum</option>
          <option>Iné</option>
        </select>
      </div>
      <div>
        <label className="label-sm" htmlFor="l-viac">
          Viac o psíkovi *
        </label>
        <textarea
          id="l-viac"
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
      <button type="submit" className="btn-coral w-full">
        Odoslať
      </button>
    </form>
  );
}
