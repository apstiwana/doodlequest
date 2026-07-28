/**
 * Physics and feel constants for the game core.
 *
 * **Every constant here is per second, never per frame.** The pre-S4.2 loop added
 * `GRAVITY = 0.55` to `vy` once per `requestAnimationFrame` tick, which made the
 * simulation run at whatever rate the display happened to refresh at — literal double
 * speed on a 120 Hz ProMotion iPad, with jumps reaching half the height. That is a
 * correctness bug, not a tuning problem (ARCHITECTURE.md §2, §6.1).
 *
 * The values below are the old per-frame values converted exactly, so the game at 60 Hz
 * behaves precisely as it did before:
 *
 *   px/frame²  ->  px/s²   multiply by 60² = 3600     0.55 * 3600 = 1980
 *   px/frame   ->  px/s    multiply by 60             -18  * 60   = -1080
 *                                                       5  * 60   =   300
 *
 * No constant was re-tuned. If one ever is, say so in the change note — a tuning change
 * is a claim about how the game should feel, not a refactor.
 */

/** Downward acceleration, px/s². Was 0.55 px/frame². */
export const GRAVITY = 1980;

/** Instantaneous upward velocity applied on jump, px/s. Was -18 px/frame. */
export const JUMP_VELOCITY = -1080;

/** Horizontal run speed, px/s. Was 5 px/frame. */
export const MOVE_SPEED = 300;

/** Distance from the bottom of the viewport to the ground surface, px. */
export const GROUND_OFFSET = 90;

/** The character sits this fraction across the screen while the camera scrolls. */
export const CAMERA_LEAD = 0.4;

/** Logic tick length, seconds. The accumulator always steps by exactly this. */
export const FIXED_DT = 1 / 60;

/**
 * Longest wall-clock slice a single frame may contribute, seconds.
 * Without this clamp a backgrounded tab returns with a multi-minute elapsed time and the
 * accumulator either spirals or teleports the character across the world.
 */
export const MAX_FRAME_TIME = 0.25;

/** Half-width of a star's pickup box, px. */
export const STAR_RADIUS = 40;

/** Score awarded per star. The HUD divides by this to show a count. */
export const POINTS_PER_STAR = 10;

/** The finish line sits this far in from the right-hand edge of the world, px. */
export const FINISH_MARGIN = 80;

/** Rising faster than this stretches the character, px/s. Was -4 px/frame. */
export const STRETCH_VY = -240;

/** Falling faster than this squashes the character, px/s. Was 4 px/frame. */
export const SQUASH_VY = 240;

/** Horizontal speed above which the run animation plays, px/s. Was 0.5 px/frame. */
export const MOVING_VX = 30;

export const STRETCH_SCALE = 1.25;
export const FALL_SQUASH_SCALE = 0.85;
export const LAND_SQUASH_SCALE = 1.3;
export const TILT_DEGREES = 8;
