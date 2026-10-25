import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useState } from "react";
import { Header, type Tab } from "./components/Header";
import { MemoryRail } from "./components/MemoryRail";
import { CREDITS } from "./components/Photo";
import { PreflightPage } from "./components/PreflightPage";
import { Story } from "./components/Story";
import { scrollToEl, scrollToTop } from "./lib/smooth";
import { useApp } from "./lib/store";

const JournalPage = lazy(() => import("./components/JournalPage").then((m) => ({ default: m.JournalPage })));
const LearningPage = lazy(() => import("./components/LearningPage").then((m) => ({ default: m.LearningPage })));

const DESK_COPY: Record<Tab, [string, string]> = {
  preflight: ["The desk", "A working demo on Kofi's sample journal. Pick a case or set your own move, ask, decide, then log how it went. The notebook on the right changes as you do."],
  journal: ["The journal", "Every move Second Thought remembers, and what it cost or saved."],
  learning: ["Learning", "Replay the memories one by one and watch the same move get judged differently."],
};

export default function App() {
  const [tab, setTab] = useState<Tab>("preflight");
  const [resetKey, setResetKey] = useState(0);
  const [preset, setPreset] = useState(0);
  const { error, status } = useApp();
  const [title, blurb] = DESK_COPY[tab];

  const tryPanic = () => {
    setPreset((n) => n + 1);
    requestAnimationFrame(() => scrollToEl(document.getElementById("desk"), -72));
  };
  const switchTab = (t: Tab) => {
    setTab(t);
    if (t !== "preflight") scrollToTop(true);
  };

  return (
    <>
      <div aria-hidden className="grain" />
      <Header tab={tab} onTab={switchTab} onReset={() => setResetKey((k) => k + 1)} />
      {tab === "preflight" && !error && <Story onTry={tryPanic} />}
      <main id="desk" className="mx-auto max-w-[1320px] scroll-mt-20 px-5 pb-10 pt-12 sm:px-8 lg:pt-16">
        <div className="mb-10 grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-ink pb-6 lg:grid-cols-12 lg:items-end">
          <h2 className="serif text-[48px] leading-[0.95] sm:text-[64px] lg:col-span-5">{title}</h2>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-dim lg:col-span-7 lg:justify-self-end">{blurb}</p>
        </div>
        {error && (
          <div className="panel mx-auto mt-10 max-w-xl p-8 text-center" role="alert">
            <h2 className="text-[20px] font-semibold">Can't reach the Second Thought API</h2>
            <p className="mt-2 text-[14px] text-dim">{error}</p>
            <p className="mono mt-4 rounded-[3px] bg-sand p-3 text-[12px] text-dim">npm run dev</p>
          </div>
        )}
        {!error && (
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 14, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(4px)" }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="min-w-0">
                {tab === "preflight" && <PreflightPage resetKey={resetKey} preset={preset} goLearning={() => setTab("learning")} />}
                <Suspense fallback={<div className="min-h-[60vh]" />}>
                  {tab === "journal" && <JournalPage />}
                  {tab === "learning" && <LearningPage />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
            <div className="hidden xl:sticky xl:top-[84px] xl:block"><MemoryRail /></div>
          </div>
        )}
        {!error && <div className="mt-10 xl:hidden"><MemoryRail compact /></div>}
      </main>
      <footer className="mt-10 border-t border-line">
        <div className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-8 px-5 py-10 text-[12.5px] leading-relaxed text-faint sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="serif text-[22px] text-ink">Second Thought never moves funds. It only advises.</p>
            <p className="mt-3">
              {status?.mode === "demo" ? "Demo mode: a sample journal of a fictional trader, Kofi. Memories live in the SDK's offline mock, not on Walrus." : `Live · ${status?.memory.network ?? ""}`}
            </p>
          </div>
          <div className="lg:col-span-4">
            <p className="eyebrow mb-2">Photographs</p>
            <ul className="space-y-1">
              {Object.values(CREDITS).map((c) => (
                <li key={c.url}><a className="link-draw" href={c.url} target="_blank" rel="noreferrer">{c.by}</a>, via Pexels (Pexels License)</li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <p className="eyebrow mb-2">Type</p>
            <p>Instrument Serif, Schibsted Grotesk and IBM Plex Mono, served from this site.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
