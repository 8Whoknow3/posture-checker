import { afterEach, describe, expect, it, vi } from "vitest";
import { createServices } from "../../services";
import { AnalysisFailure } from "../../services/errors";
import type { LiveEvent } from "../../types";
import { MockLiveAnalysisService } from "./MockLiveAnalysisService";
import { MockPostureService } from "./MockPostureService";
import { setMockScenario } from "./scenario";

const image = new Blob(["x"], { type: "image/jpeg" });

afterEach(() => {
  setMockScenario("success");
  vi.useRealTimers();
});

describe("MockPostureService", () => {
  const service = new MockPostureService(0);

  it("returns a success result with null metrics for the side view", async () => {
    setMockScenario("side_view");
    const result = await service.analyzeImage(image);
    const unavailable = result.metrics.filter((m) => m.tier === 2);
    expect(unavailable.every((m) => m.value === null && m.status === "unavailable")).toBe(true);
    expect(result.riskScore.maxScore).toBe(11);
  });

  it.each([
    ["no_person", "no_person"],
    ["invalid_image", "invalid_image"],
    ["processing_error", "processing_failed"],
    ["connection_lost", "unreachable"],
  ] as const)("scenario %s rejects with %s", async (scenario, code) => {
    setMockScenario(scenario);
    await expect(service.analyzeImage(image)).rejects.toMatchObject({
      code,
    } satisfies Partial<AnalysisFailure>);
  });
});

describe("MockLiveAnalysisService", () => {
  it("emits connect → result → stopped", () => {
    vi.useFakeTimers();
    const events: LiveEvent[] = [];
    const service = new MockLiveAnalysisService(100);
    service.start(document.createElement("video"), (e) => events.push(e));

    vi.advanceTimersByTime(1000);
    service.stop();

    const types = events.map((e) =>
      e.type === "connection" ? `connection:${e.state}` : e.type,
    );
    expect(types[0]).toBe("connection:connecting");
    expect(types).toContain("connection:connected");
    expect(types).toContain("result");
    expect(types.at(-1)).toBe("connection:stopped");
  });
});

describe("createServices", () => {
  it("selects adapters from config only", () => {
    const mock = createServices({ useMock: true, apiBaseUrl: "", wsUrl: "" });
    expect(mock.isMock).toBe(true);
    const real = createServices({
      useMock: false,
      apiBaseUrl: "http://example.test",
      wsUrl: "ws://example.test/ws/posture",
    });
    expect(real.isMock).toBe(false);
  });
});
