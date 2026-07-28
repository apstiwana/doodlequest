/**
 * The game core. Plain TypeScript — no React, no DOM, enforced by lint
 * (`eslint.config.js`) and by `src/test/game-core-has-no-react.test.ts`.
 *
 * Everything in here can be stepped deterministically in a Node process, which is what
 * makes the physics testable and what will let E5 swap the DOM renderer for a canvas one
 * without touching the simulation.
 */
export * from "./constants";
export * from "./types";
export * from "./world";
export { Emitter } from "./emitter";
export { stepCharacter } from "./physics";
export { GameCore } from "./core";
export type { GameCoreOptions } from "./core";
export { FixedTimestepLoop } from "./loop";
export type { LoopCallbacks, LoopOptions } from "./loop";
export { FrameMeter } from "./metrics";
