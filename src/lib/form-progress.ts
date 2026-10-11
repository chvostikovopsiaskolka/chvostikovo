import { useEffect, useRef, type FormEvent } from "react";
import { hasAnalyticsConsent } from "./consent";
import { trackCookielessInteraction, type CookielessInteractionName } from "./cookieless-interactions";

// Only field identifiers. Never record values, text, phone numbers or keystrokes.
export const FORM_PROGRESS_FIELDS = new Set([
  "meno", "telefon", "zaujem", "pes", "plemeno", "vaha", "pohlavie",
  "vek", "kastrovana", "duvod", "alergie", "povaha",
  "name", "phone", "interest",
]);

type InputField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function safeConsent() {
  try { return hasAnalyticsConsent(); } catch { return false; }
}

function fieldFromEvent(event: FormEvent<HTMLFormElement>): InputField | null {
  const target = event.target as InputField | null;
  if (!target || typeof target.name !== "string" || !FORM_PROGRESS_FIELDS.has(target.name)) return null;
  if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return null;
  return target;
}

/** Opt-in, aggregate form diagnostics. Never used to validate or submit forms. */
export function useFormProgress(source: string, language: "sk" | "en" = "sk") {
  const seen = useRef(new Set<string>());
  const lastTouched = useRef<string | null>(null);
  const attempted = useRef(false);
  const succeeded = useRef(false);

  function record(eventName: CookielessInteractionName, field: string) {
    if (!safeConsent() || !FORM_PROGRESS_FIELDS.has(field)) return;
    const key = eventName + "|" + field;
    if (seen.current.has(key)) return;
    seen.current.add(key);
    // Purely optional; no await, so analytics cannot block a customer.
    void trackCookielessInteraction(eventName, source + "|" + field, language).catch(() => {});
  }

  function onInputCapture(event: FormEvent<HTMLFormElement>) {
    const target = fieldFromEvent(event);
    if (!target) return;
    lastTouched.current = target.name;
    record("form_field_touch", target.name);
  }

  function onChangeCapture(event: FormEvent<HTMLFormElement>) {
    const target = fieldFromEvent(event);
    if (!target) return;
    lastTouched.current = target.name;
    record("form_field_touch", target.name);
    if (target.value.trim() && target.validity.valid) record("form_field_complete", target.name);
  }

  function onBlurCapture(event: FormEvent<HTMLFormElement>) {
    const target = fieldFromEvent(event);
    if (target?.value.trim() && target.validity.valid) record("form_field_complete", target.name);
  }

  function onInvalidCapture(event: FormEvent<HTMLFormElement>) {
    const target = fieldFromEvent(event);
    if (target) record("form_field_invalid", target.name);
    // Never prevent browser validation; it must continue working normally.
  }

  function markAttempt() { attempted.current = true; }
  function markSuccess() { succeeded.current = true; }

  useEffect(() => {
    const abandonment = () => {
      if (!attempted.current && !succeeded.current && lastTouched.current) {
        record("form_abandon", lastTouched.current);
      }
    };
    window.addEventListener("pagehide", abandonment);
    return () => {
      window.removeEventListener("pagehide", abandonment);
      abandonment(); // Also handles a modal being closed before submission.
    };
  }, [source, language]);

  return { onInputCapture, onChangeCapture, onBlurCapture, onInvalidCapture, markAttempt, markSuccess };
}
