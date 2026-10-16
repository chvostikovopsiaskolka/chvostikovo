import { useId, useState, type FormEvent } from "react";
import { correctInquiryPhone } from "@/lib/submit-inquiry";

type CorrectionAuth = { id: number; token: string } | null;

export function LeadPhoneReceipt({
  initialPhone,
  correctionAuth,
  language = "sk",
}: {
  initialPhone: string;
  correctionAuth: CorrectionAuth;
  language?: "sk" | "en";
}) {
  const inputId = useId();
  const [phone, setPhone] = useState(initialPhone);
  const [editValue, setEditValue] = useState(initialPhone);
  const [auth, setAuth] = useState(correctionAuth);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [corrected, setCorrected] = useState(false);
  const [smsQueued, setSmsQueued] = useState(false);
  const en = language === "en";

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await correctInquiryPhone(auth, editValue);
      setPhone(result.phone);
      setAuth(null);
      setCorrected(true);
      setSmsQueued(result.smsQueued);
      setEditing(false);
    } catch {
      setError(en
        ? "We could not save the correction. Please call us."
        : "Oprava čísla sa nepodarila. Prosíme, zavolajte nám.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-forest/10 bg-secondary/55 p-3 text-left">
      <p className="mb-1 text-sm font-semibold text-forest">{en ? "Is this phone number correct?" : "Je toto telefónne číslo správne?"}</p>
      <p className="text-xs leading-relaxed text-forest/70">
        {en ? "We plan to send the SMS after about 2 minutes to" : "SMS plánujeme odoslať približne o 2 minúty na číslo"}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <strong className="min-w-0 break-all text-sm text-forest">{phone}</strong>
        {auth && !editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="shrink-0 text-sm font-semibold text-coral-dark underline underline-offset-2">
            {en ? "Edit" : "Opraviť"}
          </button>
        )}
      </div>
      {editing && auth && (
        <form className="mt-3 space-y-2" onSubmit={save}>
          <label className="label-sm" htmlFor={inputId}>{en ? "Correct number" : "Správne číslo"}</label>
          <input id={inputId} type="tel" required autoComplete="tel"
            value={editValue} onChange={(e) => setEditValue(e.target.value)}
            className="field" />
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="btn-coral flex-1 px-3 py-2 text-sm disabled:opacity-60">
              {saving ? (en ? "Saving…" : "Ukladám…") : (en ? "Save number" : "Uložiť opravu")}
            </button>
            <button type="button" className="rounded-xl border border-forest/20 px-3 text-sm"
              onClick={() => { setEditing(false); setError(""); }}>
              {en ? "Back" : "Späť"}
            </button>
          </div>
        </form>
      )}
      {corrected && (
        <p role="status" className="mt-2 text-xs leading-relaxed text-forest/75">
          {smsQueued
            ? (en ? "Number updated. The SMS will be sent to your updated number." : "Kontaktné číslo sme opravili. SMS bude odoslaná na aktualizované číslo.")
            : (en ? "Number updated. If the SMS was already sent, we won't send another." : "Kontaktné číslo sme opravili. Ak už SMS odišla, ďalšiu neposielame.")}
        </p>
      )}
    </div>
  );
}
