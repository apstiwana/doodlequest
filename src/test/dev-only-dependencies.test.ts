import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Build-time tooling belongs in devDependencies.
 *
 * This is not tidiness. `npm audit --omit=dev` is the only audit view that answers
 * "what can reach a child's browser", and it trusts the classification in
 * package.json. `tailwindcss-animate` is a Tailwind plugin: it runs in PostCSS at
 * build time and ships nothing but the class names it generates. Listed as a runtime
 * dependency it dragged its sucrase -> glob -> minimatch -> brace-expansion chain
 * into the production surface and made a clean audit impossible to read.
 */

const pkg = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };

/** Tools that only ever run on a build machine. */
const BUILD_TIME_ONLY = [
  "tailwindcss",
  "tailwindcss-animate",
  "@tailwindcss/typography",
  "autoprefixer",
  "postcss",
  "vite",
  "vitest",
  "typescript",
];

describe("build-time tooling is not declared as a runtime dependency", () => {
  it.each(BUILD_TIME_ONLY)("IsAbsentFromDependencies_%s", (name) => {
    expect(Object.keys(pkg.dependencies)).not.toContain(name);
  });

  it("DeclaresTailwindAnimate_AsADevDependency", () => {
    expect(Object.keys(pkg.devDependencies)).toContain("tailwindcss-animate");
  });

  it("StillLoadsTailwindAnimate_FromTheTailwindConfig", () => {
    // Guards the other direction: moving it to devDependencies must not be mistaken
    // later for "unused" and removed, which would silently drop every animation.
    const config = readFileSync(resolve(process.cwd(), "tailwind.config.ts"), "utf8");

    expect(config).toContain("tailwindcss-animate");
  });
});
