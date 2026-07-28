// @vitest-environment node
//
// Deliberately `node`, not `jsdom`. If any of these tests ever needs a DOM, the game core
// has stopped being a game core (ARCHITECTURE.md §14 rule 1, story S4.1).

import { describe, expect, it } from "vitest";
import { FixedTimestepLoop } from "@/game/loop";
import { GameCore } from "@/game/core";
import { stepCharacter } from "@/game/physics";
import {
  FIXED_DT,
  GRAVITY,
  GROUND_OFFSET,
  JUMP_VELOCITY,
  MOVE_SPEED,
} from "@/game/constants";
import { WORLD_WIDTH } from "@/game/world";
import type { CharacterState, InputState, ObstacleBox, WorldSpec } from "@/game/types";

const VIEWPORT = { width: 1024, height: 768 };
const CHARACTER_SIZE = 180;
const GROUND_CENTRE_Y = VIEWPORT.height - GROUND_OFFSET - CHARACTER_SIZE / 2;

function makeCore(): GameCore {
  return new GameCore({
    scene: "forest",
    viewportWidth: VIEWPORT.width,
    viewportHeight: VIEWPORT.height,
    characterSize: CHARACTER_SIZE,
  });
}

function makeCharacter(x: number, y: number): CharacterState {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    isOnGround: true,
    facingRight: true,
    isJumping: false,
    justLanded: false,
    squashStretch: 1,
    tilt: 0,
  };
}

function box(x: number, width: number, height: number, groundY: number): ObstacleBox {
  return { x, y: groundY - height / 2, width, height, type: "test" };
}

function noInput(): InputState {
  return { left: false, right: false, jump: false };
}

interface PlayOptions {
  /**
   * Set the input for a moment in time. Called once per *frame* with elapsed seconds, so
   * the same script delivers the same input at the same wall-clock time whatever the
   * refresh rate — which is the whole point of comparing 60 Hz against 120 Hz.
   */
  input?: (elapsed: number, core: GameCore) => void;
  /** Called after every logic tick, for sampling a trajectory. */
  onStep?: (core: GameCore) => void;
}

function play(core: GameCore, hz: number, seconds: number, options: PlayOptions = {}) {
  const loop = new FixedTimestepLoop({
    step: (dt) => {
      core.step(dt);
      options.onStep?.(core);
    },
    render: () => {},
  });
  const frameTime = 1 / hz;
  const frames = Math.round(seconds * hz);
  let steps = 0;
  for (let f = 0; f < frames; f++) {
    options.input?.(f * frameTime, core);
    steps += loop.advance(frameTime);
  }
  return { steps, frames };
}

