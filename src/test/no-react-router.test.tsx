import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import App from "@/App";
import { isAppRoot } from "@/lib/route";

/**
 * Guards the removal of react-router-dom.
 *
 * The package carried GHSA-wrjc-x8rr-h8h6 (open redirect via a backslash in a
 * `<Link>` / `useNavigate` target) across the whole 6.x line, and `npm audit fix`
 * only moved us to 6.30.4 — still inside the vulnerable range. A single-screen game
 * does not need a routing table, so the dependency was dropped rather than migrated
 * to 7.x.
 *
 * Two halves, deliberately:
 *  1. a grep-style guard, because the cheapest way for the dependency to come back
 *     is a scaffold or a component pasted in from a router-shaped template
 *     (same pattern as `no-remote-endpoints.test.tsx`);
 *  2. a render, because "no import" is worthless if the app no longer mounts.
 */

const SRC_ROOT = resolve(process.cwd(), "src");

/**
 * Matches an *import* of the routing packages, not a mention of them. Prose may say
 * "react-router" — a neutralised file explaining why it is empty does exactly that —
 * without reintroducing the dependency.
 */
const ROUTER_IMPORT = /(?:from|import|require\()\s*["'`]react-router(?:-dom)?(?:\/[^"'`]*)?["'`]/;

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("no source file imports a router", () => {
  const files = sourceFiles(SRC_ROOT);

  it("FindsSourceFilesToScan", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("ImportsRouterNowhereInSrc_IncludingTests", () => {
    const offenders = files
      .filter((f) => ROUTER_IMPORT.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC_ROOT, f));

    expect(offenders).toEqual([]);
  });

  it("DeclaresNoRouterDependency_InPackageJson", () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
    const all = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(Object.keys(all).filter((d) => d.startsWith("react-router"))).toEqual([]);
  });
});

describe("the app mounts without a router", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    // jsdom keeps history between tests in a file; put it back on the entry point.
    window.history.pushState({}, "", "/");
    consoleError.mockClear();
  });

  it("RendersTheGame_AtTheEntryPoint", () => {
    render(<App />);

    // The welcome screen is step one of the flow Index owns; if it is on screen, the
    // app mounted with no router context and no provider missing.
    expect(screen.getByText("Start Adventure!")).toBeInTheDocument();
  });

  it("RendersNotFound_ForAnUnknownPath", () => {
    window.history.pushState({}, "", "/no-such-page");

    render(<App />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.queryByText("Start Adventure!")).not.toBeInTheDocument();
  });

  it("LogsTheMissingPath_WhenNotFoundRenders", () => {
    window.history.pushState({}, "", "/no-such-page");

    render(<App />);

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("404"), "/no-such-page");
  });

  it("LinksHomeWithAPlainAnchor_NotAClientSideNavigation", () => {
    window.history.pushState({}, "", "/no-such-page");

    const { container } = render(<App />);
    const home = container.querySelector('a[href="/"]');

    expect(home).not.toBeNull();
    expect(home?.textContent).toContain("Return to Home");
  });
});

describe("isAppRoot", () => {
  it.each([
    ["/", "/"],
    ["", "/"],
    ["//", "/"],
    ["/index.html", "/"],
    ["/INDEX.HTM", "/"],
    ["/app", "/app/"],
    ["/app/", "/app/"],
    ["/app/index.html", "/app/"],
  ])("Accepts_%s_ForBase_%s", (pathname, base) => {
    expect(isAppRoot(pathname, base)).toBe(true);
  });

  it.each([
    ["/nope", "/"],
    ["/index.html/nope", "/"],
    ["/app/nope", "/app/"],
    ["/", "/app/"],
    // The advisory's own shape: a backslash-prefixed host is a path, not a redirect.
    ["/\\evil.example.com", "/"],
  ])("Rejects_%s_ForBase_%s", (pathname, base) => {
    expect(isAppRoot(pathname, base)).toBe(false);
  });

  it("DefaultsToTheViteBaseUrl", () => {
    expect(isAppRoot(import.meta.env.BASE_URL)).toBe(true);
  });
});
