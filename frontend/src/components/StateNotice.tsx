import type { ReactNode } from "react";
import type { NoticeContent } from "../content/notices";
import { Icon } from "./Icon";

type Tone = "error" | "info" | "warning";

/** What happened + why + what to do next. */
export function StateNotice({
  content,
  tone = "error",
  children,
}: {
  content: NoticeContent;
  tone?: Tone;
  /** Action buttons. */
  children?: ReactNode;
}) {
  return (
    <div
      className={`notice notice--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="notice__icon">
        <Icon name={tone === "info" ? "info" : "alert"} />
      </span>
      <div className="notice__body">
        <h3 className="notice__title">{content.title}</h3>
        <p className="notice__line">
          <span className="notice__label">چرا:</span> {content.why}
        </p>
        <p className="notice__line">
          <span className="notice__label">قدم بعدی:</span> {content.next}
        </p>
        {children && <div className="notice__actions">{children}</div>}
      </div>
    </div>
  );
}

export function LoadingPanel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p className="loading__title">{title}</p>
      {hint && <p className="loading__hint">{hint}</p>}
    </div>
  );
}
