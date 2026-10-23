import type { Balance, ChainContext } from "../../shared/types";
import { DEMO_ADDRESS } from "../config";

export interface ChainClient {
  readonly source: ChainContext["source"];
  readonly endpoint: string;
  context(address: string): Promise<ChainContext>;
}

type Fetch = typeof fetch;

/** Minimal JSON-RPC client for Tatum's Sui gateway (https://sui-mainnet.gateway.tatum.io). */
export class TatumSui implements ChainClient {
  readonly source = "tatum-sui-rpc" as const;
  private decimalsCache = new Map<string, { symbol: string; decimals: number }>();
  private id = 0;

  constructor(readonly endpoint: string, private apiKey: string, private doFetch: Fetch = fetch) {}

  async rpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const res = await this.doFetch(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": this.apiKey },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`Tatum ${method} failed: HTTP ${res.status}`);
    const json = (await res.json()) as { result?: T; error?: { code: number; message: string } };
    if (json.error) throw new Error(`Tatum ${method} error ${json.error.code}: ${json.error.message}`);
    return json.result as T;
  }

  private async meta(coinType: string): Promise<{ symbol: string; decimals: number }> {
    if (coinType === "0x2::sui::SUI") return { symbol: "SUI", decimals: 9 };
    const hit = this.decimalsCache.get(coinType);
    if (hit) return hit;
    try {
      const m = await this.rpc<{ symbol: string; decimals: number } | null>("suix_getCoinMetadata", [coinType]);
      const v = { symbol: m?.symbol ?? coinType.split("::").pop() ?? "?", decimals: m?.decimals ?? 9 };
      this.decimalsCache.set(coinType, v);
      return v;
    } catch {
      return { symbol: coinType.split("::").pop() ?? "?", decimals: 9 };
    }
  }

  async context(address: string): Promise<ChainContext> {
    const [checkpoint, all, gas, txs] = await Promise.all([
      this.rpc<string>("sui_getLatestCheckpointSequenceNumber"),
      this.rpc<{ coinType: string; totalBalance: string }[]>("suix_getAllBalances", [address]),
      this.rpc<string>("suix_getReferenceGasPrice"),
      this.rpc<{ data: { timestampMs?: string }[] }>("suix_queryTransactionBlocks", [
        { filter: { FromAddress: address }, options: {} }, null, 50, true,
      ]).catch(() => null),
    ]);

    const balances: Balance[] = [];
    for (const b of all.slice(0, 8)) {
      const m = await this.meta(b.coinType);
      balances.push({ symbol: m.symbol, coinType: b.coinType, decimals: m.decimals, amount: Number(b.totalBalance) / 10 ** m.decimals });
    }
    balances.sort((a, b) => (a.symbol === "SUI" ? -1 : b.symbol === "SUI" ? 1 : b.amount - a.amount));

    let txLast24h: number | null = null;
    if (txs) {
      const cutoff = Date.now() - 24 * 3600_000;
      const stamped = txs.data.filter((t) => t.timestampMs);
      txLast24h = stamped.length ? stamped.filter((t) => Number(t.timestampMs) >= cutoff).length : null;
    }

    return {
      source: this.source,
      address,
      checkpoint: Number(checkpoint),
      balances,
      txLast24h,
      gasPriceMist: Number(gas),
      fetchedAt: new Date().toISOString(),
    };
  }
}

/** Demo mode: a fixed wallet so the app runs without a Tatum key. Clearly labelled "fixture". */
export class FixtureChain implements ChainClient {
  readonly source = "fixture" as const;
  readonly endpoint = "local fixture (no network)";
  private started = Date.now();

  async context(address = DEMO_ADDRESS): Promise<ChainContext> {
    return {
      source: this.source,
      address,
      checkpoint: 301_482_000 + Math.floor((Date.now() - this.started) / 250),
      balances: [
        { symbol: "SUI", coinType: "0x2::sui::SUI", decimals: 9, amount: 4820.5 },
        { symbol: "USDC", coinType: "fixture::usdc::USDC", decimals: 6, amount: 1260 },
        { symbol: "WAL", coinType: "fixture::wal::WAL", decimals: 9, amount: 940 },
      ],
      txLast24h: 3,
      gasPriceMist: 750,
      fetchedAt: new Date().toISOString(),
    };
  }
}
