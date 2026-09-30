import { useEffect, useRef } from "react";
import { AnnotatedImage } from "../components/AnnotatedImage";
import { Icon } from "../components/Icon";
import { MetricGrid } from "../components/MetricGrid";
import { RecommendationList } from "../components/RecommendationList";
import { RiskScore } from "../components/RiskScore";
import { StateNotice } from "../components/StateNotice";
import { useApp } from "../state/AppContext";
import type { RoutePath } from "../state/useHashRoute";

export function ResultPage({ navigate }: { navigate: (p: RoutePath) => void }) {
  const { analysis, resetAnalysis } = useApp();
  const heading = useRef<HTMLHeadingElement>(null);
  const { result } = analysis;

  useEffect(() => {
    if (result) heading.current?.focus();
  }, [result]);

  if (!result) {
    return (
      <div className="page">
        <h1 className="page__title">نتیجه</h1>
        <StateNotice
          tone="info"
          content={{
            title: "هنوز نتیجه‌ای وجود ندارد",
            why: "تحلیلی انجام نشده یا نتیجهٔ قبلی پاک شده است.",
            next: "یک تصویر آپلود کنید، با وبکم عکس بگیرید یا تحلیل زنده را شروع کنید.",
          }}
        >
          <a className="btn btn--primary btn--sm" href="#/analyze">
            شروع تحلیل
          </a>
        </StateNotice>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title" ref={heading} tabIndex={-1}>
          نتیجهٔ تحلیل
        </h1>
        <p className="page__lead">{result.riskScore.levelLabel}</p>
      </header>

      <div className="result">
        <div className="result__media">
          <AnnotatedImage
            annotated={result.annotatedImage}
            original={analysis.preview}
            alt="تصویر تحلیل‌شده"
            badge={`نمای دوربین: ${result.viewLabel}`}
          />
        </div>

        <div className="result__summary">
          <RiskScore risk={result.riskScore} />
          <div className="actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                resetAnalysis();
                navigate("/analyze");
              }}
            >
              <Icon name="upload" size={18} /> تحلیل تصویر جدید
            </button>
            <a className="btn btn--ghost" href="#/live">
              <Icon name="live" size={18} /> تحلیل زنده
            </a>
          </div>
        </div>
      </div>

      <MetricGrid metrics={result.metrics} />
      <RecommendationList recommendations={result.recommendations} />
    </div>
  );
}
