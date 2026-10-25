import { cancelFrame, frame } from "framer-motion";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Lenis smooth scrolling, driven from Motion's frame loop (frame.setup) so
 * scroll-linked values never lag a frame behind. Off for reduced motion; touch
 * keeps its native momentum.
 */
let lenis: Lenis | null = null;

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 0.95, anchors: { offset: -64 } });
    lenis = l;
    const tick = ({ timestamp }: { timestamp: number }) => l.raf(timestamp);
    frame.setup(tick, true);
    return () => { cancelFrame(tick); l.destroy(); lenis = null; };
  }, []);
  return null;
}

/** Scroll an element into view, through Lenis when it's running. */
export function scrollToEl(el: HTMLElement | null, offset = -64) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

export function scrollToTop(immediate = false) {
  if (lenis) lenis.scrollTo(0, immediate ? { immediate: true, force: true } : { duration: 1.1 });
  else window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
}
