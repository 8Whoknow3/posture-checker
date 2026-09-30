/**
 * DEVELOPMENT ONLY — simulated data.
 *
 * Everything here is fabricated to exercise the UI. It is NOT produced by a
 * posture-analysis engine and must never be presented as a real result.
 * The fixtures use the backend transport shape so the real mappers are
 * exercised even in mock mode.
 */
import { mapAnalysisResponse } from "../api/mappers";
import type { AnalysisResponseDto, MetricDto } from "../api/dto";
import type { PostureAnalysisResult } from "../../types";

const LABELS = {
  good: "مطلوب",
  caution: "نیازمند توجه",
  poor: "پرخطر",
  unavailable: "قابل سنجش نیست",
} as const;

function metric(
  partial: Pick<MetricDto, "key" | "title" | "tier" | "value" | "status"> &
    Partial<MetricDto>,
): MetricDto {
  return {
    unit: "درجه",
    status_label: LABELS[partial.status as keyof typeof LABELS],
    reference: "",
    tip: null,
    convention_note: null,
    ...partial,
  };
}

function frontalMetrics(jitter = 0): MetricDto[] {
  return [
    metric({
      key: "cva",
      title: "زاویه کرانیووِرتبرال (سر به جلو)",
      tier: 1,
      value: round(49.1 + jitter),
      status: "caution",
      reference: "نمونه آزمایشی",
      tip: "چانه را به آرامی عقب بکشید.",
      convention_note: "عدد بزرگ‌تر = وضعیت بهتر",
    }),
    metric({
      key: "trunk",
      title: "خمیدگی تنه نسبت به عمود",
      tier: 1,
      value: round(14.3 + jitter),
      status: "good",
      reference: "نمونه آزمایشی",
      tip: "کمر را صاف کرده و به پشتی صندلی تکیه دهید.",
    }),
    metric({
      key: "spine_align",
      title: "هم‌راستایی ستون فقرات",
      tier: 1,
      value: round(148.6 - jitter),
      status: "poor",
      reference: "نمونه آزمایشی",
      tip: "گوش، شانه و باسن را هم‌راستا قرار دهید.",
    }),
    metric({
      key: "head_tilt",
      title: "کجی جانبی سر",
      tier: 2,
      value: round(3.2 + Math.abs(jitter) / 4),
      status: "good",
      reference: "قابل ارزیابی در نمای روبه‌رو یا زاویه‌دار",
      tip: "سر را در راستای عمود بدن نگه دارید.",
    }),
    metric({
      key: "trunk_lateral",
      title: "کجی جانبی تنه",
      tier: 2,
      value: round(9.4 + Math.abs(jitter) / 4),
      status: "caution",
      reference: "قابل ارزیابی در نمای روبه‌رو یا زاویه‌دار",
      tip: "وزن بدن را یکنواخت توزیع کنید.",
    }),
  ];
}

function sideMetrics(jitter = 0): MetricDto[] {
  return frontalMetrics(jitter).map((m) =>
    m.tier === 2
      ? {
          ...m,
          value: null,
          status: "unavailable",
          status_label: LABELS.unavailable,
          tip: null,
        }
      : m,
  );
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildMockResult(options: {
  view: "frontal" | "side";
  annotatedImage: string | null;
  jitter?: number;
}): PostureAnalysisResult {
  const { view, annotatedImage, jitter = 0 } = options;
  const dto: AnalysisResponseDto = {
    annotated_image: annotatedImage,
    view_label: view === "side" ? "نیم‌رخ (نمونه)" : "روبه‌رو (نمونه)",
    metrics: view === "side" ? sideMetrics(jitter) : frontalMetrics(jitter),
    overall: {
      score: view === "side" ? 5 : 6,
      max_score: 11,
      level: "medium",
      level_label: "ریسک متوسط",
    },
    timestamp_ms: Date.now(),
  };
  return mapAnalysisResponse(dto);
}
