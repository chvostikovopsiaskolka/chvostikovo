import type { ChangeEventHandler } from "react";

/** Shared, compact breed + optional sex row for every short enquiry. */
export function InquiryDogFields({
  idPrefix,
  language = "sk",
  breed,
  onBreedChange,
}: {
  idPrefix: string;
  language?: "sk" | "en";
  breed?: string;
  onBreedChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  const en = language === "en";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(124px,0.9fr)] gap-2 sm:grid-cols-2" data-inquiry-dog-fields>
      <div className="min-w-0">
        <label className="label-sm" htmlFor={`${idPrefix}-plemeno`}>{en ? "Dog breed *" : "Plemeno psíka *"}</label>
        <input id={`${idPrefix}-plemeno`} name="plemeno" type="text" maxLength={80}
          autoComplete="off" required className="field min-w-0 w-full"
          placeholder={en ? "e.g. Labrador" : "Napr. labrador"}
          {...(onBreedChange ? { value: breed ?? "", onChange: onBreedChange } : { defaultValue: breed })} />
      </div>
      <fieldset className="min-w-0">
        <legend className="label-sm">{en ? "Sex (optional)" : "Pohlavie (nepovinné)"}</legend>
        <div className="grid grid-cols-2 gap-1">
          {([["male", en ? "Male" : "Pes"], ["female", en ? "Female" : "Suka"]] as const).map(([value, label]) => (
            <label key={value} className="relative min-w-0 cursor-pointer">
              <input type="radio" name="pohlavie" value={value} className="peer sr-only" aria-label={label} />
              <span className="flex min-h-11 items-center justify-center rounded-xl border border-forest/15 bg-white px-1 text-center text-xs font-semibold text-forest transition peer-checked:border-coral peer-checked:bg-secondary/55 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-coral">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
