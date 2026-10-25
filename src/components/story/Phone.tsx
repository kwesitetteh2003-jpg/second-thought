import { motion, useMotionTemplate, useTransform, type MotionValue } from "framer-motion";

/**
 * Kofi's phone at 2 AM. One component, driven by a single progress value `p`
 * (0..1): the hero drives it with a clock, the night section with scroll.
 *   0.18–0.26  thumb taps "Confirm sell"
 *   0.28–0.38  Second Thought slides in and starts recalling
 *   0.38–0.58  four past nights come back, one by one
 *   0.62–0.74  the sheet opens fully and the STOP stamp lands
 *   0.74–1     the cooling-off clock runs
 * Sized in em: set font-size on the wrapper to scale the whole phone.
 * Purely illustrative, so it's hidden from assistive tech.
 */

export const NIGHTS = [
  { d: "29 Aug", h: "02:00", pct: 45, pnl: -11 },
  { d: "15 Sep", h: "03:00", pct: 35, pnl: -13 },
  { d: "26 Sep", h: "01:00", pct: 50, pnl: -10 },
  { d: "06 Oct", h: "02:00", pct: 40, pnl: -12 },
] as const;

const SPARK = "M0 12 L14 10 L26 14 L38 11 L50 18 L62 16 L74 24 L86 22 L98 31 L110 29 L122 38 L134 36 L146 44 L160 47";

function Row({ p, i, n }: { p: MotionValue<number>; i: number; n: (typeof NIGHTS)[number] }) {
  const s = 0.38 + i * 0.05;
  const opacity = useTransform(p, [s, s + 0.04], [0, 1]);
  const x = useTransform(p, [s, s + 0.04], [14, 0]);
  return (
    <motion.div style={{ opacity, x }} className="flex items-baseline justify-between border-t border-[rgba(29,26,22,0.1)] py-[0.42em]">
      <span className="mono text-[0.72em] text-[#4d463d]">{n.d} · {n.h} · sell {n.pct}%</span>
      <span className="mono text-[0.8em] font-medium text-[#ad2f1d]">{n.pnl}%</span>
    </motion.div>
  );
}

