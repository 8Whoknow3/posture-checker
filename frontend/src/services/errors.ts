import type { AnalysisErrorCode } from "../types";

/** Normalized failure thrown by every PostureService implementation. */
export class AnalysisFailure extends Error {
  readonly code: AnalysisErrorCode;

  constructor(code: AnalysisErrorCode, detail?: string) {
    super(detail ?? code);
    this.name = "AnalysisFailure";
    this.code = code;
  }
}

export function toAnalysisFailure(error: unknown): AnalysisFailure {
  if (error instanceof AnalysisFailure) return error;
  return new AnalysisFailure("unknown");
}
