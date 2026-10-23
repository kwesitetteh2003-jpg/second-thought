import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, Database, Eye, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Intent, ReplayPoint } from "../../shared/types";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { LEVEL, plain, SCENARIOS } from "../lib/ui";

const PANIC: Intent = { ...SCENARIOS[0].intent } as Intent;
const W = 760, H = 250, PADL = 40, PADR = 16, PADT = 16, PADB = 34, MAXR = 2.6;

function Chart({ pts, k, onK }: { pts: ReplayPoint[]; k: number; onK: (k: number) => void }) {
  const x = (i: number) => PADL + (i / Math.max(pts.length - 1, 1)) * (W - PADL - PADR);
  const y = (r: number) => PADT + (1 - Math.min(r, MAXR) / MAXR) * (H - PADT - PADB);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.risk).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const cur = pts[Math.min(k, pts.length - 1)];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Risk score for the same move as memories accumulate">
      <defs>
        <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff4d6a" stopOpacity="0.35" /><stop offset="1" stopColor="#ff4d6a" stopOpacity="0" /></linearGradient>
        <clipPath id="clipk"><rect x="0" y="0" width={x(Math.min(k, pts.length - 1))} height={H} /></clipPath>
      </defs>
      <rect x={PADL} y={y(MAXR)} width={W - PADL - PADR} height={y(1.2) - y(MAXR)} fill="#ff4d6a" opacity="0.06" />
      <rect x={PADL} y={y(1.2)} width={W - PADL - PADR} height={y(0.5) - y(1.2)} fill="#ffb84d" opacity="0.06" />
      <rect x={PADL} y={y(0.5)} width={W - PADL - PADR} height={y(0) - y(0.5)} fill="#5ef2d0" opacity="0.05" />
      {[[1.9, "STOP", "#ff4d6a"], [0.85, "PAUSE", "#ffb84d"], [0.22, "GO", "#5ef2d0"]].map(([r, t, c]) => (
        <text key={t as string} x={PADL + 8} y={y(r as number) + 4} fill={c as string} opacity="0.7" fontSize="10" fontWeight="700" letterSpacing="1.5">{t as string}</text>
      ))}
      {[0.5, 1.2].map((t) => <line key={t} x1={PADL} x2={W - PADR} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.14)" strokeDasharray="3 5" />)}
      {[0, 1, 2].map((t) => <text key={t} x={PADL - 8} y={y(t) + 3} fill="#566074" fontSize="10" textAnchor="end" className="mono">{t.toFixed(1)}</text>)}
      <path d={line} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
      <g clipPath="url(#clipk)"><path d={area} fill="url(#ar)" /><path d={line} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" /></g>
      {pts.map((p, i) => (
        <g key={i} onClick={() => onK(i)} style={{ cursor: "pointer" }}>
          <circle cx={x(i)} cy={y(p.risk)} r="12" fill="transparent" />
          <circle cx={x(i)} cy={y(p.risk)} r={i === k ? 6 : 3} fill={i <= k ? LEVEL[p.level].color : "#2a3345"} stroke={i === k ? "#fff" : "none"} strokeWidth="2" />
        </g>
      ))}
      <line x1={x(Math.min(k, pts.length - 1))} x2={x(Math.min(k, pts.length - 1))} y1={PADT} y2={H - PADB} stroke={LEVEL[cur.level].color} strokeOpacity="0.5" strokeDasharray="2 4" />
      <text x={PADL} y={H - 10} fill="#566074" fontSize="10.5">no memories</text>
      <text x={W - PADR} y={H - 10} fill="#566074" fontSize="10.5" textAnchor="end">{pts.length - 1} memories of past moves</text>
    </svg>
  );
}

