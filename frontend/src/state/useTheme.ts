import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "paw-theme";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

/**
 * The initial theme is set before first paint by an inline script in
 * index.html (saved choice, otherwise the system preference).
 * Follows system changes until the user picks a theme explicitly.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const apply = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
    apply(next);
  }, [apply]);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => {
      if (storedTheme() === null) apply(event.matches ? "dark" : "light");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [apply]);

  return [theme, toggle];
}
