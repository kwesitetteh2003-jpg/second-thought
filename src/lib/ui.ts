import type { Level, Mood, Trigger, Action } from "../../shared/types";

/** Strip the "[2nd]" marker and the #key=value tags: what a human reads. */
export const plain = (text: string) => text.replace(/^\[2nd\]\s*/, "").replace(/\s#\w+=\S*/g, "").trim();
export const shortId = (id: string) => (id.length > 16 ? `${id.slice(0, 7)}…${id.slice(-5)}` : id);
export const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 10) / 10}%`;
export const num = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
export const short = (a: string) => (a.length > 14 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a);

/** Verdict colours: earth pigments that read as text on the paper background. */
export const LEVEL: Record<Level, { word: string; color: string; wash: string; text: string }> = {
  go: { word: "GO", color: "#2c6a4c", wash: "rgba(44,106,76,0.09)", text: "text-go" },
  pause: { word: "PAUSE", color: "#9a5b0b", wash: "rgba(154,91,11,0.09)", text: "text-pause" },
  stop: { word: "STOP", color: "#ad2f1d", wash: "rgba(173,47,29,0.08)", text: "text-stop" },
};

/** Shared ink colours for SVG and inline styles (mirror the @theme tokens). */
export const INK = { ink: "#1d1a16", dim: "#4d463d", faint: "#6b6257", line: "rgba(29,26,22,0.13)", mem: "#2b3f7a", info: "#3c5a8a", go: "#2c6a4c", pause: "#9a5b0b", stop: "#ad2f1d" } as const;

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
