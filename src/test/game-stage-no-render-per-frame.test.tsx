import { Profiler, type ProfilerOnRenderCallback } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { GameStage } from "@/components/GameStage";
import { LanguageProvider } from "@/context/LanguageContext";

/**
 * Guards S4.1's headline acceptance criterion: **no `setState` inside the rAF loop.**
 *
 * The old loop called `setPhysicsDisplay({...})` every frame, and `cameraX` derived from
 * that state was a prop of an unmemoized `SceneBackground` rendering up to 350 `<circle>`
 * elements — so React reconciled several hundred SVG nodes sixty times a second
 * (ARCHITECTURE.md §2; OBJECTIONS.md confirmed it against this repo). Counting React
 * commits while the character is actually moving is the mechanical check that it cannot
 * come back. A line in a review checklist cannot do that.
 *
 * `requestAnimationFrame` is stubbed rather than left to jsdom, so frames are pumped
 * deterministically off a monotonic clock instead of off real timers.
 */

let frameCallbacks: FrameRequestCallback[] = [];
let clockMs = 0;

function pumpFrames(count: number, msPerFrame = 1000 / 120) {
  for (let i = 0; i < count; i++) {
    clockMs += msPerFrame;
    const due = frameCallbacks;
    frameCallbacks = [];
    for (const cb of due) cb(clockMs);
  }
}

beforeEach(() => {
  frameCallbacks = [];
  clockMs = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frameCallbacks.push(cb);
    return frameCallbacks.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderStage() {
  let commits = 0;
  const onRender: ProfilerOnRenderCallback = () => {
    commits++;
  };
  const utils = render(
    <LanguageProvider>
      <Profiler id="stage" onRender={onRender}>
        <GameStage
          playerName="Test"
          characterImageUrl="data:image/gif;base64,R0lGODlhAQABAAAAACw="
          characterDescription=""
          characterSize={180}
        />
      </Profiler>
    </LanguageProvider>,
  );
  return { ...utils, commitCount: () => commits };
}

function el(container: HTMLElement, testId: string): HTMLElement {
  const found = container.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  expect(found, `missing [data-testid="${testId}"]`).not.toBeNull();
  return found!;
}

describe("S4.1 — React does not re-render per frame", () => {
  it("commits zero times across 240 frames of a jumping character", () => {
    const { container, commitCount } = renderStage();

    act(() => {
      pumpFrames(2);
    });
    const baseline = commitCount();
    expect(baseline).toBeGreaterThan(0); // mount happened at all

    const character = el(container, "character");
    const before = character.style.transform;

    act(() => {
      // Jumping in place: the character moves every single frame, but stays clear of the
      // nearest star (world X 541 against a 130 px pickup box at world X 409.6) so no
      // legitimate event fires. Any commit here would be a per-frame `setState`.
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      pumpFrames(240);
    });

    // Positive control: the loop really is running, and really is moving the character.
    expect(character.style.transform).not.toBe(before);
    expect(character.style.transform).toMatch(/translate3d/);

    // The actual assertion: two seconds of animation at 120 Hz, zero React commits.
    expect(commitCount()).toBe(baseline);
  });

  it("scrolls the world by transform and commits only on real events", () => {
    const { container, commitCount } = renderStage();
    act(() => {
      pumpFrames(2);
    });
    const baseline = commitCount();
    const score = el(container, "score");
    expect(score.textContent).toBe("0");

    const propLayer = el(container, "prop-layer");
    const bgLayer = el(container, "background-layer");
    const frames = 600;

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
      pumpFrames(frames);
    });

    // Both world layers scrolled, without either being re-rendered.
    expect(propLayer.style.transform).toMatch(/translate3d\(-\d/);
    expect(bgLayer.style.transform).toBe(propLayer.style.transform);

    // A star was picked up, so React *did* hear about the game — through the event
    // emitter, on a discrete event.
    expect(Number(score.textContent)).toBeGreaterThan(0);

    // But a handful of commits, not 600. The ceiling is deliberately loose: the point is
    // the order of magnitude, not an exact count that breaks on any UI tweak.
    const commits = commitCount() - baseline;
    expect(commits).toBeGreaterThan(0);
    expect(commits).toBeLessThan(frames / 20);
  });
});
