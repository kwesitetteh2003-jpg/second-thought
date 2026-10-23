/**
 * Stores the sample journal (seed/journal.ts) in YOUR Walrus Memory account.
 *
 *   npm run memories:preview    → prints what would be stored. Writes nothing.
 *   npm run memories:store      → writes to Walrus Memory. Needs SECOND_THOUGHT_MODE=live keys in .env.
 *
 * Writing is irreversible-ish (data is stored on Walrus for its paid epochs), so it only
 * happens with --confirm, and only after printing exactly what will be sent.
 */
import fs from "node:fs";
import path from "node:path";
import { ConfigError, loadDotEnv, readConfig, MIN_MEMORIES } from "../server/config";
import { createLiveJournal } from "../server/memory/journal";
import { buildSeed } from "../seed/journal";
import { encode } from "../shared/codec";

loadDotEnv();
const confirm = process.argv.includes("--confirm");
const seed = buildSeed();

console.log(`\nSample journal: ${seed.length} memories (${seed.filter((s) => s.kind === "trade").length} trades, ${seed.filter((s) => s.kind === "lesson").length} lessons, ${seed.filter((s) => s.kind === "pref").length} preferences).`);
console.log(`Hackathon minimum on mainnet: ${MIN_MEMORIES}.\n`);

if (!confirm) {
  seed.forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${encode(r).slice(0, 150)}…`));
  console.log("\nDRY RUN. Nothing was written. Re-run with `npm run memories:store` to write these to Walrus Memory.\n");
  process.exit(0);
}

let cfg;
try {
  process.env.SECOND_THOUGHT_MODE = "live";
  cfg = readConfig(process.env, { memwal: true, tatum: false });
} catch (e) {
  if (e instanceof ConfigError) { console.error("✖ " + e.message); process.exit(1); }
  throw e;
}

const journal = createLiveJournal(cfg);
console.log(`Relayer   ${cfg.memwal.serverUrl}`);
console.log(`Namespace ${cfg.namespace}`);
console.log(`Network   ${journal.info.network}${journal.info.onMainnet ? "" : "  ← NOT the hosted mainnet relayer"}\n`);

await journal.client.health();
console.log("Relayer health OK.");

const existing = new Set((await journal.loadAll(true)).map((m) => m.text));
const todo = seed.filter((r) => !existing.has(encode(r)));
console.log(`${existing.size} memories already in this namespace; storing ${todo.length} new.\n`);

if (todo.length) {
  const { stored, failed } = await journal.writeMany(todo);
  console.log(`Stored ${stored.length}, failed ${failed}.`);
  const receipt = {
    storedAt: new Date().toISOString(),
    relayer: cfg.memwal.serverUrl,
    namespace: cfg.namespace,
    network: journal.info.network,
    blobs: stored.map((m) => ({ blobId: m.blobId, kind: m.record.kind, date: m.record.date })),
  };
  fs.mkdirSync("proof", { recursive: true });
  const out = path.resolve("proof", "memories-receipt.local.json");
  fs.writeFileSync(out, JSON.stringify(receipt, null, 2));
  console.log(`Receipt (blob ids) → ${out}`);
  if (failed) process.exitCode = 1;
}
console.log("\nNext: npm run memories:verify\n");
