/** Typographic wordmark: no glyph, just the name set in the display serif. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="serif whitespace-nowrap text-[24px] leading-none tracking-[-0.015em] text-ink sm:text-[26px]">
      Second{compact ? " " : " "}<em className="text-ember">Thought</em>
    </span>
  );
}
