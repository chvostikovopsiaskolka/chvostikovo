import { useRef } from "react";
import { COUNTRY_CODES, normalizePhone, splitInitialPhone } from "@/lib/phone";

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
  const initial = useRef(splitInitialPhone(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);
  const prefixRef = useRef<HTMLSelectElement>(null);

  function notifyChange() {
    if (!onChange) return;
    try {
      onChange(normalizePhone(inputRef.current?.value ?? "", prefixRef.current?.value ?? "+421"));
    } catch {
      onChange("");
    }
  }

  return (
    <div className={className}>
      <label className="label-sm" htmlFor={id}>
        {label}
      </label>
      <div className="flex w-full overflow-hidden rounded-[0.85rem] border border-border bg-card transition-colors focus-within:border-coral">
        <select
          ref={prefixRef}
          data-phone-prefix
          aria-label={language === "en" ? "Country calling code" : "Predvoľba krajiny"}
          defaultValue={initial.current.prefix}
          onChange={notifyChange}
          className="shrink-0 border-r border-border bg-secondary/55 px-2 text-sm font-semibold text-forest outline-none sm:px-2.5"
        >
          {COUNTRY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          id={id}
          name={name ?? id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          defaultValue={initial.current.number}
          onInput={notifyChange}
          onChange={notifyChange}
          onBlur={notifyChange}
          placeholder="912 345 678"
          className="min-w-0 flex-1 bg-transparent px-3 py-[0.65rem] text-base leading-[1.35] text-foreground outline-none"
        />
      </div>
    </div>
  );
}
