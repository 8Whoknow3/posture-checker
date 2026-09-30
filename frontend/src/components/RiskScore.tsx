import type { RiskScore as RiskScoreModel } from "../types";

/** Displays the service-owned "Project Risk Score". No calculation here. */
export function RiskScore({ risk }: { risk: RiskScoreModel }) {
  const ratio =
    risk.maxScore > 0 ? Math.min(1, Math.max(0, risk.score / risk.maxScore)) : 0;

  return (
    <section
      className={`risk risk--${risk.level ?? "unknown"}`}
      aria-labelledby="risk-heading"
    >
      <h2 id="risk-heading" className="risk__eyebrow">
        امتیاز ریسک پروژه
      </h2>
      <p className="risk__score">
        <bdi dir="ltr" className="risk__number">
          <span className="risk__value">{risk.score}</span>
          <span className="risk__max"> / {risk.maxScore}</span>
        </bdi>
      </p>
      <p className="risk__label">{risk.levelLabel}</p>
      <div className="risk__meter" aria-hidden="true">
        <div className="risk__fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </section>
  );
}
