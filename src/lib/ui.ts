import type { Level, Mood, Trigger, Action } from "../../shared/types";

/** Strip the "[2nd]" marker and the #key=value tags: what a human reads. */
export const plain = (text: string) => text.replace(/^\[2nd\]\s*/, "").replace(/\s#\w+=\S*/g, "").trim();
export const shortId = (id: string) => (id.length > 16 ? `${id.slice(0, 7)}…${id.slice(-5)}` : id);
export const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 10) / 10}%`;
export const num = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
export const short = (a: string) => (a.length > 14 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a);

export const LEVEL: Record<Level, { word: string; color: string; glow: string; text: string }> = {
  go: { word: "GO", color: "#5ef2d0", glow: "rgba(94,242,208,0.35)", text: "text-tide" },
  pause: { word: "PAUSE", color: "#ffb84d", glow: "rgba(255,184,77,0.35)", text: "text-amber" },
  stop: { word: "STOP", color: "#ff4d6a", glow: "rgba(255,77,106,0.4)", text: "text-flare" },
};

export const TRIGGER_LABEL: Record<Trigger, string> = {
  dip: "Price dip", pump: "Price pump", tip: "A tip", news: "Headline", planned: "My plan", revenge: "Win it back", boredom: "Boredom",
};
export const MOOD_LABEL: Record<Mood, string> = { calm: "Calm", fearful: "Fearful", fomo: "FOMO", angry: "Angry", excited: "Excited" };
export const MOOD_TONE: Record<Mood, "good" | "warn" | "bad"> = { calm: "good", fearful: "bad", fomo: "bad", angry: "bad", excited: "warn" };
export const ACTION_LABEL: Record<Action, string> = { sell: "Sell", buy: "Buy", swap: "Swap", send: "Send" };

export const WHEN = [
  { label: "Morning", hour: 9 },
  { label: "Afternoon", hour: 14 },
  { label: "Evening", hour: 20 },
  { label: "Late night", hour: 2 },
] as const;

export const SCENARIOS = [
  { id: "panic", title: "Kofi's 2 AM panic sell", sub: "Sell 40% · dip · fearful · 02:00", intent: { action: "sell", asset: "SUI", pct: 40, trigger: "dip", mood: "fearful", hour: 2 } },
  { id: "tip", title: "The group-chat tip", sub: "Buy 28% · tip · FOMO · 23:00", intent: { action: "buy", asset: "SUI", pct: 28, trigger: "tip", mood: "fomo", hour: 23 } },
  { id: "plan", title: "Planned rebalance", sub: "Sell 10% · plan · calm · 14:00", intent: { action: "sell", asset: "SUI", pct: 10, trigger: "planned", mood: "calm", hour: 14 } },
] as const;
