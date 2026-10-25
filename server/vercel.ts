// Vercel serverless entry: the same API as server/index.ts, without app.listen().
// In demo mode the journal is in-memory per function instance (re-seeded on cold start).
import type { IncomingMessage, ServerResponse } from "node:http";
import { readConfig } from "./config";
import { createApp, seedDemo } from "./app";
import { createDemoJournal, createLiveJournal } from "./memory/journal";
import { FixtureChain, TatumSui } from "./chain/tatum";

let ready: Promise<(req: IncomingMessage, res: ServerResponse) => void> | undefined;
async function init() {
  const cfg = readConfig();
  const journal = cfg.mode === "live" ? createLiveJournal(cfg) : createDemoJournal(cfg.namespace);
  const chain = cfg.mode === "live" ? new TatumSui(cfg.tatum.url, cfg.tatum.apiKey) : new FixtureChain();
  if (cfg.mode === "demo") await seedDemo(journal);
  return createApp({ cfg, journal, chain }) as unknown as (req: IncomingMessage, res: ServerResponse) => void;
}
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await (ready ??= init());
  app(req, res);
}
