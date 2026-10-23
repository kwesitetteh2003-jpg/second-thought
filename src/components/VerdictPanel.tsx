import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Database, Hand, Hourglass, ShieldCheck, ShieldAlert, Sparkles, Radio, Brain, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Reason } from "../../shared/types";
import type { PreflightResponse } from "../lib/api";
import { useApp } from "../lib/store";
import { LEVEL, plain, shortId } from "../lib/ui";
import { Gauge } from "./Gauge";

const TONE: Record<Reason["tone"], string> = { danger: "#ff4d6a", warn: "#ffb84d", good: "#5ef2d0", info: "#5b8cff" };
const SRC: Record<Reason["source"], { label: string; icon: typeof Brain }> = {
  learned: { label: "learned from your memories", icon: Brain },
  default: { label: "default guard-rail", icon: ShieldAlert },
  context: { label: "live chain data (Tatum)", icon: Radio },
  strictness: { label: "adapted to your overrides", icon: Sparkles },
};

export function Idle() {
  return (
    <div className="panel flex h-full min-h-[520px] flex-col items-center justify-center p-10 text-center">
      <Gauge risk={0} level="go" idle />
      <h3 className="mt-6 text-[20px] font-semibold tracking-tight">Your second opinion shows up here</h3>
      <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-dim">Pick a move on the left. Try “Kofi's 2 AM panic sell” to see what a few months of remembered mistakes do to a single decision.</p>
      <div className="mt-8 grid w-full max-w-sm gap-3 text-left text-[12.5px] text-dim">
        {[[Radio, "Tatum reads your wallet and activity on Sui"], [Database, "Walrus Memory recalls what happened before"], [Hand, "You decide. Nothing is ever done for you."]].map(([I, t], i) => {
          const Icon = I as typeof Radio;
          return <div key={i} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white/[0.03]"><Icon size={14} className="text-tide" /></span>{t as string}</div>;
        })}
      </div>
    </div>
  );
}

function useCountdown(totalMin: number, key: string) {
  const [left, setLeft] = useState(totalMin * 60);
  const ff = useRef<number | null>(null);
  useEffect(() => { setLeft(totalMin * 60); }, [totalMin, key]);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [key]);
  const fastForward = () => {
    if (ff.current) cancelAnimationFrame(ff.current);
    const from = left, start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / 1600, 1);
      setLeft(Math.round(from * (1 - p)));
      if (p < 1) ff.current = requestAnimationFrame(step);
    };
    ff.current = requestAnimationFrame(step);
  };
  return { left, fastForward };
}

function HoldButton({ onDone, children, tone }: { onDone: () => void; children: React.ReactNode; tone: string }) {
  const [p, setP] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; setP(0); };
  const begin = () => {
    start.current = performance.now();
    const step = (now: number) => {
      const f = Math.min((now - start.current) / 1100, 1);
      setP(f);
      if (f >= 1) { raf.current = null; onDone(); return; }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  return (
    <button className="btn-ghost relative flex-1 overflow-hidden" style={{ borderColor: `${tone}66`, color: tone }} onPointerDown={begin} onPointerUp={stop} onPointerLeave={stop} onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) begin(); }} onKeyUp={stop} onBlur={stop}>
      <span className="absolute inset-y-0 left-0" style={{ width: `${p * 100}%`, background: `${tone}30` }} />
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
}