/** Deterministic pseudo-random source, so the property tests are reproducible. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe("S4.2 — physics constants are per second, not per frame", () => {
  it("expresses the old per-frame constants exactly, so 60 Hz feel is unchanged", () => {
    // The pre-S4.2 loop used GRAVITY = 0.55 px/frame², JUMP_FORCE = -18 px/frame and
    // MOVE_SPEED = 5 px/frame. A per-frame value converts to per-second by multiplying by
    // 60 (velocity) or 60² (acceleration). If someone re-tunes one of these, this test is
    // what tells them they have changed how the game feels, not just how it is written.
    // `toBeCloseTo`, not `toBe`: 0.55 * 3600 is 1980.0000000000002 in binary floating
    // point. The constant is the round number; the conversion is what has the error.
    expect(GRAVITY).toBeCloseTo(0.55 * 3600, 6);
    expect(JUMP_VELOCITY).toBe(-18 * 60);
    expect(MOVE_SPEED).toBe(5 * 60);
  });

  it("reaches the same jump apex the pre-refactor loop reached at 60 Hz", () => {
    const core = makeCore();
    expect(core.character.y).toBeCloseTo(GROUND_CENTRE_Y, 6);

    let highest = core.character.y;
    play(core, 60, 1.5, {
      input: (t) => core.setKey(" ", t < 0.1),
      onStep: (c) => {
        highest = Math.min(highest, c.character.y);
      },
    });

    // 303.6 px, which is what semi-implicit Euler at a 1/60 s step actually produces from
    // v = -1080 px/s and g = 1980 px/s². (The continuous-time answer, v²/2g, is 294.5 px;
    // a discrete integrator overshoots it slightly.) 303.6 is also exactly what the old
    // per-frame loop produced on a 60 Hz display, which is the number that matters: the
    // refactor must not change how high a child's character jumps.
    const rise = GROUND_CENTRE_Y - highest;
    expect(rise).toBeCloseTo(303.6, 1);
    expect(core.character.isOnGround).toBe(true);
    expect(core.character.y).toBeCloseTo(GROUND_CENTRE_Y, 6);
  });
});

describe("S4.2 — the simulation is frame-rate independent", () => {
  /**
   * This is the test that would have caught the shipped bug: gravity was applied once per
   * `requestAnimationFrame` tick, so a 120 Hz ProMotion iPad ran the game at double speed.
   *
   * Note that it has to go through the accumulator rather than calling `stepCharacter`
   * with different `dt`s. Euler integration genuinely does give different answers for
   * different step sizes — which is exactly why the fix is a *fixed* timestep and not
   * "multiply by dt and hope".
   */
  it("puts the character in the same place after 2 s at 60 Hz and at 120 Hz", () => {
    const script = (t: number, core: GameCore) => {
      core.setKey("ArrowRight", true);
      core.setKey(" ", t < 0.1 || (t > 0.9 && t < 1.0));
    };

    const run = (hz: number) => {
      const core = makeCore();
      let highest = core.character.y;
      const result = play(core, hz, 2, {
        input: script,
        onStep: (c) => {
          highest = Math.min(highest, c.character.y);
        },
      });
      return { core, highest, ...result };
    };

    const at60 = run(60);
    const at120 = run(120);

    expect(at120.steps).toBe(at60.steps);
    expect(at60.steps).toBeGreaterThan(115);
    expect(at120.core.character.x).toBeCloseTo(at60.core.character.x, 6);
    expect(at120.core.character.y).toBeCloseTo(at60.core.character.y, 6);
    expect(at120.core.character.vy).toBeCloseTo(at60.core.character.vy, 6);
    expect(at120.highest).toBeCloseTo(at60.highest, 6);

    // And the run actually did something — a test that passes because nothing moved is
    // worse than no test at all. The character travelled horizontally and left the ground.
    expect(at60.core.character.x).toBeGreaterThan(VIEWPORT.width * 0.4 + 10);
    expect(GROUND_CENTRE_Y - at60.highest).toBeGreaterThan(200);
  });

  it("gives the same jump trajectory at 30, 60, 90 and 144 Hz", () => {
    const apexFor = (hz: number) => {
      const core = makeCore();
      let highest = core.character.y;
      play(core, hz, 1.5, {
        input: (t) => core.setKey(" ", t < 0.1),
        onStep: (c) => {
          highest = Math.min(highest, c.character.y);
        },
      });
      return highest;
    };

    const reference = apexFor(60);
    for (const hz of [30, 90, 144]) {
      expect(apexFor(hz)).toBeCloseTo(reference, 6);
    }
  });

  it("does not teleport the character after a ten-minute backgrounded tab", () => {
    const core = makeCore();
    const startX = core.character.x;
    core.setKey("ArrowRight", true);

    const loop = new FixedTimestepLoop({ step: (dt) => core.step(dt), render: () => {} });
    const steps = loop.advance(600); // ten minutes of elapsed wall clock, in one frame

    // The clamp caps one frame at 0.25 s: at most 15 ticks, at most 75 px of travel.
    expect(steps).toBeLessThanOrEqual(15);
    expect(core.character.x - startX).toBeLessThanOrEqual(MOVE_SPEED * 0.25 + 1e-9);
  });
});

describe("S4.2 / ARCH §14 — the integrator is deterministic", () => {
  it("produces an identical position sequence on every run", () => {
    const trace = () => {
      const core = makeCore();
      const random = lcg(20260728);
      const samples: number[] = [];
      play(core, 60, 4, {
        input: (t, c) => {
          // A fixed pseudo-random input script. The point is that the same script always
          // yields the same trajectory, not that the script is realistic.
          const frame = Math.round(t * 60);
          if (frame % 7 === 0) c.setKey("ArrowRight", random() > 0.35);
          if (frame % 11 === 0) c.setKey("ArrowLeft", random() > 0.8);
          if (frame % 13 === 0) c.setKey(" ", random() > 0.5);
        },
        onStep: (c) => {
          samples.push(c.character.x, c.character.y, c.character.vy);
        },
      });
      return samples;
    };

    const first = trace();
    for (let run = 0; run < 5; run++) {
      expect(trace()).toEqual(first);
    }
    // Guard against the trace being trivially short or stationary.
    expect(first.length).toBe(240 * 3);
    expect(new Set(first).size).toBeGreaterThan(50);
  });
});

