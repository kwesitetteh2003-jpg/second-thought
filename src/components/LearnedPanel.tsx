import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, RotateCcw } from "lucide-react";
import type { OutcomeResponse } from "../lib/api";
import { LEVEL, plain, shortId } from "../lib/ui";

export function LearnedPanel({ res, onAgain, onLearning }: { res: OutcomeResponse; onAgain: () => void; onLearning: () => void }) {
  const b = LEVEL[res.before.level], a = LEVEL[res.after.level];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel p-7" style={{ boxShadow: "0 0 0 1px rgba(176,147,255,0.35), 0 40px 80px -40px rgba(176,147,255,0.4)" }}>
      <div className="flex items-center gap-3">
        <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="grid h-10 w-10 place-items-center rounded-xl bg-mem/20 text-mem"><BrainCircuit size={20} /></motion.span>
        <div>
          <div className="eyebrow">Remembered</div>
          <h3 className="text-[19px] font-semibold tracking-tight">Next time, I'll know.</h3>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-mem/30 bg-mem/[0.06] p-4">
        <p className="text-[13.5px] leading-relaxed text-text">{plain(res.written.text)}</p>
        <div className="mono mt-2 text-[10.5px] text-faint">stored as {shortId(res.written.blobId)}</div>
      </div>
      {res.lessons.map((l) => (
        <motion.div key={l.blobId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="mt-3 rounded-2xl border border-amber/30 bg-amber/[0.06] p-4">
          <div className="eyebrow mb-1.5 !text-amber">New lesson written</div>
          <p className="text-[13.5px] leading-relaxed">{plain(l.text)}</p>
        </motion.div>
      ))}
      <div className="mt-5 flex items-center justify-center gap-4 rounded-2xl border border-line bg-black/25 p-4">
        <div className="text-center"><div className="eyebrow mb-1">Before</div><div className="text-[22px] font-bold" style={{ color: b.color }}>{b.word}</div><div className="mono text-[11px] text-faint">risk {res.before.risk.toFixed(2)}</div></div>
        <ArrowRight className="text-faint" />
        <div className="text-center"><div className="eyebrow mb-1">Same move, now</div><div className="text-[22px] font-bold" style={{ color: a.color }}>{a.word}</div><div className="mono text-[11px] text-faint">risk {res.after.risk.toFixed(2)}</div></div>
      </div>
      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-dim">
        {res.after.risk > res.before.risk + 0.005
          ? <>You went against the warning and it cost you. Risk rose to <b className="text-text">{res.after.risk.toFixed(2)}</b> and I'm now <b className="text-text">{res.after.strictness.toFixed(2)}×</b> stricter with you.</>
          : res.after.risk < res.before.risk - 0.005
            ? <>That worked out, so I eased off a little. Risk is now <b className="text-text">{res.after.risk.toFixed(2)}</b>.</>
            : <>Verdict unchanged. When you listen, there's nothing to tighten, and the journal's “protected” total goes up.</>}
      </p>
      <div className="mt-5 flex gap-3">
        <button className="btn-primary flex-1 !py-3.5" onClick={onAgain}><RotateCcw size={16} />Ask about another move</button>
        <button className="btn-ghost" onClick={onLearning}>See it learn</button>
      </div>
    </motion.div>
  );
}
