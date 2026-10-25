import { lazy, Suspense } from "react";
import { Hero } from "./story/Hero";
import { Ticker } from "./story/Ticker";

// Below-the-fold chapters load as separate chunks so the hero paints first.
const Night = lazy(() => import("./story/Night").then((m) => ({ default: m.Night })));
const Proof = lazy(() => import("./story/Proof").then((m) => ({ default: m.Proof })));
const How = lazy(() => import("./story/How").then((m) => ({ default: m.How })));
const Bridge = lazy(() => import("./story/Bridge").then((m) => ({ default: m.Bridge })));

/** The landing story above the working desk: hero → 2 AM → the record → how → your turn. */
export function Story({ onTry }: { onTry: () => void }) {
  return (
    <>
      <Hero onTry={onTry} />
      <Ticker />
      <Suspense fallback={<div className="h-[380vh] bg-paper" />}>
        <Night />
        <Proof />
        <How />
        <Bridge onTry={onTry} />
      </Suspense>
    </>
  );
}
