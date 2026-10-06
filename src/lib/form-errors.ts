export type InquiryErrorStage =
  | "frontend_validation"
  | "phone_normalization"
  | "zod_validation"
  | "payload"
  | "network"
  | "backend_http"
  | "backend_response";

export class InquirySubmissionError extends Error {
  constructor(public readonly stage: InquiryErrorStage, public readonly status?: number) {
    super(`Form submission failed at ${stage}`);
    this.name = "InquirySubmissionError";
  }
}

// Never log the original error, Zod input, name, phone, or backend response body.
export function reportInquiryError(error: unknown) {
  const diagnostic = error instanceof InquirySubmissionError
    ? { stage: error.stage, ...(error.status === undefined ? {} : { status: error.status }) }
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
