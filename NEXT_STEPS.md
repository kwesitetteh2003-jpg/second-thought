# Next steps (only you can do these)

Nothing has been signed up for, funded, submitted, or published on your behalf. All times are **Accra time (UTC+0)**.

## Key dates
| Date | What |
|---|---|
| Fri Oct 23 | Today. Hackathon is open (since Oct 20) |
| **Sun Nov 8** | Suggested personal deadline: everything done and tested, so Nov 9–10 are buffer |
| **Tue Nov 10, 17:00** | **Submission deadline** (hard) |
| Tue Nov 17 | Results announced |
| ≈ Dec 1 | Prize wallet + email confirmation due (14 days from the official announcement) |

## Checklist in order

1. **Review the code and rules.** Read `README.md` §1 and §6. Decide you're happy to submit this as your own work (it is yours to edit, and the rules require original work and a single submission per person). Ask on Discord about the rules page's "feedback and form platform" text if you want certainty.
2. **Tatum key.** Sign up free at https://dashboard.tatum.io, create a Sui mainnet key, and note your **Tatum ID** for the form. Put `TATUM_API_KEY` in `.env`. Run `npm run check:tatum`. (Add `WATCH_ADDRESS` to also see balances.) Consider also trying ai.tatum.io if you want the $500 bonus (that requires building the product *primarily* with it, so likely out of reach now).
3. **Sui wallet and Walrus Memory account.** Use a Sui wallet you control (a fresh one is wise). Go to https://memory.walrus.xyz, connect it, create a **Memory account**, and create a **delegate key**. Note: Account ID, the delegate **public** key (= `MEMWAL_AGENT_ID` on the form), and the delegate private key (→ `MEMWAL_KEY`, only in `.env`, never in the repo or chat).
4. **Funds.** Check what the Memory app asks for. Writes may need a little **SUI** (gas) and **WAL** (storage). We couldn't determine whether the hosted relayer charges per write. Buy only what the app tells you, and only with your own approval.
5. **Store the memories.**
   ```bash
   cp .env.example .env   # fill MEMWAL_*, TATUM_API_KEY, WATCH_ADDRESS, SECOND_THOUGHT_MODE=live
   npm run memories:preview
   npm run memories:store -- --confirm
   npm run memories:verify         # must report ≥ 10
   ```
   Optional but recommended: edit `seed/journal.ts` first if you want your own data, and then run the live app and make a few real pre-flights + outcomes, so some of the mainnet memories came from actually using it.
6. **Run live and rehearse.** `npm run dev` → pills should say Walrus mainnet / Tatum · Sui mainnet. Do the full flow from `DEMO_SCRIPT.md`. Fix anything that's off, and note real latency for the blog.
7. **Deploy (optional but nice).** The app is one Node server (`npm run build && npm start`; set the env vars on the host). Any Node host works (Railway, Fly, Render). Put real keys only in the host's secret store. Use a read-only demo or keep keys out of a public instance (anyone using a public live instance would write to *your* memory account).
8. **Push to a public GitHub repo.** `git ls-files | grep -E "^\.env"` must show only `.env.example`. The `proof/*.local.json` receipt is git-ignored (share blob IDs in the blog if you like).
9. **Record the video** (2 to 3 min), live mode, following `DEMO_SCRIPT.md`. Upload (YouTube unlisted / Loom).
10. **Publish the blog.** Fill the `[[...]]` blanks in `BLOG_POST.md` with what really happened, publish it yourself and keep the URL.
11. **Share on X and/or LinkedIn** tagging @Tatum_io and @WalrusFoundation (bonus points).
12. **Join the event Discord** (Mystery Bounty is revealed there).
13. **Fill in and submit the form** (https://recall-tatum-walrus.vercel.app) using `SUBMISSION.md`, before Nov 10 17:00 Accra time. Keep the confirmation.
14. **After results (Nov 17):** if you win, reply by email with a USDC-capable wallet within 14 days and do the test transaction.

## Follow-up ideas (if time)
- Move the Tatum client from JSON-RPC to Tatum's gRPC gateway (`sui-mainnet-grpc.gateway.tatum.io:443`). The JSON-RPC deprecation is a judging risk on "Technical quality".
- Read-only wallet connect so the address isn't an env var.
- Page `listMemories` for long journals; persist pending decisions.
- Spending and subscription habits as additional memory kinds.
