import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useRef } from "react";

/** Kofi's ledger as a running tape. Drifts on its own; scrolling pushes it. */
const TAPE: [string, string, number][] = [
  ["14 Aug", "22:00 · buy 15% · a tip", -9],
  ["29 Aug", "02:00 · sell 45% · fearful", -11],
  ["09 Sep", "23:00 · buy 30% · FOMO", -14],
  ["15 Sep", "03:00 · sell 35% · fearful", -13],
  ["26 Sep", "01:00 · sell 50% · angry", -10],
  ["06 Oct", "02:00 · sell 40% · STOP, overrode", -12],
  ["16 Oct", "02:00 · STOP · he waited", 9],
  ["20 Oct", "14:00 · sell 20% · to plan", 4],
];

const wrap = (min: number, max: number, v: number) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };

function Items() {
  return (
    <div className="flex shrink-0 items-center">
      {TAPE.map(([d, what, pnl]) => (
        <span key={d} className="flex items-center gap-3 whitespace-nowrap px-6">
          <span className="font-serif text-[22px] italic text-moon sm:text-[26px]">{d}</span>
          <span className="mono text-[12px] uppercase tracking-[0.08em] text-[#a39a8b]">{what}</span>
          <span className={`mono text-[13px] font-medium ${pnl < 0 ? "text-[#e9927a]" : "text-[#8fc5a6]"}`}>{pnl > 0 ? "+" : "−"}{Math.abs(pnl)}%</span>
          <span aria-hidden className="ml-6 h-1 w-1 rounded-full bg-[#4d463d]" />
        </span>
      ))}
    </div>
  );
}

export function Ticker() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(vel, [-1500, 0, 1500], [-4, 0, 4], { clamp: false });
  const skew = useTransform(vel, [-2000, 0, 2000], [4, 0, -4]);
  const dir = useRef(1);
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);
  useAnimationFrame((_, delta) => {
    if (reduce || !inView) return;
    const f = factor.get();
    if (f < 0) dir.current = -1; else if (f > 0) dir.current = 1;
    base.set(base.get() - dir.current * 1.6 * (delta / 1000) * (1 + Math.abs(f)));
  });
  return (
    <div ref={ref} className="relative overflow-hidden border-y border-black bg-night py-4" role="marquee" aria-label="Kofi's journal, as a running tape">
      <motion.div style={{ x, skewX: reduce ? 0 : skew }} className="flex w-max">
        <Items /><div aria-hidden className="flex"><Items /></div>
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-night to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-night to-transparent" />
    </div>
  );
}
