import { motion } from "framer-motion";
import { useState } from "react";
import { INK, pct } from "../lib/ui";

export function OutcomeLogger({ acted, busy, onSeal, error }: { acted: boolean; busy: boolean; onSeal: (pnl: number) => void; error: string | null }) {
  const [v, setV] = useState(acted ? -8 : 8);
  const col = v >= 0 ? INK.go : INK.stop;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel p-6 sm:p-8">
      <div className="eyebrow mb-3">{acted ? "You went ahead" : "You waited"}</div>
      <h3 className="serif text-[30px] leading-[1.05]">{acted ? "How did it turn out?" : "How did holding turn out?"}</h3>
      <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-dim">
        {acted ? "Log the result in percent. In real life you'd come back days later. This is the moment the app learns." : "Positive means you ended up better off by waiting, negative means acting would have been better."}
      </p>
      <div className="mt-7 flex items-end justify-between">
        <span className="mono text-[11px] text-faint">−30%</span>
        <span className="serif tnum text-[64px] leading-[0.8] transition-colors" style={{ color: col }}>{pct(v)}</span>
        <span className="mono text-[11px] text-faint">+30%</span>
      </div>
      <div className="relative mt-2">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-ink/10" />
        <div className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 transition-colors" style={{ background: col, left: v >= 0 ? "50%" : `${((v + 30) / 60) * 100}%`, width: `${(Math.abs(v) / 60) * 100}%` }} />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-ink/40" aria-hidden />
        <input aria-label="Result in percent" type="range" className="slider relative" min={-30} max={30} value={v} onChange={(e) => setV(Number(e.target.value))} style={{ ["--thumb" as string]: col }} />
      </div>
      {error && <p className="mt-2 text-[13px] text-stop">{error}</p>}
      <button className="btn-primary mt-5 w-full" disabled={busy} onClick={() => onSeal(v)}>
        {busy ? "Writing to memory…" : "Seal this in memory"}
      </button>
    </motion.div>
  );
}
