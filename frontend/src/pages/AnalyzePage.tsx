import { useEffect, useRef, useState, type DragEvent } from "react";
import { Icon } from "../components/Icon";
import { ModeSwitch } from "../components/ModeSwitch";
import { PrivacyNote } from "../components/PrivacyNote";
import { LoadingPanel, StateNotice } from "../components/StateNotice";
import { ACCEPTED_IMAGE_TYPES, isAcceptedImage } from "../lib/image";
import { ANALYSIS_ERRORS } from "../content/notices";
import { useApp } from "../state/AppContext";
import type { RoutePath } from "../state/useHashRoute";
import type { AnalysisErrorCode } from "../types";

export function AnalyzePage({ navigate }: { navigate: (p: RoutePath) => void }) {
  const { analysis, analyze, resetAnalysis } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<AnalysisErrorCode | null>(null);
  const analysisPreview = useRef<string | null>(null);
  analysisPreview.current = analysis.preview;

  // Start clean when entering the page.
  useEffect(() => {
    if (analysis.status === "error") resetAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = analysis.status === "analyzing";
  const errorCode =
    localError ?? (analysis.status === "error" ? analysis.error?.code ?? "unknown" : null);

  function choose(next: File | undefined) {
    if (!next || busy) return;
    if (preview && preview !== analysisPreview.current) URL.revokeObjectURL(preview);
    if (!isAcceptedImage(next)) {
      setFile(null);
      setPreview(null);
      setLocalError("invalid_image");
      return;
    }
    if (analysis.status === "error") resetAnalysis();
    setLocalError(null);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  async function submit() {
    if (!file || busy) return;
    const ok = await analyze(file, "upload", preview);
    if (ok) navigate("/result");
  }

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">تحلیل از روی تصویر</h1>
        <p className="page__lead">
          یک عکس از فرد نشسته انتخاب کنید. هر نمایی (روبه‌رو، نیم‌رخ یا زاویه‌دار) قابل قبول است.
        </p>
        <ModeSwitch current="upload" />
      </header>

      <div className="split">
        <section className="card card--flush" aria-labelledby="input-heading">
          <h2 id="input-heading" className="sr-only">
            انتخاب تصویر
          </h2>

          <div className="dz-wrap">
            <label
              className={`dropzone ${dragging ? "is-drag" : ""} ${preview ? "has-preview" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                className="dropzone__input"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                disabled={busy}
                onChange={(e) => {
                  choose(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {preview ? (
                <img className="dropzone__preview" src={preview} alt="پیش‌نمایش تصویر انتخاب‌شده" />
              ) : (
                <span className="dropzone__empty">
                  <Icon name="upload" size={32} />
                  <span className="dropzone__title">تصویر را اینجا رها کنید یا برای انتخاب کلیک کنید</span>
                  <span className="muted">
                    <bdi dir="ltr">JPG · PNG · WebP</bdi>
                  </span>
                </span>
              )}
              {busy && (
                <span className="dropzone__busy">
                  <LoadingPanel title="در حال تحلیل تصویر…" hint="منتظر پاسخ سرویس تحلیل هستیم." />
                </span>
              )}
            </label>
          </div>

          {errorCode && (
            <StateNotice content={ANALYSIS_ERRORS[errorCode]}>
              {file && errorCode !== "invalid_image" && (
                <button type="button" className="btn btn--primary btn--sm" onClick={submit}>
                  <Icon name="refresh" size={16} /> تلاش دوباره
                </button>
              )}
            </StateNotice>
          )}

          <div className="actions">
            <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={submit}>
              تحلیل وضعیت نشستن
            </button>
            {file && !busy && (
              <span className="muted file-name" dir="ltr">
                {file.name}
              </span>
            )}
          </div>
        </section>

        <aside className="side" aria-label="راهنمای عکس">
          <section className="card">
            <h2 className="card__title">برای نتیجهٔ بهتر</h2>
            <ul className="checklist">
              <li>سر، شانه‌ها، تنه و ران‌ها در قاب باشند</li>
              <li>دوربین هم‌سطح و بدون کجی باشد</li>
              <li>نور کافی و پس‌زمینهٔ ساده</li>
              <li>یک نفر در تصویر باشد</li>
            </ul>
          </section>
          <PrivacyNote />
        </aside>
      </div>
    </div>
  );
}
