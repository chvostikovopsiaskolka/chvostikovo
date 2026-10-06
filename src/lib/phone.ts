import { InquirySubmissionError } from "./form-errors";

export const COUNTRY_CODES = ["+421", "+420", "+36", "+48", "+43", "+380", "+49", "+44"] as const;

export function normalizePhone(value: string, prefix = "+421") {
  const compact = value.normalize("NFKC").replace(/[\s().\-\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "");
  if (!compact || !/^\+?\d+$/.test(compact) || !/^\+\d{1,3}$/.test(prefix)) {
    throw new InquirySubmissionError("phone_normalization");
  }

  let phone: string;
  if (compact.startsWith("+")) phone = compact;
  else if (compact.startsWith("00")) phone = `+${compact.slice(2)}`;
  else {
    const code = prefix.slice(1);
    // Some browsers omit '+' on a full international number. Do not mistake
    // a nine-digit local number starting with the country code for that case.
    if (compact.length > 9 && compact.startsWith(code)) phone = `+${compact}`;
    else {
      let national = compact;
      if (prefix === "+36" && national.startsWith("06")) national = national.slice(2);
      else if (["+421", "+43", "+49", "+44", "+380"].includes(prefix) && national.startsWith("0")) national = national.slice(1);
      phone = `${prefix}${national}`;
    }
  }

  if (!/^\+[1-9]\d{6,14}$/.test(phone)) throw new InquirySubmissionError("phone_normalization");
  return phone;
}

export function splitInitialPhone(value: string) {
  const compact = value.replace(/[\s().-]/g, "").replace(/^00/, "+");
  const prefix = COUNTRY_CODES.find((code) => compact.startsWith(code)) ?? "+421";
  return { prefix, number: compact.startsWith(prefix) ? compact.slice(prefix.length) : value };
}

export function phoneFromForm(form: HTMLFormElement, inputId: string) {
  const input = form.querySelector<HTMLInputElement>(`input[id="${inputId}"]`);
  const prefix = input?.parentElement?.querySelector<HTMLSelectElement>("[data-phone-prefix]")?.value ?? "+421";
  // Read the real DOM at submission, even if autofill emitted no React event.
  return normalizePhone(input?.value ?? "", prefix);
}
