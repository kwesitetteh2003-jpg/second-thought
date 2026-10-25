import { motion, useReducedMotion } from "framer-motion";
import { EASE, Magnetic } from "./fx";
import { InkWash } from "./InkWash";

/** The hand-off from story to desk: a dark band with one living ink accent. */
export function Bridge({ onTry }: { onTry: () => void }) {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="bridge-h" className="relative overflow-hidden bg-night text-moon">
      <InkWash className="absolute inset-0 h-full w-full" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_80%_at_75%_40%,rgba(217,87,42,0.35),transparent_70%)] [.ink-wash[data-live]~&]:opacity-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-night via-night/70 to-transparent" />
      <div className="relative mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:py-36">
        <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }} className="eyebrow !text-[#a39a8b]">Your turn</motion.p>
        <motion.h2
          id="bridge-h"
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="serif mt-5 max-w-[14ch] text-[clamp(48px,8vw,112px)] leading-[0.92]"
        >
          Be Kofi for <em className="text-[#f08a5d]">one minute.</em>
        </motion.h2>
        <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-[#c9c1b3]">The desk below is the real thing, running on his sample journal. Ask, decide, log how it went, and watch the notebook change.</p>
        <div className="mt-9">
          <Magnetic>
            <button onClick={onTry} className="btn-shine group inline-flex items-center gap-3 rounded-full bg-moon px-6 py-3.5 text-[15px] font-semibold text-night transition-transform duration-200 active:scale-[0.97]">
              Open Kofi's case
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
