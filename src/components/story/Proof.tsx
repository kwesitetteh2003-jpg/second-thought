import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { LessonRecord, TradeRecord } from "../../../shared/types";
import { useApp } from "../../lib/store";
import { EASE, spotlight } from "./fx";

function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) { setV(to); return; }
    const c = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: setV });
    return () => c.stop();
  }, [inView, to, reduce]);
  return <span ref={ref} className="tnum">{v.toFixed(decimals)}{suffix}</span>;
}

function Card({ children, className = "", i = 0 }: { children: React.ReactNode; className?: string; i?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      {...spotlight}
      initial={reduce ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.8, delay: i * 0.07, ease: EASE }}
      className={`bento group relative overflow-hidden rounded-[6px] border border-line bg-sheet p-6 sm:p-7 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Every trade in the notebook as a bar: red cost him, green helped. Moons mark the small hours. */
function Ledger({ trades }: { trades: TradeRecord[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const max = Math.max(14, ...trades.map((t) => Math.abs(t.pnl)));
  return (
    <div ref={ref} className="mt-8 flex h-[180px] items-center gap-[3px] sm:h-[220px] sm:gap-1.5">
      {trades.map((t, i) => {
        const h = (Math.abs(t.pnl) / max) * 50;
        const late = t.hour < 5;
        return (
          <div key={i} className="relative flex h-full flex-1 flex-col items-center" title={`${t.date} · ${t.action} ${t.pct}% · ${t.pnl > 0 ? "+" : ""}${t.pnl}%`}>
            <div className="relative h-1/2 w-full">
              {t.pnl > 0 && <motion.div initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}} transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: EASE }} className="absolute bottom-0 w-full origin-bottom rounded-t-[2px] bg-go" style={{ height: `${h * 2}%` }} />}
            </div>
            <div className="relative h-1/2 w-full border-t border-ink/60">
              {t.pnl < 0 && <motion.div initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}} transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: EASE }} className={`absolute top-0 w-full origin-top rounded-b-[2px] ${late ? "bg-stop" : "bg-stop/45"}`} style={{ height: `${h * 2}%` }} />}
            </div>
            {late && <span aria-hidden className="absolute -bottom-5 text-[10px] text-mem">☾</span>}
          </div>
        );
      })}
    </div>
  );
}

export function Proof() {
  const { mem } = useApp();
  const trades = (mem?.memories ?? []).map((m) => m.record).filter((r): r is TradeRecord => r.kind === "trade").sort((a, b) => a.date.localeCompare(b.date));
  const lesson = (mem?.memories ?? []).map((m) => m.record).filter((r): r is LessonRecord => r.kind === "lesson").sort((a, b) => a.avg - b.avg)[0];
  const strict = mem?.stats.strictness ?? 1;
  const late = trades.filter((t) => t.hour < 5 && t.acted && t.pnl < 0);
  const lateAvg = late.length ? late.reduce((s, t) => s + t.pnl, 0) / late.length : 0;

  return (
    <section aria-labelledby="proof-h" className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mb-12 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4">What the notebook knows</p>
          <h2 id="proof-h" className="serif text-[46px] leading-[0.98] sm:text-[68px]">Not a vibe. <em className="text-ember">A record.</em></h2>
        </div>
        <p className="max-w-[46ch] text-[15.5px] leading-relaxed text-dim lg:col-span-5 lg:justify-self-end">
          Everything below is read live from Kofi's sample journal through the same API the desk uses. Seal a new memory further down and these numbers move.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-6 lg:auto-rows-[minmax(190px,auto)]">
        <Card className="md:col-span-6 lg:col-span-4 lg:row-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-[18px] font-semibold tracking-tight">Every move, and what it did</h3>
            <span className="mono text-[11px] text-faint">{trades.length} trades · Aug → Oct</span>
          </div>
          <Ledger trades={trades} />
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-dim">
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-[2px] bg-stop" />Small-hours loss <span className="text-mem">☾</span></span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-[2px] bg-stop/45" />Daytime loss</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-[2px] bg-go" />Helped (or waiting helped)</span>
          </div>
        </Card>

        <Card className="md:col-span-3 lg:col-span-2" i={1}>
          <p className="eyebrow">After midnight</p>
          <p className="serif mt-4 text-[64px] leading-none text-stop sm:text-[76px]"><CountUp to={lateAvg} decimals={1} suffix="%" /></p>
          <p className="mt-3 text-[14px] leading-snug text-dim">average on his {late.length} small-hours sells that went through. Not one was a win.</p>
        </Card>

        <Card className="md:col-span-3 lg:col-span-2" i={2}>
          <p className="eyebrow">Memories</p>
          <p className="serif mt-4 text-[64px] leading-none text-mem sm:text-[76px]"><CountUp to={mem?.counts.total ?? 0} /></p>
          <p className="mt-3 text-[14px] leading-snug text-dim">plain sentences, Seal-encrypted to his account in Walrus Memory. Recalled by meaning, not keywords.</p>
        </Card>

        <Card className="md:col-span-6 lg:col-span-3" i={1}>
          <p className="eyebrow !text-pause">A lesson it wrote for him</p>
          <blockquote className="serif mt-4 text-[26px] leading-[1.15] sm:text-[30px]">
            “{lesson ? lesson.summary.replace(/^\d{4}-\d{2}-\d{2}:\s*/, "").replace(/^Lesson:\s*/, "") : "Patterns that cost you raise the risk next time."}”
          </blockquote>
          {lesson && <p className="mono mt-4 text-[11px] text-faint">from {lesson.n} trades · {lesson.win}% wins</p>}
        </Card>

        <Card className="md:col-span-3 lg:col-span-2" i={2}>
          <p className="eyebrow">Stricter with him</p>
          <p className="serif mt-4 text-[60px] leading-none"><CountUp to={strict} decimals={2} suffix="×" /></p>
          <div className="mt-4 h-1.5 rounded-full bg-sand"><motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, (strict / 2) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} className="h-full rounded-full bg-ink" /></div>
          <p className="mt-3 text-[13.5px] leading-snug text-dim">Override a warning and lose, and the bar for a GO goes up.</p>
        </Card>

        <Card className="md:col-span-3 lg:col-span-1 !bg-night !border-night text-moon" i={3}>
          <p className="eyebrow !text-[#a39a8b]">Coins it can move</p>
          <p className="serif mt-4 text-[76px] leading-none">0</p>
          <p className="mt-3 text-[13px] leading-snug text-[#bdb5a7]">No keys. No signing. Advice only.</p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-2">Built on</span>
        {["Walrus Memory", "Seal encryption", "Sui via Tatum RPC", "Express API", "React + Motion"].map((s) => <span key={s} className="chip mono !text-[11.5px]">{s}</span>)}
      </div>
    </section>
  );
}
