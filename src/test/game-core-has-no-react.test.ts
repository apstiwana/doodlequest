// @vitest-environment node

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * Guards ARCHITECTURE.md §14 rule 1 and story S4.1: nothing in the game core may import
 * React or reach for the DOM.
 *
 * `eslint.config.js` enforces the import half of this with `no-restricted-imports`, which
 * is the mechanism CI should rely on. This test exists as well, deliberately, for two
 * reasons: `npm run lint` currently has pre-existing failures, so a new rule hidden inside
 * a red command is easy to stop reading; and this file also catches DOM *usage*, which the
 * import rule cannot see.
 */

const GAME_ROOT = resolve(process.cwd(), "src/game");

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

const files = sourceFiles(GAME_ROOT);

describe("S4.1 — src/game/ is React-free", () => {
  it("has files to check", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => relative(GAME_ROOT, f)))(
    "%s does not import React",
    (relativePath) => {
      const source = readFileSync(join(GAME_ROOT, relativePath), "utf8");
      expect(source).not.toMatch(/from\s+["']react/);
      expect(source).not.toMatch(/require\(\s*["']react/);
      expect(source).not.toMatch(/from\s+["']@\/(components|context|hooks|pages)\//);
    },
  );

  it("loads and runs with no DOM globals at all", async () => {
    // If anything in the core touched `window`, `document` or `requestAnimationFrame` at
    // module scope, importing it in a node environment would throw here.
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");

    const game = await import("@/game");
    const core = new game.GameCore({
      scene: "space",
      viewportWidth: 800,
      viewportHeight: 600,
      characterSize: 120,
    });
    const startY = core.character.y;
    core.setKey(" ", true);
    for (let i = 0; i < 10; i++) core.step(game.FIXED_DT);
    expect(core.character.y).toBeLessThan(startY);
  });
});
