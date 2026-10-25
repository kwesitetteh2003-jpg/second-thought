import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { useApp } from "../../lib/store";
import { Credit, Photo } from "../Photo";
import { EASE, Magnetic, useTilt } from "./fx";
import { StoryPhone } from "./Phone";

function Words({ text, line, className = "" }: { text: string; line: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top">
          <motion.span
            className={`inline-block ${className}`}
            initial={{ y: "108%", rotate: 4 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ delay: 0.1 + line * 0.11 + i * 0.06, duration: 0.95, ease: EASE }}
          >
            {w}
          </motion.span>
          {"\u00a0"}
        </span>
      ))}
    </>
  );
}

function InkStroke() {
  return (
    <svg aria-hidden viewBox="0 0 300 24" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.06em] left-0 h-[0.16em] w-full overflow-visible">
      <motion.path
        d="M3 15 C 50 6, 92 20, 140 12 S 232 5, 297 13"
        fill="none" stroke="#d9572a" strokeWidth="5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ delay: 1.05, duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}

/** Drives the hero phone on a slow loop, paused while it's off-screen. */
function useLoop(inView: boolean) {
  const reduce = useReducedMotion();
  const t = useMotionValue(reduce ? 0.86 : 0);
  const ctl = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => {
    if (reduce) { t.set(0.86); return; }
    const timer = setTimeout(() => {
      ctl.current = animate(t, [0, 1], { duration: 11, ease: "linear", repeat: Infinity, repeatDelay: 0.4 });
    }, 900);
    return () => { clearTimeout(timer); ctl.current?.stop(); };
  }, [reduce, t]);
  useEffect(() => {
    if (!ctl.current) return;
    if (inView) ctl.current.play(); else ctl.current.pause();
  }, [inView]);
  return t;
}

export function Hero({ onTry }: { onTry: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const fig = useRef<HTMLDivElement>(null);
  const inView = useInView(fig, { margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const { mem } = useApp();
  const t = useLoop(inView);
  const fade = useTransform(t, [0, 0.03, 0.97, 1], [0.25, 1, 1, 0.25]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 80]);
  const phoneY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -70]);
  const l1 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -60]);
  const l3 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 60]);
  const { rotateX, rotateY, glareX, handlers } = useTilt(10);

  return (
    <section ref={ref} className="relative mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-14">
      <div className="flex flex-col justify-between lg:col-span-7">
        <div>
          <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE }} className="eyebrow mb-6 flex items-center gap-3">
            <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-ember/60 motion-reduce:hidden" /><span className="relative h-2 w-2 rounded-full bg-ember" /></span>
            A wallet co-pilot with a memory
          </motion.p>
          <h1 className="serif text-[clamp(54px,9.4vw,136px)] leading-[0.9] text-ink">
            <motion.span style={{ x: l1 }} className="block"><Words text="Sleep on it." line={0} /></motion.span>
            <span className="block"><Words text="Your wallet" line={1} className="italic text-ember" /></span>
            <motion.span style={{ x: l3 }} className="block">
              <span className="relative inline-block"><Words text="remembers" line={2} /><InkStroke /></span>{" "}
              <Words text="why." line={3} />
            </motion.span>
          </h1>
          <motion.p initial={{ y: 10 }} animate={{ y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease: EASE }} className="mt-8 max-w-[50ch] text-[17px] leading-[1.6] text-dim sm:text-[18.5px]">
            Before you sign, Second Thought checks the move against what happened the last times you made one like it, and tells you plainly.
            Your history lives in Walrus Memory. Your wallet's live state comes from Sui. It never moves a coin.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.8, ease: EASE }} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Magnetic>
              <button className="btn-primary btn-shine group" onClick={onTry}>
                Try Kofi's 2 AM sell
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </Magnetic>
            <a href="#how" className="link-draw pb-0.5 text-[15px] font-medium">How it learns</a>
          </motion.div>
        </div>

        <dl className="mt-14 grid grid-cols-3 border-t border-line pt-5 lg:mt-12">
          {[
            [mem?.counts.trades ?? "–", "past moves in Kofi's journal"],
            [mem?.counts.lessons ?? "–", "lessons it wrote for him"],
            ["0", "coins it can touch"],
          ].map(([n, l], i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.08, duration: 0.7, ease: EASE }} className={i ? "border-l border-line pl-4 sm:pl-6" : "pr-4"}>
              <dt className="sr-only">{l}</dt>
              <dd className="serif tnum text-[40px] leading-none sm:text-[54px]">{n}</dd>
              <dd className="mt-2 max-w-[18ch] text-[12.5px] leading-snug text-faint">{l}</dd>
            </motion.div>
          ))}
        </dl>
      </div>

      <figure className="relative lg:col-span-5" {...handlers}>
        <div ref={fig} className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-sand">
          <motion.div style={{ y: photoY }} className="absolute inset-[-7%_0]">
            <motion.div initial={reduce ? false : { scale: 1.18 }} animate={{ scale: 1.04 }} transition={{ duration: 1.8, ease: EASE }} className="h-full w-full">
              <Photo name="kofi-phone" priority alt="A young man in a white shirt sits against an orange wall, looking down at his phone" sizes="(min-width: 1024px) 520px, 100vw" className="h-full w-full object-cover object-[50%_30%]" />
            </motion.div>
          </motion.div>
          {/* paper curtain lifts off the photo on load */}
          {!reduce && <motion.div aria-hidden initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={{ duration: 1.1, delay: 0.15, ease: [0.76, 0, 0.24, 1] }} className="absolute inset-0 origin-top bg-paper" />}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.6 }} className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-paper/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-stop" />Kofi · 02:04
          </motion.div>
        </div>

        <motion.div
          style={{ y: phoneY }}
          className="absolute -bottom-10 right-2 text-[8.4px] [perspective:1100px] min-[420px]:text-[9.5px] sm:text-[11px] lg:bottom-auto lg:top-[16%] lg:-left-[24%] lg:right-auto lg:text-[12.5px] xl:text-[13.5px]"
        >
          <motion.div initial={reduce ? false : { opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1.1, ease: EASE }} className="[transform-style:preserve-3d]">
            <motion.div style={{ rotateX, rotateY, opacity: fade }} className="relative [transform-style:preserve-3d]">
              <StoryPhone p={t} />
              <motion.div aria-hidden style={{ left: glareX }} className="pointer-events-none absolute top-0 h-full w-1/2 -translate-x-1/2 rounded-[2.7em] bg-[radial-gradient(closest-side,rgba(255,255,255,0.10),transparent)]" />
            </motion.div>
          </motion.div>
        </motion.div>

        <figcaption className="mt-3 flex items-baseline justify-between gap-4 pr-[50%] lg:pl-[22%] lg:pr-0">
          <span className="text-[13px] text-dim">What's on his screen at 02:04, and what happens next.</span>
          <span className="hidden lg:block"><Credit name="kofi-phone" /></span>
        </figcaption>
        <div className="mt-10 lg:hidden"><Credit name="kofi-phone" /></div>
      </figure>
    </section>
  );
}
