import { useEffect, useRef, useState } from "react";
import type { Intent } from "../../shared/types";
import { api, type OutcomeResponse, type PreflightResponse } from "../lib/api";
import { useApp } from "../lib/store";
import { SCENARIOS } from "../lib/ui";
import { Composer } from "./Composer";
import { LearnedPanel } from "./LearnedPanel";
import { OutcomeLogger } from "./OutcomeLogger";
import { Idle, VerdictPanel } from "./VerdictPanel";
import { WalletStrip } from "./WalletStrip";

const DEFAULT: Intent = { action: "sell", asset: "SUI", pct: 20, trigger: "planned", mood: "calm", hour: 14 };

export function PreflightPage({ resetKey, preset = 0, goLearning }: { resetKey: number; preset?: number; goLearning: () => void }) {
  const { refresh, setLastIntent, markFresh, wallet } = useApp();
  const [intent, setIntent] = useState<Intent>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [res, setRes] = useState<PreflightResponse | null>(null);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [out, setOut] = useState<OutcomeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tail = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => { if (preset > 0) { setIntent({ ...SCENARIOS[0].intent }); setRes(null); setChoice(null); setOut(null); } }, [preset]);
  useEffect(() => { setRes(null); setChoice(null); setOut(null); setErr(null); }, [resetKey]);
  useEffect(() => { if (wallet && !wallet.balances.some((b) => b.symbol === intent.asset)) setIntent((i) => ({ ...i, asset: wallet.balances[0]?.symbol ?? i.asset })); }, [wallet, intent.asset]);

  const ask = async () => {
    setLoading(true); setStage(0); setErr(null); setRes(null); setChoice(null); setOut(null);
    const t1 = setTimeout(() => setStage(1), 650), t2 = setTimeout(() => setStage(2), 1300);
    const minWait = new Promise((r) => setTimeout(r, 1900));
    try {
      const [r] = await Promise.all([api.preflight(intent), minWait]);
      setRes(r); setLastIntent(intent); setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) { setErr((e as Error).message); }
    finally { clearTimeout(t1); clearTimeout(t2); setLoading(false); }
  };
  const decide = async (acted: boolean) => {
    if (!res) return;
    try { await api.choice(res.decision.id, acted); setChoice(acted); setTimeout(() => tail.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150); }
    catch (e) { setErr((e as Error).message); }
  };
  const seal = async (pnl: number) => {
    if (!res) return;
    setBusy(true); setErr(null);
    try {
      const o = await api.outcome(res.decision.id, pnl);
      setOut(o); markFresh([o.written.blobId, ...o.lessons.map((l) => l.blobId)]); await refresh();
      setTimeout(() => tail.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <WalletStrip />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <Composer intent={intent} onChange={setIntent} onSubmit={ask} loading={loading} stage={stage} />
        <div className="space-y-6">
          <div ref={top} className="scroll-mt-24" />
          {err && !busy && !out && <div className="rounded-[3px] border-l-2 border-stop bg-stop/5 p-4 text-[13.5px] text-stop" role="alert">{err}</div>}
          {res ? <VerdictPanel key={res.decision.id} res={res} choice={choice} onChoice={decide} /> : <Idle />}
          {res && choice !== null && !out && <OutcomeLogger acted={choice} busy={busy} onSeal={seal} error={err} />}
          {out && <LearnedPanel res={out} onAgain={() => { setRes(null); setChoice(null); setOut(null); document.getElementById("desk")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} onLearning={goLearning} />}
          <div ref={tail} />
        </div>
      </div>
    </div>
  );
}
