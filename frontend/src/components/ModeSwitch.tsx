import { Icon } from "./Icon";

/** Switches between the two single-image inputs (upload / webcam). */
export function ModeSwitch({ current }: { current: "upload" | "capture" }) {
  return (
    <nav className="segmented" aria-label="روش ورودی">
      <a
        className="segmented__item"
        href="#/analyze"
        aria-current={current === "upload" ? "page" : undefined}
      >
        <Icon name="upload" size={16} /> آپلود تصویر
      </a>
      <a
        className="segmented__item"
        href="#/capture"
        aria-current={current === "capture" ? "page" : undefined}
      >
        <Icon name="camera" size={16} /> وبکم
      </a>
    </nav>
  );
}
