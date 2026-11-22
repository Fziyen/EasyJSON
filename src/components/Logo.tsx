export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M11 8c-2 0-3 1-3 3v2.5c0 1.2-.8 2-2 2.5 1.2.5 2 1.3 2 2.5V21c0 2 1 3 3 3M21 8c2 0 3 1 3 3v2.5c0 1.2.8 2 2 2.5-1.2.5-2 1.3-2 2.5V21c0 2-1 3-3 3"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M16 13l-3 6M16 13l3 6" className="stroke-primary-foreground" strokeOpacity=".6" strokeWidth="1.5" />
      <circle cx="16" cy="12" r="2" className="fill-primary-foreground" />
      <circle cx="13" cy="20" r="2" className="fill-primary-foreground" />
      <circle cx="19" cy="20" r="2" className="fill-primary-foreground" />
    </svg>
  );
}
