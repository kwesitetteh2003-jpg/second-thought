# Submission pack

Form: https://recall-tatum-walrus.vercel.app · **Deadline: Nov 10 2026, 17:00 Accra time (17:00 UTC)** · One submission per person. **Rufus submits this himself. Nothing has been submitted.**

## Pick
- **Track:** Consumer Finance Apps (select this on the form if there's a track field).
- **Also targets:** Best Walrus Memory special prize.
- **Not targeted:** Tatum AI Builder bonus (not built primarily with ai.tatum.io).

## Title
Second Thought: a wallet co-pilot that remembers what you regret

## One-liner
Before you move money, it recalls what happened last time you did the same thing, and tells you to GO, PAUSE or STOP.

## Short description (≈90 words, for the "Project description" field)
Second Thought is a pre-flight check for money moves. You say what you're about to do and why (sell 40% of SUI, after a dip, feeling fearful, at 2 AM). It reads your wallet through Tatum's Sui RPC, recalls similar moments from Walrus Memory, and returns GO / PAUSE / STOP with reasons that cite the exact memories behind them. You log the outcome, which is written back to Walrus Memory; it derives lessons, and gets stricter if you override warnings and lose. Memory is the only database, and visibly changes the verdict.

## Long description
**Problem.** People repeat the same costly money habits (panic sells, tip-driven buys, 2 AM trades) because the lesson from last time isn't there at decision time.
**Solution.** A co-pilot that turns your own history into a second opinion. It never signs or sends transactions.
**Walrus Memory.** One readable sentence + compact tags per memory (`trade`, `lesson`, `pref`) stored with `rememberAndWait`/`rememberBulkAndWait` and read with semantic `recall`. No other database: restart the server and everything is rebuilt from memory.
**Tatum.** The Sui gateway supplies balances, checkpoint, gas price and 24h activity (`suix_getAllBalances`, `sui_getLatestCheckpointSequenceNumber`, `suix_getReferenceGasPrice`, `suix_queryTransactionBlocks`) to size the move and flag busy days.
**How it learns.** Pattern statistics by trigger/mood/size/hour over *your actual* trades; auto-written lessons at n≥3; a strictness multiplier (0.7×–1.8×) that rises when you override a warning and lose. Verified in tests and visible in the UI: same move 2.32 → 3.48 after one overridden loss; Learning tab replays GO → PAUSE → STOP.
**Honest limits.** In the README: sample journal is fictional; "learning" is transparent statistics, not an LLM; advice only; JSON-RPC (gRPC migration next).

## Field-by-field

| Field | Answer |
|---|---|
| Email | [[Rufus]] |
| Discord handle | [[Rufus]] (join the event Discord. The Mystery Bounty is announced there) |
| LinkedIn | [[Rufus]] |
| How did you hear about this event? | [[Rufus: be truthful]] |
| Is this your first Web3 project? | [[Rufus: truthful yes/no]] |
| Tatum ID | [[from dashboard.tatum.io, after you sign up]] |
| SUI address | [[the funded wallet you used in memory.walrus.xyz]] |
| Account ID (SUI) | [[MemWal account object ID from memory.walrus.xyz]] |
| MEMWAL_AGENT_ID | [[Public key of the delegate key you created, shown in the Memory app. This is the `memwal_agent_id` on your memories. Public key only. NEVER the private key.]] |
| Project description | Short description above |
| Short demo video (2 to 3 min) | [[URL]]. Follow `DEMO_SCRIPT.md` |
| GitHub repo | [[public URL]] |
| Walrus experience | See notes below. Edit to match your own experience |
| Tatum AI Builder experience | Answer honestly. If you didn't use ai.tatum.io, say so and, if you did try it, describe that. |

### Notes for the "experience with Walrus" answer (facts from building; add your own)
- The SDK takes key / accountId / serverUrl explicitly; it reads no environment variables.
- `rememberBulkAndWait` caps at 20 per request.
- The offline `MemWalMock` doesn't implement `listMemories`, so a mock-driven app needs a different path from a live one. We rebuilt state from `recall`.
- Great for apps where "what happened last time" matters. [[Your latency / cost / onboarding observations]]

## Final checklist (tick before submitting)

- [ ] Tatum API key created; `npm run check:tatum` passes
- [ ] MemWal account + delegate key created at memory.walrus.xyz; wallet funded as needed
- [ ] `.env` filled (never committed); `npm run memories:store` run against hosted relayer (mainnet)
- [ ] `npm run memories:verify` shows ≥ 10 memories (aim for 15+, including a few made by really using the app)
- [ ] App in live mode shows **Walrus mainnet** + **Tatum · Sui mainnet** pills
- [ ] Repo public on GitHub; no secrets (`git ls-files | grep -E "^\.env"` shows only `.env.example`); README placeholders updated
- [ ] Deployed demo URL (optional but "working demo" is a requirement; a video + runnable repo may suffice) [[URL]]
- [ ] 2 to 3 min video recorded in live mode and uploaded [[URL]]
- [ ] Blog post published with real details filled in [[URL]]
- [ ] Shared on X and/or LinkedIn tagging @Tatum_io @WalrusFoundation [[URL]] (bonus points)
- [ ] Form completed by you, with your own contact details, before **Nov 10 17:00 Accra time**
- [ ] After results (Nov 17): reply by email with a USDC-capable wallet within 14 days (by **Dec 1 2026**, Accra time) and be ready for a de minimis test transaction
