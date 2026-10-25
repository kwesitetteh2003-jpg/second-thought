import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { useApp } from "../lib/store";
import { Credit, Photo } from "./Photo";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────── 1. Opening spread ───────────────────────── */

function Line({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.12 + i * 0.09, duration: 0.9, ease: EASE }}>
        {children}
      </motion.span>
    </span>
  );
}

function Hero({ onTry }: { onTry: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { mem } = useApp();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 90]);
  const photoScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.04, 1.12]);

  return (
    <section ref={ref} className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-16">
      <div className="flex flex-col justify-between lg:col-span-7">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="eyebrow mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-ink/40" />A wallet co-pilot with a memory
          </motion.p>
          <h1 className="serif text-[clamp(52px,9.2vw,128px)] leading-[0.92] text-ink">
            <Line i={0}>Sleep on it.</Line>
            <Line i={1}><em className="text-ember">Your wallet</em></Line>
            <Line i={2}>remembers why.</Line>
          </h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7, ease: EASE }} className="mt-8 max-w-[52ch] text-[17px] leading-[1.6] text-dim sm:text-[18px]">
            Before you sign, Second Thought looks at the move you're about to make, recalls what happened the last times you made one like it,
            and tells you plainly. Your history lives in Walrus Memory. Your wallet's live state comes from Sui. It never moves a coin.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7, ease: EASE }} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <button className="btn-primary group" onClick={onTry}>
              Try Kofi's 2 AM sell
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
            <a href="#how" className="link-draw pb-0.5 text-[15px] font-medium">How it learns</a>
          </motion.div>
        </div>

        <dl className="mt-14 grid grid-cols-3 border-t border-line pt-5 lg:mt-0">
          {[
            [mem?.counts.trades ?? "–", "past moves in Kofi's journal"],
            [mem?.counts.lessons ?? "–", "lessons it wrote for him"],
            ["0", "coins it can touch"],
          ].map(([n, l], i) => (
            <div key={i} className={i ? "border-l border-line pl-4 sm:pl-6" : "pr-4"}>
              <dt className="sr-only">{l}</dt>
              <dd className="serif tnum text-[40px] leading-none sm:text-[52px]">{n}</dd>
              <dd className="mt-2 max-w-[18ch] text-[12.5px] leading-snug text-faint">{l}</dd>
            </div>
          ))}
        </dl>
      </div>

      <figure className="lg:col-span-5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-sand">
          <motion.div style={{ y: photoY, scale: photoScale }} className="absolute inset-[-6%_0]">
            <Photo name="kofi-phone" priority alt="A young man in a white shirt sits against an orange wall, looking down at his phone" sizes="(min-width: 1024px) 520px, 100vw" className="h-full w-full object-cover object-[50%_30%]" />
          </motion.div>
        </div>
        <figcaption className="mt-3 flex items-baseline justify-between gap-4">
          <span className="text-[13px] text-dim">Most bad trades start the same way: one person, one phone.</span>
          <Credit name="kofi-phone" />
        </figcaption>
      </figure>
    </section>
  );
}

/* ───────────────────────── 2. 2 AM, scroll-scrubbed ───────────────────────── */

const BEATS = [
  { kicker: "The move", title: "SUI has been sliding since dinner. Kofi opens his wallet to sell 40% of it.", body: "He's tired, a little scared, and alone with a phone. That is when most of us make our worst calls." },
  { kicker: "The memory", title: "Second Thought has seen this night four times before.", body: "Four late-night sells between August and October. Average result: −11.5%. Not one of them worked. Those memories are his, kept in Walrus Memory." },
  { kicker: "The ask", title: "STOP. It asks him for an hour.", body: "The last time he waited, on 16 October, holding left him 9% better off. He can still go ahead. Either way, what happens next gets written down." },
];

function useBeat(p: MotionValue<number>, i: number) {
  const ranges: [number[], number[]][] = [
    [[0, 0.28, 0.34], [1, 1, 0]],
    [[0.28, 0.34, 0.6, 0.66], [0, 1, 1, 0]],
    [[0.6, 0.66, 1], [0, 1, 1]],
  ];
  const [inp, out] = ranges[i];
  const opacity = useTransform(p, inp, out);
  const y = useTransform(opacity, [0, 1], [24, 0]);
  return { opacity, y };
}

function Clock({ p }: { p: MotionValue<number> }) {
  // 02:04 while he decides, 02:05 when it answers, then the hour ticks to 03:04
  const minutes = useTransform(p, [0, 0.3, 0.36, 0.64, 0.97], [4, 4, 5, 5, 64]);
  const text = useTransform(minutes, (m) => {
    const t = 120 + Math.round(m);
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  });
  const stopOpacity = useTransform(p, [0.6, 0.68], [0, 1]);
  return (
    <div className="text-right">
      <motion.div className="serif tnum text-[clamp(72px,15vw,220px)] leading-[0.85] text-moon">{text}</motion.div>
      <motion.div style={{ opacity: stopOpacity }} className="mono mt-3 text-[12px] uppercase tracking-[0.2em] text-[#e9927a]">cooling-off · 60 min</motion.div>
    </div>
  );
}

