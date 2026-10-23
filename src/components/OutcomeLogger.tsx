import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { pct } from "../lib/ui";

export function OutcomeLogger({ acted, busy, onSeal, error }: { acted: boolean; busy: boolean; onSeal: (pnl: number) => void; error: string | null }) {
  const [v, setV] = useState(acted ? -8 : 8);
  const good = v >= 0;
  const col = good ? "#5ef2d0" : "#ff4d6a";
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel p-7">
      <div className="eyebrow mb-2">{acted ? "You went ahead" : "You waited"}</div>
      <h3 className="text-[20px] font-semibold tracking-tight">{acted ? "How did it turn out?" : "How did holding turn out?"}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-dim">
        {acted ? "Log the result in percent. In real life you'd come back days later. This is the moment the app learns." : "Positive means you ended up better off by waiting, negative means acting would have been better."}
      </p>
      <div className="mt-6 flex items-end justify-between">
        <span className="text-[12px] text-faint">−30%</span>
        <motion.span key={Math.sign(v)} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="tnum text-[46px] font-semibold leading-none tracking-tight" style={{ color: col }}>{pct(v)}</motion.span>
        <span className="text-[12px] text-faint">+30%</span>
      </div>
      <input aria-label="Result in percent" type="range" className="slider mt-2" min={-30} max={30} value={v} onChange={(e) => setV(Number(e.target.value))} style={{ ["--thumb" as string]: col }} />
      {error && <p className="mt-2 text-[13px] text-flare">{error}</p>}
      <button className="btn-primary mt-4 w-full" disabled={busy} onClick={() => onSeal(v)}>
        {busy ? <Loader2 size={17} className="animate-spin" /> : <Lock size={17} />}
        {busy ? "Writing to memory…" : "Seal this in memory"}
      </button>
    </motion.div>
  );
}
