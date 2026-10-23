import type { Intent, Level, Pattern, Reason, ReplayPoint, StoredMemory, TradeRecord, Verdict, ChainContext, LessonRecord } from "./types";
import { fmtPct } from "./codec";

/* ───────────── helpers ───────────── */

export const sizeBucket = (pct: number): "small" | "mid" | "large" => (pct <= 15 ? "small" : pct <= 30 ? "mid" : "large");
export const hourBucket = (h: number): "night" | "day" | "evening" => (h < 6 ? "night" : h < 18 ? "day" : "evening");
const BUCKET_MAX: Record<string, number> = { small: 15, mid: 30, large: 100 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

type Dim = Pattern["dim"];
const DIMS: { dim: Dim; weight: number; of: (t: { trigger: string; mood: string; pct: number; hour: number }) => string }[] = [
  { dim: "trigger", weight: 0.7, of: (t) => t.trigger },
  { dim: "mood", weight: 0.8, of: (t) => t.mood },
  { dim: "size", weight: 0.6, of: (t) => sizeBucket(t.pct) },
  { dim: "hour", weight: 0.4, of: (t) => hourBucket(t.hour) },
];

const DIM_PHRASE: Record<string, (v: string) => string> = {
  trigger: (v) => ({
    dip: "after a dip", pump: "after a pump", tip: "on a tip", news: "on news", planned: "with a plan", revenge: "to win back a loss", boredom: "out of boredom",
  } as Record<string, string>)[v] ?? v,
  mood: (v) => `while ${v}`,
  size: (v) => ({ small: "small (≤15% of wallet)", mid: "medium (16–30%)", large: "large (>30% of wallet)" } as Record<string, string>)[v] ?? v,
  hour: (v) => ({ night: "late at night (00–05h)", day: "in the daytime", evening: "in the evening" } as Record<string, string>)[v] ?? v,
};

export function patternLabel(action: string, dim: string, value: string): string {
  const verb = { sell: "Selling", buy: "Buying", swap: "Swapping", send: "Sending" }[action] ?? action;
  return dim === "size" ? `${verb} ${DIM_PHRASE.size(value)}` : `${verb} ${DIM_PHRASE[dim](value)}`;
}

export interface Journal {
  trades: { id: string; rec: TradeRecord }[];
  lessons: { id: string; rec: LessonRecord }[];
}

export function toJournal(mems: StoredMemory[]): Journal {
  const trades: Journal["trades"] = [];
  const lessons: Journal["lessons"] = [];
  const seen = new Set<string>();
  for (const m of mems) {
    if (seen.has(m.blobId)) continue;
    seen.add(m.blobId);
    if (m.record.kind === "trade") trades.push({ id: m.blobId, rec: m.record });
    else if (m.record.kind === "lesson") lessons.push({ id: m.blobId, rec: m.record });
  }
  trades.sort((a, b) => a.rec.date.localeCompare(b.rec.date));
  lessons.sort((a, b) => a.rec.date.localeCompare(b.rec.date));
  return { trades, lessons };
}

/* ───────────── patterns ───────────── */

/** Patterns that match this intent, built only from trades the user actually made. */
export function matchingPatterns(intent: Intent, trades: Journal["trades"]): Pattern[] {
  const acted = trades.filter((t) => t.rec.acted && t.rec.action === intent.action);
  const out: Pattern[] = [];
  for (const d of DIMS) {
    const value = d.of(intent);
    const group = acted.filter((t) => d.of(t.rec) === value);
    if (group.length < 2) continue;
    const avg = group.reduce((s, t) => s + t.rec.pnl, 0) / group.length;
    const win = (group.filter((t) => t.rec.pnl > 0).length / group.length) * 100;
    const confidence = clamp((group.length - 1) / 4, 0, 1);
    const contribution = -clamp(avg / 12, -1.2, 1.2) * confidence * d.weight;
    out.push({
      key: `${intent.action}:${d.dim}:${value}`,
      dim: d.dim,
      value,
      label: patternLabel(intent.action, d.dim, value),
      n: group.length,
      avg: round1(avg),
      win: Math.round(win),
      contribution: round2(contribution),
      tradeIds: group.map((t) => t.id),
    });
  }
  return out;
}

/** How hard the app leans on this user, learned from what happened when they ignored it. */
export function strictnessFrom(trades: Journal["trades"]): { value: number; overrodeLost: number; overrodeFine: number; heeded: number } {
  let s = 1;
  let overrodeLost = 0, overrodeFine = 0, heeded = 0;
  for (const { rec } of trades) {
    if (rec.warned !== "pause" && rec.warned !== "stop") continue;
    if (!rec.overrode) { heeded++; continue; }
    if (rec.pnl < 0) { s += 0.25; overrodeLost++; } else { s -= 0.1; overrodeFine++; }
  }
  return { value: round2(clamp(s, 0.7, 1.8)), overrodeLost, overrodeFine, heeded };
}

/* ───────────── verdict ───────────── */

export const THRESHOLDS = { pause: 0.5, stop: 1.2 };

export function evaluate(intent: Intent, journal: Journal, ctx?: Pick<ChainContext, "txLast24h" | "balances">): Verdict {
  const reasons: Reason[] = [];
  const patterns = matchingPatterns(intent, journal.trades);
  const st = strictnessFrom(journal.trades);

  let learned = 0;
  for (const p of patterns) {
    if (Math.abs(p.contribution) < 0.08) continue;
    learned += p.contribution;
    const bad = p.contribution > 0;
    reasons.push({
      tone: bad ? (p.contribution > 0.4 ? "danger" : "warn") : "good",
      source: "learned",
      title: bad ? `${p.label} has cost you` : `${p.label} has worked for you`,
      detail: `${p.n} past ${intent.action}s like this averaged ${fmtPct(p.avg)}; ${p.win}% were wins.`,
      weight: p.contribution,
      memoryIds: p.tradeIds,
    });
  }

  let risk = learned * (learned > 0 ? st.value : 1);

  if (learned > 0 && st.value > 1.05) {
    reasons.push({
      tone: "info", source: "strictness",
      title: `I'm ${st.value.toFixed(2)}× stricter with you now`,
      detail: `You went ahead against my warning ${st.overrodeLost} time${st.overrodeLost === 1 ? "" : "s"} and lost; I raised my guard each time.`,
      weight: 0, memoryIds: [],
    });
  }

  // Default guard-rails: not learned, always on, and labelled as such.
  if (intent.pct > 50) {
    risk += 0.25;
    reasons.push({ tone: "warn", source: "default", title: "More than half your balance", detail: "Default guard-rail (not learned): single moves above 50% of a balance get a pause.", weight: 0.25, memoryIds: [] });
  } else if (intent.pct > 25) {
    risk += 0.1;
    reasons.push({ tone: "info", source: "default", title: "A big slice of your balance", detail: "Default guard-rail (not learned): moves above 25% are noted.", weight: 0.1, memoryIds: [] });
  }
  if (ctx?.txLast24h != null && ctx.txLast24h >= 8) {
    risk += 0.3;
    reasons.push({ tone: "warn", source: "context", title: `${ctx.txLast24h} transactions in the last 24h`, detail: "Read from the Sui chain through Tatum RPC. Busy days tend to be impulsive days.", weight: 0.3, memoryIds: [] });
  }

  risk = round2(Math.max(0, risk));
  const level: Level = risk >= THRESHOLDS.stop ? "stop" : risk >= THRESHOLDS.pause ? "pause" : "go";
  const cooldownMin = level === "go" ? 0 : level === "pause" ? Math.round(clamp(5 + risk * 10, 5, 30)) : 60;

  // A safer size: the best past size bucket (by average result) that is smaller than this move.
  let saferPct: number | null = null;
  if (level !== "go") {
    const acted = journal.trades.filter((t) => t.rec.acted && t.rec.action === intent.action);
    let best: { bucket: string; avg: number } | null = null;
    for (const b of ["small", "mid", "large"]) {
      const g = acted.filter((t) => sizeBucket(t.rec.pct) === b);
      if (g.length < 2 || BUCKET_MAX[b] >= intent.pct) continue;
      const avg = g.reduce((s, t) => s + t.rec.pnl, 0) / g.length;
      if (avg > 0 && (!best || avg > best.avg)) best = { bucket: b, avg };
    }
    if (best) saferPct = BUCKET_MAX[best.bucket];
  }

  const baselineOnly = !reasons.some((r) => r.source === "learned");
  const headline = {
    go: baselineOnly && journal.trades.length === 0 ? "No history yet. Go ahead, and I'll start learning." : "Nothing in your history argues against this.",
    pause: "Take ten before you do this.",
    stop: "You've been here before, and it cost you.",
  }[level];

  reasons.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  return {
    level, risk, strictness: st.value, cooldownMin, saferPct,
    headline: level === "pause" ? `Take ${cooldownMin} minutes before you do this.` : headline,
    reasons,
    memoriesUsed: new Set(reasons.flatMap((r) => r.memoryIds)).size,
    baselineOnly,
  };
}

/* ───────────── learning loop ───────────── */

/** Replay one intent against the first k trades, for k = 0..N, to show how memory changed the answer. */
export function replay(intent: Intent, journal: Journal): ReplayPoint[] {
  const pts: ReplayPoint[] = [];
  for (let k = 0; k <= journal.trades.length; k++) {
    const sub: Journal = { trades: journal.trades.slice(0, k), lessons: [] };
    const v = evaluate(intent, sub);
    pts.push({ k, label: k === 0 ? "No memories" : journal.trades[k - 1].rec.date, risk: v.risk, level: v.level, strictness: v.strictness });
  }
  return pts;
}

export interface LessonDraft extends Omit<LessonRecord, "date"> {}

/** Lessons worth writing down: patterns with n>=3 and a clear average, not yet written at this strength. */
export function deriveLessons(trades: Journal["trades"], existing: LessonRecord[], today: string): LessonRecord[] {
  const acted = trades.filter((t) => t.rec.acted);
  const out: LessonRecord[] = [];
  const actions = [...new Set(acted.map((t) => t.rec.action))];
  for (const action of actions) {
    for (const d of DIMS) {
      const values = [...new Set(acted.filter((t) => t.rec.action === action).map((t) => d.of(t.rec)))];
      for (const value of values) {
        const g = acted.filter((t) => t.rec.action === action && d.of(t.rec) === value);
        if (g.length < 3) continue;
        const avg = g.reduce((s, t) => s + t.rec.pnl, 0) / g.length;
        if (Math.abs(avg) < 5) continue;
        const key = `${action}:${d.dim}:${value}`;
        const prev = [...existing, ...out].filter((l) => l.pattern === key).sort((a, b) => b.n - a.n)[0];
        const flipped = prev && Math.sign(prev.avg) !== Math.sign(avg);
        if (prev && !flipped && g.length < prev.n + 2) continue;
        const win = Math.round((g.filter((t) => t.rec.pnl > 0).length / g.length) * 100);
        const label = patternLabel(action, d.dim, value);
        out.push({
          kind: "lesson", date: today, pattern: key, n: g.length, avg: round1(avg), win,
          summary: `Lesson: ${label.toLowerCase()} has ${avg < 0 ? "cost me" : "paid me"} ${fmtPct(avg)} on average across ${g.length} trades (${win}% wins). ${
            avg < 0 ? "Flag it before I do it again." : "This is a habit worth keeping."
          }`,
        });
      }
    }
  }
  return out;
}
