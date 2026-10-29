import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import type { Decision, Intent, StatusInfo, StoredMemory, TradeRecord, Verdict } from "../shared/types";
import { ACTIONS, MOODS, TRIGGERS } from "../shared/types";
import { deriveLessons, evaluate, replay, strictnessFrom, toJournal } from "../shared/engine";
import { buildSeed } from "../seed/journal";
import { encode } from "../shared/codec";
import type { Journal } from "./memory/journal";
import type { ChainClient } from "./chain/tatum";
import { MIN_MEMORIES, type Config } from "./config";

export interface Deps { cfg: Config; journal: Journal; chain: ChainClient }

export function parseIntent(body: unknown): Intent | string {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!ACTIONS.includes(b.action as never)) return "action must be one of " + ACTIONS.join(", ");
  if (!TRIGGERS.includes(b.trigger as never)) return "trigger must be one of " + TRIGGERS.join(", ");
  if (!MOODS.includes(b.mood as never)) return "mood must be one of " + MOODS.join(", ");
  const pct = Number(b.pct), hour = Number(b.hour);
  if (!(pct >= 1 && pct <= 100)) return "pct must be between 1 and 100";
  if (!(Number.isInteger(hour) && hour >= 0 && hour <= 23)) return "hour must be an integer 0-23";
  const asset = String(b.asset ?? "SUI").slice(0, 12).replace(/[^A-Za-z0-9_.-]/g, "") || "SUI";
  return { action: b.action as Intent["action"], asset, pct: Math.round(pct), trigger: b.trigger as Intent["trigger"], mood: b.mood as Intent["mood"], hour, note: typeof b.note === "string" ? b.note.slice(0, 200) : undefined };
}

export async function seedDemo(journal: Journal) {
  await journal.reset();
  const seed = buildSeed();
  const { failed } = await journal.writeMany(seed);
  if (failed) throw new Error(`demo seed: ${failed} writes failed`);
}

