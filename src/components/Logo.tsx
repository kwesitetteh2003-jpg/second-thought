export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ef2d0" />
          <stop offset="1" stopColor="#5b8cff" />
        </linearGradient>
      </defs>
      <path d="M44 20a17 17 0 1 0 2 15" fill="none" stroke="url(#lg)" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4.6" fill="#5ef2d0" />
    </svg>
  );
}