export function LearningPage() {
  const { mem, lastIntent } = useApp();
  const [intent, setIntent] = useState<Intent>(lastIntent ?? PANIC);
  const [pts, setPts] = useState<ReplayPoint[]>([]);
  const [trades, setTrades] = useState<{ id: string; date: string; pnl: number }[]>([]);
  const [k, setK] = useState(0);
  const memTotal = mem?.counts.total ?? 0;
  useEffect(() => {
    api.replay(intent).then((r) => { setPts(r.points); setTrades(r.trades); setK((c) => (c === 0 ? 0 : Math.min(c, r.points.length - 1))); });
  }, [intent, memTotal]);
  useEffect(() => { if (pts.length) { setK(0); const id = setInterval(() => setK((c) => { if (c >= pts.length - 1) { clearInterval(id); return c; } return c + 1; }), 260); return () => clearInterval(id); } }, [pts.length]);
  const cur = pts[Math.min(k, pts.length - 1)];
  const lessons = useMemo(() => (mem?.memories ?? []).filter((m) => m.record.kind === "lesson").sort((a, b) => b.record.date.localeCompare(a.record.date)), [mem]);
  const lastTrade = k > 0 ? trades[k - 1] : null;

  return (
    <div className="space-y-6">
      <div className="panel p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-2">Proof that it learns</div>
            <h2 className="max-w-[28ch] text-[26px] font-semibold leading-[1.1] tracking-tight">Same move. Different answer, because of what I remember.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button key={s.id} className="chip" data-on={JSON.stringify(s.intent) === JSON.stringify({ action: intent.action, asset: intent.asset, pct: intent.pct, trigger: intent.trigger, mood: intent.mood, hour: intent.hour })} onClick={() => setIntent(s.intent as Intent)}>{s.title}</button>
            ))}
          </div>
        </div>
        {pts.length > 0 && cur && (
          <>
            <Chart pts={pts} k={k} onK={setK} />
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <input aria-label="How many memories to replay" type="range" className="slider max-w-[420px] flex-1" min={0} max={pts.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ ["--thumb" as string]: LEVEL[cur.level].color }} />
              <div className="flex items-center gap-3">
                <motion.span key={cur.level} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-xl px-3.5 py-1.5 text-[18px] font-bold" style={{ color: LEVEL[cur.level].color, background: `${LEVEL[cur.level].color}1a` }}>{LEVEL[cur.level].word}</motion.span>
                <span className="text-[13px] text-dim"><b className="tnum text-text">{k}</b> memories · risk <b className="mono tnum text-text">{cur.risk.toFixed(2)}</b></span>
                {lastTrade && <span className="hidden text-[12px] text-faint md:inline">just learned: move of {lastTrade.date} ({lastTrade.pnl > 0 ? "+" : ""}{lastTrade.pnl}%)</span>}
              </div>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-faint">Replayed with the same scoring the Pre-flight uses: only trades you actually made, plus default guard-rails. Lessons are not double counted.</p>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel p-7">
          <div className="mb-4 flex items-center gap-2"><BookOpen size={16} className="text-amber" /><h3 className="text-[17px] font-semibold tracking-tight">Lessons I wrote down</h3></div>
          {lessons.length === 0 && <p className="text-[13.5px] text-dim">None yet. After three similar moves with a clear pattern, I write a lesson into memory.</p>}
          <ul className="space-y-3">
            {lessons.map((l, i) => {
              const r = l.record as Extract<typeof l.record, { kind: "lesson" }>;
              const bad = r.avg < 0;
              return (
                <motion.li key={l.blobId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-line bg-white/[0.02] p-4">
                  <p className="text-[13.5px] leading-relaxed">{plain(l.text)}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-faint">
                    <span className="mono">n={r.n}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full" style={{ width: `${r.win}%`, background: bad ? "#ff4d6a" : "#5ef2d0" }} /></div>
                    <span>{r.win}% wins</span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="panel p-7">
          <div className="mb-5 flex items-center gap-2"><Brain size={16} className="text-mem" /><h3 className="text-[17px] font-semibold tracking-tight">The loop</h3></div>
          <ol className="relative space-y-1">
            {[
              [Eye, "Log", "You tell me the move and, later, how it went.", "#5b8cff", "POST /api/decisions/:id/outcome"],
              [Database, "Remember", "One readable sentence per move is written to Walrus Memory, Seal-encrypted.", "#b093ff", "memwal.rememberAndWait()"],
              [Radio, "Recall", "Next time, similar moments come back by meaning, and the wallet's live state comes from Tatum.", "#5ef2d0", "memwal.recall() + Tatum Sui RPC"],
              [Brain, "Warn", "Patterns that cost you raise the risk. Overriding me and losing makes me stricter.", "#ffb84d", "evaluate() in shared/engine.ts"],
            ].map(([I, t, d, c, code], i, a) => {
              const Icon = I as typeof Eye;
              return (
                <motion.li key={t as string} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="relative flex gap-4 pb-5">
                  {i < a.length - 1 && <span className="absolute left-[19px] top-10 h-[calc(100%-26px)] w-px" style={{ background: `linear-gradient(${c as string}, transparent)` }} />}
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${c as string}1f`, color: c as string }}><Icon size={18} /></span>
                  <div>
                    <div className="flex items-center gap-2 text-[15px] font-semibold">{t as string}{i < a.length - 1 && <ArrowRight size={13} className="text-faint" />}</div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{d as string}</p>
                    <code className="mono mt-1.5 inline-block rounded-md bg-black/40 px-2 py-1 text-[10.5px] text-faint">{code as string}</code>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