export function VerdictPanel({ res, onChoice, choice }: { res: PreflightResponse; onChoice: (acted: boolean) => void; choice: boolean | null }) {
  const { setHighlight, highlight, mem } = useApp();
  const { decision, recall } = res;
  const v = decision.verdict;
  const L = LEVEL[v.level];
  const cd = useCountdown(v.cooldownMin, decision.id);
  const [trace, setTrace] = useState(false);
  const mm = String(Math.floor(cd.left / 60)).padStart(2, "0"), ss = String(cd.left % 60).padStart(2, "0");
  const cooled = v.cooldownMin > 0 && cd.left === 0;
  const idsOf = (r: Reason) => r.memoryIds;
  const total = mem?.counts.total ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden" style={{ boxShadow: `0 0 0 1px ${L.color}33, 0 40px 80px -40px ${L.glow}` }}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${L.color}, transparent)` }} />
      <div className="flex flex-col items-center gap-6 border-b border-line p-7 sm:flex-row">
        <Gauge risk={v.risk} level={v.level} />
        <div className="min-w-0 flex-1">
          <div className="eyebrow mb-2 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full" style={{ background: L.color }} />Second opinion</div>
          <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[24px] font-semibold leading-[1.15] tracking-tight">{v.headline}</motion.h3>
          <p className="mt-3 text-[13.5px] leading-relaxed text-dim">
            {v.baselineOnly ? "Only the default guard-rails applied. No remembered pattern matched this move." : <>Built from <b className="text-text">{v.memoriesUsed}</b> of your <b className="text-text">{total}</b> memories.</>}
            {v.strictness > 1.05 && <> I'm <b className="text-text">{v.strictness.toFixed(2)}×</b> stricter with you than at the start.</>}
          </p>
          {v.cooldownMin > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-black/30 px-3.5 py-2.5">
                <Hourglass size={16} style={{ color: L.color }} />
                <span className="mono tnum text-[20px] font-semibold">{mm}:{ss}</span>
                <span className="text-[11.5px] text-faint">{cooled ? "cooled off" : "cooling-off"}</span>
              </div>
              {!cooled && <button className="text-[12px] text-dim underline decoration-dotted underline-offset-4 hover:text-text" onClick={cd.fastForward}>fast-forward (demo)</button>}
            </div>
          )}
        </div>
      </div>

      <div className="p-7">
        <div className="eyebrow mb-4">Why</div>
        <ul className="space-y-3">
          {v.reasons.map((r, i) => {
            const S = SRC[r.source];
            const hot = idsOf(r).length > 0 && idsOf(r).every((id) => highlight.has(id));
            return (
              <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.09, type: "spring", stiffness: 300, damping: 28 }}
                className="rounded-2xl border p-4 transition-colors" style={{ borderColor: hot ? TONE[r.tone] : "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: TONE[r.tone], boxShadow: `0 0 12px ${TONE[r.tone]}` }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold leading-snug">{r.title}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-dim">{r.detail}</div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-medium text-faint"><S.icon size={11} />{S.label}</span>
                      {idsOf(r).length > 0 && (
                        <button className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition hover:bg-white/5" style={{ color: "#b093ff", borderColor: "#b093ff55" }} onMouseEnter={() => setHighlight(idsOf(r))} onMouseLeave={() => setHighlight([])} onFocus={() => setHighlight(idsOf(r))} onBlur={() => setHighlight([])}>
                          <Link2 size={11} />{idsOf(r).length} memories
                        </button>
                      )}
                    </div>
                  </div>
                  {r.weight !== 0 && <span className="mono tnum text-[12px] font-semibold" style={{ color: TONE[r.tone] }}>{r.weight > 0 ? "+" : ""}{r.weight.toFixed(2)}</span>}
                </div>
              </motion.li>
            );
          })}
        </ul>

        {v.saferPct !== null && choice === null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-4 flex items-center gap-3 rounded-2xl border border-tide/30 bg-tide/[0.06] p-4">
            <ShieldCheck size={20} className="shrink-0 text-tide" />
            <p className="text-[13.5px] leading-relaxed text-dim">Moves of <b className="text-tide">{v.saferPct}%</b> or less have worked for you before. Consider that instead of <b className="text-text">{decision.intent.pct}%</b>.</p>
          </motion.div>
        )}

        <button className="mt-6 flex w-full items-center justify-between rounded-xl border border-line bg-black/20 px-4 py-3 text-left text-[12.5px] text-dim transition hover:border-line-2" onClick={() => setTrace((t) => !t)} aria-expanded={trace}>
          <span className="flex min-w-0 items-center gap-2"><Database size={14} className="shrink-0 text-mem" /><span className="shrink-0">How I recalled this</span><span className="mono truncate text-[11px] text-faint">· {recall.hits.length} hits · {recall.backend}</span></span>
          <ChevronDown size={15} className={`shrink-0 transition ${trace ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {trace && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mono mt-3 rounded-xl border border-line bg-black/40 p-3 text-[11.5px] leading-relaxed text-dim">
                <div><span className="text-mem">recall</span>(<span className="text-tide">"{recall.query}"</span>)</div>
                {recall.hits.map((h) => (
                  <div key={h.blobId} className="mt-2 border-t border-line pt-2" onMouseEnter={() => setHighlight([h.blobId])} onMouseLeave={() => setHighlight([])}>
                    <span className="text-amber">d={h.distance}</span> <span className="text-faint">{shortId(h.blobId)}</span><br />{plain(h.text).slice(0, 130)}…
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {choice === null && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary flex-1 !py-3.5" onClick={() => onChoice(false)}><Hand size={17} />{v.level === "go" ? "Not now" : "I'll wait"}</button>
            {v.level === "stop" && !cooled ? (
              <HoldButton tone="#ff4d6a" onDone={() => onChoice(true)}>Hold to proceed anyway</HoldButton>
            ) : (
              <button className="btn-ghost flex-1" onClick={() => onChoice(true)}>{v.level === "go" ? "Go ahead" : cooled ? "Cooled off. Proceed" : "Proceed anyway"}</button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
