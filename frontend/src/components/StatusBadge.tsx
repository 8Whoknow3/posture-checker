import type { MetricStatus } from "../types";

const GLYPH: Record<MetricStatus, string> = {
  good: "✓",
  caution: "!",
  poor: "×",
  unavailable: "–",
};

/** Status is conveyed by text + glyph + color, never color alone. */
export function StatusBadge({
  status,
  label,
}: {
  status: MetricStatus;
  label: string;
}) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__glyph" aria-hidden="true">
        {GLYPH[status]}
      </span>
      {label}
    </span>
  );
}