function NightStatic() {
  return (
    <section aria-label="Two in the morning" className="bg-night text-moon">
      <div className="relative h-[60vh] overflow-hidden">
        <Photo name="night-phone" alt="A man lies in bed at night, his face lit by his phone, city lights behind him" sizes="100vw" className="h-full w-full object-cover object-[35%_50%] opacity-70" />
      </div>
      <div className="mx-auto max-w-[900px] space-y-12 px-5 py-16 sm:px-8">
        <div className="serif text-[72px] leading-none">02:04</div>
        {BEATS.map((b) => (
          <div key={b.kicker}>
            <p className="eyebrow !text-[#a39a8b]">{b.kicker}</p>
            <h3 className="serif mt-3 text-[34px] leading-[1.08]">{b.title}</h3>
            <p className="mt-3 max-w-[56ch] text-[16px] leading-relaxed text-[#bdb5a7]">{b.body}</p>
          </div>
        ))}
        <Credit name="night-phone" />
      </div>
    </section>
  );
}

function Beat({ p, i }: { p: MotionValue<number>; i: number }) {
  const { opacity, y } = useBeat(p, i);
  const b = BEATS[i];
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 bottom-0" aria-hidden={false}>
      <p className="eyebrow !text-[#a39a8b]"><span className="mono mr-3 text-moon">0{i + 1}</span>{b.kicker}</p>
      <h3 className="serif mt-3 text-[30px] leading-[1.06] sm:text-[44px]">{b.title}</h3>
      <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[#c9c1b3] sm:text-[16.5px]">{b.body}</p>
    </motion.div>
  );
}

function Night() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scale = useTransform(p, [0, 1], [1.16, 1.0]);
  const x = useTransform(p, [0, 1], ["0%", "-4%"]);
  const veil = useTransform(p, [0, 0.4, 1], [0.25, 0.55, 0.72]);
  const bar = useTransform(p, [0, 1], [0, 1]);
  if (reduce) return <NightStatic />;
  return (
    <section ref={ref} aria-label="Two in the morning" className="relative h-[340vh] bg-night text-moon">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ scale, x }} className="absolute inset-0 will-change-transform">
          <Photo name="night-phone" alt="A man lies in bed at night, his face lit by his phone, city lights behind him" sizes="100vw" className="h-full w-full object-cover object-[32%_50%]" />
        </motion.div>
        <motion.div style={{ opacity: veil }} className="absolute inset-0 bg-night" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />

        <div className="relative mx-auto flex h-full max-w-[1320px] flex-col justify-between px-5 pb-16 pt-[136px] sm:px-8 lg:pb-20 lg:pt-24">
          <div className="flex items-start justify-between gap-6">
            <p className="eyebrow !text-[#a39a8b]">Late, on a weeknight</p>
            <Clock p={p} />
          </div>
          <div className="relative min-h-[300px] max-w-[760px] sm:min-h-[260px]">
            {BEATS.map((_, i) => <Beat key={i} p={p} i={i} />)}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-8">
          <div className="mx-auto flex max-w-[1320px] items-center gap-4">
            <div className="h-px flex-1 bg-moon/15"><motion.div style={{ scaleX: bar }} className="h-px origin-left bg-moon/80" /></div>
            <span className="caption !text-[#8f8778]"><Credit name="night-phone" /></span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 3. How it remembers ───────────────────────── */

const STEPS = [
  ["Log", "You tell it the move. Days later you tell it how the move turned out, or what waiting saved you.", "POST /api/decisions/:id/outcome"],
  ["Remember", "Each move becomes one plain sentence, written to Walrus Memory and Seal-encrypted to your account.", "memwal.rememberAndWait()"],
  ["Recall", "Next time, similar moments come back by meaning, next to your wallet's live state from Tatum's Sui RPC.", "memwal.recall() · Tatum"],
  ["Warn", "Patterns that cost you raise the risk. Override a warning and lose, and it gets stricter with you.", "evaluate() in shared/engine.ts"],
] as const;

function How() {
  const band = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: band, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  return (
    <section id="how" className="scroll-mt-16">
      <figure>
        <div ref={band} className="relative h-[46vh] min-h-[280px] overflow-hidden bg-sand sm:h-[62vh]">
          <motion.div style={{ y }} className="absolute inset-[-12%_0]">
            <Photo name="accra-market" alt="A busy market street in Accra; a woman carries a basin on her head past stalls and parked cars" sizes="100vw" className="h-full w-full object-cover" />
          </motion.div>
        </div>
        <figcaption className="mx-auto flex max-w-[1320px] flex-wrap items-baseline justify-between gap-2 px-5 pt-3 sm:px-8">
          <span className="text-[13px] text-dim">Accra. For most people we built this for, trading happens in between everything else.</span>
          <Credit name="accra-market" />
        </figcaption>
      </figure>

      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow mb-4">How it learns</p>
            <h2 className="serif text-[44px] leading-[1] sm:text-[60px]">Four steps, <em>no magic</em>.</h2>
            <p className="mt-5 max-w-[38ch] text-[15.5px] leading-relaxed text-dim">The scoring is about two hundred lines of plain TypeScript you can read. The memory is what makes it yours.</p>
          </div>
        </div>
        <ol className="lg:col-span-8">
          {STEPS.map(([t, d, code], i) => (
            <motion.li
              key={t}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="grid grid-cols-[56px_1fr] gap-x-5 border-t border-line py-8 last:border-b sm:grid-cols-[96px_1fr_auto] sm:gap-x-8"
            >
              <span className="serif text-[44px] leading-none text-ember sm:text-[64px]">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-[21px] font-semibold tracking-tight">{t}</h3>
                <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-dim">{d}</p>
              </div>
              <code className="mono col-start-2 mt-3 self-start text-[11.5px] text-faint sm:col-start-3 sm:mt-1.5">{code}</code>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Story({ onTry }: { onTry: () => void }) {
  return (
    <>
      <Hero onTry={onTry} />
      <Night />
      <How />
    </>
  );
}
