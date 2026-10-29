import { describe, expect, it } from "vitest";
import { TatumSui } from "../server/chain/tatum";

type Seen = { headers?: Record<string, string>; url?: string; body?: any };
function fakeFetch(respond: (body: any) => unknown, seen: Seen[] = []) {
  return (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    seen.push({ headers: init.headers as Record<string, string>, url, body });
    return new Response(JSON.stringify(respond(body)));
  }) as unknown as typeof fetch;
}

describe("TatumSui", () => {
  it("sends the x-api-key header to the gateway's GraphQL endpoint", async () => {
    const seen: Seen[] = [];
    const c = new TatumSui("https://sui-mainnet.gateway.tatum.io", "KEY123", fakeFetch(() => ({ data: { checkpoint: { sequenceNumber: 42 } } }), seen));
    expect(await c.latestCheckpoint()).toBe(42);
    expect(seen[0].url).toBe("https://sui-mainnet.gateway.tatum.io/graphql");
    expect(seen[0].headers!["x-api-key"]).toBe("KEY123");
  });

  it("builds wallet context from balances, gas and recent activity", async () => {
    const now = Date.now();
    const iso = (ms: number) => new Date(ms).toISOString();
    const c = new TatumSui("https://x", "k", fakeFetch((body) => {
      if (String(body.query).includes("coinMetadata")) return { data: { coinMetadata: { symbol: "USDC", decimals: 6 } } };
      return {
        data: {
          checkpoint: { sequenceNumber: 301000000 },
          epoch: { referenceGasPrice: "750" },
          address: { balances: { nodes: [
            { coinType: { repr: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI" }, totalBalance: "2500000000000" },
            { coinType: { repr: "0xabc::usdc::USDC" }, totalBalance: "1500000" },
          ] } },
          transactions: { nodes: [
            { effects: { timestamp: iso(now - 3600_000) } },
            { effects: { timestamp: iso(now - 2 * 3600_000) } },
            { effects: { timestamp: iso(now - 3 * 86400_000) } },
          ] },
        },
      };
    }));
    const ctx = await c.context("0xabc");
    expect(ctx.source).toBe("tatum-sui-rpc");
    expect(ctx.checkpoint).toBe(301000000);
    expect(ctx.balances[0]).toMatchObject({ symbol: "SUI", amount: 2500 });
    expect(ctx.balances[1]).toMatchObject({ symbol: "USDC", amount: 1.5 });
    expect(ctx.txLast24h).toBe(2);
    expect(ctx.gasPriceMist).toBe(750);
  });

  it("surfaces GraphQL errors instead of hiding them", async () => {
    const c = new TatumSui("https://x", "k", fakeFetch(() => ({ errors: [{ message: "bad field" }] })));
    await expect(c.latestCheckpoint()).rejects.toThrow(/bad field/);
  });
});
