/**
 * Frame-time meter for the dev overlay.
 *
 * S4.1 requires a measurable before/after frame-time comparison rather than an assertion
 * that things feel smoother. This records the numbers; the overlay in `GameStage` prints
 * them. Append `?debug` to the URL to switch it on.
 *
 * Costs one `push`-free array write and a handful of arithmetic per frame — no
 * allocation, so measuring does not perturb what is being measured.
 */
export class FrameMeter {
  private readonly samples: Float32Array;
  private index = 0;
  private filled = 0;
  private lastMs = 0;

  /** Frames whose wall-clock cost exceeded the 60 Hz budget of 16.67 ms. */
  longFrames = 0;
  /** Total frames observed since the last {@link reset}. */
  frames = 0;
  /** Logic ticks run since the last {@link reset}. */
  steps = 0;
  /** Worst single frame seen since the last {@link reset}, ms. */
  worstMs = 0;

  constructor(private readonly window = 120) {
    this.samples = new Float32Array(window);
  }

  /**
   * Record one frame.
   *
   * @param nowMs Timestamp from `requestAnimationFrame`.
   * @param steps How many logic ticks the accumulator ran for this frame.
   */
  sample(nowMs: number, steps: number): void {
    if (this.lastMs !== 0) {
      const delta = nowMs - this.lastMs;
      // Ignore the pathological first frame after a tab resume, which is not a render cost.
      if (delta > 0 && delta < 1000) {
        this.samples[this.index] = delta;
        this.index = (this.index + 1) % this.window;
        if (this.filled < this.window) this.filled++;
        if (delta > this.worstMs) this.worstMs = delta;
        if (delta > 16.67) this.longFrames++;
        this.frames++;
      }
    }
    this.lastMs = nowMs;
    this.steps += steps;
  }

  /** Mean frame time over the rolling window, ms. `0` before any samples. */
  get averageMs(): number {
    if (this.filled === 0) return 0;
    let total = 0;
    for (let i = 0; i < this.filled; i++) total += this.samples[i];
    return total / this.filled;
  }

  /** Frames per second implied by {@link averageMs}. */
  get fps(): number {
    const avg = this.averageMs;
    return avg > 0 ? 1000 / avg : 0;
  }

  reset(): void {
    this.samples.fill(0);
    this.index = 0;
    this.filled = 0;
    this.lastMs = 0;
    this.longFrames = 0;
    this.frames = 0;
    this.steps = 0;
    this.worstMs = 0;
  }
}
