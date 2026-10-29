import { motion } from "framer-motion";
import type { OutcomeResponse } from "../lib/api";
import { LEVEL, plain, shortId } from "../lib/ui";

export function LearnedPanel({ res, onAgain, onLearning }: { res: OutcomeResponse; onAgain: () => void; onLearning: () => void }) {
  const b = LEVEL[res.before.level], a = LEVEL[res.after.level];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden" style={{ borderTop: "3px solid #2b3f7a" }}>
      <div className="p-6 sm:p-8">
        <div className="eyebrow mb-3 !text-mem">Remembered</div>
        <h3 className="serif text-[34px] leading-[1.02] sm:text-[40px]">Next time, I'll know.</h3>

        <blockquote className="ruled mt-6 border-l-2 border-mem pl-4 text-[15px] leading-[28px] text-ink">
          {plain(res.written.text)}
          <footer className="mono mt-1 text-[10.5px] leading-5 text-faint">{res.persisted === false ? "preview only: this public demo doesn't write to the owner's Walrus Memory" : <>stored as {shortId(res.written.blobId)}</>}</footer>
        </blockquote>

        {res.lessons.map((l) => (
          <motion.div key={l.blobId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5 border-l-2 border-pause pl-4">
            <div className="eyebrow mb-1 !text-pause">{res.persisted === false ? "New lesson (preview)" : "New lesson written"}</div>
            <p className="text-[14.5px] leading-relaxed">{plain(l.text)}</p>
          </motion.div>
        ))}

        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-end border-y border-line py-5">
          <div><div className="eyebrow mb-1">Before</div><div className="serif text-[40px] leading-none" style={{ color: b.color }}>{b.word}</div><div className="mono mt-1 text-[11px] text-faint">risk {res.before.risk.toFixed(2)}</div></div>
          <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="mx-4 mb-6 block h-px w-10 origin-left bg-ink sm:w-20" aria-hidden />
          <div className="text-right"><div className="eyebrow mb-1">Same move, now</div><div className="serif text-[40px] leading-none" style={{ color: a.color }}>{a.word}</div><div className="mono mt-1 text-[11px] text-faint">risk {res.after.risk.toFixed(2)}</div></div>
        </div>
        <p className="mt-4 text-[13.5px] leading-relaxed text-dim">
          {res.after.risk > res.before.risk + 0.005
            ? <>You went against the warning and it cost you. Risk rose to <b className="text-ink">{res.after.risk.toFixed(2)}</b> and I'm now <b className="text-ink">{res.after.strictness.toFixed(2)}×</b> stricter with you.</>
            : res.after.risk < res.before.risk - 0.005
              ? <>That worked out, so I eased off a little. Risk is now <b className="text-ink">{res.after.risk.toFixed(2)}</b>.</>
              : <>Verdict unchanged. When you listen, there's nothing to tighten, and the journal's “protected” total goes up.</>}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="btn-primary flex-1 !py-3.5" onClick={onAgain}>Ask about another move</button>
          <button className="btn-ghost !py-3.5" onClick={onLearning}>See it learn →</button>
        </div>
      </div>
    </motion.div>
  );
}
