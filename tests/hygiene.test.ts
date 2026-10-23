import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const files: string[] = [];
(function walk(d: string) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "screenshots"].includes(f.name)) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(ts|tsx|md|json|example|html|css)$/.test(f.name) && f.name !== "package-lock.json") files.push(p);
  }
})(root);

describe("repo hygiene", () => {
  it("contains no private keys", () => {
    for (const f of files) {
      const txt = fs.readFileSync(f, "utf8");
      expect(txt, f).not.toMatch(/suiprivkey1[a-z0-9]{20,}/);
      expect(txt, f).not.toMatch(/\b0x[0-9a-f]{64}\b.*(private|secret)/i);
    }
  });
  it(".env.example leaves every secret empty", () => {
    const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
    for (const k of ["MEMWAL_KEY", "MEMWAL_ACCOUNT_ID", "TATUM_API_KEY", "WATCH_ADDRESS"]) expect(env).toMatch(new RegExp(`^${k}=$`, "m"));
  });
});
