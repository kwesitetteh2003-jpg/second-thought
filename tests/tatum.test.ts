import { describe, expect, it } from "vitest";
import { TatumSui } from "../server/chain/tatum";

function fakeFetch(handlers: Record<string, unknown>, seen: { headers?: Record<string, string>; url?: string }[] = []) {
  return (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    seen.push({ headers: init.headers as Record<string, string>, url });
    const result = handlers[body.method];
    if (result === undefined) return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "nope" } }));
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }));
  }) as unknown as typeof fetch;
}

describe("TatumSui", () => {
  it("sends the x-api-key header to the configured Sui gateway", async () => {
    const seen: any[] = [];
    const c = new TatumSui("https://sui-mainnet.gateway.tatum.io", "KEY123", fakeFetch({ sui_getLatestCheckpointSequenceNumber: "42" }, seen));
    expect(await c.rpc("sui_getLatestCheckpointSequenceNumber")).toBe("42");
    expect(seen[0].url).toBe("https://sui-mainnet.gateway.tatum.io");
    expect(seen[0].headers["x-api-key"]).toBe("KEY123");
  });

  it("builds wallet context from balances, gas and recent activity", async () => {
    const now = Date.now();
    const c = new TatumSui("https://x", "k", fakeFetch({
      sui_getLatestCheckpointSequenceNumber: "301000000",
      suix_getReferenceGasPrice: "750",
      suix_getAllBalances: [
        { coinType: "0x2::sui::SUI", totalBalance: "2500000000000" },
        { coinType: "0xabc::usdc::USDC", totalBalance: "1500000" },
      ],
      suix_getCoinMetadata: { symbol: "USDC", decimals: 6 },
      suix_queryTransactionBlocks: { data: [{ timestampMs: String(now - 3600_000) }, { timestampMs: String(now - 2 * 3600_000) }, { timestampMs: String(now - 3 * 86400_000) }] },
    }));
    const ctx = await c.context("0xabc");
    expect(ctx.source).toBe("tatum-sui-rpc");
    expect(ctx.checkpoint).toBe(301000000);
    expect(ctx.balances[0]).toMatchObject({ symbol: "SUI", amount: 2500 });
    expect(ctx.balances[1]).toMatchObject({ symbol: "USDC", amount: 1.5 });
    expect(ctx.txLast24h).toBe(2);
    expect(ctx.gasPriceMist).toBe(750);
  });

  it("surfaces RPC errors instead of hiding them", async () => {
    const c = new TatumSui("https://x", "k", fakeFetch({}));
    await expect(c.rpc("sui_getChainIdentifier")).rejects.toThrow(/-32601/);
  });
});
