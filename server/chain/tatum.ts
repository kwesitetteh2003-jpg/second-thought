import type { Balance, ChainContext } from "../../shared/types";
import { DEMO_ADDRESS } from "../config";

export interface ChainClient {
  readonly source: ChainContext["source"];
  readonly endpoint: string;
  context(address: string): Promise<ChainContext>;
}

type Fetch = typeof fetch;

/**
 * Client for Tatum's Sui mainnet gateway. Sui has retired full-node JSON-RPC, so this uses the
 * gateway's GraphQL interface (https://sui-mainnet.gateway.tatum.io/graphql) with the x-api-key header.
 * Read-only: it never signs or sends transactions.
 */
export class TatumSui implements ChainClient {
  readonly source = "tatum-sui-rpc" as const;
  private decimalsCache = new Map<string, { symbol: string; decimals: number }>();

  constructor(readonly endpoint: string, private apiKey: string, private doFetch: Fetch = fetch) {}

  private get graphqlUrl() {
    const base = this.endpoint.replace(/\/+$/, "");
    return base.endsWith("/graphql") ? base : base + "/graphql";
  }

  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await this.doFetch(this.graphqlUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": this.apiKey },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`Tatum Sui GraphQL failed: HTTP ${res.status}`);
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(`Tatum Sui GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
    return json.data as T;
  }

  async latestCheckpoint(): Promise<number> {
    const d = await this.query<{ checkpoint: { sequenceNumber: number } }>("{ checkpoint { sequenceNumber } }");
    return Number(d.checkpoint.sequenceNumber);
  }

  private async meta(coinType: string): Promise<{ symbol: string; decimals: number }> {
    if (/^0x0*2::sui::SUI$/.test(coinType)) return { symbol: "SUI", decimals: 9 };
    const hit = this.decimalsCache.get(coinType);
    if (hit) return hit;
    try {
      const d = await this.query<{ coinMetadata: { symbol: string; decimals: number } | null }>(
        "query($t: String!) { coinMetadata(coinType: $t) { symbol decimals } }", { t: coinType });
      const m = d.coinMetadata;
      const v = { symbol: m?.symbol ?? coinType.split("::").pop() ?? "?", decimals: m?.decimals ?? 9 };
      this.decimalsCache.set(coinType, v);
      return v;
    } catch {
      return { symbol: coinType.split("::").pop() ?? "?", decimals: 9 };
    }
  }

  async context(address: string): Promise<ChainContext> {
    const d = await this.query<{
      checkpoint: { sequenceNumber: number } | null;
      epoch: { referenceGasPrice: string } | null;
      address: { balances: { nodes: { coinType: { repr: string }; totalBalance: string }[] } } | null;
      transactions: { nodes: { effects: { timestamp: string | null } | null }[] } | null;
    }>(
      `query($a: SuiAddress!) {
        checkpoint { sequenceNumber }
        epoch { referenceGasPrice }
        address(address: $a) { balances(first: 8) { nodes { coinType { repr } totalBalance } } }
        transactions(last: 50, filter: { sentAddress: $a }) { nodes { effects { timestamp } } }
      }`,
      { a: address },
    );

    const balances: Balance[] = [];
    for (const b of d.address?.balances.nodes ?? []) {
      const coinType = b.coinType.repr;
      const m = await this.meta(coinType);
      balances.push({ symbol: m.symbol, coinType, decimals: m.decimals, amount: Number(b.totalBalance) / 10 ** m.decimals });
    }
    balances.sort((a, b) => (a.symbol === "SUI" ? -1 : b.symbol === "SUI" ? 1 : b.amount - a.amount));

    let txLast24h: number | null = null;
    if (d.transactions) {
      const cutoff = Date.now() - 24 * 3600_000;
      txLast24h = d.transactions.nodes.filter((t) => t.effects?.timestamp && Date.parse(t.effects.timestamp) >= cutoff).length;
    }

    return {
      source: this.source,
      address,
      checkpoint: d.checkpoint ? Number(d.checkpoint.sequenceNumber) : null,
      balances,
      txLast24h,
      gasPriceMist: d.epoch ? Number(d.epoch.referenceGasPrice) : null,
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
