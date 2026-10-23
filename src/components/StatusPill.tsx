import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useState } from "react";

export function StatusPill({ label, value, live, honest }: { label: string; value: string; live: boolean; honest: string }) {
  const [open, setOpen] = useState(false);
  const color = live ? "#5ef2d0" : "#ffb84d";
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex items-center gap-2.5 rounded-full border border-line bg-white/[0.03] py-1.5 pl-3 pr-3.5 text-left transition hover:border-line-2"
        aria-label={`${label}: ${value}. ${honest}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-pulse-ring rounded-full" style={{ background: color }} />
          <span className="relative h-2 w-2 rounded-full" style={{ background: color }} />
        </span>
        <span className="leading-none">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</span>
          <span className="mt-1 block text-[12.5px] font-semibold" style={{ color }}>{value}</span>
        </span>
        <Info size={13} className="text-faint" />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel panel-tight absolute right-0 top-[calc(100%+10px)] z-40 w-72 p-3.5 text-[12.5px] leading-relaxed text-dim"
          style={{ background: "#0d121b" }}
        >
          {honest}
        </motion.div>
      )}
    </div>
  );
}
