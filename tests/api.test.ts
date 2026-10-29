import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp, seedDemo } from "../server/app";
import { createDemoJournal } from "../server/memory/journal";
import { FixtureChain } from "../server/chain/tatum";
import { ConfigError, readConfig } from "../server/config";

let server: Server, base: string;
const post = (p: string, body: unknown) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  const cfg = readConfig({ SECOND_THOUGHT_MODE: "demo" } as any);
  const journal = createDemoJournal("test");
  await seedDemo(journal);
  server = createApp({ cfg, journal, chain: new FixtureChain() }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

const panic = { action: "sell", asset: "SUI", pct: 40, trigger: "dip", mood: "fearful", hour: 2 };

describe("config", () => {
  it("defaults to demo and needs no keys", () => {
    expect(readConfig({} as any).mode).toBe("demo");
  });
  it("live mode refuses to start without keys", () => {
    expect(() => readConfig({ SECOND_THOUGHT_MODE: "live" } as any)).toThrow(ConfigError);
    expect(() => readConfig({ SECOND_THOUGHT_MODE: "live", MEMWAL_KEY: "a", MEMWAL_ACCOUNT_ID: "b", TATUM_API_KEY: "c", WATCH_ADDRESS: "0x1" } as any)).not.toThrow();
  });
});

describe("API (demo mode)", () => {
  it("status labels demo mode honestly and never claims mainnet", async () => {
    const s = await (await fetch(base + "/api/status")).json();
    expect(s.mode).toBe("demo");
    expect(s.memory.onMainnet).toBe(false);
    expect(s.chain.onMainnet).toBe(false);
    expect(s.memory.honest).toMatch(/DEMO/);
    expect(s.memory.count).toBeGreaterThanOrEqual(10);
  });

  it("rejects bad input", async () => {
    expect((await post("/api/preflight", { ...panic, pct: 500 })).status).toBe(400);
    expect((await post("/api/preflight", { ...panic, mood: "zen" })).status).toBe(400);
  });

  it("preflight returns a STOP with cited memories and a recall trace", async () => {
    const r = await (await post("/api/preflight", panic)).json();
    expect(r.decision.verdict.level).toBe("stop");
    expect(r.decision.verdict.reasons[0].memoryIds.length).toBeGreaterThan(0);
    expect(r.recall.hits.length).toBeGreaterThan(0);
    expect(r.context.source).toBe("fixture");
  });

  it("full loop: choose, log outcome, memory grows, a lesson is written", async () => {
    const before = (await (await fetch(base + "/api/memories")).json()).counts.total;
    const r = await (await post("/api/preflight", { ...panic, pct: 44, hour: 3 })).json();
    const id = r.decision.id;
    expect((await post(`/api/decisions/${id}/outcome`, { pnl: -10 })).status).toBe(400); // must choose first
    expect((await post(`/api/decisions/${id}/choice`, { acted: true })).status).toBe(200);
    const out = await (await post(`/api/decisions/${id}/outcome`, { pnl: -10 })).json();
    expect(out.written.record.overrode).toBe(true);
    expect(out.written.record.warned).toBe("stop");
    expect(out.after.risk).toBeGreaterThanOrEqual(out.before.risk);
    const after = (await (await fetch(base + "/api/memories")).json()).counts.total;
    expect(after).toBeGreaterThan(before);
    expect((await post(`/api/decisions/${id}/outcome`, { pnl: -10 })).status).toBe(409); // once only
  });

  it("replay shows the verdict changing as memory grows", async () => {
    const r = await (await post("/api/replay", panic)).json();
    expect(r.points[0].level).toBe("go");
    expect(r.points.at(-1).level).toBe("stop");
  });

  it("demo reset can empty the journal", async () => {
    await post("/api/demo/reset", { to: "empty" });
    expect((await (await fetch(base + "/api/memories")).json()).counts.total).toBe(0);
    const r = await (await post("/api/preflight", panic)).json();
    expect(r.decision.verdict.level).toBe("go");
    await post("/api/demo/reset", { to: "seed" });
  });
});

describe("public write guard", () => {
  it("without the owner key, an outcome is a preview and nothing is stored; with it, the memory is written", async () => {
    const cfg = readConfig({ SECOND_THOUGHT_MODE: "demo", OWNER_WRITE_KEY: "letmein" } as any);
    const journal = createDemoJournal("guard");
    await seedDemo(journal);
    const srv = createApp({ cfg, journal, chain: new FixtureChain() }).listen(0, "127.0.0.1");
    await new Promise((r) => srv.once("listening", r));
    const b = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
    const p = (path: string, body: unknown, h: Record<string, string> = {}) =>
      fetch(b + path, { method: "POST", headers: { "content-type": "application/json", ...h }, body: JSON.stringify(body) });
    try {
      expect((await (await fetch(b + "/api/status")).json()).writes).toBe("owner");
      const count = async () => (await (await fetch(b + "/api/memories")).json()).counts.total;
      const start = await count();

      const r1 = await (await p("/api/preflight", panic)).json();
      await p(`/api/decisions/${r1.decision.id}/choice`, { acted: true });
      const o1 = await (await p(`/api/decisions/${r1.decision.id}/outcome`, { pnl: -9 }, { "x-owner-key": "wrong" })).json();
      expect(o1.persisted).toBe(false);
      expect(o1.written.blobId).toMatch(/^preview-/);
      expect(o1.after.risk).toBeGreaterThanOrEqual(o1.before.risk);
      expect(await count()).toBe(start);

      const r2 = await (await p("/api/preflight", panic)).json();
      await p(`/api/decisions/${r2.decision.id}/choice`, { acted: true });
      const o2 = await (await p(`/api/decisions/${r2.decision.id}/outcome`, { pnl: -9 }, { "x-owner-key": "letmein" })).json();
      expect(o2.persisted).toBe(true);
      expect(await count()).toBeGreaterThan(start);
    } finally { srv.close(); }
  });
});
