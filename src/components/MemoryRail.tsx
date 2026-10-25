import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../lib/store";
import { INK, plain, shortId } from "../lib/ui";
import type { StoredMemory } from "../../shared/types";

const KIND = {
  trade: { color: INK.info, label: "Trade" },
  lesson: { color: INK.pause, label: "Lesson" },
  pref: { color: INK.mem, label: "Preference" },
} as const;

/** Progress toward the SDK's minimum, drawn as a row of tally marks. */
function Tally({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex items-end gap-[3px]" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.03 }} className="block h-4 w-[3px] origin-bottom" style={{ background: i < value ? INK.mem : "rgba(29,26,22,0.14)" }} />
      ))}
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="relative cursor-pointer border-b border-line py-3.5 pl-3 pr-1 transition-colors"
      style={{ boxShadow: `inset 2px 0 0 ${hot || fresh ? k.color : "transparent"}`, background: hot ? `${k.color}10` : fresh ? "rgba(217,87,42,0.06)" : "transparent" }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="mono text-[11px] text-faint">{m.record.date}</span>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: k.color }}>{k.label}</span>
        {fresh && <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.12em] text-ember">New</span>}
      </div>
      <p className={`text-[13px] leading-[1.5] text-dim ${open ? "" : "line-clamp-3"}`}>{plain(m.text)}</p>
      <div className="mono mt-1.5 text-[10.5px] text-faint">{shortId(m.blobId)}</div>
    </motion.li>
  );
}

export function MemoryRail({ compact = false }: { compact?: boolean }) {
  const { mem, status, highlight, freshIds } = useApp();
  const min = status?.minMemoriesRequired ?? 10;
  const list = mem ? [...mem.memories].sort((a, b) => b.record.date.localeCompare(a.record.date)) : [];
  const total = mem?.counts.total ?? 0;
  return (
    <aside className={`panel flex flex-col overflow-hidden ${compact ? "h-[560px]" : "h-[calc(100vh-108px)] min-h-[520px]"}`} aria-label="Memory stream">
      <div className="border-b border-ink/80 px-5 pb-4 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="serif text-[28px] leading-none">Walrus Memory</h2>
          <span className="serif tnum text-[28px] leading-none text-mem">{total}</span>
        </div>
        <div className="mt-2 text-[12.5px] text-dim">{total} memories · {mem?.counts.trades ?? 0} trades · {mem?.counts.lessons ?? 0} lessons</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <Tally value={Math.min(total, min)} max={min} />
          <span className="text-right text-[11px] text-faint">{status?.memory.onMainnet ? "Seal-encrypted · stored on Walrus" : status?.mode === "live" ? status.memory.network : `demo · SDK mock · ${total >= min ? "≥" : "<"} ${min} minimum`}</span>
        </div>
      </div>
      <div className="ruled flex-1 overflow-y-auto px-4">
        {total === 0 && (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <div className="serif text-[30px] leading-none">A blank slate</div>
              <p className="mt-3 text-[13px] leading-relaxed text-dim">No memories yet, so Second Thought can only apply its default guard-rails. Make a move and log how it went.</p>
            </div>
          </div>
        )}
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {list.map((m) => <Item key={m.blobId} m={m} hot={highlight.has(m.blobId)} fresh={freshIds.has(m.blobId)} />)}
          </AnimatePresence>
        </ul>
      </div>
    </aside>
  );
}
