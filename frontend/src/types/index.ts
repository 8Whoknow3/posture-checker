/**
 * Frontend (presentation) models.
 *
 * These are intentionally independent from the backend transport DTOs
 * (see `adapters/api/dto.ts`). Adapters map DTOs to these models so UI
 * components never know how the data was produced.
 */

export type MetricKey =
  | "cva"
  | "trunk"
  | "spine_align"
  | "head_tilt"
  | "trunk_lateral";

export type MetricStatus = "good" | "caution" | "poor" | "unavailable";

export interface PostureMetric {
  key: MetricKey | (string & {});
  title: string;
  tier: 1 | 2;
  /** `null` means the metric could not be evaluated. Never substitute a number. */
  value: number | null;
  unit: string;
  status: MetricStatus;
  statusLabel: string;
  reference: string;
  /** Suggested correction supplied by the service. */
  tip: string | null;
  note: string | null;
}

export type RiskLevel = "low" | "medium" | "high";

/** "Project Risk Score" — owned by the service, displayed as-is. */
export interface RiskScore {
  score: number;
  maxScore: number;
  level: RiskLevel | null;
  levelLabel: string;
}

/** Issue → why it was flagged → suggested correction. */
export interface Recommendation {
  metricKey: string;
  issue: string;
  status: MetricStatus;
  statusLabel: string;
  value: number | null;
  unit: string;
  reference: string;
  action: string;
}

export interface PostureAnalysisResult {
  /** Image (data URL or URL) annotated by the service. */
  annotatedImage: string | null;
  viewLabel: string;
  metrics: PostureMetric[];
  riskScore: RiskScore;
  recommendations: Recommendation[];
  timestampMs: number | null;
}

// ---------------------------------------------------------------- errors

export type AnalysisErrorCode =
  | "no_person"
  | "invalid_image"
  | "processing_failed"
  | "unreachable"
  | "unknown";

// ------------------------------------------------------------------ live

export type LiveConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "stopped";

export type LiveAnalysisPhase = "idle" | "waiting" | "analyzing";

export type LiveEvent =
  | { type: "connection"; state: LiveConnectionState }
  | { type: "phase"; phase: LiveAnalysisPhase }
  | { type: "result"; result: PostureAnalysisResult }
  | { type: "no_person" }
  | { type: "error"; code: AnalysisErrorCode; message?: string };

// ---------------------------------------------------------------- camera

export type CameraState =
  | "idle" // not requested yet
  | "requesting"
  | "active"
  | "denied" // permission refused
  | "unavailable"; // no camera / unsupported / in use
