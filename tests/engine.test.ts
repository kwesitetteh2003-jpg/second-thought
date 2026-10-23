import { describe, expect, it } from "vitest";
import { buildSeed } from "../seed/journal";
import { deriveLessons, evaluate, matchingPatterns, replay, strictnessFrom, toJournal } from "../shared/engine";
import type { Intent, TradeRecord } from "../shared/types";

const journal = () => toJournal(buildSeed().map((record, i) => ({ blobId: `b${i}`, text: "", record })));
const panic: Intent = { action: "sell", asset: "SUI", pct: 40, trigger: "dip", mood: "fearful", hour: 2 };
const plan: Intent = { action: "sell", asset: "SUI", pct: 10, trigger: "planned", mood: "calm", hour: 14 };

describe("engine", () => {
  it("says GO with an empty memory, and says so honestly", () => {
    const v = evaluate(panic, { trades: [], lessons: [] });
    expect(v.level).toBe("go");
    expect(v.baselineOnly).toBe(true);
    expect(v.headline).toMatch(/No history yet/);
  });

  it("the same intent goes GO -> PAUSE -> STOP as memories accumulate", () => {
    const pts = replay(panic, journal());
    expect(pts[0].level).toBe("go");
    expect(pts.some((p) => p.level === "pause")).toBe(true);
    expect(pts.at(-1)!.level).toBe("stop");
    const order = { go: 0, pause: 1, stop: 2 };
    for (let i = 1; i < pts.length; i++) expect(order[pts[i].level]).toBeGreaterThanOrEqual(order[pts[i - 1].level]);
  });

  it("does not just say no: calm planned small sells are GO and praised", () => {
    const v = evaluate(plan, journal());
    expect(v.level).toBe("go");
    expect(v.reasons.some((r) => r.tone === "good")).toBe(true);
  });

  it("cites the exact memories behind a warning", () => {
    const j = journal();
    const v = evaluate(panic, j);
    const ids = new Set(j.trades.map((t) => t.id));
    const cited = v.reasons.flatMap((r) => r.memoryIds);
    expect(cited.length).toBeGreaterThan(0);
    for (const id of cited) expect(ids.has(id)).toBe(true);
  });

  it("only learns from trades the user actually made", () => {
    const j = journal();
    const skipped = j.trades.filter((t) => !t.rec.acted);
    expect(skipped.length).toBeGreaterThan(0);
    const pats = matchingPatterns(panic, j.trades);
    for (const p of pats) for (const id of p.tradeIds) expect(skipped.some((s) => s.id === id)).toBe(false);
  });

  it("gets stricter after the user overrides a warning and loses", () => {
    const j = journal();
    expect(strictnessFrom(j.trades).value).toBe(1.5);
    const lost: TradeRecord = { ...j.trades[9].rec };
    expect(strictnessFrom([{ id: "x", rec: { ...lost, pnl: 5 } }]).value).toBeLessThan(1);
    expect(strictnessFrom([]).value).toBe(1);
  });

  it("suggests a safer size learned from the user's own best bucket", () => {
    expect(evaluate(panic, journal()).saferPct).toBe(15);
  });

  it("adds a context reason when Tatum reports a busy day", () => {
    const v = evaluate(plan, { trades: [], lessons: [] }, { txLast24h: 11, balances: [] });
    expect(v.reasons.some((r) => r.source === "context")).toBe(true);
  });

  it("writes each lesson once and again only when evidence grows", () => {
    const j = journal();
    const lessons = j.lessons.map((l) => l.rec);
    expect(deriveLessons(j.trades, lessons, "2026-10-21")).toHaveLength(0);
    const extra: TradeRecord = { kind: "trade", date: "2026-10-22", action: "buy", asset: "SUI", pct: 10, trigger: "tip", mood: "calm", hour: 12, pnl: -8, acted: true, warned: "none", overrode: false };
    const more = [...j.trades, { id: "new1", rec: extra }];
    expect(deriveLessons(more, lessons, "2026-10-22")).toHaveLength(0); // tip-buys n 3 -> 4: not +2 yet
    const more2 = [...more, { id: "new2", rec: { ...extra, date: "2026-10-23" } }];
    expect(deriveLessons(more2, lessons, "2026-10-23").length).toBeGreaterThan(0); // tip-buys n 3 -> 5
  });
});
