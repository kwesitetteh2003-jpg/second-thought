import { describe, expect, it } from "vitest";
import { decode, encode } from "../shared/codec";
import { buildSeed } from "../seed/journal";

describe("memory codec", () => {
  it("round-trips every seed memory", () => {
    for (const rec of buildSeed()) {
      const text = encode(rec);
      const back = decode(text);
      expect(back, text).not.toBeNull();
      expect(back!.kind).toBe(rec.kind);
      if (rec.kind === "trade") expect(back).toEqual(rec);
      if (rec.kind === "lesson") expect(back).toMatchObject({ pattern: rec.pattern, n: rec.n, avg: rec.avg, win: rec.win });
    }
  });
  it("stores a readable sentence before the tags", () => {
    const text = encode(buildSeed().find((r) => r.kind === "trade")!);
    expect(text).toMatch(/^\[2nd\] 2026-08-14: Bought 15% of my SUI on a tip/);
    expect(text).toContain("#kind=trade");
  });
  it("ignores text that is not ours", () => {
    expect(decode("User prefers dark mode")).toBeNull();
    expect(decode("[2nd] broken #kind=trade")).toBeNull();
  });
  it("seed has at least 10 memories (hackathon minimum)", () => {
    expect(buildSeed().length).toBeGreaterThanOrEqual(10);
  });
});
