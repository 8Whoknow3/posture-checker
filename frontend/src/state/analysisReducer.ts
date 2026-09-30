import type { AnalysisErrorCode, PostureAnalysisResult } from "../types";

export type InputSource = "upload" | "capture";

export interface AnalysisState {
  status: "idle" | "analyzing" | "success" | "error";
  source: InputSource | null;
  /** Local preview of what was sent (object/data URL). */
  preview: string | null;
  result: PostureAnalysisResult | null;
  error: { code: AnalysisErrorCode; detail?: string } | null;
}

export const initialAnalysisState: AnalysisState = {
  status: "idle",
  source: null,
  preview: null,
  result: null,
  error: null,
};

export type AnalysisAction =
  | { type: "start"; source: InputSource; preview: string | null }
  | { type: "success"; result: PostureAnalysisResult }
  | { type: "failure"; code: AnalysisErrorCode; detail?: string }
  | { type: "reset" };

export function analysisReducer(
  state: AnalysisState,
  action: AnalysisAction,
): AnalysisState {
  switch (action.type) {
    case "start":
      return {
        status: "analyzing",
        source: action.source,
        preview: action.preview,
        result: null,
        error: null,
      };
    case "success":
      return { ...state, status: "success", result: action.result, error: null };
    case "failure":
      return {
        ...state,
        status: "error",
        result: null,
        error: { code: action.code, detail: action.detail },
      };
    case "reset":
      return initialAnalysisState;
  }
}