describe("S4.2 — axis-separated collision resolution", () => {
  const groundY = 600;
  const half = 20;

  function world(obstacles: ObstacleBox[]): WorldSpec {
    return { groundY, halfSize: half, obstacles };
  }

  it("stops the character at the first of two adjacent obstacles, never inside the second", () => {
    // A occupies 280..320, B occupies 320..360. They touch. The pre-S4.2 resolver could
    // push the character out of one and into the other inside the same loop, because it
    // wrote the corrected X back into the variable the next obstacle was tested against.
    const a = box(300, 40, 40, groundY);
    const b = box(340, 40, 40, groundY);
    const w = world([a, b]);
    const c = makeCharacter(200, groundY - half);
    const input: InputState = { left: false, right: true, jump: false };

    for (let i = 0; i < 200; i++) {
      stepCharacter(c, input, w, FIXED_DT);
      expect(c.x + half).toBeLessThanOrEqual(280 + 1e-9);
    }

    // Resting exactly against A's left face.
    expect(c.x).toBeCloseTo(280 - half, 9);
  });

  it("stops at the first obstacle when travelling left, too", () => {
    const w = world([box(300, 40, 40, groundY), box(340, 40, 40, groundY)]);
    const c = makeCharacter(500, groundY - half);
    const input: InputState = { left: true, right: false, jump: false };

    for (let i = 0; i < 200; i++) {
      stepCharacter(c, input, w, FIXED_DT);
      expect(c.x - half).toBeGreaterThanOrEqual(360 - 1e-9);
    }
    expect(c.x).toBeCloseTo(360 + half, 9);
  });

  it("never lets the character overlap an obstacle, under any input sequence", () => {
    const obstacles = [
      box(300, 40, 40, groundY),
      box(340, 40, 40, groundY), // the adjacent pair
      box(500, 60, 34, groundY),
      box(700, 50, 120, groundY),
    ];
    const w = world(obstacles);

    for (let seed = 1; seed <= 40; seed++) {
      const random = lcg(seed * 7919);
      const c = makeCharacter(150, groundY - half);
      const input = noInput();

      for (let i = 0; i < 400; i++) {
        if (i % 5 === 0) {
          input.right = random() > 0.35;
          input.left = random() > 0.75;
          input.jump = random() > 0.6;
        }
        stepCharacter(c, input, w, FIXED_DT);

        for (const o of obstacles) {
          const overlapX =
            c.x + half > o.x - o.width / 2 && c.x - half < o.x + o.width / 2;
          const overlapY =
            c.y + half > o.y - o.height / 2 && c.y - half < o.y + o.height / 2;
          expect(overlapX && overlapY).toBe(false);
        }
      }
    }
  });

  it("lands the character on top of an obstacle it falls onto", () => {
    const obstacleTop = groundY - 40;
    const w = world([box(300, 60, 40, groundY)]);
    const c = makeCharacter(300, obstacleTop - half - 150);
    c.isOnGround = false;
    const input = noInput();

    for (let i = 0; i < 120; i++) stepCharacter(c, input, w, FIXED_DT);

    expect(c.isOnGround).toBe(true);
    expect(c.y).toBeCloseTo(obstacleTop - half, 9);
    expect(c.vy).toBe(0);
  });

  it("resolves X against the pre-move Y, so a character on a ledge can walk off it", () => {
    const obstacleTop = groundY - 40;
    const w = world([box(300, 60, 40, groundY)]); // spans 270..330
    const c = makeCharacter(300, obstacleTop - half);
    const input: InputState = { left: false, right: true, jump: false };

    for (let i = 0; i < 120; i++) stepCharacter(c, input, w, FIXED_DT);

    // Walked off the right-hand edge and fell to the ground, rather than being trapped by
    // the side face of the very box it was standing on.
    expect(c.x).toBeGreaterThan(330 + half);
    expect(c.y).toBeCloseTo(groundY - half, 9);
  });

  it("clamps the character to the world edges", () => {
    const w = world([]);
    const left = makeCharacter(200, groundY - half);
    for (let i = 0; i < 200; i++) {
      stepCharacter(left, { left: true, right: false, jump: false }, w, FIXED_DT);
    }
    expect(left.x).toBeCloseTo(half, 9);

    const right = makeCharacter(WORLD_WIDTH - 200, groundY - half);
    for (let i = 0; i < 200; i++) {
      stepCharacter(right, { left: false, right: true, jump: false }, w, FIXED_DT);
    }
    expect(right.x).toBeCloseTo(WORLD_WIDTH - half, 9);
  });
});

