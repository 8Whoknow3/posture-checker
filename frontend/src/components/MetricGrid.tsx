import type { PostureMetric } from "../types";
import { MetricCard, MetricCardSkeleton } from "./MetricCard";

export function MetricGrid({ metrics }: { metrics: PostureMetric[] }) {
  const tier1 = metrics.filter((m) => m.tier === 1);
  const tier2 = metrics.filter((m) => m.tier === 2);

  return (
    <div className="metric-groups">
      {[
        { id: "tier1", title: "معیارهای اصلی", badge: "Tier 1", items: tier1 },
        { id: "tier2", title: "معیارهای تکمیلی", badge: "Tier 2", items: tier2 },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.id} aria-labelledby={`${group.id}-heading`}>
            <h3 id={`${group.id}-heading`} className="group-title">
              {group.title} <bdi className="group-title__tag">{group.badge}</bdi>
            </h3>
            <div className="metric-grid">
              {group.items.map((metric) => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

/** Same footprint as real cards so the layout never jumps when data arrives. */
export function MetricGridSkeleton() {
  return (
    <div className="metric-groups" role="status">
      <span className="sr-only">در انتظار نتیجهٔ تحلیل</span>
      <div className="metric-grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <MetricCardSkeleton key={i} label="معیار در انتظار نتیجه" />
        ))}
      </div>
    </div>
  );
}
