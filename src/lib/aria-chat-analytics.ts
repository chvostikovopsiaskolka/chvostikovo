// In-memory, LEAD-only conversational analytics; no cookie, storage or contact data.
export const ARIA_CHAT_PREFIX = "lead_landing_aria_chat_";
export const ARIA_IDLE_MS = 30 * 60 * 1000;
export const ARIA_QUESTIONS = ["pricing","requirements","caretakers","puppy","location","space","first_visit","reservation"] as const;
export const ARIA_FORMS = ["interest","other","puppy_contact"] as const;
export type AriaAction = "open" | "reopen" | "resume" | "close" | "leave" | "question" | "auto_question" | "interest_open" | "other_open" | "puppy_check_open" | "puppy_precheck_passed" | "puppy_precheck_info" | "form_open" | "form_start" | "form_attempt" | "form_error" | "form_submit";
export type AriaEvent = { chat_id: string; visit_id: string; sequence: number; action: AriaAction; detail: string | null; form_attempt_id: string | null };
type Conversation = { id: string; seq: number; lastAt: number; open: boolean };
const simpleActions = new Set(["open","resume","close","leave","interest_open","other_open","puppy_check_open","puppy_precheck_passed","puppy_precheck_info"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function ariaEventSource(action: AriaAction, detail: string | null) {
  return ARIA_CHAT_PREFIX + action + (detail ? "_" + detail : "");
}
export function ariaFormKind(source: string) {
  const key = source.split(":")[0];
  if (!key.startsWith(ARIA_CHAT_PREFIX)) return undefined;
  return ARIA_FORMS.find(kind => key === ARIA_CHAT_PREFIX + kind);
}
export function isLeadAriaPath(path: string) {
  return path === "/psia-skolka-kosice" || path === "/psia-skolka-kosice/";
}
export function createAriaChatAnalytics(now = () => Date.now(), uuid = () => globalThis.crypto.randomUUID()) {
  let visitId: string | null = null;
  let current: Conversation | null = null;
  const attempts = new Map<string, { conversation: Conversation; at: number; detail: string }>();
  function newConversation(at: number): Conversation {
    visitId ||= uuid();
    return { id: uuid(), seq: 0, lastAt: at, open: true };
  }
  function record(action: AriaAction, detail: string | null = null, attemptId?: string): AriaEvent | undefined {
    const question = action === "question" || action === "auto_question";
    const form = action.startsWith("form_");
    if (question ? !ARIA_QUESTIONS.some(q => q === detail) : form ? !ARIA_FORMS.some(k => k === detail) : !simpleActions.has(action) || detail !== null) return;
    if (attemptId && (!uuidPattern.test(attemptId) || !["form_attempt","form_error","form_submit"].includes(action))) return;
    if ((action === "form_attempt" || action === "form_submit") && !attemptId) return;
    const at = now();
    for (const [id, attempt] of attempts) if (at - attempt.at > ARIA_IDLE_MS) attempts.delete(id);
    try {
      if (action === "open") {
        if (current && current.open && at - current.lastAt <= ARIA_IDLE_MS) return;
        if (!current || at - current.lastAt > ARIA_IDLE_MS) current = newConversation(at);
        else { action = "reopen"; current.open = true; }
      } else if (action === "resume") {
        if (!current || current.open) return;
        if (at - current.lastAt > ARIA_IDLE_MS) current = newConversation(at);
        else current.open = true;
      } else if (!current) return;
      // A late outcome belongs to its original attempt, never the newly opened chat.
      let target = current;
      if ((action === "form_error" || action === "form_submit") && attemptId) {
        const attempt = attempts.get(attemptId);
        if (!attempt || attempt.detail !== detail) return;
        target = attempt.conversation;
        attempts.delete(attemptId);
      } else if (action !== "open" && action !== "reopen" && action !== "resume" && current) {
        if (!current.open) return;
        if (at - current.lastAt > ARIA_IDLE_MS && action !== "close" && action !== "leave") {
          current = newConversation(at); target = current;
        }
      }
      if (!target || !visitId) return;
      if (target.seq >= 10000) return;
      if (action === "close" || action === "leave") {
        if (!target.open) return;
        target.open = false;
      }
      if (action === "form_attempt" && attemptId && detail) {
        if (attempts.has(attemptId)) return;
        attempts.set(attemptId, { conversation: target, at, detail });
        if (attempts.size > 64) { const oldest = attempts.keys().next().value; if (oldest) attempts.delete(oldest); }
      }
      target.lastAt = at;
      return { chat_id: target.id, visit_id: visitId, sequence: ++target.seq, action, detail, form_attempt_id: attemptId || null };
    } catch { return; } // analytics must never block interaction
  }
  return { record };
}
