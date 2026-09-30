/** PAW mark: three aligned points (ear · shoulder · hip) inside a rounded square. */
export function PawMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="paw-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" fill="var(--color-panel)" />
      <path d="M12 7v18" stroke="#3b4a63" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="9" r="2.6" fill="#ffffff" />
      <circle cx="12" cy="16" r="2.6" fill="#ffffff" />
      <circle cx="12" cy="23" r="2.6" fill="var(--color-accent-on-dark)" />
      <path
        d="M21 10.5v11"
        stroke="var(--color-accent-on-dark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 4"
      />
    </svg>
  );
}
