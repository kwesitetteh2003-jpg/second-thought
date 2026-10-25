import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Reason } from "../../shared/types";
import type { PreflightResponse } from "../lib/api";
import { useApp } from "../lib/store";
import { INK, LEVEL, plain, shortId } from "../lib/ui";
import { Gauge } from "./Gauge";

const TONE: Record<Reason["tone"], string> = { danger: INK.stop, warn: INK.pause, good: INK.go, info: INK.info };
const SRC: Record<Reason["source"], string> = {
  learned: "learned from your memories",
  default: "default guard-rail",
  context: "live chain data (Tatum)",
  strictness: "adapted to your overrides",
};

export function Idle() {
  return (
    <div className="panel flex h-full min-h-[440px] flex-col justify-between p-6 sm:p-8">
      <Gauge risk={0} level="go" idle />
      <div className="mt-10">
        <h3 className="serif text-[32px] leading-[1.05]">Your second opinion shows up here</h3>
        <p className="mt-3 max-w-[46ch] text-[14.5px] leading-relaxed text-dim">Pick a move on the left. Try “Kofi's 2 AM panic sell” to see what a few months of remembered mistakes do to a single decision.</p>
        <ol className="mt-8 border-t border-line text-[13.5px] text-dim">
          {["Tatum reads your wallet and activity on Sui", "Walrus Memory recalls what happened before", "You decide. Nothing is ever done for you."].map((t, i) => (
            <li key={i} className="flex gap-4 border-b border-line py-3"><span className="mono text-[11px] leading-[20px] text-faint">0{i + 1}</span>{t}</li>
          ))}
        </ol>
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
    <button className="btn-ghost relative flex-1 select-none overflow-hidden !py-3.5" style={{ borderColor: tone, color: p > 0.55 ? "#fbf8f2" : tone }} onPointerDown={begin} onPointerUp={stop} onPointerLeave={stop} onContextMenu={(e) => e.preventDefault()} onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) begin(); }} onKeyUp={stop} onBlur={stop}>
      <span className="absolute inset-y-0 left-0" style={{ width: `${p * 100}%`, background: tone }} />
      <span className="relative">{children}</span>
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="panel overflow-hidden" style={{ borderTop: `3px solid ${L.color}` }}>
      <div className="border-b border-line p-6 sm:p-8" style={{ background: L.wash }}>
        <div className="eyebrow mb-5">Second opinion</div>
        <Gauge risk={v.risk} level={v.level} />
        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="serif mt-2 text-[30px] leading-[1.08] sm:text-[36px]">{v.headline}</motion.h3>
        <p className="mt-3 text-[14px] leading-relaxed text-dim">
          {v.baselineOnly ? "Only the default guard-rails applied. No remembered pattern matched this move." : <>Built from <b className="text-ink">{v.memoriesUsed}</b> of your <b className="text-ink">{total}</b> memories.</>}
          {v.strictness > 1.05 && <> I'm <b className="text-ink">{v.strictness.toFixed(2)}×</b> stricter with you than at the start.</>}
        </p>
        {v.cooldownMin > 0 && (
          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="mono tnum text-[34px] font-medium leading-none" style={{ color: cooled ? INK.go : L.color }}>{mm}:{ss}</span>
            <span className="text-[12.5px] text-faint">{cooled ? "cooled off" : "cooling-off"}</span>
            {!cooled && <button className="link-draw text-[12.5px] text-dim hover:text-ink" onClick={cd.fastForward}>fast-forward (demo)</button>}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <div className="eyebrow mb-3">Why</div>
        <ul>
          {v.reasons.map((r, i) => {
            const hot = idsOf(r).length > 0 && idsOf(r).every((id) => highlight.has(id));
            return (
              <motion.li key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.08, duration: 0.4 }}
                className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-line py-4 pl-4 transition-colors"
                style={{ boxShadow: `inset 3px 0 0 ${TONE[r.tone]}`, background: hot ? `${TONE[r.tone]}12` : "transparent" }}>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold leading-snug">{r.title}</div>
                  <div className="mt-1 text-[13.5px] leading-relaxed text-dim">{r.detail}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]">
                    <span className="text-faint">{SRC[r.source]}</span>
                    {idsOf(r).length > 0 && (
                      <button className="font-semibold text-mem underline decoration-mem/40 underline-offset-[3px] hover:decoration-mem" onMouseEnter={() => setHighlight(idsOf(r))} onMouseLeave={() => setHighlight([])} onFocus={() => setHighlight(idsOf(r))} onBlur={() => setHighlight([])}>
                        {idsOf(r).length} memories
                      </button>
                    )}
                  </div>
                </div>
                {r.weight !== 0 && <span className="mono tnum pt-0.5 text-[12.5px] font-medium" style={{ color: TONE[r.tone] }}>{r.weight > 0 ? "+" : ""}{r.weight.toFixed(2)}</span>}
              </motion.li>
            );
          })}
        </ul>

        {v.saferPct !== null && choice === null && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-2 border-l-2 border-go bg-go/[0.06] px-4 py-3 text-[14px] leading-relaxed text-dim">
            Moves of <b className="text-go">{v.saferPct}%</b> or less have worked for you before. Consider that instead of <b className="text-ink">{decision.intent.pct}%</b>.
          </motion.p>
        )}

        <button className="mt-6 flex w-full items-center justify-between gap-3 border-y border-line py-3 text-left text-[13px] text-dim transition-colors hover:text-ink" onClick={() => setTrace((t) => !t)} aria-expanded={trace}>
          <span className="flex min-w-0 items-baseline gap-2"><span className="shrink-0 font-medium">How I recalled this</span><span className="mono truncate text-[11px] text-faint">{recall.hits.length} hits · {recall.backend}</span></span>
          <span aria-hidden className={`mono shrink-0 text-[15px] transition-transform ${trace ? "rotate-45" : ""}`}>+</span>
        </button>
        <AnimatePresence>
          {trace && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mono mt-3 bg-ink p-4 text-[11.5px] leading-relaxed text-[#d8d1c4]">
                <div><span className="text-[#9fb4ea]">recall</span>(<span className="text-[#e9b98a]">"{recall.query}"</span>)</div>
                {recall.hits.map((h) => (
                  <div key={h.blobId} className="mt-2 border-t border-white/10 pt-2" onMouseEnter={() => setHighlight([h.blobId])} onMouseLeave={() => setHighlight([])}>
                    <span className="text-[#e9b98a]">d={h.distance}</span> <span className="text-[#9a9284]">{shortId(h.blobId)}</span><br />{plain(h.text).slice(0, 130)}…
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {choice === null && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary flex-1 !py-3.5" onClick={() => onChoice(false)}>{v.level === "go" ? "Not now" : "I'll wait"}</button>
            {v.level === "stop" && !cooled ? (
              <HoldButton tone={INK.stop} onDone={() => onChoice(true)}>Hold to proceed anyway</HoldButton>
            ) : (
              <button className="btn-ghost flex-1 !py-3.5" onClick={() => onChoice(true)}>{v.level === "go" ? "Go ahead" : cooled ? "Cooled off. Proceed" : "Proceed anyway"}</button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
