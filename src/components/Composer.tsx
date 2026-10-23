import { motion } from "framer-motion";
import { Check, ChevronsRight, Clock, Flame, Frown, Heart, MessageCircle, Newspaper, ClipboardCheck, Swords, Coffee, TrendingDown, TrendingUp, Zap, Smile, Angry, Loader2 } from "lucide-react";
import type { Action, Intent, Mood, Trigger } from "../../shared/types";
import { ACTIONS, MOODS, TRIGGERS } from "../../shared/types";
import { ACTION_LABEL, MOOD_LABEL, MOOD_TONE, SCENARIOS, TRIGGER_LABEL, WHEN, num } from "../lib/ui";
import { useApp } from "../lib/store";

const TRIG_ICON: Record<Trigger, typeof Flame> = { dip: TrendingDown, pump: TrendingUp, tip: MessageCircle, news: Newspaper, planned: ClipboardCheck, revenge: Swords, boredom: Coffee };
const MOOD_ICON: Record<Mood, typeof Flame> = { calm: Smile, fearful: Frown, fomo: Flame, angry: Angry, excited: Zap };

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <span className="eyebrow">{children}</span>
      {hint && <span className="text-[11.5px] text-faint">{hint}</span>}
    </div>
  );
}

export function Composer({ intent, onChange, onSubmit, loading, stage }: { intent: Intent; onChange: (i: Intent) => void; onSubmit: () => void; loading: boolean; stage: number }) {
  const { wallet } = useApp();
  const set = <K extends keyof Intent>(k: K, v: Intent[K]) => onChange({ ...intent, [k]: v });
  const bal = wallet?.balances.find((b) => b.symbol === intent.asset)?.amount ?? 0;
  const amt = (bal * intent.pct) / 100;
  const hot = intent.pct > 50 ? "#ff4d6a" : intent.pct > 25 ? "#ffb84d" : "#5ef2d0";
  const steps = ["Reading your wallet on Sui via Tatum", "Recalling similar moments from Walrus Memory", "Weighing what happened last time"];

  return (
    <div className="panel p-6 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-semibold leading-[1.1] tracking-tight"><span className="text-gradient">About to make a move?</span></h2>
          <p className="mt-2 max-w-[44ch] text-[14px] leading-relaxed text-dim">Tell me what you're about to do. I'll check it against what actually happened the last times.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        {SCENARIOS.map((s) => (
          <button key={s.id} className="group min-w-0 rounded-xl border border-line bg-white/[0.025] px-3 py-2 text-left transition hover:border-line-2 hover:bg-white/[0.06]" onClick={() => onChange({ ...intent, ...s.intent })}>
            <span className="flex items-center gap-1 text-[12px] font-semibold leading-tight"><ChevronsRight size={13} className="shrink-0 text-tide transition group-hover:translate-x-0.5" />{s.title}</span>
            <span className="mono mt-1 block truncate text-[10px] text-faint">{s.sub}</span>
          </button>
        ))}
      </div>

      <Label>I want to</Label>
      <div className="mb-6 grid grid-cols-4 gap-1 rounded-2xl border border-line bg-black/30 p-1" role="radiogroup" aria-label="Action">
        {ACTIONS.map((a: Action) => (
          <button key={a} role="radio" aria-checked={intent.action === a} onClick={() => set("action", a)} className="relative rounded-xl py-2.5 text-[14px] font-semibold" style={{ color: intent.action === a ? "#05070b" : "#8b95a8" }}>
            {intent.action === a && <motion.span layoutId="act" className="absolute inset-0 rounded-xl bg-white" transition={{ type: "spring", stiffness: 440, damping: 34 }} />}
            <span className="relative">{ACTION_LABEL[a]}</span>
          </button>
        ))}
      </div>

      <Label hint={`≈ ${num(amt, amt < 10 ? 3 : 0)} ${intent.asset} of ${num(bal, bal < 10 ? 3 : 0)}`}>How much of my {intent.asset}</Label>
      <div className="mb-1 flex items-end justify-between">
        <div className="flex gap-1.5">
          {(wallet?.balances ?? []).map((b) => (
            <button key={b.symbol} className="chip !px-3 !py-1.5 !text-[12.5px]" data-on={intent.asset === b.symbol} onClick={() => set("asset", b.symbol)}>{b.symbol}</button>
          ))}
        </div>
        <motion.div key={intent.pct} initial={{ y: -4, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} className="tnum text-[44px] font-semibold leading-none tracking-tight" style={{ color: hot }}>
          {intent.pct}<span className="text-[22px] text-faint">%</span>
        </motion.div>
      </div>
      <div className="relative mb-6">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full transition-colors" style={{ width: `${intent.pct}%`, background: `linear-gradient(90deg, #5ef2d0, ${hot})` }} />
        </div>
        <input aria-label="Share of balance" className="slider relative" type="range" min={1} max={100} value={intent.pct} onChange={(e) => set("pct", Number(e.target.value))} style={{ ["--thumb" as string]: hot }} />
      </div>

      <Label hint="what's driving it?">Because of</Label>
      <div className="mb-6 flex flex-wrap gap-2">
        {TRIGGERS.map((t) => { const I = TRIG_ICON[t]; return (
          <button key={t} className="chip" data-on={intent.trigger === t} onClick={() => set("trigger", t)}><I size={14} />{TRIGGER_LABEL[t]}</button>
        ); })}
      </div>

      <Label hint="be honest, nobody's watching">I'm feeling</Label>
      <div className="mb-6 flex flex-wrap gap-2">
        {MOODS.map((m) => { const I = MOOD_ICON[m]; return (
          <button key={m} className="chip" data-tone={MOOD_TONE[m] === "bad" ? "bad" : MOOD_TONE[m] === "warn" ? "warn" : undefined} data-on={intent.mood === m} onClick={() => set("mood", m)}><I size={14} />{MOOD_LABEL[m]}</button>
        ); })}
      </div>

      <Label hint={`${String(intent.hour).padStart(2, "0")}:00`}>It's</Label>
      <div className="mb-8 flex flex-wrap gap-2">
        {WHEN.map((w) => (
          <button key={w.label} className="chip" data-on={intent.hour === w.hour} onClick={() => set("hour", w.hour)}><Clock size={14} />{w.label}</button>
        ))}
      </div>

      <button className="btn-primary w-full text-[16px]" onClick={onSubmit} disabled={loading || !wallet}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
        {loading ? "Thinking it over…" : "Ask Second Thought"}
      </button>

      {loading && (
        <ol className="mt-4 space-y-1.5" aria-live="polite">
          {steps.map((s, i) => (
            <motion.li key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: stage >= i ? 1 : 0.25, x: 0 }} className="flex items-center gap-2.5 text-[12.5px] text-dim">
              <span className="grid h-4 w-4 place-items-center rounded-full" style={{ background: stage > i ? "#5ef2d0" : "rgba(255,255,255,0.08)" }}>{stage > i ? <Check size={11} className="text-[#031512]" strokeWidth={3} /> : stage === i ? <Loader2 size={10} className="animate-spin" /> : null}</span>
              {s}
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
