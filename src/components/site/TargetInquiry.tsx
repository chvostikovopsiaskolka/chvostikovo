import { useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { ProductInquirySteps } from "./ProductInquirySteps";
import { ProductInquiryContact } from "./ProductInquiryContact";
import type { TargetSize } from "./TargetVariantCards";
import { phoneFromForm } from "@/lib/phone";
import { submitProductInquiry } from "@/lib/product-inquiry";

const SIZE_OPTIONS: Array<{ value: TargetSize; label: string; detail: string }> = [
  { value: "large", label: "Veľký", detail: "40 × 20 cm" },
  { value: "medium", label: "Stredný", detail: "30 × 15 cm" },
  { value: "small", label: "Malý", detail: "25 × 25 cm" },
];


export function useTargetInquiry({ sourceRef, phoneId }: { sourceRef: string; phoneId: string }) {
  const submissionId = useRef(crypto.randomUUID());
  const submissionInFlight = useRef(false);
  const [size, setSize] = useState<TargetSize>("large");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [height, setHeight] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current || isSubmitted) return;

    const parsedHeight = height.trim() ? Number(height.replace(",", ".")) : null;
    if (parsedHeight !== null && (!Number.isFinite(parsedHeight) || parsedHeight < 3 || parsedHeight > 60)) {
      setFormError("Zadajte výšku targetu v centimetroch, prípadne pole nechajte prázdne.");
      return;
    }

    setFormError("");
    submissionInFlight.current = true;
    setIsSubmitting(true);

    try {
      const fd = new FormData(event.currentTarget);
      await submitProductInquiry({
        client_submission_id: submissionId.current,
        product_type: "target",
        customer_name: String(fd.get("customer_name") ?? "").trim(),
        phone: phoneFromForm(event.currentTarget, phoneId),
        email: String(fd.get("email") ?? "").trim(),
        customer_location: String(fd.get("customer_location") ?? "").trim(),
        source_ref: sourceRef,
        consent: true,
        company,
        configuration: {
          size,
          height_cm: parsedHeight,
          note,
        },
      });
      setIsSubmitted(true);
    } catch {
      setFormError("Dopyt sa nepodarilo odoslať. Skúste to, prosím, znova o chvíľu.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  const form = (isSubmitted ? (
          <div className="rounded-3xl bg-secondary/70 px-5 py-8 text-center" role="status">
            <Check className="mx-auto size-7 text-coral" />
            <p className="mt-3 font-display text-xl font-bold text-forest">
              Ďakujeme za váš záujem 🐶 Ozveme sa vám hneď, ako to bude možné.
            </p>
          </div>
        ) : (
          <ProductInquirySteps step={step} onStepChange={(next) => { setStep(next); setFormError(""); }}
            titles={["Rozmer targetu", "Úprava na mieru", "Kontakt"]}
            stepOne={(
              <div className="space-y-5">
                <div>
                  <p className="font-display text-sm font-bold text-forest">Veľkosť targetu *</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {SIZE_OPTIONS.map((option) => (
                      <button key={option.value} type="button" onClick={() => setSize(option.value)}
                        aria-pressed={size === option.value}
                        className={size === option.value
                          ? "rounded-2xl border-2 border-coral bg-coral-soft/25 p-3 text-left"
                          : "rounded-2xl border-2 border-forest/10 bg-background p-3 text-left"}>
                        <span className="font-display text-sm font-bold text-forest">{option.label}</span>
                        <span className="mt-1 block text-xs text-forest/60">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block font-display text-sm font-bold text-forest">
                  Požadovaná výška targetu v cm (voliteľné)
                  <input value={height} onChange={(event) => { setHeight(event.target.value); setFormError(""); }}
                    inputMode="decimal" placeholder="5"
                    className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans text-base font-normal outline-none focus:border-coral" />
                  <span className="mt-1 block font-sans text-xs font-normal text-forest/55">
                    Ak výšku necháte prázdnu, platí štandard približne 5 cm.
                  </span>
                </label>
              </div>
            )}
            stepTwo={(
              <label className="block font-display text-sm font-bold text-forest">
                Poznámka k výrobe (voliteľné)
                <textarea value={note} onChange={(event) => setNote(event.target.value)}
                  maxLength={1000} rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans text-base font-normal outline-none focus:border-coral"
                  placeholder="Čokoľvek, čo máme pri výrobe vedieť." />
                <span className="mt-1 block font-sans text-xs font-normal text-forest/55">
                  Pokiaľ nechcete žiadnu úpravu, pokračujte bez poznámky.
                </span>
              </label>
            )}
            stepThree={(
              <ProductInquiryContact phoneId={phoneId}
                customerName={customerName} setCustomerName={setCustomerName}
                phone={phone} setPhone={setPhone}
                email={email} setEmail={setEmail}
                company={company} setCompany={setCompany} />
            )}
            onNext={() => {
              const value = height.trim() ? Number(height.replace(",", ".")) : null;
              const valid = value === null || (Number.isFinite(value) && value >= 3 && value <= 60);
              setFormError(valid ? "" : "Zadajte výšku targetu v centimetroch (3 až 60) alebo nechajte pole prázdne.");
              return valid;
            }}
            onSubmit={sendInquiry} error={formError} submitting={isSubmitting} />
        ));
  return { form, step, isSubmitted, setSize, setStep, setFormError };
}

export function TargetInquiryInline({ sourceRef }: { sourceRef: string }) {
  const { form } = useTargetInquiry({ sourceRef, phoneId: "target-blog-phone" });
  return <div data-blog-target-inquiry>{form}</div>;
}
