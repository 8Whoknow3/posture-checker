import { formatValue } from "../lib/format";
import type { Recommendation } from "../types";
import { StatusBadge } from "./StatusBadge";

/** Hierarchy: issue → why it was flagged → suggested correction. */
export function RecommendationList({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  if (recommendations.length === 0) {
    return (
      <section className="card" aria-labelledby="recs-heading">
        <h2 id="recs-heading" className="card__title">
          پیشنهادهای اصلاحی
        </h2>
        <p className="muted">
          سرویس تحلیل برای این نتیجه پیشنهاد اصلاحی ارسال نکرده است.
        </p>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="recs-heading">
      <h2 id="recs-heading" className="card__title">
        پیشنهادهای اصلاحی
      </h2>
      <ol className="recs">
        {recommendations.map((rec, index) => (
          <li key={rec.metricKey} className="rec">
            <div className="rec__head">
              <span className="rec__index" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="rec__issue">{rec.issue}</h3>
              <StatusBadge status={rec.status} label={rec.statusLabel} />
            </div>
            <p className="rec__why">
              <span className="rec__label">چرا علامت خورد:</span> مقدار{" "}
              <bdi dir="ltr" className="num">
                {formatValue(rec.value)}
              </bdi>{" "}
              {rec.unit}
              {rec.reference && (
                <>
                  {" "}
                  · مرجع: <bdi>{rec.reference}</bdi>
                </>
              )}
            </p>
            <p className="rec__action">
              <span className="rec__label">پیشنهاد:</span> {rec.action}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
