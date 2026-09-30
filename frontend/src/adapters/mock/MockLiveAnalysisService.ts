/**
 * DEVELOPMENT ADAPTER — simulates WS /ws/posture with normalized events.
 * Values are fabricated and jitter slightly to exercise layout stability.
 */
import type {
  LiveAnalysisService,
  LiveListener,
} from "../../services/LiveAnalysisService";
import { buildMockResult } from "./fixtures";
import { getMockScenario } from "./scenario";

export class MockLiveAnalysisService implements LiveAnalysisService {
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private listener: LiveListener | null = null;
  private tick = 0;

  constructor(private readonly tickMs = 600) {}

  start(_source: HTMLVideoElement, listener: LiveListener): void {
    this.stop();
    this.listener = listener;
    this.tick = 0;
    listener({ type: "connection", state: "connecting" });

    this.later(700, () => {
      listener({ type: "connection", state: "connected" });
      listener({ type: "phase", phase: "waiting" });
      this.interval = setInterval(() => this.emitFrame(), this.tickMs);
    });
  }

  stop(): void {
    const listener = this.listener;
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    if (this.interval !== null) clearInterval(this.interval);
    this.interval = null;
    this.listener = null;
    listener?.({ type: "connection", state: "stopped" });
  }

  private later(ms: number, fn: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);
    this.timers.add(timer);
  }

  private emitFrame(): void {
    const listener = this.listener;
    if (!listener) return;
    this.tick += 1;
    const scenario = getMockScenario();

    switch (scenario) {
      case "no_person":
        listener({ type: "no_person" });
        return;
      case "invalid_image":
        listener({ type: "error", code: "invalid_image" });
        return;
      case "processing_error":
        listener({ type: "error", code: "processing_failed" });
        return;
      case "connection_lost":
        if (this.tick > 3) {
          if (this.interval !== null) clearInterval(this.interval);
          this.interval = null;
          listener({ type: "phase", phase: "idle" });
          listener({ type: "connection", state: "disconnected" });
          return;
        }
        break;
      default:
        break;
    }

    listener({ type: "phase", phase: "analyzing" });
    listener({
      type: "result",
      result: buildMockResult({
        view: scenario === "side_view" ? "side" : "frontal",
        annotatedImage: null,
        jitter: Math.sin(this.tick / 2) * 1.5,
      }),
    });
  }
}
