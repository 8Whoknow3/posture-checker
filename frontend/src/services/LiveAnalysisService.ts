import type { LiveEvent } from "../types";

export type LiveListener = (event: LiveEvent) => void;

/**
 * Live analysis boundary.
 *
 * Implementations: `MockLiveAnalysisService` (development) and
 * `WebSocketLiveAnalysisService` (WS /ws/posture).
 * The UI only consumes normalized `LiveEvent`s.
 */
export interface LiveAnalysisService {
  /** Begin a session. `source` is the playing camera element. */
  start(source: HTMLVideoElement, listener: LiveListener): void;
  /** End the session and release every timer/socket. Safe to call twice. */
  stop(): void;
}
