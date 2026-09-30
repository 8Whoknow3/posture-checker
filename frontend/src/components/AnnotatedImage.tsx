import { useState } from "react";
import { Icon } from "./Icon";

interface Props {
  annotated: string | null;
  original?: string | null;
  alt: string;
  badge?: string;
}

/** Shows the service-annotated image with loading/error states and an original toggle. */
export function AnnotatedImage({ annotated, original, alt, badge }: Props) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const canToggle = Boolean(annotated && original);
  const src = showOriginal && original ? original : annotated ?? original;

  return (
    <figure className="figure">
      <div className="figure__frame">
        {src ? (
          <img
            key={src}
            className="figure__img"
            src={src}
            alt={alt}
            onLoad={() => setState("ready")}
            onError={() => setState("error")}
            hidden={state === "error"}
          />
        ) : null}

        {(!src || state === "error") && (
          <div className="figure__empty" role="status">
            <Icon name="image" size={28} />
            <p>تصویر قابل نمایش نیست.</p>
          </div>
        )}
        {src && state === "loading" && (
          <div className="figure__loading" aria-hidden="true">
            <span className="spinner" />
          </div>
        )}
        {badge && <span className="figure__badge">{badge}</span>}
      </div>

      {canToggle && (
        <figcaption className="figure__caption">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            aria-pressed={showOriginal}
            onClick={() => {
              setState("loading");
              setShowOriginal((value) => !value);
            }}
          >
            {showOriginal ? "نمایش تصویر تحلیل‌شده" : "نمایش تصویر اصلی"}
          </button>
        </figcaption>
      )}
    </figure>
  );
}
