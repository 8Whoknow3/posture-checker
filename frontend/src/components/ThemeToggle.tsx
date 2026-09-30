import { useTheme } from "../state/useTheme";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "حالت روشن" : "حالت تاریک"}
    >
      <Icon name={dark ? "sun" : "moon"} size={20} />
      <span className="theme-toggle__label">
        {dark ? "حالت روشن" : "حالت تاریک"}
      </span>
    </button>
  );
}