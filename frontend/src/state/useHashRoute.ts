import { useCallback, useEffect, useState } from "react";

export type RoutePath =
  | "/"
  | "/analyze"
  | "/capture"
  | "/live"
  | "/result"
  | "/help";

const ROUTES: readonly RoutePath[] = [
  "/",
  "/analyze",
  "/capture",
  "/live",
  "/result",
  "/help",
];

export function parseHash(hash: string): RoutePath {
  const path = hash.replace(/^#/, "") || "/";
  return (ROUTES as readonly string[]).includes(path) ? (path as RoutePath) : "/";
}

export function useHashRoute(): [RoutePath, (path: RoutePath) => void] {
  const [route, setRoute] = useState<RoutePath>(() =>
    parseHash(window.location.hash),
  );

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((path: RoutePath) => {
    window.location.hash = path;
  }, []);

  return [route, navigate];
}
