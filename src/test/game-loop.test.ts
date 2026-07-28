// @vitest-environment node

import { describe, expect, it } from "vitest";
import { FixedTimestepLoop } from "@/game/loop";
import { FIXED_DT, MAX_FRAME_TIME } from "@/game/constants";

function counting() {
  const state = { steps: 0, renders: 0, dts: [] as number[], alphas: [] as number[] };
  const loop = new FixedTimestepLoop({
    step: (dt) => {
      state.steps++;
      state.dts.push(dt);
    },
    render: (alpha) => {
      state.renders++;
      state.alphas.push(alpha);
    },
  });
  return { state, loop };
}

describe("FixedTimestepLoop", () => {
  it("always steps by exactly the fixed tick, whatever the frame time", () => {
    const { state, loop } = counting();
    loop.advance(1 / 144);
    loop.advance(1 / 30);
    loop.advance(1 / 60);
    expect(state.steps).toBeGreaterThan(0);
    for (const dt of state.dts) expect(dt).toBe(FIXED_DT);
  });

  it("runs the same number of ticks per second at any refresh rate", () => {
    for (const hz of [30, 60, 90, 120, 144]) {
      const { state, loop } = counting();
      for (let f = 0; f < hz; f++) loop.advance(1 / hz);
      // One second of wall clock is 60 ticks, give or take the banked remainder.
      expect(state.steps).toBeGreaterThanOrEqual(59);
      expect(state.steps).toBeLessThanOrEqual(60);
      expect(state.renders).toBe(hz);
    }
  });

  it("renders once per frame even when no tick was due", () => {
    const { state, loop } = counting();
    // A 240 Hz frame does not pay for a 60 Hz tick on its own.
    const steps = loop.advance(1 / 240);
    expect(steps).toBe(0);
    expect(state.renders).toBe(1);
    expect(state.alphas[0]).toBeGreaterThan(0);
    expect(state.alphas[0]).toBeLessThan(1);
  });

  it("clamps a long frame instead of spiralling", () => {
    const { state, loop } = counting();
    loop.advance(600);
    expect(state.steps).toBeLessThanOrEqual(Math.ceil(MAX_FRAME_TIME / FIXED_DT));
    expect(state.steps).toBeGreaterThan(0);
  });

  it("treats a backwards, zero or NaN clock as no elapsed time", () => {
    const { state, loop } = counting();
    loop.advance(-5);
    loop.advance(0);
    loop.advance(Number.NaN);
    expect(state.steps).toBe(0);
    expect(loop.pending).toBe(0);
    expect(state.renders).toBe(3);
  });

  it("throws away banked time on reset, so a resumed tab does not lurch", () => {
    const { state, loop } = counting();
    loop.advance(1 / 240); // bank a partial tick
    expect(loop.pending).toBeGreaterThan(0);
    loop.reset();
    expect(loop.pending).toBe(0);
    expect(state.steps).toBe(0);
  });

  it("starts and stops safely with no requestAnimationFrame and no document", () => {
    // The loop is browser plumbing over `advance`, and it has to survive being
    // constructed in a headless environment rather than assuming a browser exists.
    const { loop, state } = counting();
    expect(() => {
      loop.start();
      loop.stop();
    }).not.toThrow();
    expect(state.steps).toBe(0);
  });
});
