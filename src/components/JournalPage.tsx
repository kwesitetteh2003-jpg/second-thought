import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useApp } from "../lib/store";
import { INK, pct, plain, shortId } from "../lib/ui";

function Count({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const reduce = useReducedMotion();
  const v = useMotionValue(reduce ? to : 0);
  const t = useTransform(v, (x) => `${x.toFixed(decimals)}${suffix}`);
  useEffect(() => { const c = animate(v, to, { duration: reduce ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [to, v, reduce]);
  return <motion.span>{t}</motion.span>;
}

export function JournalPage() {
  const { mem } = useApp();
  if (!mem) return null;
  const s = mem.stats;
  const trades = mem.memories.filter((m) => m.record.kind === "trade").sort((a, b) => b.record.date.localeCompare(a.record.date));
  const cards = [
    { label: "Moves remembered", value: mem.counts.trades, suffix: "", color: INK.ink, sub: `${mem.counts.lessons} lessons written` },
    { label: "Warnings heeded", value: s.heeded, suffix: "", color: INK.go, sub: `saved you ${s.protectedPct}% in total` },
    { label: "Overrode and lost", value: s.overrodeLost, suffix: "", color: INK.stop, sub: `each one raised my guard` },
    { label: "Average result when you act", value: s.avgResult, suffix: "%", color: s.avgResult >= 0 ? INK.go : INK.pause, sub: `strictness now ${s.strictness.toFixed(2)}×`, decimals: 1 },
  ];
  return (
    <div className="space-y-10">
      <dl className="grid grid-cols-2 border-y border-line xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`px-4 py-6 sm:px-6 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line xl:border-t-0" : ""} ${i === 2 ? "xl:border-l" : ""}`}>
            <dt className="text-[12.5px] font-medium text-dim">{c.label}</dt>
            <dd className="serif tnum mt-3 text-[48px] leading-none sm:text-[60px]" style={{ color: c.color }}><Count to={c.value} suffix={c.suffix} decimals={c.decimals ?? 0} /></dd>
            <dd className="mt-2 text-[12px] text-faint">{c.sub}</dd>
          </motion.div>
        ))}
      </dl>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-5 sm:px-7">
          <h2 className="serif text-[30px] leading-none">Every move I remember</h2>
          <span className="text-[12px] text-faint">newest first · read straight from memory</span>
        </div>
        {trades.length === 0 && <p className="p-10 text-center text-[14px] text-dim">Nothing yet. Ask about a move on the Pre-flight tab and log how it went.</p>}
        <ul>
          {trades.map((m, i) => {
            const t = m.record as Extract<typeof m.record, { kind: "trade" }>;
            const good = t.pnl >= 0;
            const col = good ? INK.go : INK.stop;
            return (
              <motion.li key={m.blobId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}
                className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-line px-5 py-4 last:border-0 hover:bg-ink/[0.025] sm:grid-cols-[96px_1fr_auto] sm:px-7">
                <div className="mono col-span-2 mb-1 text-[11.5px] text-faint sm:col-span-1 sm:mb-0 sm:pt-0.5">{t.date}</div>
                <div className="min-w-0">
                  <p className="text-[14px] leading-snug text-ink">{plain(m.text).replace(/^\d{4}-\d{2}-\d{2}: /, "")}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                    {t.warned !== "none" && <span className="text-faint">warned: {t.warned}</span>}
                    {t.overrode && <span className="text-stop">overrode</span>}
                    {!t.acted && <span className="text-go">waited</span>}
                    <span className="mono font-normal normal-case tracking-normal text-faint">{shortId(m.blobId)}</span>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <div className="mono tnum text-[15px] font-medium" style={{ color: col }}>{pct(t.pnl)}</div>
                  <div className="ml-auto mt-2 h-[3px] w-full bg-ink/[0.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Math.abs(t.pnl) * 5, 100)}%` }} className="ml-auto h-full" style={{ background: col }} /></div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
