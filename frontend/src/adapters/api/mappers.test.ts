import { describe, expect, it } from "vitest";
import type { AnalysisResponseDto, MetricDto } from "./dto";
import {
  classifyHttpError,
  mapAnalysisResponse,
  mapWsMessage,
} from "./mappers";

function metric(overrides: Partial<MetricDto>): MetricDto {
  return {
    key: "cva",
    title: "CVA",
    tier: 1,
    value: 50,
    unit: "درجه",
    status: "good",
    status_label: "مطلوب",
    reference: "ref",
    tip: "tip",
    convention_note: null,
    ...overrides,
  };
}

const dto: AnalysisResponseDto = {
  annotated_image: "data:image/jpeg;base64,AAAA",
  view_label: "نیم‌رخ",
  metrics: [
    metric({ key: "cva", status: "caution", tip: "a" }),
    metric({ key: "trunk", status: "poor", tip: "b" }),
    metric({ key: "spine_align", status: "good", tip: "c" }),
    metric({
      key: "head_tilt",
      tier: 2,
      value: null,
      status: "unavailable",
      status_label: "قابل سنجش نیست",
      tip: "d",
    }),
  ],
  overall: { score: 6, max_score: 11, level: "medium", level_label: "ریسک متوسط" },
};

describe("mapAnalysisResponse", () => {
  const result = mapAnalysisResponse(dto);

  it("copies the service-owned risk score untouched", () => {
    expect(result.riskScore).toEqual({
      score: 6,
      maxScore: 11,
      level: "medium",
      levelLabel: "ریسک متوسط",
    });
  });

  it("keeps unavailable metrics null and unavailable", () => {
    const head = result.metrics.find((m) => m.key === "head_tilt");
    expect(head?.value).toBeNull();
    expect(head?.status).toBe("unavailable");
  });

  it("never reports a value-less metric as anything but unavailable", () => {
    const mapped = mapAnalysisResponse({
      ...dto,
      metrics: [metric({ value: null, status: "poor" })],
    });
    expect(mapped.metrics[0].status).toBe("unavailable");
  });

  it("builds recommendations only from flagged metrics, poor first", () => {
    expect(result.recommendations.map((r) => r.metricKey)).toEqual([
      "trunk",
      "cva",
    ]);
  });
});

describe("error classification", () => {
  it("maps HTTP status to codes", () => {
    expect(classifyHttpError(400)).toBe("invalid_image");
    expect(classifyHttpError(422)).toBe("no_person");
    expect(classifyHttpError(500)).toBe("processing_failed");
    expect(classifyHttpError(404)).toBe("unknown");
  });

  it("maps websocket messages to normalized events", () => {
    expect(mapWsMessage('{"type":"error","error":"No person detected."}')).toEqual({
      type: "no_person",
    });
    expect(mapWsMessage('{"type":"error","error":"Invalid image frame."}')).toMatchObject({
      type: "error",
      code: "invalid_image",
    });
    expect(mapWsMessage("not json")).toMatchObject({ type: "error", code: "unknown" });
    const event = mapWsMessage(
      JSON.stringify({ type: "posture_result", timestamp_ms: 5, ...dto }),
    );
    expect(event).toMatchObject({ type: "result" });
  });
});
