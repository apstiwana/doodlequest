import type { Scene } from "@/types/game";

export type { Scene };

/**
 * Which controls are held down right now. Owned by the input layer, read by the
 * simulation. Mutated in place — never reallocated — so the hot path stays free of
 * per-frame garbage (ARCHITECTURE.md §14 rule 3).
 */
export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

/**
 * The character's simulation state.
 *
 * `x`/`y` are the centre of the character's axis-aligned bounding box. `x` is world
 * space (0 .. WORLD_WIDTH); `y` is measured downwards from the top of the viewport, which
 * is the same space the DOM renderer draws in.
 *
 * Velocities are px per **second**, never per frame.
 */
export interface CharacterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isOnGround: boolean;
  facingRight: boolean;
  isJumping: boolean;
  /**
   * Set when the character touches down, cleared when they next jump. Drives the landing
   * squash. Deliberately *not* cleared once the squash has played — see GameCore for why
   * that pre-existing quirk is preserved rather than fixed here.
   */
  justLanded: boolean;
  /** 1 = neutral, > 1 = stretched tall, < 1 = squashed flat. */
  squashStretch: number;
  /** Lean, in degrees. */
  tilt: number;
}

/** A solid, static, axis-aligned box the character cannot walk through. */
export interface ObstacleBox {
  /** World-space centre. */
  x: number;
  /** Screen-space centre (measured downwards from the top of the viewport). */
  y: number;
  width: number;
  height: number;
  type: string;
}

/** A collectible. `collected` is mutated in place by the simulation. */
export interface StarState {
  id: number;
  worldX: number;
  worldY: number;
  collected: boolean;
}

/** Everything the collision resolver needs to know about the level. */
export interface WorldSpec {
  /** Screen-space Y of the ground surface (the top of the ground strip). */
  groundY: number;
  /** Half the character's bounding box, px. The box is square. */
  halfSize: number;
  /** Static solids. Pre-computed per scene; never rebuilt inside the loop. */
  obstacles: ObstacleBox[];
}

/**
 * Discrete things React is allowed to hear about.
 *
 * The whole point of S4.1 is that React learns about the game on *events*, not on frames.
 * Allocating one small object per event is fine precisely because these fire on player
 * actions, not 60 times a second.
 */
export type GameEvent =
  | { type: "score"; score: number }
  | { type: "starCollected"; id: number; score: number }
  | { type: "levelComplete"; score: number };

export type GameEventType = GameEvent["type"];
