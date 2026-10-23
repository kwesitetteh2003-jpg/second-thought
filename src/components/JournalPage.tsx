import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useApp } from "../lib/store";
import { pct, plain, shortId } from "../lib/ui";
import { Check, Hand, ShieldAlert, Sparkles } from "lucide-react";

function Count({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const v = useMotionValue(0);
  const t = useTransform(v, (x) => `${x.toFixed(decimals)}${suffix}`);
  useEffect(() => { const c = animate(v, to, { duration: 1.2, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [to, v]);
  return <motion.span>{t}</motion.span>;
}

export function JournalPage() {
  const { mem } = useApp();
  if (!mem) return null;
  const s = mem.stats;
  const trades = mem.memories.filter((m) => m.record.kind === "trade").sort((a, b) => b.record.date.localeCompare(a.record.date));
  const cards = [
    { label: "Moves remembered", value: mem.counts.trades, suffix: "", icon: Sparkles, color: "#5b8cff", sub: `${mem.counts.lessons} lessons written` },
    { label: "Warnings heeded", value: s.heeded, suffix: "", icon: Hand, color: "#5ef2d0", sub: `saved you ${s.protectedPct}% in total` },
    { label: "Overrode and lost", value: s.overrodeLost, suffix: "", icon: ShieldAlert, color: "#ff4d6a", sub: `each one raised my guard` },
    { label: "Average result when you act", value: s.avgResult, suffix: "%", icon: Check, color: s.avgResult >= 0 ? "#5ef2d0" : "#ffb84d", sub: `strictness now ${s.strictness.toFixed(2)}×`, decimals: 1 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="panel p-5">
            <div className="mb-4 flex items-center justify-between"><span className="eyebrow !normal-case !tracking-normal !text-[12px]">{c.label}</span><c.icon size={16} style={{ color: c.color }} /></div>
            <div className="tnum text-[40px] font-semibold leading-none tracking-tight" style={{ color: c.color }}><Count to={c.value} suffix={c.suffix} decimals={c.decimals ?? 0} /></div>
            <div className="mt-2 text-[12px] text-faint">{c.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-semibold tracking-tight">Every move I remember</h2>
          <span className="text-[12px] text-faint">newest first · read straight from memory</span>
        </div>
        {trades.length === 0 && <p className="p-10 text-center text-[14px] text-dim">Nothing yet. Ask about a move on the Pre-flight tab and log how it went.</p>}
        <ul>
          {trades.map((m, i) => {
            const t = m.record as Extract<typeof m.record, { kind: "trade" }>;
            const good = t.pnl >= 0;
            return (
              <motion.li key={m.blobId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }} className="flex items-center gap-5 border-b border-line px-6 py-4 last:border-0 hover:bg-white/[0.02]">
                <div className="mono w-[86px] shrink-0 text-[11.5px] text-faint">{t.date}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-snug text-dim">{plain(m.text).replace(/^\d{4}-\d{2}-\d{2}: /, "")}</p>
                  <div className="mt-1.5 flex gap-2 text-[10.5px]">
                    {t.warned !== "none" && <span className="rounded-full bg-white/[0.05] px-2 py-0.5 font-semibold uppercase tracking-wider text-faint">warned: {t.warned}</span>}
                    {t.overrode && <span className="rounded-full bg-flare/15 px-2 py-0.5 font-semibold uppercase tracking-wider text-flare">overrode</span>}
                    {!t.acted && <span className="rounded-full bg-tide/15 px-2 py-0.5 font-semibold uppercase tracking-wider text-tide">waited</span>}
                    <span className="mono text-faint">{shortId(m.blobId)}</span>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <div className="tnum text-[17px] font-semibold" style={{ color: good ? "#5ef2d0" : "#ff4d6a" }}>{pct(t.pnl)}</div>
                  <div className="mt-1.5 ml-auto h-1 w-full overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Math.abs(t.pnl) * 5, 100)}%` }} className="h-full" style={{ background: good ? "#5ef2d0" : "#ff4d6a" }} /></div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
