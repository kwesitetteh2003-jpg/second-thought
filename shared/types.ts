// Shared between the Express API and the React app.

export type Action = "sell" | "buy" | "swap" | "send";
export type Trigger = "dip" | "pump" | "tip" | "news" | "planned" | "revenge" | "boredom";
export type Mood = "calm" | "fearful" | "fomo" | "angry" | "excited";
export type Level = "go" | "pause" | "stop";

export const ACTIONS: Action[] = ["sell", "buy", "swap", "send"];
export const TRIGGERS: Trigger[] = ["dip", "pump", "tip", "news", "planned", "revenge", "boredom"];
export const MOODS: Mood[] = ["calm", "fearful", "fomo", "angry", "excited"];

/** What the user is about to do. */
export interface Intent {
  action: Action;
  asset: string;
  /** Share of the wallet's balance of `asset`, 1-100. */
  pct: number;
  trigger: Trigger;
  mood: Mood;
  /** Local hour of day 0-23. */
  hour: number;
  note?: string;
}

/** A decision plus its result. Written to Walrus Memory once the outcome is known. */
export interface TradeRecord {
  kind: "trade";
  date: string; // YYYY-MM-DD
  action: Action;
  asset: string;
  pct: number;
  trigger: Trigger;
  mood: Mood;
  hour: number;
  /** Result of the decision, in percent. For a skipped trade: how much better off holding turned out. */
  pnl: number;
  /** Did the user actually do it? */
  acted: boolean;
  /** What Second Thought said at the time. "none" = journal entry made before the app existed. */
  warned: Level | "none";
  /** Did the user go ahead despite a pause or stop? */
  overrode: boolean;
}

/** A reflection written by the app after enough trades show a pattern. */
export interface LessonRecord {
  kind: "lesson";
  date: string;
  pattern: string; // e.g. sell:trigger:dip
  n: number;
  avg: number;
  win: number; // win rate 0-100
  summary: string;
}

/** A standing preference. */
export interface PrefRecord {
  kind: "pref";
  date: string;
  key: string;
  value: string;
  summary: string;
}

export type MemoryRecord = TradeRecord | LessonRecord | PrefRecord;

export interface StoredMemory {
  /** Walrus blob id (live) or the mock's id (demo). */
  blobId: string;
  createdAt?: string;
  /** The exact text stored in Walrus Memory. */
  text: string;
  record: MemoryRecord;
}

export interface Balance {
  symbol: string;
  coinType: string;
  amount: number;
  decimals: number;
}

export interface ChainContext {
  source: "tatum-sui-rpc" | "fixture";
  address: string;
  checkpoint: number | null;
  balances: Balance[];
  txLast24h: number | null;
  gasPriceMist: number | null;
  fetchedAt: string;
}

export interface Pattern {
  key: string;
  dim: "trigger" | "mood" | "size" | "hour";
  value: string;
  label: string;
  n: number;
  avg: number;
  win: number;
  contribution: number;
  tradeIds: string[];
}

export interface Reason {
  tone: "danger" | "warn" | "good" | "info";
  source: "learned" | "default" | "context" | "strictness";
  title: string;
  detail: string;
  weight: number;
  memoryIds: string[];
}

export interface Verdict {
  level: Level;
  risk: number;
  strictness: number;
  cooldownMin: number;
  saferPct: number | null;
  headline: string;
  reasons: Reason[];
  memoriesUsed: number;
  /** true when no learned pattern fired, so only the default guard-rails applied */
  baselineOnly: boolean;
}

export interface RecallTrace {
  query: string;
  backend: string;
  hits: { blobId: string; distance: number; text: string }[];
}

export interface ReplayPoint {
  k: number;
  label: string;
  risk: number;
  level: Level;
  strictness: number;
}

export interface Decision {
  id: string;
  createdAt: string;
  intent: Intent;
  verdict: Verdict;
  acted: boolean | null;
  overrode: boolean | null;
  outcomeLogged: boolean;
}

export interface StatusInfo {
  mode: "demo" | "live";
  memory: { backend: string; honest: string; network: string; namespace: string; count: number; onMainnet: boolean };
  chain: { backend: string; honest: string; endpoint: string; onMainnet: boolean };
  canReset: boolean;
  /** "open": anyone can write; "owner": only the owner key writes, visitors get a preview. */
  writes: "open" | "owner";
  minMemoriesRequired: number;
}
