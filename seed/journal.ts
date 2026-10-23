import type { LessonRecord, MemoryRecord, PrefRecord, TradeRecord } from "../shared/types";
import { deriveLessons, toJournal } from "../shared/engine";
import { encode } from "../shared/codec";

/**
 * A fictional trader, "Kofi". These are SAMPLE memories for the demo.
 * Edit this file to use your own (or clearly-fictional) journal before running
 * `npm run memories:store`, which writes them to your own Walrus Memory account.
 */
type Row = [date: string, action: TradeRecord["action"], pct: number, trigger: TradeRecord["trigger"], mood: TradeRecord["mood"], hour: number, pnl: number, acted: boolean, warned: TradeRecord["warned"], overrode: boolean];

const rows: Row[] = [
  ["2026-08-14", "buy", 15, "tip", "excited", 22, -9, true, "none", false],
  ["2026-08-21", "sell", 10, "planned", "calm", 14, 5, true, "none", false],
  ["2026-08-29", "sell", 45, "dip", "fearful", 2, -11, true, "none", false],
  ["2026-09-03", "buy", 8, "planned", "calm", 11, 7, true, "none", false],
  ["2026-09-09", "buy", 30, "tip", "fomo", 23, -14, true, "none", false],
  ["2026-09-15", "sell", 35, "dip", "fearful", 3, -13, true, "none", false],
  ["2026-09-20", "swap", 12, "planned", "calm", 15, 4, true, "none", false],
  ["2026-09-26", "sell", 50, "news", "angry", 1, -10, true, "none", false],
  ["2026-10-02", "buy", 10, "planned", "calm", 10, 6, true, "none", false],
  ["2026-10-06", "sell", 40, "dip", "fearful", 2, -12, true, "stop", true],
  ["2026-10-11", "sell", 12, "dip", "calm", 13, 3, true, "go", false],
  ["2026-10-14", "buy", 25, "tip", "fomo", 0, -8, true, "pause", true],
  ["2026-10-16", "sell", 38, "dip", "fearful", 2, 9, false, "stop", false],
  ["2026-10-20", "sell", 20, "planned", "calm", 14, 4, true, "go", false],
];

export function buildSeed(): MemoryRecord[] {
  const out: MemoryRecord[] = [];
  const prefs: PrefRecord[] = [
    { kind: "pref", date: "2026-08-10", key: "risk_profile", value: "moderate; no single move above 25% of a balance", summary: "2026-08-10: My risk profile is moderate. I do not want any single move above 25% of a balance." },
    { kind: "pref", date: "2026-08-10", key: "cooldown", value: "I accept a wait before big moves", summary: "2026-08-10: I'm happy to wait ten minutes before any big move if it saves me from a bad decision." },
  ];
  out.push(...prefs);
  const trades: TradeRecord[] = [];
  const lessons: LessonRecord[] = [];
  for (const r of rows) {
    const t: TradeRecord = { kind: "trade", date: r[0], action: r[1], asset: "SUI", pct: r[2], trigger: r[3], mood: r[4], hour: r[5], pnl: r[6], acted: r[7], warned: r[8], overrode: r[9] };
    trades.push(t);
    out.push(t);
    const j = toJournal(trades.map((rec, i) => ({ blobId: `seed-${i}`, text: "", record: rec })));
    const fresh = deriveLessons(j.trades, lessons, t.date);
    lessons.push(...fresh);
    out.push(...fresh);
  }
  return out;
}

export const seedTexts = (): string[] => buildSeed().map(encode);
