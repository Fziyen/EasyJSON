/**
 * EasyJSON mark: an opening brace whose contents branch out into a small graph,
 * i.e. JSON turning into nodes. Monochrome; follows the theme (black tile in light, white tile in dark).
 */
export function Logo({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="7.5" className="fill-primary" />
      <g fill="none" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground">
        <path d="M11.6 6.6c-2.5 0-3.4 1.3-3.4 3.2v2.8c0 1.7-.9 2.9-2.6 3.4 1.7.5 2.6 1.7 2.6 3.4v2.8c0 1.9.9 3.2 3.4 3.2" />
        <path d="M15.8 16h3.4M19.2 16v-4.1c0-1.1.6-1.6 1.6-1.6h1.4M19.2 16v4.1c0 1.1.6 1.6 1.6 1.6h1.4" />
      </g>
      <g className="fill-primary-foreground">
        <circle cx="15" cy="16" r="2.4" />
        <circle cx="24.2" cy="10.3" r="2.4" />
        <circle cx="24.2" cy="21.7" r="2.4" />
      </g>
    </svg>
  );
}
