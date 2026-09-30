import type { ReactNode, RefObject } from "react";
import { CAMERA_NOTICES } from "../content/notices";
import type { CameraState } from "../types";
import { Icon } from "./Icon";
import { StateNotice } from "./StateNotice";

const CAMERA_STATUS_LABEL: Record<CameraState, string> = {
  idle: "دوربین روشن نیست",
  requesting: "در انتظار اجازهٔ مرورگر",
  active: "دوربین آماده است",
  denied: "دسترسی داده نشد",
  unavailable: "دوربین در دسترس نیست",
};

export function CameraStatusPill({ state }: { state: CameraState }) {
  return (
    <span className={`pill pill--camera-${state}`}>
      <span className="pill__dot" aria-hidden="true" />
      {CAMERA_STATUS_LABEL[state]}
    </span>
  );
}

function FramingGuide() {
  return (
    <svg
      className="guide"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="26" rx="10" ry="12" />
      <path d="M26 52c4-7 12-10 24-10s20 3 24 10" />
      <path d="M32 54v40M68 54v40" strokeDasharray="2 3" />
      <text x="63" y="27">سر</text>
      <text x="76" y="50">شانه‌ها</text>
      <text x="72" y="75">تنه</text>
    </svg>
  );
}

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: CameraState;
  onEnable: () => void;
  /** Extra layers shown above the video (live annotation, captured frame…). */
  overlay?: ReactNode;
  showGuide?: boolean;
  liveBadge?: boolean;
}

/**
 * Camera viewport + setup states. The <video> is always mounted so the
 * stream can attach as soon as permission is granted.
 */
export function CameraStage({
  videoRef,
  state,
  onEnable,
  overlay,
  showGuide = true,
  liveBadge = false,
}: Props) {
  const active = state === "active";
  const notice = CAMERA_NOTICES[state];

  return (
    <div className="stage">
      <video
        ref={videoRef}
        className="stage__video"
        autoPlay
        playsInline
        muted
        hidden={!active}
        aria-label="پیش‌نمایش دوربین"
      />

      {active && showGuide && <FramingGuide />}
      {overlay}

      {liveBadge && (
        <span className="live-badge">
          <span className="live-badge__dot" aria-hidden="true" />
          زنده
        </span>
      )}

      {!active && (
        <div className="stage__setup">
          <span className="stage__setup-icon">
            <Icon name="camera" size={28} />
          </span>

          {notice ? (
            <StateNotice content={notice}>
              <button type="button" className="btn btn--primary btn--sm" onClick={onEnable}>
                <Icon name="refresh" size={16} /> تلاش دوباره
              </button>
            </StateNotice>
          ) : (
            <>
              <h2 className="stage__setup-title">آماده‌سازی دوربین</h2>
              <ul className="checklist">
                <li>سر، شانه‌ها و تنه کاملاً در قاب باشند</li>
                <li>دوربین هم‌سطح و بدون کجی باشد</li>
                <li>نور کافی روبه‌روی شما باشد</li>
              </ul>
              <button
                type="button"
                className="btn btn--primary"
                onClick={onEnable}
                disabled={state === "requesting"}
              >
                <Icon name="camera" size={18} />
                {state === "requesting" ? "در انتظار اجازه…" : "روشن کردن دوربین"}
              </button>
              <p className="muted stage__setup-hint">
                مرورگر از شما اجازهٔ استفاده از دوربین را می‌پرسد.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
