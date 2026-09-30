import { useApp } from "../state/AppContext";
import { Icon } from "./Icon";

/** Factual note only: what leaves the browser, and what the UI keeps. */
export function PrivacyNote() {
  const { services } = useApp();
  return (
    <p className="privacy">
      <Icon name="lock" size={16} />
      <span>
        {services.isMock
          ? "حالت آزمایشی فعال است؛ تصویر جایی ارسال نمی‌شود."
          : "تصویر یا فریم‌های دوربین فقط برای تحلیل به سرویس PAW ارسال می‌شود و رابط کاربری چیزی ذخیره نمی‌کند."}
      </span>
    </p>
  );
}
