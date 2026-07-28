import { FIXED_DT, MAX_FRAME_TIME } from "./constants";

export interface LoopCallbacks {
  /** Advance the simulation by exactly `dt` seconds. */
  step(dt: number): void;
  /**
   * Draw. `alpha` is how far the display time has advanced into the next logic tick,
   * 0 .. 1, for interpolating between the previous and current simulation positions.
   */
  render(alpha: number): void;
}

export interface LoopOptions {
  /** Logic tick length in seconds. Defaults to 1/60. */
  dt?: number;
  /** Longest wall-clock slice one frame may contribute, seconds. Defaults to 0.25. */
  maxFrameTime?: number;
}

/**
 * Fixed-timestep accumulator (ARCHITECTURE.md §6.1; the canonical write-up is Glenn
 * Fiedler's "Fix Your Timestep!").
 *
 * The simulation is always advanced in whole ticks of exactly `dt`, however often the
 * display refreshes. This is what makes the game run at the same speed on a 60 Hz laptop
 * and a 120 Hz ProMotion iPad — the defect S4.2 exists to fix.
 *
 * {@link advance} is the entire algorithm and takes elapsed seconds as an argument, so it
 * can be driven by a test with no `requestAnimationFrame`, no `performance.now()` and no
 * DOM at all. {@link start} is only the browser plumbing on top of it.
 */
export class FixedTimestepLoop {
  private readonly dt: number;
  private readonly maxFrameTime: number;
  private accumulator = 0;
  private previousMs = 0;
  private running = false;
  private rafId = 0;
  private visibilityBound: (() => void) | null = null;

  constructor(
    private readonly callbacks: LoopCallbacks,
    options: LoopOptions = {},
  ) {
    this.dt = options.dt ?? FIXED_DT;
    this.maxFrameTime = options.maxFrameTime ?? MAX_FRAME_TIME;
  }

  /** Seconds of un-simulated time currently banked. Exposed for tests. */
  get pending(): number {
    return this.accumulator;
  }

  /**
   * Consume `elapsedSeconds` of wall-clock time: run as many whole logic ticks as it
   * pays for, bank the remainder, then render once.
   *
   * @param elapsedSeconds Time since the previous frame. Clamped to `maxFrameTime`;
   *   negative, NaN and zero values are treated as zero, because a clock that goes
   *   backwards must not rewind the game.
   * @returns How many logic ticks ran, so a caller or test can assert on it.
   */
  advance(elapsedSeconds: number): number {
    let elapsed = elapsedSeconds;
    if (!(elapsed > 0)) elapsed = 0;
    if (elapsed > this.maxFrameTime) elapsed = this.maxFrameTime;

    this.accumulator += elapsed;

    let steps = 0;
    while (this.accumulator >= this.dt) {
      this.callbacks.step(this.dt);
      this.accumulator -= this.dt;
      steps++;
    }

    this.callbacks.render(this.accumulator / this.dt);
    return steps;
  }

  /**
   * Throw away banked time and forget the previous frame's timestamp.
   *
   * Called when the tab becomes visible again: without it the first frame after a
   * ten-minute background reports a ten-minute elapsed time and — even with the clamp —
   * hands the player a character that has lurched forward for no reason.
   */
  reset(): void {
    this.accumulator = 0;
    this.previousMs = 0;
  }

  /** Whether the rAF loop is currently scheduled. */
  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Start driving {@link advance} from `requestAnimationFrame`, and pause automatically
   * while the tab is hidden.
   *
   * A no-op in an environment without `requestAnimationFrame` — the loop is still fully
   * usable there via {@link advance}, which is how the unit tests drive it.
   */
  start(): void {
    if (this.running) return;
    if (typeof requestAnimationFrame !== "function") return;

    this.running = true;
    this.reset();
    this.rafId = requestAnimationFrame(this.frame);

    if (typeof document !== "undefined" && !this.visibilityBound) {
      this.visibilityBound = () => {
        if (document.visibilityState === "hidden") this.pause();
        else this.resume();
      };
      document.addEventListener("visibilitychange", this.visibilityBound);
    }
  }

  /** Stop the loop and detach the visibility listener. */
  stop(): void {
    this.pause();
    if (this.visibilityBound && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityBound);
    }
    this.visibilityBound = null;
  }

  private pause(): void {
    if (!this.running) return;
    this.running = false;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private resume(): void {
    if (this.running) return;
    if (typeof requestAnimationFrame !== "function") return;
    this.running = true;
    this.reset();
    this.rafId = requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    if (this.previousMs === 0) this.previousMs = now;
    const elapsed = (now - this.previousMs) / 1000;
    this.previousMs = now;
    this.advance(elapsed);
    if (this.running) this.rafId = requestAnimationFrame(this.frame);
  };
}