describe("S4.1 — the core reports discrete events, not frames", () => {
  it("emits score and starCollected once per star, and nothing on an empty frame", () => {
    const core = makeCore();
    const events: string[] = [];
    core.on("score", (e) => events.push(e.type === "score" ? `score:${e.score}` : "?"));
    core.on("starCollected", () => events.push("star"));

    const star = core.stars[0];
    core.character.x = star.worldX;
    core.character.y = star.worldY + CHARACTER_SIZE / 4;

    core.step(FIXED_DT);
    expect(core.score).toBe(10);
    expect(events).toEqual(["star", "score:10"]);

    // Standing over an already-collected star produces nothing further.
    core.step(FIXED_DT);
    core.step(FIXED_DT);
    expect(events).toHaveLength(2);
    expect(core.stars[0].collected).toBe(true);
  });

  it("emits levelComplete exactly once when the finish line is crossed", () => {
    const core = makeCore();
    let completions = 0;
    core.on("levelComplete", () => completions++);

    core.character.x = core.finishX - CHARACTER_SIZE / 2 - 1;
    core.setKey("ArrowRight", true);
    play(core, 60, 1);

    expect(completions).toBe(1);
    expect(core.levelComplete).toBe(true);
  });

  it("resets cleanly for a replay", () => {
    const core = makeCore();
    core.character.x = core.stars[0].worldX;
    core.character.y = core.stars[0].worldY + CHARACTER_SIZE / 4;
    core.step(FIXED_DT);
    expect(core.score).toBe(10);

    core.resetToStart();
    expect(core.score).toBe(0);
    expect(core.levelComplete).toBe(false);
    expect(core.stars.every((s) => !s.collected)).toBe(true);
    expect(core.character.x).toBeCloseTo(VIEWPORT.width * 0.4, 6);
  });

  it("keeps the camera inside the world", () => {
    const core = makeCore();
    expect(core.cameraX(0)).toBe(0);
    expect(core.cameraX(WORLD_WIDTH)).toBe(WORLD_WIDTH - VIEWPORT.width);
    expect(core.cameraX(1500)).toBeCloseTo(1500 - VIEWPORT.width * 0.4, 6);
  });

  /**
   * A playability smoke test. Not a substitute for a child on the real iPad — nothing is —
   * but it is the difference between "the refactor compiles" and "a level can still be
   * finished". A physics change that makes an obstacle unjumpable would break this.
   */
  it.each(["forest", "underwater", "city", "moon", "space"] as const)(
    "%s is completable, with stars reachable along the way",
    (scene) => {
      const core = new GameCore({
        scene,
        viewportWidth: VIEWPORT.width,
        viewportHeight: VIEWPORT.height,
        characterSize: CHARACTER_SIZE,
      });
      let finished = false;
      let starsCollected = 0;
      core.on("levelComplete", () => {
        finished = true;
      });
      core.on("starCollected", () => {
        starsCollected++;
      });

      core.setKey("ArrowRight", true);
      core.setKey(" ", true);

      const loop = new FixedTimestepLoop({
        step: (dt) => core.step(dt),
        render: () => {},
      });
      let frames = 0;
      while (!finished && frames < 60 * 60) {
        loop.advance(1 / 60);
        frames++;
      }

      expect(finished).toBe(true);
      // ~10 s of held input crosses the 3,600 px world at 300 px/s. A generous window:
      // the assertion is "this finishes and does not take a minute", not a stopwatch.
      expect(frames / 60).toBeLessThan(20);
      expect(starsCollected).toBeGreaterThanOrEqual(8);
    },
  );

  it("lays out the same scene identically every time", () => {
    const a = makeCore();
    const b = makeCore();
    expect(b.stars).toEqual(a.stars);
    expect(b.obstacles).toEqual(a.obstacles);
  });
});
