import { describe, expect, it } from "vitest";
import { buildMockResult } from "../adapters/mock/fixtures";
import {
  analysisReducer,
  initialAnalysisState,
} from "./analysisReducer";
import { initialLiveState, liveReducer } from "./liveReducer";

describe("analysisReducer", () => {
  it("moves idle → analyzing → success", () => {
    const started = analysisReducer(initialAnalysisState, {
      type: "start",
      source: "upload",
      preview: null,
    });
    expect(started.status).toBe("analyzing");

    const result = buildMockResult({ view: "frontal", annotatedImage: null });
    const done = analysisReducer(started, { type: "success", result });
    expect(done.status).toBe("success");
    expect(done.result).toBe(result);
  });

  it("records errors and clears them on reset", () => {
    const failed = analysisReducer(initialAnalysisState, {
      type: "failure",
      code: "no_person",
    });
    expect(failed.status).toBe("error");
    expect(failed.error?.code).toBe("no_person");
    expect(analysisReducer(failed, { type: "reset" })).toEqual(initialAnalysisState);
  });
});

describe("liveReducer", () => {
  it("tracks connection, result, no person and recovery", () => {
    let state = liveReducer(initialLiveState, { type: "begin" });
    expect(state.connection).toBe("connecting");

    state = liveReducer(state, {
      type: "event",
      event: { type: "connection", state: "connected" },
    });
    expect(state.running).toBe(true);

    const result = buildMockResult({ view: "side", annotatedImage: null });
    state = liveReducer(state, { type: "event", event: { type: "result", result } });
    state = liveReducer(state, { type: "event", event: { type: "no_person" } });
    expect(state.noPerson).toBe(true);
    expect(state.result).toBe(result);

    state = liveReducer(state, { type: "event", event: { type: "result", result } });
    expect(state.noPerson).toBe(false);

    state = liveReducer(state, {
      type: "event",
      event: { type: "connection", state: "stopped" },
    });
    expect(state.running).toBe(false);
  });
});
