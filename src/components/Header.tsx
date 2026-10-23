import { motion } from "framer-motion";
import { Compass, Gauge, History, RotateCcw } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { Logo } from "./Logo";
import { StatusPill } from "./StatusPill";

export type Tab = "preflight" | "journal" | "learning";
const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: "preflight", label: "Pre-flight", icon: Compass },
  { id: "journal", label: "Journal", icon: History },
  { id: "learning", label: "Learning", icon: Gauge },
];

export function Header({ tab, onTab, onReset }: { tab: Tab; onTab: (t: Tab) => void; onReset: () => void }) {
  const { status, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const reset = async (to: "seed" | "empty") => {
    setBusy(true);
    try { await api.reset(to); await refresh(); onReset(); } finally { setBusy(false); }
  };
  const mem = status?.memory;
  const chain = status?.chain;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="hidden leading-none sm:block">
            <div className="text-[17px] font-semibold tracking-tight">Second Thought</div>
            <div className="mt-1 hidden text-[11px] text-faint sm:block">the wallet that remembers</div>
          </div>
        </div>

        <nav className="relative ml-2 flex items-center gap-1 rounded-full border border-line bg-white/[0.03] p-1" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => onTab(t.id)} className="relative rounded-full px-3.5 py-2 text-[13.5px] font-medium" style={{ color: tab === t.id ? "#05070b" : "#8b95a8" }}>
              {tab === t.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative flex items-center gap-2"><t.icon size={15} /><span className="hidden sm:inline">{t.label}</span><span className="sr-only sm:hidden">{t.label}</span></span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {mem && <StatusPill label="Memory" value={mem.onMainnet ? "Walrus mainnet" : status?.mode === "live" ? mem.network : "DEMO · mock"} live={mem.onMainnet} honest={mem.honest} />}
          {chain && <StatusPill label="Chain data" value={chain.onMainnet ? "Tatum · Sui mainnet" : "DEMO · fixture"} live={chain.onMainnet} honest={chain.honest} />}
          {status?.canReset && (
            <div className="hidden items-center gap-1 lg:flex">
              <button className="btn-ghost !px-3 !py-2 text-[12.5px]" disabled={busy} onClick={() => reset("seed")} title="Reload the sample journal">
                <RotateCcw size={14} className={busy ? "animate-spin" : ""} /> Reset demo
              </button>
              <button className="btn-ghost !px-3 !py-2 text-[12.5px]" disabled={busy} onClick={() => reset("empty")} title="Wipe to zero memories to show the cold start">
                Start empty
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
