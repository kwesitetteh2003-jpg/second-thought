import type { ChainContext, Decision, Intent, ReplayPoint, StatusInfo, StoredMemory, Verdict, RecallTrace } from "../../shared/types";

async function j<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body as T;
}
const post = (p: string, body: unknown) => fetch(p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export interface MemoriesResponse {
  memories: StoredMemory[];
  counts: { total: number; trades: number; lessons: number; prefs: number };
  stats: { strictness: number; heeded: number; overrodeLost: number; overrodeFine: number; avgResult: number; protectedPct: number };
}
export interface PreflightResponse { decision: Decision; context: ChainContext; recall: RecallTrace }
export interface OutcomeResponse { written: StoredMemory; lessons: StoredMemory[]; before: Verdict; after: Verdict; memoriesBefore: number }

export const api = {
  status: () => fetch("/api/status").then(j<StatusInfo>),
  wallet: () => fetch("/api/wallet").then(j<ChainContext>),
  memories: () => fetch("/api/memories").then(j<MemoriesResponse>),
  preflight: (i: Intent) => post("/api/preflight", i).then(j<PreflightResponse>),
  choice: (id: string, acted: boolean) => post(`/api/decisions/${id}/choice`, { acted }).then(j<{ decision: Decision }>),
  outcome: (id: string, pnl: number) => post(`/api/decisions/${id}/outcome`, { pnl }).then(j<OutcomeResponse>),
  replay: (i: Intent) => post("/api/replay", i).then(j<{ points: ReplayPoint[]; trades: { id: string; date: string; pnl: number }[] }>),
  reset: (to: "seed" | "empty") => post("/api/demo/reset", { to }).then(j<{ ok: boolean }>),
};
