import { AnimatePresence, motion } from "framer-motion";
import { BookMarked, Lightbulb, Sliders, ArrowLeftRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../lib/store";
import { plain, shortId } from "../lib/ui";
import type { StoredMemory } from "../../shared/types";

const KIND = {
  trade: { icon: ArrowLeftRight, color: "#5b8cff", label: "Trade" },
  lesson: { icon: Lightbulb, color: "#ffb84d", label: "Lesson" },
  pref: { icon: Sliders, color: "#b093ff", label: "Preference" },
} as const;

function Ring({ value, max }: { value: number; max: number }) {
  const r = 22, c = 2 * Math.PI * r;
  const f = Math.min(value / max, 1);
  return (
    <div className="relative grid h-14 w-14 place-items-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <motion.circle cx="28" cy="28" r={r} fill="none" stroke={f >= 1 ? "#5ef2d0" : "#b093ff"} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - f) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="absolute text-[13px] font-semibold tnum">{value}</span>
    </div>
  );
}

function Item({ m, hot, fresh }: { m: StoredMemory; hot: boolean; fresh: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const k = KIND[m.record.kind];
  useEffect(() => { if (hot) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [hot]);
  return (
    <motion.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: -14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="group relative cursor-pointer rounded-2xl border p-3.5 transition-colors"
      style={{
        borderColor: hot ? k.color : "rgba(255,255,255,0.07)",
        background: hot ? `${k.color}14` : "rgba(255,255,255,0.025)",
        boxShadow: fresh ? `0 0 0 1px ${k.color}, 0 0 40px -6px ${k.color}88` : hot ? `0 0 30px -10px ${k.color}` : "none",
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-lg" style={{ background: `${k.color}22`, color: k.color }}><k.icon size={13} /></span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: k.color }}>{k.label}</span>
        {fresh && <span className="rounded-full bg-tide px-2 py-0.5 text-[10px] font-bold text-[#031512]">NEW</span>}
        <span className="mono ml-auto text-[11px] text-faint">{m.record.date}</span>
      </div>
      <p className={`text-[13px] leading-[1.5] text-dim ${open ? "" : "line-clamp-3"}`}>{plain(m.text)}</p>
      <div className="mono mt-2.5 flex items-center gap-1.5 text-[10.5px] text-faint">
        <span className="h-1 w-1 rounded-full bg-faint" />
        {shortId(m.blobId)}
      </div>
    </motion.li>
  );
}

export function MemoryRail({ compact = false }: { compact?: boolean }) {
  const { mem, status, highlight, freshIds } = useApp();
  const min = status?.minMemoriesRequired ?? 10;
  const list = mem ? [...mem.memories].sort((a, b) => b.record.date.localeCompare(a.record.date)) : [];
  const total = mem?.counts.total ?? 0;
  return (
    <aside className={`panel flex flex-col overflow-hidden ${compact ? "h-[560px]" : "h-[calc(100vh-110px)] min-h-[520px]"}`} aria-label="Memory stream">
      <div className="flex items-center gap-4 border-b border-line p-5">
        <Ring value={total} max={min} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"><BookMarked size={16} className="text-mem" /> Walrus Memory</div>
          <div className="mt-0.5 text-[12px] text-dim">
            {total} memories · {mem?.counts.trades ?? 0} trades · {mem?.counts.lessons ?? 0} lessons
          </div>
          <div className="mt-1 text-[11px] text-faint">{status?.memory.onMainnet ? "Seal-encrypted · stored on Walrus" : status?.mode === "live" ? status.memory.network : `demo · SDK mock · ${total >= min ? "≥" : "<"} ${min} minimum`}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {total === 0 && (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <Sparkles className="mx-auto mb-3 text-mem" />
              <div className="text-[15px] font-semibold">A blank slate</div>
              <p className="mt-1 text-[13px] text-dim">No memories yet, so Second Thought can only apply its default guard-rails. Make a move and log how it went.</p>
            </div>
          </div>
        )}
        <ul className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {list.map((m) => <Item key={m.blobId} m={m} hot={highlight.has(m.blobId)} fresh={freshIds.has(m.blobId)} />)}
          </AnimatePresence>
        </ul>
      </div>
    </aside>
  );
}
