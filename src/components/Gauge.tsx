import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { Level } from "../../shared/types";
import { LEVEL } from "../lib/ui";

const MAX = 2.5;
const ARC = 0.75; // 270°

export function Gauge({ risk, level, idle = false, size = 232 }: { risk: number; level: Level; idle?: boolean; size?: number }) {
  const r = 92, c = 2 * Math.PI * r;
  const f = Math.min(risk / MAX, 1);
  const v = useMotionValue(0);
  const shown = useTransform(v, (x) => (x * MAX).toFixed(2));
  useEffect(() => {
    const ctl = animate(v, idle ? 0 : f, { duration: 1.25, ease: [0.22, 1, 0.36, 1] });
    return () => ctl.stop();
  }, [f, idle, v]);
  const col = idle ? "#2a3345" : LEVEL[level].color;
  const tick = (t: number) => {
    const a = (135 + t * 270) * (Math.PI / 180);
    return { x1: 110 + Math.cos(a) * 80, y1: 110 + Math.sin(a) * 80, x2: 110 + Math.cos(a) * 104, y2: 110 + Math.sin(a) * 104 };
  };
  const dash = useTransform(v, (x) => `${c * ARC * x} ${c}`);
  const ang = (x: number) => (135 + x * 270) * (Math.PI / 180);
  const dx = useTransform(v, (x) => 110 + Math.cos(ang(x)) * r);
  const dy = useTransform(v, (x) => 110 + Math.sin(ang(x)) * r);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-4 rounded-full blur-3xl transition-colors duration-700" style={{ background: idle ? "transparent" : LEVEL[level].glow }} />
      <svg viewBox="0 0 220 220" width={size} height={size} className="relative">
        <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * ARC} ${c}`} transform="rotate(135 110 110)" />
        <motion.circle cx="110" cy="110" r={r} fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" transform="rotate(135 110 110)" style={{ strokeDasharray: dash }} />
        {[0.5 / MAX, 1.2 / MAX].map((t) => <line key={t} {...tick(t)} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />)}
        <motion.circle cx={dx} cy={dy} r="9" fill="#fff" />
        <motion.circle cx={dx} cy={dy} r="4" fill={col} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <motion.div key={idle ? "idle" : level} initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ delay: idle ? 0 : 0.75, type: "spring", stiffness: 260, damping: 18 }} className="text-[42px] font-bold leading-none tracking-tight" style={{ color: col }}>
            {idle ? "—" : LEVEL[level].word}
          </motion.div>
          <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">risk <motion.span className="mono tnum text-dim">{shown}</motion.span></div>
        </div>
      </div>
    </div>
  );
}
