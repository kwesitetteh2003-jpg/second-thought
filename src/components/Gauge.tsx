import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { Level } from "../../shared/types";
import { INK, LEVEL } from "../lib/ui";

const MAX = 2.5;
const ZONES: { from: number; to: number; level: Level; label: string }[] = [
  { from: 0, to: 0.5, level: "go", label: "go" },
  { from: 0.5, to: 1.2, level: "pause", label: "pause" },
  { from: 1.2, to: MAX, level: "stop", label: "stop" },
];

/** The verdict as a big word over a printed scale, with a needle that settles on the risk score. */
export function Gauge({ risk, level, idle = false }: { risk: number; level: Level; idle?: boolean; size?: number }) {
  const reduce = useReducedMotion();
  const f = Math.min(risk / MAX, 1);
  const v = useMotionValue(0);
  const shown = useTransform(v, (x) => (x * MAX).toFixed(2));
  const left = useTransform(v, (x) => `${x * 100}%`);
  useEffect(() => {
    const ctl = animate(v, idle ? 0 : f, { duration: reduce ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] });
    return () => ctl.stop();
  }, [f, idle, v, reduce]);
  const col = idle ? INK.faint : LEVEL[level].color;
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <motion.div
          key={idle ? "idle" : level}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idle ? 0 : 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="serif text-[72px] leading-[0.8] sm:text-[88px]"
          style={{ color: col }}
        >
          {idle ? <span className="text-ink/25">—</span> : LEVEL[level].word}
        </motion.div>
        <div className="text-right">
          <div className="eyebrow">Risk</div>
          <motion.div className="mono tnum mt-1 text-[22px] font-medium text-ink">{shown}</motion.div>
        </div>
      </div>
      <div className="relative mt-6 pb-6" aria-hidden>
        <div className="flex h-[6px]">
          {ZONES.map((z) => (
            <div key={z.level} className="h-full" style={{ width: `${((z.to - z.from) / MAX) * 100}%`, background: LEVEL[z.level].color, opacity: idle ? 0.15 : z.level === level ? 0.95 : 0.22 }} />
          ))}
        </div>
        <div className="mono absolute inset-x-0 top-[12px] text-[10px] uppercase tracking-[0.12em] text-faint">
          {ZONES.map((z) => <span key={z.level} className="absolute" style={{ left: `calc(${(z.from / MAX) * 100}% + 2px)` }}>{z.label}</span>)}
          <span className="absolute right-0">{MAX.toFixed(1)}</span>
        </div>
        {!idle && (
          <motion.div className="absolute -top-[7px] h-[20px] w-[2px] -translate-x-1/2 bg-ink" style={{ left }}>
            <span className="absolute -left-[4px] -top-[4px] h-[10px] w-[10px] rounded-full border-2 border-ink bg-sheet" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
