export type InquiryErrorStage =
  | "frontend_validation"
  | "phone_normalization"
  | "zod_validation"
  | "payload"
  | "network"
  | "backend_http"
  | "backend_response";

export class InquirySubmissionError extends Error {
  constructor(public readonly stage: InquiryErrorStage, public readonly status?: number, public readonly issues?: Array<{ field: string; code: string }>) {
    super(`Form submission failed at ${stage}`);
    this.name = "InquirySubmissionError";
  }
}

// Never log the original error, Zod input, name, phone, or backend response body.
export function reportInquiryError(error: unknown) {
  const diagnostic = error instanceof InquirySubmissionError
    ? { stage: error.stage, ...(error.status === undefined ? {} : { status: error.status }), ...(error.issues ? { issues: error.issues } : {}) }
    : { stage: "frontend_validation" as const };
  console.error("[Chvostikovo form]", diagnostic);
  return diagnostic;
}

export function runFormTelemetry(callback: () => void) {
  try {
    callback();
  } catch {
    // A saved submission must remain successful if optional analytics fail.
    console.warn("[Chvostikovo form] Optional telemetry failed");
  }
}

// Only schema field names and Zod codes; no values or validation messages.
export function inquiryDiagnosticSuffix(diagnostic: ReturnType<typeof reportInquiryError>) {
  const status = "status" in diagnostic ? String(diagnostic.status) : "";
  const issues = "issues" in diagnostic ? diagnostic.issues?.map(({ field, code }) => `${field}=${code}`).join(",") : "";
  return issues ? `:${status}:${issues}` : status ? `:${status}` : "";
}
