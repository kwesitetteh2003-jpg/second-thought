import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { Credit, Photo } from "../Photo";
import { NIGHTS, StoryPhone } from "./Phone";

const BEATS = [
  { kicker: "The move", title: "SUI has been sliding since dinner. Kofi opens his wallet to sell 40% of it.", body: "He's tired, a little scared, and alone with a phone. That is when most of us make our worst calls." },
  { kicker: "The memory", title: "Second Thought has seen this night four times before.", body: "Four late-night sells between August and October. Average result: −11.5%. Not one of them worked. Those memories are his, kept in Walrus Memory." },
  { kicker: "The ask", title: "STOP. It asks him for an hour.", body: "The last time he waited, on 16 October, holding left him 9% better off. He can still go ahead. Either way, what happens next gets written down." },
];
const RANGES: [number[], number[]][] = [
  [[0, 0.28, 0.34], [1, 1, 0]],
  [[0.28, 0.34, 0.6, 0.66], [0, 1, 1, 0]],
  [[0.6, 0.66, 1], [0, 1, 1]],
];

function Beat({ p, i }: { p: MotionValue<number>; i: number }) {
  const opacity = useTransform(p, RANGES[i][0], RANGES[i][1]);
  const y = useTransform(opacity, [0, 1], [28, 0]);
  const blur = useTransform(opacity, [0, 1], ["blur(6px)", "blur(0px)"]);
  const b = BEATS[i];
  return (
    <motion.div style={{ opacity, y, filter: blur }} className="absolute inset-x-0 bottom-0">
      <p className="eyebrow !text-[#a39a8b]"><span className="mono mr-3 text-moon">0{i + 1}</span>{b.kicker}</p>
      <h3 className="serif mt-3 text-[27px] leading-[1.06] sm:text-[44px] lg:max-w-[20ch] lg:text-[50px]">{b.title}</h3>
      <p className="mt-4 max-w-[52ch] text-[14.5px] leading-relaxed text-[#c9c1b3] sm:text-[16.5px]">{b.body}</p>
    </motion.div>
  );
}

function Clock({ p }: { p: MotionValue<number> }) {
  // 02:04 while he decides, 02:05 when it answers, then the hour ticks to 03:04
  const minutes = useTransform(p, [0, 0.3, 0.36, 0.72, 0.98], [4, 4, 5, 5, 64]);
  const text = useTransform(minutes, (m) => {
    const t = 120 + Math.round(m);
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  });
  const stopOpacity = useTransform(p, [0.66, 0.72], [0, 1]);
  return (
    <div>
      <motion.div className="serif tnum text-[clamp(64px,13vw,200px)] leading-[0.85] text-moon">{text}</motion.div>
      <motion.div style={{ opacity: stopOpacity }} className="mono mt-3 text-[11.5px] uppercase tracking-[0.2em] text-[#e9927a]">cooling-off · 60 min</motion.div>
    </div>
  );
}

/** A remembered night, floating beside the phone while it recalls. */
function MemoryCard({ p, i }: { p: MotionValue<number>; i: number }) {
  const n = NIGHTS[i];
  const s = 0.36 + i * 0.05;
  const pos = [
    { left: "-84%", top: "6%", r: -7 },
    { left: "-96%", top: "31%", r: 4 },
    { left: "-80%", top: "56%", r: -3 },
    { left: "-90%", top: "80%", r: 6 },
  ][i];
  const opacity = useTransform(p, [s, s + 0.05, 0.62, 0.7], [0, 1, 1, 0]);
  const x = useTransform(p, [s, s + 0.06, 0.62, 0.7], [-60, 0, 0, 90]);
  const rotate = useTransform(p, [s, s + 0.06], [pos.r * 2.5, pos.r]);
  const drift = useTransform(p, [0.3, 0.7], [16, -16]);
  return (
    <motion.div style={{ opacity, x, rotate, y: drift, left: pos.left, top: pos.top }} className="absolute w-[176px] rounded-[4px] bg-sheet p-3 text-ink shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]">
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-[22px] leading-none">{n.d}</span>
        <span className="mono text-[13px] font-medium text-stop">{n.pnl}%</span>
      </div>
      <div className="mono mt-1.5 text-[10.5px] text-faint">{n.h} · sell {n.pct}% · price dip</div>
      <div className="mono mt-2 border-t border-line pt-1.5 text-[9.5px] text-mem">memory · seed-{[2, 5, 7, 9][i]}</div>
    </motion.div>
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

export function Night() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const clip = useTransform(enter, [0, 1], ["inset(9% 7% 0% 7% round 18px)", "inset(0% 0% 0% 0% round 0px)"]);
  const scale = useTransform(p, [0, 1], [1.18, 1.0]);
  const x = useTransform(p, [0, 1], ["0%", "-4%"]);
  const veil = useTransform(p, [0, 0.3, 0.7, 1], [0.3, 0.5, 0.72, 0.8]);
  const glow = useTransform(p, [0.62, 0.72, 1], [0, 0.55, 0.3]);
  const bar = useTransform(p, [0, 1], [0, 1]);
  const phoneY = useTransform(p, [0, 1], [40, -40]);
  const phoneRot = useTransform(p, [0, 0.5, 1], [-4, 0, 3]);
  if (reduce) return <NightStatic />;
  return (
    <section ref={ref} aria-label="Two in the morning" className="relative h-[380vh] bg-paper text-moon">
      <motion.div style={{ clipPath: clip }} className="sticky top-0 h-[100svh] overflow-hidden bg-night">
        <motion.div style={{ scale, x }} className="absolute inset-0 will-change-transform">
          <Photo name="night-phone" alt="A man lies in bed at night, his face lit by his phone, city lights behind him" sizes="100vw" className="h-full w-full object-cover object-[32%_50%]" />
        </motion.div>
        <motion.div style={{ opacity: veil }} className="absolute inset-0 bg-night" />
        <motion.div style={{ opacity: glow }} className="absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_55%,rgba(173,47,29,0.45),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />

        <div className="relative mx-auto grid h-full max-w-[1320px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] px-5 pb-14 pt-[124px] sm:px-8 sm:pt-[100px] lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:pb-20 lg:pt-24">
          <div className="flex items-start justify-between gap-6 lg:col-span-7">
            <Clock p={p} />
            <p className="eyebrow mt-3 hidden !text-[#a39a8b] sm:block lg:hidden">Late, on a weeknight</p>
          </div>
          <div className="night-phone relative flex items-center justify-center lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <motion.div style={{ y: phoneY, rotate: phoneRot }} className="relative text-[7.2px] min-[400px]:text-[7.8px] sm:text-[10px] lg:text-[13.5px]">
              <div className="hidden lg:block">{NIGHTS.map((_, i) => <MemoryCard key={i} p={p} i={i} />)}</div>
              <StoryPhone p={p} />
            </motion.div>
          </div>
          <div className="relative min-h-[250px] sm:min-h-[270px] lg:col-span-7 lg:row-start-2 lg:self-end">
            {BEATS.map((_, i) => <Beat key={i} p={p} i={i} />)}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-8">
          <div className="mx-auto flex max-w-[1320px] items-center gap-4">
            <div className="h-px flex-1 bg-moon/15"><motion.div style={{ scaleX: bar }} className="h-px origin-left bg-ember" /></div>
            <span className="caption !text-[#8f8778]"><Credit name="night-phone" /></span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
