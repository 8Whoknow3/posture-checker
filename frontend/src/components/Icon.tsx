export type IconName =
  | "upload"
  | "camera"
  | "live"
  | "arrow"
  | "refresh"
  | "alert"
  | "info"
  | "image"
  | "stop"
  | "lock"
  | "home"
  | "help"
  | "sun"
  | "moon";

const PATHS: Record<IconName, string> = {
  upload: "M12 16V4m0 0L7 9m5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3",
  camera:
    "M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM12 16.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z",
  live: "M3 12h3l2.5-6 4 12 2.5-6H21",
  arrow: "M19 12H5m0 0 6-6m-6 6 6 6",
  refresh: "M20 11a8 8 0 1 0-2.3 6.1M20 4v7h-7",
  alert: "M12 8v5m0 3.5v.01M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  info: "M12 11v5m0-8.5v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  image:
    "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 11 5-5 4 4 3-3 5 5M9 9.5v.01",
  stop: "M7 7h10v10H7z",
  sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  home: "M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z",
  help: "M9.1 9a3 3 0 1 1 4.5 2.6c-.9.6-1.6 1.2-1.6 2.4M12 17.5v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z",
};

/** Decorative icon; always paired with visible text. */
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
