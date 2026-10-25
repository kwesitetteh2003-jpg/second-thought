import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

/** A small labelled status line. The tooltip carries the honest version of what is (and isn't) real. */
export function StatusPill({ label, value, live, honest }: { label: string; value: string; live: boolean; honest: string }) {
  const [open, setOpen] = useState(false);
  const color = live ? "#2c6a4c" : "#9a5b0b";
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="group flex items-baseline gap-2 py-1 text-left"
        aria-label={`${label}: ${value}. ${honest}`}
      >
        <span className="h-[7px] w-[7px] translate-y-[-1px] rounded-full" style={{ background: color }} aria-hidden />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-faint">{label}</span>
        <span className="text-[12.5px] font-semibold underline decoration-dotted decoration-1 underline-offset-[3px]" style={{ color, textDecorationColor: `${color}88` }}>{value}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(18rem,80vw)] rounded-[3px] bg-ink p-3.5 text-[12.5px] leading-relaxed text-paper shadow-[0_18px_40px_-18px_rgba(0,0,0,.5)]"
          >
            {honest}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
