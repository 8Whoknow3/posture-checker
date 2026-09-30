/**
 * Backend transport shapes (snake_case), exactly as produced by
 * POST /api/analyze and WS /ws/posture. Only mappers may import this file.
 */

export interface MetricDto {
  key: string;
  title: string;
  tier: number;
  value: number | null;
  unit: string;
  status: string;
  status_label: string;
  reference: string;
  tip: string | null;
  convention_note: string | null;
}

export interface OverallDto {
  score: number;
  max_score: number;
  level: string;
  level_label: string;
}

export interface AnalysisResponseDto {
  annotated_image: string | null;
  view_label: string;
  metrics: MetricDto[];
  overall: OverallDto;
  timestamp_ms?: number;
}

export interface WsPostureResultDto extends AnalysisResponseDto {
  type: "posture_result";
}

export interface WsErrorDto {
  type: "error";
  error?: string;
}

export type WsMessageDto = WsPostureResultDto | WsErrorDto;
