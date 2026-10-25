import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { Logo } from "./Logo";
import { StatusPill } from "./StatusPill";

export type Tab = "preflight" | "journal" | "learning";
const TABS: { id: Tab; label: string }[] = [
  { id: "preflight", label: "Pre-flight" },
  { id: "journal", label: "Journal" },
  { id: "learning", label: "Learning" },
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
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-8 gap-y-1 px-5 pt-3 sm:px-8 lg:flex-nowrap lg:py-3">
        <button onClick={() => { onTab("preflight"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Second Thought, back to top" className="py-1">
          <Logo />
        </button>

        <nav className="order-3 -mx-1 flex w-full items-center gap-1 sm:gap-2 lg:order-none lg:w-auto" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`relative px-2 py-2.5 text-[14px] font-medium transition-colors ${tab === t.id ? "text-ink" : "text-faint hover:text-ink"}`}
            >
              {t.label}
              {tab === t.id && <motion.span layoutId="tab-pill" className="absolute inset-x-2 bottom-1 h-[2px] bg-ember" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-x-5 gap-y-1">
          <div className="flex flex-col items-end sm:flex-row sm:items-center sm:gap-5">
            {mem && <StatusPill label="Memory" value={mem.onMainnet ? "Walrus mainnet" : status?.mode === "live" ? mem.network : "Demo mock"} live={mem.onMainnet} honest={mem.honest} />}
            {chain && <StatusPill label="Chain" value={chain.onMainnet ? "Tatum · Sui mainnet" : "Demo fixture"} live={chain.onMainnet} honest={chain.honest} />}
          </div>
          {status?.canReset && (
            <div className="hidden items-center gap-1 border-l border-line pl-5 lg:flex">
              <button className="link-draw px-1 py-1 text-[12.5px] font-medium text-dim hover:text-ink disabled:opacity-50" disabled={busy} onClick={() => reset("seed")} title="Reload the sample journal">
                {busy ? "Resetting…" : "Reset demo"}
              </button>
              <span className="text-faint" aria-hidden>/</span>
              <button className="link-draw px-1 py-1 text-[12.5px] font-medium text-dim hover:text-ink disabled:opacity-50" disabled={busy} onClick={() => reset("empty")} title="Wipe to zero memories to show the cold start">
                Start empty
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
