/**
 * Single place for backend-related configuration.
 * UI code must never read `import.meta.env` or hard-code URLs directly.
 */

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function deriveWsUrl(apiBaseUrl: string): string {
  if (/^https?:\/\//i.test(apiBaseUrl)) {
    return `${apiBaseUrl.replace(/^http/i, "ws")}/ws/posture`;
  }
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${window.location.host}${apiBaseUrl}/ws/posture`;
}

export interface AppEnv {
  /** true → development adapters are used (no backend needed). */
  useMock: boolean;
  apiBaseUrl: string;
  wsUrl: string;
}

export function readEnv(raw: ImportMetaEnv = import.meta.env): AppEnv {
  const apiBaseUrl = trimTrailingSlash(raw.VITE_API_BASE_URL ?? "");
  return {
    useMock: raw.VITE_USE_MOCK !== "false",
    apiBaseUrl,
    wsUrl: raw.VITE_WS_URL || deriveWsUrl(apiBaseUrl),
  };
}

export const env: AppEnv = readEnv();
