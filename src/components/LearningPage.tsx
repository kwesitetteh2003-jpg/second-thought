import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Intent, ReplayPoint } from "../../shared/types";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { INK, LEVEL, plain, SCENARIOS } from "../lib/ui";

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
        <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={INK.stop} stopOpacity="0.16" /><stop offset="1" stopColor={INK.stop} stopOpacity="0" /></linearGradient>
        <clipPath id="clipk"><rect x="0" y="0" width={x(Math.min(k, pts.length - 1))} height={H} /></clipPath>
      </defs>
      <rect x={PADL} y={y(MAXR)} width={W - PADL - PADR} height={y(1.2) - y(MAXR)} fill={INK.stop} opacity="0.05" />
      <rect x={PADL} y={y(1.2)} width={W - PADL - PADR} height={y(0.5) - y(1.2)} fill={INK.pause} opacity="0.05" />
      <rect x={PADL} y={y(0.5)} width={W - PADL - PADR} height={y(0) - y(0.5)} fill={INK.go} opacity="0.05" />
      {([[1.9, "STOP", INK.stop], [0.85, "PAUSE", INK.pause], [0.22, "GO", INK.go]] as const).map(([r, t, c]) => (
        <text key={t} x={PADL + 8} y={y(r) + 4} fill={c} fontSize="10" fontWeight="700" letterSpacing="1.5">{t}</text>
      ))}
      {[0.5, 1.2].map((t) => <line key={t} x1={PADL} x2={W - PADR} y1={y(t)} y2={y(t)} stroke="rgba(29,26,22,0.22)" strokeDasharray="3 5" />)}
      <line x1={PADL} x2={W - PADR} y1={y(0)} y2={y(0)} stroke={INK.ink} strokeWidth="1" />
      {[0, 1, 2].map((t) => <text key={t} x={PADL - 8} y={y(t) + 3} fill={INK.faint} fontSize="10" textAnchor="end" fontFamily="IBM Plex Mono, monospace">{t.toFixed(1)}</text>)}
      <path d={line} fill="none" stroke="rgba(29,26,22,0.18)" strokeWidth="1.5" strokeDasharray="2 3" />
      <g clipPath="url(#clipk)"><path d={area} fill="url(#ar)" /><path d={line} fill="none" stroke={INK.ink} strokeWidth="2" strokeLinejoin="round" /></g>
      {pts.map((p, i) => (
        <g key={i} onClick={() => onK(i)} style={{ cursor: "pointer" }}>
          <circle cx={x(i)} cy={y(p.risk)} r="12" fill="transparent" />
          <circle cx={x(i)} cy={y(p.risk)} r={i === k ? 6 : 3} fill={i <= k ? LEVEL[p.level].color : "#d8cfbf"} stroke={i === k ? "#fbf8f2" : "none"} strokeWidth="2" />
        </g>
      ))}
      <line x1={x(Math.min(k, pts.length - 1))} x2={x(Math.min(k, pts.length - 1))} y1={PADT} y2={H - PADB} stroke={LEVEL[cur.level].color} strokeOpacity="0.6" strokeDasharray="2 4" />
      <text x={PADL} y={H - 10} fill={INK.faint} fontSize="10.5">no memories</text>
      <text x={W - PADR} y={H - 10} fill={INK.faint} fontSize="10.5" textAnchor="end">{pts.length - 1} memories of past moves</text>
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
    <div className="space-y-8">
      <div className="panel p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-2">Proof that it learns</div>
            <h2 className="serif max-w-[22ch] text-[34px] leading-[1.02] sm:text-[44px]">Same move. Different answer, because of what I remember.</h2>
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
                <motion.span key={cur.level} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="serif min-w-[3.5em] text-[34px] leading-none" style={{ color: LEVEL[cur.level].color }}>{LEVEL[cur.level].word}</motion.span>
                <span className="text-[13px] text-dim"><b className="tnum text-ink">{k}</b> memories · risk <b className="mono tnum text-ink">{cur.risk.toFixed(2)}</b></span>
                {lastTrade && <span className="hidden text-[12px] text-faint md:inline">just learned: move of {lastTrade.date} ({lastTrade.pnl > 0 ? "+" : ""}{lastTrade.pnl}%)</span>}
              </div>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-faint">Replayed with the same scoring the Pre-flight uses: only trades you actually made, plus default guard-rails. Lessons are not double counted.</p>
          </>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="panel p-5 sm:p-8">
          <h3 className="serif mb-5 text-[30px] leading-none">Lessons I wrote down</h3>
          {lessons.length === 0 && <p className="text-[13.5px] text-dim">None yet. After three similar moves with a clear pattern, I write a lesson into memory.</p>}
          <ul className="border-t border-line">
            {lessons.map((l, i) => {
              const r = l.record as Extract<typeof l.record, { kind: "lesson" }>;
              const bad = r.avg < 0;
              return (
                <motion.li key={l.blobId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="border-b border-line py-4 pl-4" style={{ boxShadow: `inset 2px 0 0 ${bad ? INK.stop : INK.go}` }}>
                  <p className="text-[14px] leading-relaxed">{plain(l.text)}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-faint">
                    <span className="mono">n={r.n}</span>
                    <div className="h-[3px] flex-1 bg-ink/[0.08]"><div className="h-full" style={{ width: `${r.win}%`, background: bad ? INK.stop : INK.go }} /></div>
                    <span className="mono">{r.win}% wins</span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </section>

        <section className="panel p-5 sm:p-8">
          <h3 className="serif mb-5 text-[30px] leading-none">The loop</h3>
          <ol className="border-t border-line">
            {[
              ["Log", "You tell me the move and, later, how it went.", "POST /api/decisions/:id/outcome"],
              ["Remember", "One readable sentence per move is written to Walrus Memory, Seal-encrypted.", "memwal.rememberAndWait()"],
              ["Recall", "Next time, similar moments come back by meaning, and the wallet's live state comes from Tatum.", "memwal.recall() + Tatum Sui RPC"],
              ["Warn", "Patterns that cost you raise the risk. Overriding me and losing makes me stricter.", "evaluate() in shared/engine.ts"],
            ].map(([t, d, code], i) => (
              <motion.li key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="grid grid-cols-[44px_1fr] gap-x-3 border-b border-line py-4">
                <span className="serif text-[30px] leading-none text-ember">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="text-[15px] font-semibold">{t}</div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-dim">{d}</p>
                  <code className="mono mt-1.5 inline-block text-[11px] text-faint">{code}</code>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
