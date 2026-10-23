import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ChainContext, Intent, StatusInfo } from "../../shared/types";
import { api, type MemoriesResponse } from "./api";

interface Ctx {
  status: StatusInfo | null;
  wallet: ChainContext | null;
  mem: MemoriesResponse | null;
  error: string | null;
  highlight: Set<string>;
  setHighlight: (ids: string[]) => void;
  freshIds: Set<string>;
  markFresh: (ids: string[]) => void;
  refresh: () => Promise<void>;
  lastIntent: Intent | null;
  setLastIntent: (i: Intent) => void;
}
const C = createContext<Ctx | null>(null);
export const useApp = () => {
  const v = useContext(C);
  if (!v) throw new Error("outside provider");
  return v;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [wallet, setWallet] = useState<ChainContext | null>(null);
  const [mem, setMem] = useState<MemoriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setH] = useState<Set<string>>(new Set());
  const [freshIds, setFresh] = useState<Set<string>>(new Set());
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, w, m] = await Promise.all([api.status(), api.wallet(), api.memories()]);
      setStatus(s); setWallet(w); setMem(m); setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<Ctx>(() => ({
    status, wallet, mem, error, refresh, lastIntent, setLastIntent, highlight, freshIds,
    setHighlight: (ids) => setH(new Set(ids)),
    markFresh: (ids) => { setFresh(new Set(ids)); setTimeout(() => setFresh(new Set()), 6000); },
  }), [status, wallet, mem, error, refresh, lastIntent, highlight, freshIds]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
