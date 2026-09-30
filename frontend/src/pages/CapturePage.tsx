import { useEffect, useState } from "react";
import { CameraStage, CameraStatusPill } from "../components/CameraStage";
import { Icon } from "../components/Icon";
import { ModeSwitch } from "../components/ModeSwitch";
import { PrivacyNote } from "../components/PrivacyNote";
import { Steps } from "../components/Steps";
import { LoadingPanel, StateNotice } from "../components/StateNotice";
import { ANALYSIS_ERRORS } from "../content/notices";
import { useApp } from "../state/AppContext";
import { useCamera } from "../state/useCamera";
import type { RoutePath } from "../state/useHashRoute";

interface Captured {
  blob: Blob;
  url: string;
}

export function CapturePage({ navigate }: { navigate: (p: RoutePath) => void }) {
  const { analysis, analyze, resetAnalysis } = useApp();
  const camera = useCamera();
  const [captured, setCaptured] = useState<Captured | null>(null);

  useEffect(() => {
    if (analysis.status === "error") resetAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = analysis.status === "analyzing";
  const step = busy ? 2 : captured ? 1 : 0;

  async function capture() {
    const blob = await camera.capture();
    if (blob) setCaptured({ blob, url: URL.createObjectURL(blob) });
  }

  function retake() {
    if (captured && captured.url !== analysis.preview) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    if (analysis.status === "error") resetAnalysis();
  }

  async function submit() {
    if (!captured || busy) return;
    const ok = await analyze(captured.blob, "capture", captured.url);
    if (ok) navigate("/result");
  }

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">عکس از وبکم</h1>
        <p className="page__lead">
          دوربین را روشن کنید، قاب را تنظیم کنید، عکس بگیرید و تحلیل کنید.
        </p>
        <ModeSwitch current="capture" />
      </header>

      <Steps steps={["پیش‌نمایش", "ثبت", "تحلیل", "نتیجه"]} current={step} />

      <div className="split">
        <section className="stage-col" aria-label="دوربین">
          <CameraStage
            videoRef={camera.videoRef}
            state={camera.state}
            onEnable={camera.start}
            showGuide={!captured}
            overlay={
              <>
                {captured && (
                  <img className="stage__captured" src={captured.url} alt="عکس ثبت‌شده" />
                )}
                {busy && (
                  <div className="stage__busy">
                    <LoadingPanel title="در حال تحلیل عکس…" hint="منتظر پاسخ سرویس تحلیل هستیم." />
                  </div>
                )}
              </>
            }
          />

          <div className="stage-bar">
            <CameraStatusPill state={camera.state} />
            <div className="actions actions--inline">
              {!captured ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={camera.state !== "active"}
                  onClick={capture}
                >
                  <Icon name="camera" size={18} /> ثبت عکس
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn--ghost" disabled={busy} onClick={retake}>
                    <Icon name="refresh" size={18} /> بازگرفتن
                  </button>
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={submit}>
                    تحلیل این عکس
                  </button>
                </>
              )}
            </div>
          </div>

          {analysis.status === "error" && analysis.error && (
            <StateNotice content={ANALYSIS_ERRORS[analysis.error.code]}>
              <button type="button" className="btn btn--primary btn--sm" onClick={submit}>
                <Icon name="refresh" size={16} /> تلاش دوباره
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={retake}>
                بازگرفتن
              </button>
            </StateNotice>
          )}
        </section>

        <aside className="side" aria-label="راهنمای قاب‌بندی">
          <section className="card">
            <h2 className="card__title">قاب‌بندی</h2>
            <ul className="checklist">
              <li>سر، شانه‌ها و تنه داخل راهنمای خط‌چین باشند</li>
              <li>کمی عقب‌تر بنشینید تا ران‌ها هم دیده شوند</li>
              <li>برای سنجش کامل‌تر، نمای روبه‌رو یا کمی زاویه‌دار</li>
            </ul>
          </section>
          <PrivacyNote />
        </aside>
      </div>
    </div>
  );
}
