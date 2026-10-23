import path from "node:path";
import fs from "node:fs";
import express from "express";
import { ConfigError, loadDotEnv, readConfig } from "./config";
import { createApp, seedDemo } from "./app";
import { createDemoJournal, createLiveJournal } from "./memory/journal";
import { FixtureChain, TatumSui } from "./chain/tatum";

loadDotEnv();
let cfg;
try {
  cfg = readConfig();
} catch (e) {
  if (e instanceof ConfigError) { console.error("\n✖ " + e.message + "\n"); process.exit(1); }
  throw e;
}

const journal = cfg.mode === "live" ? createLiveJournal(cfg) : createDemoJournal(cfg.namespace);
const chain = cfg.mode === "live" ? new TatumSui(cfg.tatum.url, cfg.tatum.apiKey) : new FixtureChain();

if (cfg.mode === "demo") await seedDemo(journal);

const app = createApp({ cfg, journal, chain });

// Serve the built UI if present (npm run build && npm start).
const dist = path.resolve(process.cwd(), "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(cfg.port, "127.0.0.1", () => {
  console.log(`\n  Second Thought API  http://127.0.0.1:${cfg.port}`);
  console.log(`  mode    ${cfg.mode.toUpperCase()}`);
  console.log(`  memory  ${journal.info.backend}`);
  console.log(`  chain   ${chain.source} (${chain.endpoint})\n`);
});
