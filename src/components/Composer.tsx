import { motion } from "framer-motion";
import type { Action, Intent } from "../../shared/types";
import { ACTIONS, MOODS, TRIGGERS } from "../../shared/types";
import { ACTION_LABEL, INK, MOOD_LABEL, MOOD_TONE, SCENARIOS, TRIGGER_LABEL, WHEN, num } from "../lib/ui";
import { useApp } from "../lib/store";

function Label({ n, children, hint }: { n: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <span className="flex items-baseline gap-2.5">
        <span className="mono text-[11px] text-faint">{n}</span>
        <span className="text-[14px] font-semibold">{children}</span>
      </span>
      {hint && <span className="text-right text-[12px] text-faint">{hint}</span>}
    </div>
  );
}

const same = (a: Intent, b: Partial<Intent>) => (Object.keys(b) as (keyof Intent)[]).every((k) => a[k] === b[k]);

export function Composer({ intent, onChange, onSubmit, loading, stage }: { intent: Intent; onChange: (i: Intent) => void; onSubmit: () => void; loading: boolean; stage: number }) {
  const { wallet } = useApp();
  const set = <K extends keyof Intent>(k: K, v: Intent[K]) => onChange({ ...intent, [k]: v });
  const bal = wallet?.balances.find((b) => b.symbol === intent.asset)?.amount ?? 0;
  const amt = (bal * intent.pct) / 100;
  const hot = intent.pct > 50 ? INK.stop : intent.pct > 25 ? INK.pause : INK.ink;
  const steps = ["Reading your wallet on Sui via Tatum", "Recalling similar moments from Walrus Memory", "Weighing what happened last time"];

  return (
    <div className="panel p-5 sm:p-8">
      <h2 className="serif text-[36px] leading-[1] sm:text-[42px]">About to make a move?</h2>
      <p className="mt-3 max-w-[44ch] text-[14.5px] leading-relaxed text-dim">Tell me what you're about to do. I'll check it against what actually happened the last times.</p>

      <div className="mt-7 border-t border-line">
        <p className="eyebrow pb-1 pt-4">Or open a case</p>
        {SCENARIOS.map((s, i) => {
          const on = same(intent, s.intent);
          return (
            <button
              key={s.id}
              onClick={() => onChange({ ...intent, ...s.intent })}
              aria-pressed={on}
              className="group grid w-full grid-cols-[52px_1fr_auto] items-baseline gap-x-3 border-b border-line py-3 text-left transition-colors hover:bg-ink/[0.03]"
            >
              <span className="mono text-[11px] text-faint">Case 0{i + 1}</span>
              <span className="min-w-0">
                <span className={`block text-[14.5px] font-semibold ${on ? "text-ember" : ""}`}>{s.title}</span>
                <span className="mono mt-0.5 block truncate text-[10.5px] text-faint">{s.sub}</span>
              </span>
              <span aria-hidden className={`text-[15px] transition-transform duration-300 group-hover:translate-x-1 ${on ? "text-ember" : "text-faint"}`}>{on ? "●" : "→"}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-7">
        <div>
          <Label n="A">I want to</Label>
          <div className="grid grid-cols-4 border border-ink" role="radiogroup" aria-label="Action">
            {ACTIONS.map((a: Action, i) => (
              <button key={a} role="radio" aria-checked={intent.action === a} onClick={() => set("action", a)} className={`relative py-2.5 text-[14px] font-semibold transition-colors ${i ? "border-l border-ink" : ""} ${intent.action === a ? "text-paper" : "text-ink hover:bg-ink/5"}`}>
                {intent.action === a && <motion.span layoutId="act" className="absolute inset-0 bg-ink" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                <span className="relative">{ACTION_LABEL[a]}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label n="B" hint={`≈ ${num(amt, amt < 10 ? 3 : 0)} ${intent.asset} of ${num(bal, bal < 10 ? 3 : 0)}`}>How much of my {intent.asset}</Label>
          <div className="flex items-end justify-between">
            <div className="flex gap-1.5">
              {(wallet?.balances ?? []).map((b) => (
                <button key={b.symbol} className="chip !px-3 !py-1.5 !text-[12.5px]" data-on={intent.asset === b.symbol} onClick={() => set("asset", b.symbol)}>{b.symbol}</button>
              ))}
            </div>
            <div className="serif tnum text-[56px] leading-[0.8] transition-colors" style={{ color: hot }}>
              {intent.pct}<span className="text-[28px] text-faint">%</span>
            </div>
          </div>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-ink/10">
              <div className="h-full transition-colors" style={{ width: `${intent.pct}%`, background: hot }} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between" aria-hidden>
              {[0, 25, 50, 75, 100].map((t) => <span key={t} className="h-2.5 w-px bg-ink/25" />)}
            </div>
            <input aria-label="Share of balance" className="slider relative" type="range" min={1} max={100} value={intent.pct} onChange={(e) => set("pct", Number(e.target.value))} style={{ ["--thumb" as string]: hot }} />
          </div>
        </div>

        <div>
          <Label n="C" hint="what's driving it?">Because of</Label>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map((t) => <button key={t} className="chip" data-on={intent.trigger === t} onClick={() => set("trigger", t)}>{TRIGGER_LABEL[t]}</button>)}
          </div>
        </div>

        <div>
          <Label n="D" hint="be honest, nobody's watching">I'm feeling</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button key={m} className="chip" data-tone={MOOD_TONE[m] === "bad" ? "bad" : MOOD_TONE[m] === "warn" ? "warn" : undefined} data-on={intent.mood === m} onClick={() => set("mood", m)}>{MOOD_LABEL[m]}</button>
            ))}
          </div>
        </div>

        <div>
          <Label n="E" hint={`${String(intent.hour).padStart(2, "0")}:00`}>It's</Label>
          <div className="flex flex-wrap gap-2">
            {WHEN.map((w) => <button key={w.label} className="chip" data-on={intent.hour === w.hour} onClick={() => set("hour", w.hour)}>{w.label}</button>)}
          </div>
        </div>
      </div>

      <button className="btn-primary group mt-9 w-full text-[16px]" onClick={onSubmit} disabled={loading || !wallet}>
        {loading ? "Thinking it over…" : "Ask Second Thought"}
        {!loading && <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>}
      </button>

      {loading && (
        <ol className="mt-5 space-y-2" aria-live="polite">
          {steps.map((s, i) => (
            <motion.li key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: stage >= i ? 1 : 0.3, x: 0 }} className="flex items-center gap-3 text-[12.5px] text-dim">
              <span className="mono w-8 text-[11px]" style={{ color: stage > i ? INK.go : INK.faint }}>{stage > i ? "done" : stage === i ? <span className="animate-blink">…</span> : `0${i + 1}`}</span>
              {s}
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
