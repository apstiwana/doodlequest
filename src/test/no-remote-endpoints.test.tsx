import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { DrawingUpload } from "@/components/DrawingUpload";
import { LanguageProvider } from "@/context/LanguageContext";

/**
 * Guards S0.2. Two halves:
 *  1. no source file may reach for the decommissioned Supabase project or its three
 *     Lovable AI edge functions — those endpoints are open, unauthenticated and
 *     billable, so a reference creeping back in is a live risk, not a tidiness issue;
 *  2. uploading a drawing must complete entirely on the device.
 */

const SRC_ROOT = resolve(process.cwd(), "src");

const FORBIDDEN = [
  "@supabase/supabase-js",
  "functions/v1",
  "supabase.co",
  "VITE_SUPABASE",
  "ai.gateway.lovable.dev",
  "character-chat",
  "remove-background",
];

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("S0.2 — no source file reaches a retired remote endpoint", () => {
  const files = sourceFiles(SRC_ROOT).filter(
    (f) => !relative(SRC_ROOT, f).startsWith("test/"),
  );

  it("FindsSourceFilesToScan", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(FORBIDDEN)("ReferencesNowhereInSrc_%s", (needle) => {
    const offenders = files
      .filter((f) => readFileSync(f, "utf8").includes(needle))
      .map((f) => relative(SRC_ROOT, f));

    expect(offenders).toEqual([]);
  });

  it("DeclaresNoSupabaseDependency_InPackageJson", () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
    const all = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(Object.keys(all).filter((d) => d.includes("supabase"))).toEqual([]);
  });
});

describe("S0.2 — drawing upload stays on the device", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderUpload(onComplete = vi.fn()) {
    render(
      <LanguageProvider>
        <DrawingUpload playerName="Ada" onComplete={onComplete} />
      </LanguageProvider>,
    );
    // The file input is visually hidden behind the drop zone.
    return document.querySelector('input[type="file"]') as HTMLInputElement;
  }

  it("ShowsPreview_WithoutAnyNetworkCall", async () => {
    const input = renderUpload();
    const file = new File(["fake-png-bytes"], "drawing.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByAltText("Your drawing")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("RejectsNonImage_WithChildFriendlyMessage", async () => {
    const input = renderUpload();
    const file = new File(["not-an-image"], "notes.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText(/please upload an image file/i)).toBeInTheDocument(),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("RejectsOversizeImage_WithChildFriendlyMessage", async () => {
    const input = renderUpload();
    const big = new File([new Uint8Array(2)], "huge.png", { type: "image/png" });
    // Patch size rather than allocating 10 MB in the test process.
    Object.defineProperty(big, "size", { value: 10 * 1024 * 1024 + 1 });

    fireEvent.change(input, { target: { files: [big] } });

    await waitFor(() => expect(screen.getByText(/too big/i)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
