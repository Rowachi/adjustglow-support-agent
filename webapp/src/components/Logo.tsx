export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      aria-hidden="true"
      style={{ width: 28, height: 28, flex: "none" }}
    >
      <g fill="var(--color-ink)">
        <rect x="53.5" y="11.5" width="13" height="15" rx="3" transform="rotate(0 60 19)" />
        <rect x="82.5" y="23.5" width="13" height="15" rx="3" transform="rotate(45 89 31)" />
        <rect x="94.5" y="52.5" width="13" height="15" rx="3" transform="rotate(90 101 60)" />
        <rect x="82.5" y="81.5" width="13" height="15" rx="3" transform="rotate(135 89 89)" />
        <rect x="53.5" y="93.5" width="13" height="15" rx="3" transform="rotate(180 60 101)" />
        <rect x="24.5" y="81.5" width="13" height="15" rx="3" transform="rotate(225 31 89)" />
        <rect x="12.5" y="52.5" width="13" height="15" rx="3" transform="rotate(270 19 60)" />
        <rect x="24.5" y="23.5" width="13" height="15" rx="3" transform="rotate(315 31 31)" />
      </g>
      <circle cx="60" cy="60" r="34" fill="none" stroke="var(--color-ink)" strokeWidth="9" />
      <g stroke="var(--color-ink)" strokeWidth="7.5" strokeLinecap="round" fill="none">
        <path d="M60 34 L44 80" />
        <path d="M60 34 L76 80" />
      </g>
      <path d="M60 22 L52 36 L68 36 Z" fill="var(--color-accent-bright)" />
      <line x1="49" y1="61" x2="71" y2="61" stroke="var(--color-orange)" strokeWidth="6" strokeLinecap="round" />
      <g fill="var(--color-orange)">
        <path d="M49 61 L57 55 L57 67 Z" />
        <path d="M71 61 L63 55 L63 67 Z" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      className={`flex items-center gap-2.5 font-display text-[1.05rem] font-semibold text-ink ${className ?? ""}`}
    >
      <LogoMark />
      Adjustglow
    </a>
  );
}
