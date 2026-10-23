import { MemWal, MemWalMock } from "@mysten-incubation/memwal";
import type { MemoryRecord, StoredMemory } from "../../shared/types";
import { decode, encode } from "../../shared/codec";
import type { Config } from "../config";

/** The slice of the MemWal API we use. Both `MemWal` (real) and `MemWalMock` (SDK's offline mock) satisfy it. */
export interface MemClient {
  health(): Promise<unknown>;
  rememberAndWait(text: string, namespace?: string, opts?: { timeoutMs?: number }): Promise<{ blob_id: string }>;
  rememberBulkAndWait(items: { text: string; namespace?: string }[], opts?: { timeoutMs?: number }): Promise<{ results: { blob_id: string; status: string }[]; succeeded: number; failed: number }>;
  recall(p: { query: string; limit?: number; namespace?: string }): Promise<{ results: { blob_id: string; text: string; distance: number; created_at?: string }[] }>;
}

export interface JournalInfo { backend: string; honest: string; network: string; onMainnet: boolean }

const RECALL_QUERIES = [
  "[2nd] trade decision result pnl",
  "[2nd] lesson pattern flag",
  "[2nd] pref preference",
];

/** The journal: every memory the app writes or reads goes through here. */
export class Journal {
  private cache: { at: number; mems: StoredMemory[] } | null = null;
  private pendingWrites: StoredMemory[] = [];

  constructor(readonly client: MemClient, readonly namespace: string, readonly info: JournalInfo) {}

  invalidate() { this.cache = null; }

  async loadAll(force = false): Promise<StoredMemory[]> {
    if (!force && this.cache && Date.now() - this.cache.at < 15_000) return this.cache.mems;
    const byId = new Map<string, StoredMemory>();
    for (const q of RECALL_QUERIES) {
      const res = await this.client.recall({ query: q, limit: 100, namespace: this.namespace });
      for (const r of res.results) {
        const record = decode(r.text);
        if (record) byId.set(r.blob_id, { blobId: r.blob_id, createdAt: r.created_at, text: r.text, record });
      }
    }
    // Writes the relayer has accepted but not yet indexed are still ours.
    for (const w of this.pendingWrites) if (!byId.has(w.blobId)) byId.set(w.blobId, w);
    const mems = [...byId.values()].sort((a, b) => a.record.date.localeCompare(b.record.date));
    this.cache = { at: Date.now(), mems };
    return mems;
  }

  async write(record: MemoryRecord): Promise<StoredMemory> {
    const text = encode(record);
    const res = await this.client.rememberAndWait(text, this.namespace, { timeoutMs: 90_000 });
    const mem: StoredMemory = { blobId: res.blob_id, createdAt: new Date().toISOString(), text, record };
    this.pendingWrites.push(mem);
    this.invalidate();
    return mem;
  }

  /** Bulk write (max 20 per request, per the SDK docs). Returns blob ids in input order. */
  async writeMany(records: MemoryRecord[]): Promise<{ stored: StoredMemory[]; failed: number }> {
    const stored: StoredMemory[] = [];
    let failed = 0;
    for (let i = 0; i < records.length; i += 20) {
      const chunk = records.slice(i, i + 20);
      const texts = chunk.map(encode);
      const res = await this.client.rememberBulkAndWait(texts.map((text) => ({ text, namespace: this.namespace })), { timeoutMs: 180_000 });
      res.results.forEach((r, j) => {
        if (r.status === "done" && r.blob_id) {
          const mem = { blobId: r.blob_id, createdAt: new Date().toISOString(), text: texts[j], record: chunk[j] };
          stored.push(mem);
          this.pendingWrites.push(mem);
        } else failed++;
      });
    }
    this.invalidate();
    return { stored, failed };
  }

  async semanticRecall(query: string, limit = 5) {
    const res = await this.client.recall({ query, limit, namespace: this.namespace });
    return res.results
      .filter((r) => decode(r.text))
      .map((r) => ({ blobId: r.blob_id, distance: Math.round(r.distance * 1000) / 1000, text: r.text.replace(/^\s*\[2nd\]\s*/, "").replace(/\s*#[a-z]+=\S+/g, "") }));
  }

  async reset() {
    if (this.client instanceof MemWalMock) (this.client as MemWalMock).clear(this.namespace);
    this.pendingWrites = [];
    this.invalidate();
  }
}

/** Demo mode: the SDK's own in-memory mock. Nothing touches Walrus or Sui. */
export function createDemoJournal(namespace: string): Journal {
  const client = MemWalMock.create({ namespace, owner: "demo-owner" }) as unknown as MemClient;
  return new Journal(client, namespace, {
    backend: "MemWalMock (SDK in-memory mock)",
    honest: "DEMO: memories live in RAM through the SDK's offline mock. Nothing is stored on Walrus or Sui.",
    network: "none",
    onMainnet: false,
  });
}

/** Live mode: the real Walrus Memory SDK against the hosted mainnet relayer (or your own). */
export function createLiveJournal(cfg: Config): Journal {
  const client = MemWal.create({
    key: cfg.memwal.key,
    accountId: cfg.memwal.accountId,
    serverUrl: cfg.memwal.serverUrl,
    namespace: cfg.namespace,
  }) as unknown as MemClient;
  const mainnet = /relayer\.memory\.walrus\.xyz/.test(cfg.memwal.serverUrl) && !/staging/.test(cfg.memwal.serverUrl);
  return new Journal(client, cfg.namespace, {
    backend: `Walrus Memory relayer (${cfg.memwal.serverUrl})`,
    honest: mainnet
      ? "LIVE: memories are encrypted with Seal and stored on Walrus through the hosted mainnet relayer."
      : "LIVE, but the relayer URL is not the hosted mainnet one. Do not claim mainnet unless it is.",
    network: mainnet ? "mainnet" : "custom relayer",
    onMainnet: mainnet,
  });
}
