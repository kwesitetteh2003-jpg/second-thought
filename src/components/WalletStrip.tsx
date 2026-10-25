import { motion } from "framer-motion";
import { useApp } from "../lib/store";
import { num, short } from "../lib/ui";

/** The wallet as a ledger line: balances first, chain facts in small mono after. */
export function WalletStrip() {
  const { wallet, status } = useApp();
  if (!wallet) return <div className="h-[84px] animate-pulse border-y border-line" />;
  const live = wallet.source === "tatum-sui-rpc";
  const facts: [string, string][] = [
    ["tx / 24h", wallet.txLast24h != null ? String(wallet.txLast24h) : "n/a"],
    ["checkpoint", wallet.checkpoint ? `#${num(wallet.checkpoint)}` : "n/a"],
    ["gas", wallet.gasPriceMist != null ? `${wallet.gasPriceMist} MIST` : "n/a"],
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-y-4 border-y border-line py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-x-10">
      <div>
        <div className="eyebrow">Wallet · {live ? "live via Tatum" : "demo fixture"}</div>
        <div className="mono mt-1.5 text-[12.5px] text-dim">{short(wallet.address)}</div>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        {wallet.balances.map((b) => (
          <div key={b.symbol} className="flex items-baseline gap-2">
            <span className="serif tnum text-[30px] leading-none">{num(b.amount, b.amount < 10 ? 3 : 1)}</span>
            <span className="text-[12px] font-semibold tracking-wide text-faint">{b.symbol}</span>
          </div>
        ))}
      </div>
      <dl className="mono flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-faint">
        {facts.map(([k, v]) => (
          <div key={k} className="flex gap-1.5"><dt>{k}</dt><dd className="tnum text-dim">{v}</dd></div>
        ))}
      </dl>
      <span className="sr-only">{status?.chain.honest}</span>
    </motion.div>
  );
}
