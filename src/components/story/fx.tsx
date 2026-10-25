import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** True on devices with a precise pointer that can hover (not touch). */
export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(hover: hover) and (pointer: fine)");
    setFine(m.matches);
    const on = () => setFine(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return fine;
}

/** Pulls its child a few pixels toward the cursor, then springs back. */
export function Magnetic({ children, strength = 0.28, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 260, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 260, damping: 18, mass: 0.6 });
  const on = fine && !reduce;
  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (!on) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.span>
  );
}

/** Perspective tilt that follows the pointer over `area` (fine pointers only). */
export function useTilt(max = 9) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 16 });
  const sy = useSpring(my, { stiffness: 120, damping: 16 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max * 0.8, -max * 0.8]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const on = fine && !reduce;
  const handlers = {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (!on) return;
      const r = e.currentTarget.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    },
    onPointerLeave: () => { mx.set(0); my.set(0); },
  };
  return { rotateX, rotateY, glareX, handlers };
}

/** Sets --mx/--my on the element so CSS can draw a light that follows the cursor. */
export const spotlight = {
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  },
};