export function StoryPhone({ p, className = "" }: { p: MotionValue<number>; className?: string }) {
  const ring = useTransform(p, [0.18, 0.27], [0, 1]);
  const ringScale = useTransform(ring, [0, 1], [0.4, 2.4]);
  const ringOpacity = useTransform(ring, [0, 0.15, 1], [0, 0.55, 0]);
  const press = useTransform(p, [0.19, 0.21, 0.25], [1, 0.94, 1]);
  const sheetY = useTransform(p, [0, 0.28, 0.38, 0.6, 0.69], ["105%", "105%", "44%", "44%", "0%"]);
  const dim = useTransform(p, [0.28, 0.38], [0, 0.55]);
  const needle = useTransform(p, [0.4, 0.66], [2, 93]);
  const needleLeft = useMotionTemplate`${needle}%`;
  const risk = useTransform(needle, (v) => ((v / 93) * 2.32).toFixed(2));
  const recallOpacity = useTransform(p, [0.3, 0.36, 0.66, 0.7], [0, 1, 1, 0]);
  const stampOpacity = useTransform(p, [0.68, 0.71], [0, 1]);
  const stampScale = useTransform(p, [0.68, 0.73], [1.9, 1]);
  const stampRotate = useTransform(p, [0.68, 0.73], [-16, -5]);
  const clock = useTransform(p, (v): string => (v < 0.36 ? "02:04" : "02:05"));
  const cooldown = useTransform(p, (v) => {
    const left = Math.max(0, 3600 - Math.round(Math.max(0, v - 0.74) * 40));
    return `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  });
  const footOpacity = useTransform(p, [0.72, 0.78], [0, 1]);
  const spark = useTransform(p, [0, 0.16], [0.15, 1]);

  return (
    <div aria-hidden className={`phone relative h-[36em] w-[17.6em] select-none rounded-[2.7em] bg-[#0a0c10] p-[0.5em] shadow-[0_2.4em_4.5em_-1.2em_rgba(17,20,27,0.55),0_0_0_1px_rgba(255,255,255,0.06)_inset] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[2.25em] bg-[#11141b] text-[#e8e2d6]">
        {/* notch + status */}
        <div className="absolute left-1/2 top-[0.55em] h-[1.35em] w-[5.4em] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-[1.5em] pt-[0.75em] text-[0.72em]">
          <motion.span className="mono font-medium">{clock}</motion.span>
          <span className="flex items-end gap-[0.18em]">{[0.4, 0.6, 0.8, 1].map((h) => <i key={h} className="block w-[0.22em] rounded-[1px] bg-[#e8e2d6]" style={{ height: `${h * 0.8}em` }} />)}</span>
        </div>

        {/* wallet */}
        <div className="px-[1.3em] pt-[1.6em]">
          <div className="text-[0.6em] uppercase tracking-[0.16em] text-[#8f8778]">Sui wallet · Kofi</div>
          <div className="mt-[0.3em] font-serif text-[2.3em] leading-none tracking-[-0.01em]">4,821<span className="text-[0.55em] text-[#a39a8b]"> SUI</span></div>
          <div className="mono mt-[0.35em] text-[0.68em] text-[#e9927a]">−6.8% since dinner</div>
          <svg viewBox="0 0 160 50" className="mt-[0.6em] h-[3.1em] w-full overflow-visible">
            <motion.path d={SPARK} fill="none" stroke="#e9927a" strokeWidth="1.6" strokeLinecap="round" style={{ pathLength: spark }} />
          </svg>
        </div>

        {/* sell sheet */}
        <div className="mx-[0.8em] mt-[0.9em] rounded-[1.3em] bg-[#1a1e27] p-[1em]">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.7em] text-[#a39a8b]">Sell</span>
            <span className="mono text-[0.62em] text-[#8f8778]">SUI → USDC</span>
          </div>
          <div className="mt-[0.2em] font-serif text-[2.9em] leading-none">40%</div>
          <div className="mono mt-[0.3em] text-[0.62em] text-[#a39a8b]">≈ 1,928 SUI</div>
          <div className="relative mt-[0.9em] h-[0.3em] rounded-full bg-[#2a2f3a]">
            <div className="absolute inset-y-0 left-0 w-[40%] rounded-full bg-[#d9572a]" />
            <div className="absolute left-[40%] top-1/2 h-[0.95em] w-[0.95em] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.18em] border-[#d9572a] bg-[#11141b]" />
          </div>
          <div className="relative mt-[1.1em]">
            <motion.div style={{ scale: press }} className="rounded-full bg-[#e8e2d6] py-[0.7em] text-center text-[0.8em] font-semibold text-[#11141b]">Confirm sell</motion.div>
            <motion.span style={{ scale: ringScale, opacity: ringOpacity }} className="pointer-events-none absolute left-[62%] top-1/2 h-[2.6em] w-[2.6em] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#e8e2d6]" />
          </div>
        </div>

        <motion.div style={{ opacity: dim }} className="absolute inset-0 bg-black" />

        {/* Second Thought sheet */}
        <motion.div style={{ y: sheetY }} className="absolute inset-x-0 bottom-0 top-[13%] rounded-t-[1.6em] bg-[#fbf8f2] px-[1.2em] pt-[0.7em] text-[#1d1a16] shadow-[0_-1em_2em_rgba(0,0,0,0.35)]">
          <div className="mx-auto h-[0.25em] w-[2.6em] rounded-full bg-[rgba(29,26,22,0.18)]" />
          <div className="mt-[0.9em] flex items-center justify-between">
            <span className="text-[0.58em] font-semibold uppercase tracking-[0.16em] text-[#6b6257]">Second Thought</span>
            <span className="mono text-[0.58em] text-[#2b3f7a]">21 memories</span>
          </div>
          <div className="relative mt-[0.5em] flex h-[4.4em] items-center justify-between">
            <motion.span style={{ opacity: recallOpacity }} className="font-serif text-[1.35em] italic text-[#4d463d]">Have I seen this before?</motion.span>
            <motion.span style={{ opacity: stampOpacity, scale: stampScale, rotate: stampRotate }} className="absolute left-0 rounded-[0.12em] border-[0.09em] border-[#ad2f1d] px-[0.18em] font-serif text-[3.3em] leading-[0.95] text-[#ad2f1d]">STOP</motion.span>
            <motion.span style={{ opacity: stampOpacity }} className="absolute right-0 text-right">
              <span className="block text-[0.55em] uppercase tracking-[0.14em] text-[#6b6257]">risk</span>
              <motion.span className="mono block text-[1.05em]">{risk}</motion.span>
            </motion.span>
          </div>
          <div className="relative mt-[0.3em] flex h-[0.28em] gap-[0.15em]">
            <span className="h-full flex-[1] bg-[#2c6a4c]/40" /><span className="h-full flex-[0.8] bg-[#9a5b0b]/45" /><span className="h-full flex-[1.2] bg-[#ad2f1d]" />
            <motion.span style={{ left: needleLeft }} className="absolute top-1/2 h-[1.1em] w-[0.16em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1d1a16]" />
          </div>
          <p className="mt-[1.1em] font-serif text-[1.15em] leading-[1.1]">Four nights like this one.</p>
          <div className="mt-[0.4em]">{NIGHTS.map((n, i) => <Row key={n.d} p={p} i={i} n={n} />)}</div>
          <div className="mono mt-[0.2em] flex justify-between border-t border-[#1d1a16] pt-[0.45em] text-[0.72em]"><span>average</span><span className="font-medium text-[#ad2f1d]">−11.5%</span></div>
          <motion.div style={{ opacity: footOpacity }} className="mt-[1em] flex items-center justify-between rounded-[0.9em] bg-[#f3e2da] px-[0.9em] py-[0.7em]">
            <span>
              <motion.span className="mono block text-[1.25em] font-medium leading-none text-[#ad2f1d]">{cooldown}</motion.span>
              <span className="text-[0.56em] uppercase tracking-[0.14em] text-[#6b6257]">cooling off</span>
            </span>
            <span className="rounded-full bg-[#1d1a16] px-[0.9em] py-[0.5em] text-[0.68em] font-semibold text-[#fbf8f2]">Sleep on it</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
