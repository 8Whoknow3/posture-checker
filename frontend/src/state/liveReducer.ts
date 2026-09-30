import type {
  AnalysisErrorCode,
  LiveAnalysisPhase,
  LiveConnectionState,
  LiveEvent,
  PostureAnalysisResult,
} from "../types";

export interface LiveState {
  running: boolean;
  connection: LiveConnectionState;
  phase: LiveAnalysisPhase;
  result: PostureAnalysisResult | null;
  /** The service currently reports that nobody is in frame. */
  noPerson: boolean;
  error: AnalysisErrorCode | null;
}

export const initialLiveState: LiveState = {
  running: false,
  connection: "stopped",
  phase: "idle",
  result: null,
  noPerson: false,
  error: null,
};

export type LiveAction = { type: "begin" } | { type: "event"; event: LiveEvent };

export function liveReducer(state: LiveState, action: LiveAction): LiveState {
  if (action.type === "begin") {
    return { ...initialLiveState, running: true, connection: "connecting" };
  }

  const { event } = action;
  switch (event.type) {
    case "connection":
      return {
        ...state,
        connection: event.state,
        running: event.state !== "stopped",
        phase: event.state === "connected" ? state.phase : "idle",
      };
    case "phase":
      return state.phase === event.phase ? state : { ...state, phase: event.phase };
    case "result":
      return {
        ...state,
        result: event.result,
        noPerson: false,
        error: null,
      };
    case "no_person":
      return state.noPerson && state.error === null
        ? state
        : { ...state, noPerson: true, error: null };
    case "error":
      return state.error === event.code
        ? state
        : { ...state, error: event.code };
  }
}
