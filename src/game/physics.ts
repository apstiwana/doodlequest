import {
  FALL_SQUASH_SCALE,
  GRAVITY,
  JUMP_VELOCITY,
  LAND_SQUASH_SCALE,
  MOVE_SPEED,
  SQUASH_VY,
  STRETCH_SCALE,
  STRETCH_VY,
  TILT_DEGREES,
} from "./constants";
import type { CharacterState, InputState, WorldSpec } from "./types";
import { WORLD_WIDTH } from "./world";

/**
 * Advance the character by exactly `dt` seconds.
 *
 * Mutates `character` in place and allocates nothing — this runs 60 times a second on a
 * low-memory iPad, where a per-frame object literal is measurable GC pressure
 * (ARCHITECTURE.md §14 rule 3).
 *
 * Integration is semi-implicit Euler (velocity first, then position), which is stable for
 * a kinematic platformer character and is what the original per-frame loop was already
 * doing implicitly.
 *
 * Collision is resolved **one axis at a time**: X is moved and fully resolved against
 * every obstacle, then Y is moved and fully resolved. The pre-S4.2 loop resolved both in
 * a single pass and wrote the corrected X back into the variable the *next* obstacle in
 * the same loop was tested against, so being pushed out of one obstacle could shove the
 * character straight into its neighbour. Resolving per axis, and taking the extreme
 * limit across all overlapping obstacles rather than applying corrections in sequence,
 * makes that impossible: the character stops at the first solid in the direction of
 * travel and is never displaced *towards* anything.
 *
 * @param character Mutated in place.
 * @param input     Which controls are held. Read only.
 * @param world     Ground height, character size and the scene's static solids. Read only.
 * @param dt        Seconds to advance. Always the fixed logic tick; never a raw frame time.
 */
export function stepCharacter(
  character: CharacterState,
  input: InputState,
  world: WorldSpec,
  dt: number,
): void {
  const half = world.halfSize;
  const obstacles = world.obstacles;

  // ── 1. Intent becomes velocity ────────────────────────────────────────────────
  // Horizontal velocity is *set*, not accumulated. A kinematic controller with no
  // horizontal inertia is what makes the controls feel immediate to a four-year-old
  // (ARCHITECTURE.md §6.1). Right wins when both directions are held, which is the
  // behaviour the game has always had.
  let vx = 0;
  if (input.left) vx = -MOVE_SPEED;
  if (input.right) vx = MOVE_SPEED;
  character.vx = vx;

  character.vy += GRAVITY * dt;
  if (input.jump && character.isOnGround) {
    character.vy = JUMP_VELOCITY;
    character.isJumping = true;
    character.justLanded = false;
  }

  // ── 2. X axis, resolved completely before Y is touched ────────────────────────
  const startX = character.x;
  let x = startX + vx * dt;

  const edgeMargin = half;
  if (x < edgeMargin) x = edgeMargin;
  else if (x > WORLD_WIDTH - edgeMargin) x = WORLD_WIDTH - edgeMargin;

  if (vx !== 0 && obstacles.length > 0) {
    // The vertical span used for the horizontal sweep is the *pre-move* one. That is what
    // axis separation means, and it is what lets a character standing exactly on top of a
    // log walk off its edge instead of being trapped by its side.
    const top = character.y - half;
    const bottom = character.y + half;

    if (vx > 0) {
      // Moving right: the only legal correction is to stop short. Take the nearest
      // blocking edge across every overlapping obstacle in one pass, so a second solid
      // sitting immediately behind the first cannot change the answer.
      let limit = Infinity;
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        const oHalfH = o.height / 2;
        if (bottom <= o.y - oHalfH || top >= o.y + oHalfH) continue;
        const oHalfW = o.width / 2;
        const oLeft = o.x - oHalfW;
        if (x + half <= oLeft || x - half >= o.x + oHalfW) continue;
        const stop = oLeft - half;
        if (stop < limit) limit = stop;
      }
      if (limit < x) x = limit;
    } else {
      // Moving left: mirror image.
      let limit = -Infinity;
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        const oHalfH = o.height / 2;
        if (bottom <= o.y - oHalfH || top >= o.y + oHalfH) continue;
        const oHalfW = o.width / 2;
        const oRight = o.x + oHalfW;
        if (x + half <= o.x - oHalfW || x - half >= oRight) continue;
        const stop = oRight + half;
        if (stop > limit) limit = stop;
      }
      if (limit > x) x = limit;
    }
  }

  character.x = x;

  // ── 3. Y axis, resolved against the already-final X ───────────────────────────
  const startY = character.y;
  let y = startY + character.vy * dt;
  let onGround = false;

  const groundCentreY = world.groundY - half;
  if (y >= groundCentreY) {
    y = groundCentreY;
    if (!character.isOnGround && !character.justLanded) character.justLanded = true;
    character.vy = 0;
    onGround = true;
    character.isJumping = false;
  }

  if (obstacles.length > 0) {
    const left = x - half;
    const right = x + half;

    if (character.vy >= 0) {
      // Falling (or resting). Land on any surface whose top plane the feet crossed this
      // tick. The crossing test — feet above the surface before, below it after — is
      // exact, which is why the old `+ 8px` fudge factor is gone.
      let limit = Infinity;
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        const oHalfW = o.width / 2;
        if (right <= o.x - oHalfW || left >= o.x + oHalfW) continue;
        const oTop = o.y - o.height / 2;
        if (startY + half > oTop || y + half <= oTop) continue;
        const stop = oTop - half;
        if (stop < limit) limit = stop;
      }
      if (limit < y) {
        y = limit;
        character.vy = 0;
        onGround = true;
        character.isJumping = false;
        character.justLanded = true;
      }
    } else {
      // Rising: bonk. Cannot happen with today's ankle-high obstacles and a 180 px tall
      // character, but leaving the case unhandled is how a taller obstacle in a later
      // scene silently becomes a tunnelling bug.
      let limit = -Infinity;
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        const oHalfW = o.width / 2;
        if (right <= o.x - oHalfW || left >= o.x + oHalfW) continue;
        const oBottom = o.y + o.height / 2;
        if (startY - half < oBottom || y - half >= oBottom) continue;
        const stop = oBottom + half;
        if (stop > limit) limit = stop;
      }
      if (limit > y) {
        y = limit;
        character.vy = 0;
      }
    }
  }

  character.y = y;
  character.isOnGround = onGround;

  // ── 4. Presentation state, derived from the physics ───────────────────────────
  let squashStretch = 1;
  if (!onGround && character.vy < STRETCH_VY) squashStretch = STRETCH_SCALE;
  if (!onGround && character.vy > SQUASH_VY) squashStretch = FALL_SQUASH_SCALE;
  if (onGround && character.justLanded) squashStretch = LAND_SQUASH_SCALE;
  character.squashStretch = squashStretch;

  character.tilt = vx > 0 ? TILT_DEGREES : vx < 0 ? -TILT_DEGREES : 0;

  // Facing right is the resting pose: the character only faces left while left is
  // actively held. Preserved from the original loop rather than "fixed", because
  // changing it changes how the game looks and that is not this story's call.
  character.facingRight = vx >= 0;
}
