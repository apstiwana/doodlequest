import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guards S2.5: the site is public but unlisted. Both signals must stay in place —
 * robots.txt discourages crawling, the meta tag is what a crawler that does fetch the
 * page reads.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("S2.5 — indexing policy", () => {
  it("DisallowsAllCrawlers_InRobotsTxt", () => {
    const robots = read("public/robots.txt");
    const directives = robots
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    expect(directives).toContain("User-agent: *");
    expect(directives).toContain("Disallow: /");
    // No leftover per-crawler Allow rules from the indexed-by-default config.
    expect(directives.filter((d) => d.startsWith("Allow:"))).toEqual([]);
  });

  it("SetsNoindex_InTheHtmlEntryPoint", () => {
    const html = read("index.html");

    expect(html).toMatch(/<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/>/);
  });

  it("KeepsRobotsTxtShippedFromPublic", () => {
    // public/ is copied verbatim into dist by Vite; if robots.txt ever moves out of
    // public/ it silently stops being served.
    expect(() => read("public/robots.txt")).not.toThrow();
  });
});
