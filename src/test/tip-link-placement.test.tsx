import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * Source-level invariant behind S0.1 and S9.1: the payment URL may live in exactly
 * one place — the home page. Rendering tests can only cover screens they know about,
 * so this scan is what catches the link being pasted into a *new* in-game screen
 * later. It is deliberately a grep, not a render: it fails on the source of truth.
 */

// vitest runs from the project root, so src/ is resolvable from cwd.
const SRC_ROOT = resolve(process.cwd(), "src");
const PAYMENT_HOST = "buy.stripe.com";
const ALLOWED_FILE = "components/WelcomeScreen.tsx";

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("payment link placement across the codebase", () => {
  const files = sourceFiles(SRC_ROOT)
    // The test files themselves reference the URL as fixture data.
    .filter((f) => !relative(SRC_ROOT, f).startsWith("test/"));

  it("FindsSourceFilesToScan", () => {
    // Guards the guard: a broken path would make every assertion below vacuous.
    expect(files.length).toBeGreaterThan(10);
  });

  it("ReferencesPaymentUrl_FromExactlyOneComponent", () => {
    const offenders = files
      .filter((f) => readFileSync(f, "utf8").includes(PAYMENT_HOST))
      .map((f) => relative(SRC_ROOT, f));

    expect(offenders).toEqual([ALLOWED_FILE]);
  });

  it("KeepsPaymentUrlOutOfEveryInGameScreen", () => {
    const inGame = ["GameStage.tsx", "LevelComplete.tsx", "SceneSelector.tsx", "SpeechBubble.tsx"];

    for (const name of inGame) {
      const match = files.find((f) => f.endsWith(name));
      expect(match, `${name} should exist`).toBeDefined();
      expect(readFileSync(match as string, "utf8")).not.toContain(PAYMENT_HOST);
    }
  });
});
