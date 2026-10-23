# Demo script: "Second Thought" (target 2:30, hard cap 3:00)

The rules want a **short demo video of 2 to 3 minutes**. You record it, in your own voice.

**Record in LIVE mode** (real keys, 10+ memories already stored: see `NEXT_STEPS.md`). Demo mode is for rehearsal. If you record in demo mode you must say so on camera, because the rules require mainnet writes. Rehearse first in demo mode: `npm run dev`, open http://localhost:9011.

## The real-life scenario

> **Kofi, a trader in Accra.** At 2 AM, SUI dips. He's tired, anxious, scrolling X. He's about to sell 40% of his stack, which he's done three times before and regretted every time. No app has ever said that to him. He always remembers it the next morning.

Make it yours if you like ("I did this in March"). The data is fictional, so say "this is a sample journal" once, early.

## Before you hit record
- `npm run memories:verify` has been run recently, and its terminal output is ready in a second window. (Proof shot.)
- Browser at 1440×900, zoom 100%, dark mode, notifications off.
- Click **Reset demo** (demo mode) or, in live mode, start from your stored journal. The header pills should read **Walrus mainnet** and **Tatum · Sui mainnet**.
- Have your Walruscan/Suiscan tab for the account open (optional proof).

## Shot list

| Time | On screen | What you say (paraphrase, don't read) |
|---|---|---|
| 0:00–0:12 | Black frame → logo → Pre-flight page | "It's 2 AM, SUI just dropped, and I'm about to sell. I've done this before and regretted it, but when it matters, I don't remember. This is Second Thought: a wallet co-pilot that remembers for me." |
| 0:12–0:30 | Point at header pills, wallet strip, right rail | "Under the hood: my balances come from **Tatum's Sui RPC**. And my history is stored in **Walrus Memory**: on the right, 21 memories, each one a trade or a lesson, encrypted on Walrus." |
| 0:30–0:50 | Click scenario **Kofi's 2 AM panic sell** (or set: Sell · SUI · 40% · Price dip · Fearful · 02:00). Click **Ask for a second opinion** | "I tell it what I'm about to do and why. Sell forty percent, because of a dip, feeling fearful, at two in the morning." Let the 3 loading steps play: Tatum → recall → verdict. |
| 0:50–1:20 | **STOP** gauge, risk 2.32, cooldown 60:00. Hover a "4 memories" chip: rail items light up. Open the **recall trace** | "STOP. Not because of a rule someone hard-coded. Because of *my own* history: four sells after a dip averaged minus 11.5%, none were wins; fearful sells, minus 12%; late-night, same. Every reason points at the exact memories it came from. Click: they light up." |
| 1:20–1:35 | Point at "moves of 15% or less have worked for you" | "It doesn't just say no. It tells me what has worked: smaller moves." |
| 1:35–2:00 | Click **Hold to proceed anyway** (hold ~1.5 s). In the outcome panel type **-8** → log | "Say I ignore it and go ahead, and it goes badly: minus eight. I log it. That result is written back to Walrus Memory, plus new lessons it derives. Memories went 21 → 25." |
| 2:00–2:20 | The **Learned** panel: before 2.32 → after 3.48, strictness 1.50× → 1.75× | "Same move, asked again: risk 3.48. It's learned that I override warnings and lose, so it's stricter with me. The memory changed the product." |
| 2:20–2:40 | **Learning** tab: replay chart, drag the scrubber GO → PAUSE → STOP | "Here's the loop: same move at zero memories is a GO; at a handful, a PAUSE; with my whole journal, a STOP." |
| 2:40–2:55 | Terminal: `npm run memories:verify` output (count ≥ 10, "mainnet" relayer) / Walruscan tab | "And these are real memories on Walrus mainnet, retrieved by meaning. Code is public, link below." |
| 2:55–3:00 | Title card with repo URL | "Second Thought. A second opinion from your past self." |

## Delivery tips
- Show the mouse, move slowly, pause one beat on the STOP screen (the animation is the hook).
- One sentence on each sponsor, no more: Tatum = live on-chain context; Walrus Memory = durable, portable memory that changes decisions.
- Don't claim: anything that happened in demo mode as "mainnet"; that it predicts prices; that it moves funds (it doesn't).
- If the live relayer is slow, cut the loading wait in the edit, not on camera.

## Backup plan
If live mode isn't ready by Nov 8: record in demo mode, state "demo mode, offline mock" on camera, and treat the submission as incomplete against requirement 1 and 3. Don't submit without the mainnet memories if you can avoid it.
