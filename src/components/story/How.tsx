import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Credit, Photo } from "../Photo";
import { EASE } from "./fx";

const STEPS = [
  ["Log", "You tell it the move. Days later you tell it how the move turned out, or what waiting saved you.", "POST /api/decisions/:id/outcome"],
  ["Remember", "Each move becomes one plain sentence, written to Walrus Memory and Seal-encrypted to your account.", "memwal.rememberAndWait()"],
  ["Recall", "Next time, similar moments come back by meaning, next to your wallet's live state from Tatum's Sui RPC.", "memwal.recall() · Tatum"],
  ["Warn", "Patterns that cost you raise the risk. Override a warning and lose, and it gets stricter with you.", "evaluate() in shared/engine.ts"],
] as const;

export function How() {
  const band = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: band, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "10%"]);
  const clip = useTransform(scrollYProgress, [0, 0.45], reduce ? ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] : ["inset(14% 10% 14% 10% round 10px)", "inset(0% 0% 0% 0% round 0px)"]);
  const capX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80, -80]);
  const { scrollYProgress: lp } = useScroll({ target: list, offset: ["start 75%", "end 60%"] });
  const spine = useTransform(lp, [0, 1], [0, 1]);

  return (
    <section id="how" className="scroll-mt-16">
      <figure>
        <motion.div ref={band} style={{ clipPath: clip }} className="relative h-[52vh] min-h-[300px] overflow-hidden bg-sand sm:h-[72vh]">
          <motion.div style={{ y }} className="absolute inset-[-12%_0]">
            <Photo name="accra-market" alt="A busy market street in Accra; a woman carries a basin on her head past stalls and parked cars" sizes="100vw" className="h-full w-full object-cover" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <motion.p style={{ x: capX }} className="serif absolute bottom-6 left-0 right-0 whitespace-nowrap px-5 text-[clamp(40px,8vw,120px)] leading-none text-paper/95 sm:bottom-10 sm:px-8">
            In between everything else.
          </motion.p>
        </motion.div>
        <figcaption className="mx-auto flex max-w-[1320px] flex-wrap items-baseline justify-between gap-2 px-5 pt-3 sm:px-8">
          <span className="text-[13px] text-dim">Accra. For most people we built this for, trading happens in between everything else.</span>
          <Credit name="accra-market" />
        </figcaption>
      </figure>

      <div className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow mb-4">How it learns</p>
            <h2 className="serif text-[44px] leading-[1] sm:text-[60px]">Four steps, <em>no magic</em>.</h2>
            <p className="mt-5 max-w-[38ch] text-[15.5px] leading-relaxed text-dim">The scoring is about two hundred lines of plain TypeScript you can read. The memory is what makes it yours.</p>
          </div>
        </div>
        <ol ref={list} className="relative lg:col-span-8">
          <motion.span aria-hidden style={{ scaleY: spine }} className="absolute -left-4 top-0 hidden h-full w-px origin-top bg-ember sm:block lg:-left-8" />
          {STEPS.map(([t, d, code], i) => (
            <motion.li
              key={t}
              initial={reduce ? false : { opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 0.8, ease: EASE }}
              className="step group grid grid-cols-[56px_minmax(0,1fr)] gap-x-5 border-t border-line py-8 last:border-b sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-x-8"
            >
              <span className="serif text-[44px] leading-none text-ember transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:text-[64px]">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-[21px] font-semibold tracking-tight">{t}</h3>
                <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-dim">{d}</p>
              </div>
              <code className="mono col-start-2 mt-3 self-start break-all text-[11.5px] text-faint transition-colors group-hover:text-ink sm:col-start-3 sm:mt-1.5">{code}</code>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
