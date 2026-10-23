/** One quick call to Tatum's Sui gateway to prove your key works. Read-only. */
import { loadDotEnv, readConfig } from "../server/config";
import { TatumSui } from "../server/chain/tatum";

loadDotEnv();
const cfg = readConfig({ ...process.env, SECOND_THOUGHT_MODE: "demo" });
if (!cfg.tatum.apiKey) { console.error("✖ TATUM_API_KEY is empty. Get a free key at https://dashboard.tatum.io"); process.exit(1); }
const t = new TatumSui(cfg.tatum.url, cfg.tatum.apiKey);
const cp = await t.rpc<string>("sui_getLatestCheckpointSequenceNumber");
console.log(`✔ ${cfg.tatum.url}\n  latest checkpoint: ${cp}`);
if (cfg.watchAddress) {
  const ctx = await t.context(cfg.watchAddress);
  console.log(`  ${cfg.watchAddress}\n  balances: ${ctx.balances.map((b) => `${b.amount.toFixed(3)} ${b.symbol}`).join(", ") || "none"}\n  tx last 24h: ${ctx.txLast24h ?? "n/a"}   gas: ${ctx.gasPriceMist} MIST`);
}
