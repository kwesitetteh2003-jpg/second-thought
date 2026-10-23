import fs from "node:fs";
import path from "node:path";

// Tiny .env loader (no dependency). Real environment variables win.
export function loadDotEnv(file = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const v = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

export interface Config {
  mode: "demo" | "live";
  port: number;
  namespace: string;
  memwal: { key: string; accountId: string; serverUrl: string };
  tatum: { apiKey: string; url: string };
  watchAddress: string;
}

export const DEMO_ADDRESS = "0x" + "d3a0".repeat(16); // obviously fictional fixture address
export const MIN_MEMORIES = 10;

export class ConfigError extends Error {}

export function readConfig(env: NodeJS.ProcessEnv = process.env, needs = { memwal: true, tatum: true }): Config {
  const mode = (env.SECOND_THOUGHT_MODE ?? "demo").toLowerCase();
  if (mode !== "demo" && mode !== "live") throw new ConfigError(`SECOND_THOUGHT_MODE must be "demo" or "live", got "${mode}"`);
  const cfg: Config = {
    mode,
    port: Number(env.PORT ?? 9010),
    namespace: env.MEMWAL_NAMESPACE ?? "second-thought",
    memwal: {
      key: env.MEMWAL_KEY ?? "",
      accountId: env.MEMWAL_ACCOUNT_ID ?? "",
      serverUrl: env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
    },
    tatum: { apiKey: env.TATUM_API_KEY ?? "", url: env.TATUM_SUI_RPC_URL ?? "https://sui-mainnet.gateway.tatum.io" },
    watchAddress: env.WATCH_ADDRESS ?? "",
  };
  if (mode === "live") {
    const missing = [
      needs.memwal && !cfg.memwal.key && "MEMWAL_KEY",
      needs.memwal && !cfg.memwal.accountId && "MEMWAL_ACCOUNT_ID",
      needs.tatum && !cfg.tatum.apiKey && "TATUM_API_KEY",
      needs.tatum && !cfg.watchAddress && "WATCH_ADDRESS",
    ].filter(Boolean);
    if (missing.length) throw new ConfigError(`SECOND_THOUGHT_MODE=live needs: ${missing.join(", ")}. See .env.example.`);
  }
  if (mode === "demo" && !cfg.watchAddress) cfg.watchAddress = DEMO_ADDRESS;
  return cfg;
}
