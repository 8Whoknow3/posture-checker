import { useEffect } from "react";
import { CameraStage, CameraStatusPill } from "../components/CameraStage";
import { Icon } from "../components/Icon";
import { MetricGrid, MetricGridSkeleton } from "../components/MetricGrid";
import { PrivacyNote } from "../components/PrivacyNote";
import { RecommendationList } from "../components/RecommendationList";
import { RiskScore } from "../components/RiskScore";
import { StateNotice } from "../components/StateNotice";
import { ANALYSIS_ERRORS, LIVE_NOTICES } from "../content/notices";
import { useApp } from "../state/AppContext";
import { useCamera } from "../state/useCamera";
import { useLiveAnalysis } from "../state/useLiveAnalysis";
import type { LiveConnectionState } from "../types";

const CONNECTION_LABEL: Record<LiveConnectionState, string> = {
  stopped: "متوقف",
  connecting: "در حال اتصال",
  connected: "متصل",
  disconnected: "قطع شده",
};

export function LivePage() {
  const { services } = useApp();
  const camera = useCamera();
  const live = useLiveAnalysis(services);
  const { state } = live;

  // Stop the session if the camera goes away.
  useEffect(() => {
    if (camera.state !== "active" && state.running) live.stop();
  }, [camera.state, state.running, live]);

  function begin() {
    const video = camera.videoRef.current;
    if (video && camera.state === "active") live.start(video);
  }

  const { result } = state;
  const connectionLost = state.running && state.connection === "disconnected";
  const waitingForPose =
    state.running && state.connection === "connected" && !result && !state.noPerson;
  const statusText = !state.running
    ? "تحلیل زنده شروع نشده است."
    : connectionLost
      ? "ارتباط با سرویس قطع شد؛ در حال تلاش مجدد."
      : state.connection === "connecting"
        ? "در حال اتصال به سرویس تحلیل."
        : state.noPerson
          ? "فردی در قاب دیده نمی‌شود."
          : result
            ? "تحلیل زنده فعال است."
            : "متصل شد؛ در انتظار نتیجه.";

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">تحلیل زنده</h1>
        <p className="page__lead">
          دوربین را روشن کنید و تحلیل زنده را شروع کنید؛ نتایج بدون تغییر چیدمان به‌روز می‌شوند.
        </p>
      </header>

      <div className="live">
        <section className="stage-col" aria-label="دوربین">
          <CameraStage
            videoRef={camera.videoRef}
            state={camera.state}
            onEnable={camera.start}
            showGuide={!state.running || !result}
            liveBadge={state.running && state.connection === "connected"}
            overlay={
              result?.annotatedImage && !state.noPerson ? (
                <img className="stage__annotation" src={result.annotatedImage} alt="" />
              ) : null
            }
          />

          <div className="stage-bar">
            <div className="pills">
              <CameraStatusPill state={camera.state} />
              <span className={`pill pill--conn-${state.connection}`}>
                <span className="pill__dot" aria-hidden="true" />
                اتصال: {CONNECTION_LABEL[state.connection]}
              </span>
            </div>
            <div className="actions actions--inline">
              {state.running ? (
                <button type="button" className="btn btn--ghost" onClick={live.stop}>
                  <Icon name="stop" size={16} /> توقف تحلیل
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={camera.state !== "active"}
                  onClick={begin}
                >
                  <Icon name="live" size={18} /> شروع تحلیل زنده
                </button>
              )}
            </div>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {statusText}
          </p>

          {connectionLost && <StateNotice content={LIVE_NOTICES.connectionLost} tone="warning" />}
          {waitingForPose && <StateNotice content={LIVE_NOTICES.waitingForPose} tone="info" />}
          {state.noPerson && <StateNotice content={LIVE_NOTICES.noPerson} tone="warning" />}
          {state.error && state.error !== "unreachable" && (
            <StateNotice content={ANALYSIS_ERRORS[state.error]} tone="warning" />
          )}
          <PrivacyNote />
        </section>

        <aside className={`live__panel ${state.noPerson ? "is-stale" : ""}`} aria-label="نتایج زنده">
          {result ? (
            <>
              <RiskScore risk={result.riskScore} />
              <MetricGrid metrics={result.metrics} />
              <RecommendationList recommendations={result.recommendations} />
            </>
          ) : (
            <>
              <section className="risk risk--unknown" aria-labelledby="risk-heading">
                <h2 id="risk-heading" className="risk__eyebrow">
                  امتیاز ریسک پروژه
                </h2>
                <p className="risk__score">
                  <bdi dir="ltr" className="risk__number">—</bdi>
                </p>
                <p className="risk__label">در انتظار نتیجه</p>
                <div className="risk__meter" aria-hidden="true" />
              </section>
              <MetricGridSkeleton />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
