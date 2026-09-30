import { formatValue } from "../lib/format";
import type { PostureMetric } from "../types";
import { StatusBadge } from "./StatusBadge";

export const UNAVAILABLE_EXPLANATION =
  "این معیار از نمای فعلی دوربین به‌طور قابل‌اعتماد سنجیده نمی‌شود.";

export function MetricCard({ metric }: { metric: PostureMetric }) {
  const unavailable = metric.status === "unavailable" || metric.value === null;
  const status = unavailable ? "unavailable" : metric.status;

  return (
    <article className={`metric metric--${status}`}>
      <header className="metric__head">
        <h3 className="metric__title">{metric.title}</h3>
        <StatusBadge status={status} label={metric.statusLabel} />
      </header>

      <p className="metric__value">
        <bdi dir="ltr" className="metric__number">
          {formatValue(metric.value)}
        </bdi>
        {unavailable ? (
          <span className="sr-only">بدون مقدار</span>
        ) : (
          <span className="metric__unit">{metric.unit}</span>
        )}
      </p>

      <div className="metric__meta">
        {unavailable ? (
          <p>{UNAVAILABLE_EXPLANATION}</p>
        ) : (
          <>
            {metric.note && <p>{metric.note}</p>}
            {metric.reference && (
              <p className="metric__ref">
                مرجع: <bdi>{metric.reference}</bdi>
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export function MetricCardSkeleton({ label }: { label: string }) {
  return (
    <div className="metric metric--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--value" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
