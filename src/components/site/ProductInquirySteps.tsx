import type { FormEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, Send } from "lucide-react";

interface ProductInquiryStepsProps {
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  titles: readonly [string, string, string];
  stepOne: ReactNode;
  stepTwo: ReactNode;
  stepThree: ReactNode;
  onNext?: () => boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  error?: string;
  submitting?: boolean;
}

/** Shared guided product inquiry; only the last step submits the existing backend payload. */
export function ProductInquirySteps({
  step, onStepChange, titles, stepOne, stepTwo, stepThree,
  onNext, onSubmit, error, submitting = false,
}: ProductInquiryStepsProps) {
  return (
    <form onSubmit={onSubmit} data-product-inquiry-steps data-step={step}>
      <nav aria-label="Postup dopytu" className="mb-6 flex items-center gap-1.5 sm:gap-2">
        {titles.map((name, index) => {
          const number = (index + 1) as 1 | 2 | 3;
          return (
            <div key={name} aria-current={step === number ? "step" : undefined}
              className={`min-w-0 flex-1 rounded-xl px-1.5 py-2 text-center transition sm:px-3 ${step === number ? "bg-coral-soft/35 text-forest ring-1 ring-coral/60" : step > number ? "bg-secondary text-forest" : "bg-secondary/45 text-forest/50"}`}>
              <span className="block font-display text-sm font-bold">{number} / 3</span>
              <span className="mt-0.5 block text-[10px] font-semibold leading-tight sm:text-xs">{name}</span>
            </div>
          );
        })}
      </nav>

      <h3 className="mb-4 font-display text-xl font-bold text-forest sm:text-2xl">{titles[step - 1]}</h3>
      <div key={step} className="min-w-0">
        {step === 1 ? stepOne : step === 2 ? stepTwo : stepThree}
      </div>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-6 flex items-center gap-3">
        {step > 1 && (
          <button type="button" onClick={() => onStepChange((step - 1) as 1 | 2)}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-2xl border border-forest/15 bg-background px-4 font-display text-sm font-bold text-forest">
            <ArrowLeft aria-hidden="true" className="size-4" /> Späť
          </button>
        )}
        {step < 3 ? (
          <button type="button" onClick={() => {
            if (step === 1 && onNext && !onNext()) return;
            onStepChange((step + 1) as 2 | 3);
          }}
            className="btn-coral inline-flex min-h-12 flex-1 items-center justify-center gap-2 font-display font-bold">
            Pokračovať <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <button type="submit" disabled={submitting}
            className="btn-coral inline-flex min-h-12 flex-1 items-center justify-center gap-2 font-display font-bold disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
            {submitting ? "Odosielam…" : "Odoslať záujem"}
          </button>
        )}
      </div>
      {step === 3 && <p className="mt-3 text-center text-xs leading-relaxed text-forest/60">Odoslaním formulára nevzniká záväzná objednávka ani povinnosť zaplatiť.</p>}
    </form>
  );
}
