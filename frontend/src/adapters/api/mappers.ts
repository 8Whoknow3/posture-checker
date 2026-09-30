import type {
  AnalysisErrorCode,
  LiveEvent,
  MetricStatus,
  PostureAnalysisResult,
  PostureMetric,
  Recommendation,
  RiskLevel,
} from "../../types";
import type { AnalysisResponseDto, MetricDto } from "./dto";

const KNOWN_STATUSES: readonly MetricStatus[] = [
  "good",
  "caution",
  "poor",
  "unavailable",
];

const KNOWN_LEVELS: readonly RiskLevel[] = ["low", "medium", "high"];

function mapStatus(status: string, value: number | null): MetricStatus {
  // A metric without a value can never be good/caution/poor.
  if (value === null) return "unavailable";
  return (KNOWN_STATUSES as readonly string[]).includes(status)
    ? (status as MetricStatus)
    : "unavailable";
}

export function mapMetric(dto: MetricDto): PostureMetric {
  return {
    key: dto.key,
    title: dto.title,
    tier: dto.tier === 2 ? 2 : 1,
    value: dto.value,
    unit: dto.unit,
    status: mapStatus(dto.status, dto.value),
    statusLabel: dto.status_label,
    reference: dto.reference,
    tip: dto.tip || null,
    note: dto.convention_note || null,
  };
}

const RECOMMENDATION_ORDER: Partial<Record<MetricStatus, number>> = {
  poor: 0,
  caution: 1,
};

/**
 * Repackages service-supplied tips for metrics the service flagged.
 * No thresholds or scores are computed here.
 */
export function buildRecommendations(
  metrics: PostureMetric[],
): Recommendation[] {
  return metrics
    .filter(
      (m) => (m.status === "poor" || m.status === "caution") && m.tip,
    )
    .sort(
      (a, b) =>
        (RECOMMENDATION_ORDER[a.status] ?? 9) -
        (RECOMMENDATION_ORDER[b.status] ?? 9),
    )
    .map((m) => ({
      metricKey: m.key,
      issue: m.title,
      status: m.status,
      statusLabel: m.statusLabel,
      value: m.value,
      unit: m.unit,
      reference: m.reference,
      action: m.tip as string,
    }));
}

export function mapAnalysisResponse(
  dto: AnalysisResponseDto,
): PostureAnalysisResult {
  const metrics = dto.metrics.map(mapMetric);
  const level = (KNOWN_LEVELS as readonly string[]).includes(dto.overall.level)
    ? (dto.overall.level as RiskLevel)
    : null;

  return {
    annotatedImage: dto.annotated_image ?? null,
    viewLabel: dto.view_label,
    metrics,
    riskScore: {
      score: dto.overall.score,
      maxScore: dto.overall.max_score,
      level,
      levelLabel: dto.overall.level_label,
    },
    recommendations: buildRecommendations(metrics),
    timestampMs: dto.timestamp_ms ?? null,
  };
}

/** REST: HTTP status → normalized error code. */
export function classifyHttpError(status: number): AnalysisErrorCode {
  if (status === 400) return "invalid_image";
  if (status === 422) return "no_person";
  if (status >= 500) return "processing_failed";
  return "unknown";
}

/** WS: backend error text → normalized event (backend sends no error codes). */
export function classifyWsError(message: string | undefined): LiveEvent {
  if (message && /no person/i.test(message)) return { type: "no_person" };
  if (message && /invalid image/i.test(message)) {
    return { type: "error", code: "invalid_image", message };
  }
  return { type: "error", code: "processing_failed", message };
}

/** Parse one WS text message into a normalized event, or `null` if unusable. */
export function mapWsMessage(raw: string): LiveEvent | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { type: "error", code: "unknown" };
  }
  if (typeof data !== "object" || data === null) return null;
  const message = data as { type?: string; error?: string };

  if (message.type === "posture_result") {
    return {
      type: "result",
      result: mapAnalysisResponse(data as AnalysisResponseDto),
    };
  }
  if (message.type === "error") return classifyWsError(message.error);
  return null;
}
