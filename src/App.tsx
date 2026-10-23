import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Background } from "./components/Background";
import { Header, type Tab } from "./components/Header";
import { JournalPage } from "./components/JournalPage";
import { LearningPage } from "./components/LearningPage";
import { MemoryRail } from "./components/MemoryRail";
import { PreflightPage } from "./components/PreflightPage";
import { useApp } from "./lib/store";

export default function App() {
  const [tab, setTab] = useState<Tab>("preflight");
  const [resetKey, setResetKey] = useState(0);
  const { error, status } = useApp();
  return (
    <>
      <Background />
      <Header tab={tab} onTab={setTab} onReset={() => setResetKey((k) => k + 1)} />
      <main className="mx-auto max-w-[1560px] px-5 py-6 lg:px-8">
        {error && (
          <div className="panel mx-auto mt-10 max-w-xl p-8 text-center" role="alert">
            <h2 className="text-[20px] font-semibold">Can't reach the Second Thought API</h2>
            <p className="mt-2 text-[14px] text-dim">{error}</p>
            <p className="mono mt-4 rounded-lg bg-black/40 p-3 text-[12px] text-faint">npm run dev</p>
          </div>
        )}
        {!error && (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_372px]">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="min-w-0">
                {tab === "preflight" && <PreflightPage resetKey={resetKey} goLearning={() => setTab("learning")} />}
                {tab === "journal" && <JournalPage />}
                {tab === "learning" && <LearningPage />}
              </motion.div>
            </AnimatePresence>
            <div className="hidden xl:sticky xl:top-[88px] xl:block"><MemoryRail /></div>
          </div>
        )}
        {!error && <div className="mt-6 xl:hidden"><MemoryRail compact /></div>}
      </main>
      <footer className="mx-auto max-w-[1560px] px-8 pb-10 pt-4 text-[11.5px] text-faint">
        {status?.mode === "demo" ? "DEMO MODE · sample journal of a fictional trader · memories live in the SDK's offline mock, not on Walrus." : `LIVE · ${status?.memory.network}`}
        {" "}· Second Thought never moves funds. It only advises.
      </footer>
    </>
  );
}
