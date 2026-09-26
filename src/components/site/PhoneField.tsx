import { useState } from "react";

const COUNTRY_CODES = [
  { value: "+421", label: "SK +421" },
  { value: "+420", label: "CZ +420" },
  { value: "+36", label: "HU +36" },
  { value: "+48", label: "PL +48" },
  { value: "+43", label: "AT +43" },
  { value: "+380", label: "UA +380" },
  { value: "+49", label: "DE +49" },
  { value: "+44", label: "UK +44" },
] as const;

function splitPhone(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  const match = [...COUNTRY_CODES]
    .sort((a, b) => b.value.length - a.value.length)
    .find((item) => normalized.startsWith(item.value));

  if (match) {
    return {
      prefix: match.value,
      digits: normalized.slice(match.value.length).replace(/\D/g, ""),
    };
  }

  return {
    prefix: "+421",
    digits: normalized.replace(/\D/g, ""),
  };
}

export function PhoneField({
  id,
  name,
  label = "Telefón *",
  language = "sk",
  value,
  onChange,
  className = "",
}: {
  id: string;
  name?: string;
  label?: string;
  language?: "sk" | "en";
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState("");
  const currentValue = value ?? internalValue;
  const { prefix, digits } = splitPhone(currentValue);

  const update = (nextPrefix: string, nextDigits: string) => {
    const cleanDigits = nextDigits.replace(/\D/g, "").slice(0, 15);
    const combined = cleanDigits ? `${nextPrefix}${cleanDigits}` : nextPrefix;

    if (value === undefined) setInternalValue(combined);
    onChange?.(combined);
  };

  const invalidMessage =
    language === "en"
      ? "Enter the phone number using digits only."
      : "Zadajte telefónne číslo iba pomocou číslic.";

  return (
    <div className={className}>
      <label className="label-sm" htmlFor={id}>
        {label}
      </label>
      <div className="flex w-full overflow-hidden rounded-[0.85rem] border border-border bg-card transition-colors focus-within:border-coral">
        <select
          aria-label={language === "en" ? "Country calling code" : "Predvoľba krajiny"}
          value={prefix}
          onChange={(event) => update(event.target.value, digits)}
          className="shrink-0 border-r border-border bg-secondary/55 px-2.5 text-sm font-semibold text-forest outline-none sm:px-3"
        >
          {COUNTRY_CODES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          minLength={6}
          maxLength={15}
          pattern="[0-9]{6,15}"
          value={digits}
          onChange={(event) => {
            event.currentTarget.setCustomValidity("");
            update(prefix, event.target.value);
          }}
          onInvalid={(event) => event.currentTarget.setCustomValidity(invalidMessage)}
          placeholder={language === "en" ? "Phone number" : "Telefónne číslo"}
          className="min-w-0 flex-1 bg-transparent px-3 py-[0.65rem] text-base leading-[1.35] text-foreground outline-none"
        />
      </div>
      {name ? <input type="hidden" name={name} value={digits ? `${prefix}${digits}` : ""} /> : null}
    </div>
  );
}