export function createApp({ cfg, journal, chain }: Deps) {
  const app = express();
  app.use(cors({ origin: [/^http:\/\/(localhost|127\.0\.0\.1):\d+$/] }));
  app.use(express.json({ limit: "32kb" }));

  const decisions = new Map<string, Decision>();
  const today = () => new Date().toISOString().slice(0, 10);
  // Public visitors must not write to the owner's Walrus Memory account. When a write key is set,
  // only requests carrying it are stored; everyone else gets the same result as a dry run.
  const canWrite = !!cfg.writeKey;
  const isOwner = (req: express.Request) => {
    if (!cfg.writeKey) return true;
    const given = Buffer.from(String(req.get("x-owner-key") ?? ""));
    const want = Buffer.from(cfg.writeKey);
    return given.length === want.length && crypto.timingSafeEqual(given, want);
  };
  const wrap = (fn: express.RequestHandler): express.RequestHandler => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((e: Error) => {
      console.error(e);
      res.status(502).json({ error: e.message });
    });
  };

  app.get("/api/status", wrap(async (_req, res) => {
    const mems = await journal.loadAll();
    const info: StatusInfo = {
      mode: cfg.mode,
      memory: { backend: journal.info.backend, honest: journal.info.honest, network: journal.info.network, namespace: journal.namespace, count: mems.length, onMainnet: journal.info.onMainnet },
      chain: {
        backend: chain.source === "tatum-sui-rpc" ? "Tatum Sui RPC gateway" : "Fixture wallet",
        honest: chain.source === "tatum-sui-rpc" ? "LIVE: balances, gas and activity are read from Sui mainnet through Tatum." : "DEMO: a fixed fictional wallet. No network calls are made.",
        endpoint: chain.endpoint,
        onMainnet: chain.source === "tatum-sui-rpc",
      },
      canReset: cfg.mode === "demo",
      writes: canWrite ? "owner" : "open",
      minMemoriesRequired: MIN_MEMORIES,
    };
    res.json(info);
  }));

  app.get("/api/wallet", wrap(async (_req, res) => res.json(await chain.context(cfg.watchAddress))));

  app.get("/api/memories", wrap(async (_req, res) => {
    const mems = await journal.loadAll(true);
    const j = toJournal(mems);
    const st = strictnessFrom(j.trades);
    const acted = j.trades.filter((t) => t.rec.acted);
    const protectedPct = j.trades.filter((t) => !t.rec.acted && t.rec.pnl > 0).reduce((s, t) => s + t.rec.pnl, 0);
    res.json({
      memories: mems,
      counts: { total: mems.length, trades: j.trades.length, lessons: j.lessons.length, prefs: mems.length - j.trades.length - j.lessons.length },
      stats: {
        strictness: st.value, heeded: st.heeded, overrodeLost: st.overrodeLost, overrodeFine: st.overrodeFine,
        avgResult: acted.length ? Math.round((acted.reduce((s, t) => s + t.rec.pnl, 0) / acted.length) * 10) / 10 : 0,
        protectedPct: Math.round(protectedPct * 10) / 10,
      },
    });
  }));

  app.post("/api/preflight", wrap(async (req, res) => {
    const intent = parseIntent(req.body);
    if (typeof intent === "string") return void res.status(400).json({ error: intent });
    const [mems, ctx] = await Promise.all([journal.loadAll(), chain.context(cfg.watchAddress)]);
    const j = toJournal(mems);
    const verdict: Verdict = evaluate(intent, j, ctx);
    const query = `${intent.action} ${intent.pct}% of ${intent.asset} ${intent.trigger} feeling ${intent.mood} around ${intent.hour}:00`;
    const hits = await journal.semanticRecall(query, 5).catch(() => []);
    const decision: Decision = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), intent, verdict, acted: null, overrode: null, outcomeLogged: false };
    decisions.set(decision.id, decision);
    res.json({ decision, context: ctx, recall: { query, backend: journal.info.backend, hits } });
  }));

  app.get("/api/decisions", (_req, res) => res.json({ decisions: [...decisions.values()].filter((d) => !d.outcomeLogged).reverse() }));

  app.post("/api/decisions/:id/choice", (req, res) => {
    const d = decisions.get(String(req.params.id));
    if (!d) return void res.status(404).json({ error: "unknown decision" });
    if (typeof req.body?.acted !== "boolean") return void res.status(400).json({ error: "acted must be boolean" });
    d.acted = req.body.acted;
    d.overrode = d.acted && d.verdict.level !== "go";
    res.json({ decision: d });
  });

  app.post("/api/decisions/:id/outcome", wrap(async (req, res) => {
    const d = decisions.get(String(req.params.id));
    if (!d) return void res.status(404).json({ error: "unknown decision" });
    if (d.acted === null) return void res.status(400).json({ error: "record whether you acted first" });
    if (d.outcomeLogged) return void res.status(409).json({ error: "outcome already logged" });
    const pnl = Number(req.body?.pnl);
    if (!Number.isFinite(pnl) || Math.abs(pnl) > 1000) return void res.status(400).json({ error: "pnl must be a number in percent" });

    const rec: TradeRecord = {
      kind: "trade", date: today(), action: d.intent.action, asset: d.intent.asset, pct: d.intent.pct, trigger: d.intent.trigger,
      mood: d.intent.mood, hour: d.intent.hour, pnl: Math.round(pnl * 10) / 10, acted: d.acted, warned: d.verdict.level, overrode: !!d.overrode,
    };
    const existing = await journal.loadAll(true);
    const before = toJournal(existing);
    const persist = isOwner(req);
    const preview = (rec: StoredMemory["record"], i: number): StoredMemory =>
      ({ blobId: `preview-${d.id.slice(0, 8)}-${i}`, createdAt: new Date().toISOString(), text: encode(rec), record: rec });
    const written = persist ? await journal.write(rec) : preview(rec, 0);
    const after = toJournal(persist ? [...(await journal.loadAll(true)), written] : [...existing, written]);
    const newLessons = deriveLessons(after.trades, after.lessons.map((l) => l.rec), today());
    const lessonMems: StoredMemory[] = [];
    for (const [i, l] of newLessons.entries()) lessonMems.push(persist ? await journal.write(l) : preview(l, i + 1));
    d.outcomeLogged = true;

    const ctx = await chain.context(cfg.watchAddress).catch(() => undefined);
    const nextVerdict = evaluate(d.intent, toJournal(persist ? await journal.loadAll(true) : [...existing, written, ...lessonMems]), ctx);
    res.json({ written, lessons: lessonMems, before: d.verdict, after: nextVerdict, memoriesBefore: before.trades.length + before.lessons.length, persisted: persist });
  }));

  app.post("/api/replay", wrap(async (req, res) => {
    const intent = parseIntent(req.body);
    if (typeof intent === "string") return void res.status(400).json({ error: intent });
    const j = toJournal(await journal.loadAll());
    res.json({ points: replay(intent, j), trades: j.trades.map((t) => ({ id: t.id, date: t.rec.date, pnl: t.rec.pnl })) });
  }));

  app.post("/api/demo/reset", wrap(async (req, res) => {
    if (cfg.mode !== "demo") return void res.status(403).json({ error: "reset is only available in demo mode" });
    const to = req.body?.to === "empty" ? "empty" : "seed";
    if (to === "empty") await journal.reset();
    else await seedDemo(journal);
    decisions.clear();
    res.json({ ok: true, to });
  }));

  return app;
}
