/** Counts the memories in your Walrus Memory namespace and recalls a few, to prove the 10+ requirement. */
import { loadDotEnv, readConfig } from "../server/config";
import { createLiveJournal } from "../server/memory/journal";
import { MIN_MEMORIES } from "../server/config";

loadDotEnv();
process.env.SECOND_THOUGHT_MODE = "live";
const cfg = readConfig(process.env, { memwal: true, tatum: false });
const journal = createLiveJournal(cfg);
await journal.client.health();
const mems = await journal.loadAll(true);
console.log(`\nRelayer: ${cfg.memwal.serverUrl}   namespace: ${cfg.namespace}   network: ${journal.info.network}`);
console.log(`Second Thought memories found: ${mems.length}  (minimum ${MIN_MEMORIES})`);
const kinds = mems.reduce<Record<string, number>>((a, m) => ((a[m.record.kind] = (a[m.record.kind] ?? 0) + 1), a), {});
console.log(kinds);
const hits = await journal.semanticRecall("selling in a panic at night after a dip", 3);
console.log("\nSemantic recall for 'selling in a panic at night after a dip':");
hits.forEach((h) => console.log(`  d=${h.distance}  ${h.blobId.slice(0, 14)}…  ${h.text.slice(0, 110)}`));
const anyClient = journal.client as unknown as { listMemories?: (o: object) => Promise<{ memories: unknown[] }> };
if (anyClient.listMemories) {
  const page = await anyClient.listMemories({ namespace: cfg.namespace, limit: 500 });
  console.log(`\nlistMemories (relayer index) in namespace: ${page.memories.length}`);
}
console.log(mems.length >= MIN_MEMORIES ? "\n✔ Requirement met (verify the blobs on Walruscan before you claim it).\n" : "\n✖ Fewer than the required minimum.\n");
process.exit(mems.length >= MIN_MEMORIES ? 0 : 1);
