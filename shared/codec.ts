import type { Action, Level, MemoryRecord, Mood, Trigger } from "./types";

/**
 * Memory text format.
 *
 * Walrus Memory stores free text and recalls it by meaning. We therefore store
 * one readable sentence (so semantic recall works and a human can audit it)
 * followed by compact `#key=value` tags (so the app can rebuild its model from
 * recalled text without a database).
 */
const TAG = "2nd";

const VERB: Record<Action, string> = { sell: "Sold", buy: "Bought", swap: "Swapped", send: "Sent" };
const SKIP_VERB: Record<Action, string> = { sell: "sell", buy: "buy", swap: "swap", send: "send" };

const TRIGGER_PHRASE: Record<Trigger, string> = {
  dip: "after a price dip",
  pump: "after a price pump",
  tip: "on a tip from a group chat",
  news: "on a news headline",
  planned: "as part of a plan",
  revenge: "to win back an earlier loss",
  boredom: "out of boredom",
};

export function fmtPct(n: number): string {
  const r = Math.round(n * 10) / 10;
  return `${r > 0 ? "+" : ""}${r}%`;
}

export function hourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function narrate(r: MemoryRecord): string {
  if (r.kind === "trade") {
    if (r.acted) {
      return `${r.date}: ${VERB[r.action]} ${r.pct}% of my ${r.asset} ${TRIGGER_PHRASE[r.trigger]}, feeling ${r.mood}, around ${hourLabel(r.hour)}. Result: ${fmtPct(r.pnl)}.${
        r.warned !== "none" && r.warned !== "go" ? ` Second Thought said ${r.warned}${r.overrode ? " and I went ahead anyway" : ""}.` : ""
      }`;
    }
    return `${r.date}: I wanted to ${SKIP_VERB[r.action]} ${r.pct}% of my ${r.asset} ${TRIGGER_PHRASE[r.trigger]}, feeling ${r.mood}, around ${hourLabel(r.hour)}. Second Thought said ${r.warned} and I waited. Holding turned out ${fmtPct(r.pnl)} versus acting.`;
  }
  return r.summary;
}

export function encode(r: MemoryRecord): string {
  let tags: Record<string, string | number>;
  if (r.kind === "trade") {
    tags = {
      kind: "trade", date: r.date, action: r.action, asset: r.asset, pct: r.pct, trigger: r.trigger,
      mood: r.mood, hour: r.hour, pnl: r.pnl, acted: r.acted ? 1 : 0, warned: r.warned, overrode: r.overrode ? 1 : 0,
    };
  } else if (r.kind === "lesson") {
    tags = { kind: "lesson", date: r.date, pattern: r.pattern, n: r.n, avg: r.avg, win: r.win };
  } else {
    tags = { kind: "pref", date: r.date, key: r.key, value: r.value };
  }
  const tagStr = Object.entries(tags).map(([k, v]) => `#${k}=${String(v).replace(/\s+/g, "_")}`).join(" ");
  return `[${TAG}] ${narrate(r)} ${tagStr}`;
}

function parseTags(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of text.matchAll(/#([a-z]+)=(\S+)/g)) out[m[1]] = m[2];
  return out;
}

export function decode(text: string): MemoryRecord | null {
  if (!text.includes(`[${TAG}]`)) return null;
  const t = parseTags(text);
  const body = text.replace(/^\s*\[2nd\]\s*/, "").replace(/\s*#[a-z]+=\S+/g, "").trim();
  const num = (k: string) => Number(t[k]);
  if (t.kind === "trade") {
    if (!t.date || !t.action || !Number.isFinite(num("pct")) || !Number.isFinite(num("pnl"))) return null;
    return {
      kind: "trade",
      date: t.date,
      action: t.action as Action,
      asset: t.asset ?? "SUI",
      pct: num("pct"),
      trigger: t.trigger as Trigger,
      mood: t.mood as Mood,
      hour: num("hour"),
      pnl: num("pnl"),
      acted: t.acted === "1",
      warned: (t.warned as Level | "none") ?? "none",
      overrode: t.overrode === "1",
    };
  }
  if (t.kind === "lesson") {
    return { kind: "lesson", date: t.date, pattern: t.pattern, n: num("n"), avg: num("avg"), win: num("win"), summary: body };
  }
  if (t.kind === "pref") {
    return { kind: "pref", date: t.date, key: t.key, value: t.value.replace(/_/g, " "), summary: body };
  }
  return null;
}
