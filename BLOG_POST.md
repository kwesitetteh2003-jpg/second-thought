<!--
DRAFT for the required blog post (rules: what it does, how it uses Tatum + Walrus, how it learned over time).
Fill every [[...]] after you've run it live. Publish it yourself (Medium / Dev.to / Hashnode / Mirror / personal site), then put the URL in the submission and share on X/LinkedIn.
Do not publish claims that aren't true: delete or reword anything you haven't done.
-->

# I built a wallet co-pilot with a memory: Second Thought on Walrus and Tatum

*By Rufus Worlanyo, built for the Walrus × Tatum Total Recall hackathon*

Every trader has a "never again" list. Mine is in my head, and my head is not reliable at 2 AM when a chart is red and X is shouting.

**Second Thought** is a wallet co-pilot that remembers that list for me. Before I sell, buy, swap or send, I tell it what I'm about to do and why. It checks my wallet, recalls what happened the last times I did something similar, and gives me **GO, PAUSE or STOP** with the receipts: *"4 past sells after a dip averaged -11.5%; none were wins."* It never touches my funds. It just makes sure my past self gets a vote.

## What it does

1. **Pre-flight.** You describe the move: action, asset, size, what's driving it (dip, tip, headline…), how you feel, and the time.
2. **Verdict.** A gauge (GO / PAUSE / STOP) and a list of reasons. Every reason links to the exact memories behind it.
3. **Outcome.** Later you log how it went. The result goes back into memory, and when a pattern becomes clear the app writes a *lesson*.
4. **Stricter with you.** If you override a warning and lose, it gets stricter with you. If you override and you were fine, it relaxes a little.

## How it uses Walrus Memory

Walrus Memory is the app's only database. Each memory is one readable sentence plus compact tags:

```
[2nd] 2026-10-06: Sold 40% of my SUI after a price dip, feeling fearful, around 02:00. Result: -12%. … #kind=trade #action=sell #trigger=dip #mood=fearful …
```

The sentence is what makes **semantic recall** work and keeps every memory human-auditable. The tags let the server rebuild its model from recalled text with no extra store. There are three kinds: `trade`, `lesson` and `pref`. Writes use `rememberAndWait` / `rememberBulkAndWait`, recall uses `recall()` against a namespace for the app. Because memory belongs to a Walrus Memory *account* rather than my server, the same journal could follow me to any other app I grant a delegate key. [[Add: what you observed about latency, reliability, and cost on mainnet]]

## How it uses Tatum

A decision about "40% of my SUI" needs to know how much SUI that is. The Sui gateway from Tatum gives the app live **balances**, the **latest checkpoint**, **reference gas price**, and my **recent transaction count** (one GraphQL query to Tatum's Sui gateway). The 24-hour transaction count is a signal too: a day with eight or more transactions is usually an impulsive day, and the engine adds risk for it. [[Add: your real Tatum experience and any latency/limits you hit]]

## How it learned over time

The learning loop is deliberately transparent: no black box.

- **Patterns.** For the same action, the engine groups my *actual* past trades by trigger, mood, size bucket and hour, and computes the count, the average result and the win rate of each group. Confidence grows with sample size (`(n-1)/4`, capped at 1). No history means no pattern, and the app says "go ahead, I'll start learning" instead of inventing fear.
- **Lessons.** When a pattern reaches three trades with a clear average, the app writes a lesson back into memory ("buying on a tip has cost me -10.3% on average across 3 trades"). It writes another only when the evidence meaningfully grows.
- **Strictness.** Each overridden-and-lost warning raises a multiplier (+0.25); an override that was fine lowers it (-0.1). It's clamped between 0.7× and 1.8×.

In the sample journal (a fictional trader, "Kofi", 14 trades): the move "sell 40% of my SUI at 2 AM, after a dip, feeling fearful" scores **STOP at risk 2.32**. After I override it and log a -8% result, the same move scores **3.48**, with strictness going from 1.50× to 1.75×. The Learning tab replays the same move against 0, then more, then all memories: **GO → PAUSE → STOP**.

![Verdict](screenshots/04-verdict-stop.png)

## What's real and what isn't

[[Edit to match what you actually did.]] The repo runs in two modes. **Demo mode** (default) uses the Walrus Memory SDK's offline mock and a fixture wallet, and is labelled DEMO in the UI. **Live mode** uses the hosted Walrus Memory relayer and the Tatum Sui RPC. [[I stored N memories on mainnet on DATE: link to account / blob proof.]] The sample trades are fictional; [[N]] memories came from actually using the app.

## Building notes

- The Walrus Memory SDK doesn't read environment variables, so the app passes the key, account id and server URL explicitly.
- `rememberBulkAndWait` takes up to 20 memories per request. The store script chunks by 20 and skips memories already stored.
- The SDK's offline mock doesn't implement `listMemories`, so the app rebuilds state through `recall`.
- Sui retired JSON-RPC during the build, so I moved the client to Tatum's GraphQL endpoint; gRPC streaming is next on my list.

## What's next

Wallet connect (read-only), gRPC via Tatum, spending/subscription habits, not just trades, and memory shared across apps.

**Code:** [[GitHub URL]] · **Demo video:** [[URL]] · Built for **@Tatum_io** and **@WalrusFoundation**
