import { motion } from "framer-motion";
import { Activity, Fuel, Layers } from "lucide-react";
import { useApp } from "../lib/store";
import { num, short } from "../lib/ui";

export function WalletStrip() {
  const { wallet, status } = useApp();
  if (!wallet) return <div className="panel h-[92px] animate-pulse" />;
  const live = wallet.source === "tatum-sui-rpc";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4">
      <div>
        <div className="eyebrow">Wallet · {live ? "live via Tatum" : "demo fixture"}</div>
        <div className="mono mt-1.5 text-[13px] text-dim">{short(wallet.address)}</div>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3">
        {wallet.balances.map((b) => (
          <div key={b.symbol}>
            <div className="text-[11px] font-medium text-faint">{b.symbol}</div>
            <div className="tnum text-[22px] font-semibold leading-tight tracking-tight">{num(b.amount, b.amount < 10 ? 3 : 1)}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-5 text-[12px] text-dim">
        <span className="flex items-center gap-1.5" title="Transactions in the last 24h"><Activity size={14} className="text-ion" /><b className="tnum text-text">{wallet.txLast24h ?? "n/a"}</b> tx / 24h</span>
        <span className="flex items-center gap-1.5" title="Latest Sui checkpoint"><Layers size={14} className="text-ion" /><span className="mono tnum text-text">{wallet.checkpoint ? `#${num(wallet.checkpoint)}` : "n/a"}</span></span>
        <span className="flex items-center gap-1.5" title="Reference gas price"><Fuel size={14} className="text-ion" /><span className="mono tnum text-text">{wallet.gasPriceMist ?? "n/a"}</span> MIST</span>
      </div>
      <span className="sr-only">{status?.chain.honest}</span>
    </motion.div>
  );
}
