import {
  CAMERA_LEAD,
  FINISH_MARGIN,
  GROUND_OFFSET,
  POINTS_PER_STAR,
  STAR_RADIUS,
} from "./constants";
import { Emitter } from "./emitter";
import { stepCharacter } from "./physics";
import type {
  CharacterState,
  GameEvent,
  GameEventType,
  InputState,
  ObstacleBox,
  Scene,
  StarState,
  WorldSpec,
} from "./types";
import { WORLD_WIDTH, generateStars, getObstaclesForScene } from "./world";

export interface GameCoreOptions {
  scene: Scene;
  viewportWidth: number;
  viewportHeight: number;
  /** Width and height of the character's square bounding box, px. */
  characterSize: number;
}

/**
 * The whole game, as a plain object.
 *
 * Nothing in this file imports React, and nothing in it touches the DOM. That is the
 * point of S4.1: the simulation can be stepped deterministically in a Node process under
 * vitest, and later driven by a canvas renderer (E5) without being rewritten.
 *
 * React hears about the game through {@link on}, and only on discrete events — a star
 * collected, the score changing, the level finishing. It is never told about a frame.
 */
export class GameCore {
  /** Live simulation state. Mutated in place; read by the renderer each frame. */
  readonly character: CharacterState;

  /** Previous tick's position, for render interpolation. */
  prevX = 0;
  prevY = 0;

  readonly stars: StarState[] = [];
  obstacles: ObstacleBox[] = [];

  score = 0;
  scene: Scene;
  levelComplete = false;

  private readonly emitter = new Emitter();
  private readonly input: InputState = { left: false, right: false, jump: false };
  private readonly world: WorldSpec;

  private viewportWidth: number;
  private viewportHeight: number;
  private characterSize: number;
  private finishTriggered = false;

  constructor(options: GameCoreOptions) {
    this.scene = options.scene;
    this.viewportWidth = options.viewportWidth;
    this.viewportHeight = options.viewportHeight;
    this.characterSize = options.characterSize;

    this.character = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isOnGround: true,
      facingRight: true,
      isJumping: false,
      justLanded: false,
      squashStretch: 1,
      tilt: 0,
    };

    this.world = { groundY: 0, halfSize: options.characterSize / 2, obstacles: [] };
    this.rebuildWorld();
    this.resetToStart();
  }

  // ── Queries ────────────────────────────────────────────────────────────────────

  /** Screen-space Y of the ground surface. */
  get groundY(): number {
    return this.viewportHeight - GROUND_OFFSET;
  }

  /** World-space X of the finish line. */
  get finishX(): number {
    return WORLD_WIDTH - FINISH_MARGIN;
  }

  /**
   * How far the world is scrolled, px. Derived rather than stored, so it can never drift
   * out of sync with the character.
   *
   * @param x World-space X to centre the camera on. Defaults to the character's.
   */
  cameraX(x: number = this.character.x): number {
    const raw = x - this.viewportWidth * CAMERA_LEAD;
    const max = WORLD_WIDTH - this.viewportWidth;
    if (raw < 0) return 0;
    return raw > max ? max : raw;
  }

  // ── Input ──────────────────────────────────────────────────────────────────────

  /**
   * Set one control's held state.
   *
   * Accepts the raw key names the keyboard and the on-screen D-pad already use, so the
   * input plumbing did not have to change for this story. E6 replaces this wholesale.
   */
  setKey(key: string, down: boolean): void {
    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.input.left = down;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.input.right = down;
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case " ":
        this.input.jump = down;
        break;
      default:
        break;
    }
  }

  /** Drop every held control. Used when the tab is backgrounded, so nothing sticks. */
  clearInput(): void {
    this.input.left = false;
    this.input.right = false;
    this.input.jump = false;
  }

  /** Read-only view of the current input, for tests and the dev overlay. */
  get inputState(): Readonly<InputState> {
    return this.input;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────────

  /** React to a resize or a character-size change. Never called from inside the loop. */
  setViewport(width: number, height: number): void {
    if (width === this.viewportWidth && height === this.viewportHeight) return;
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.rebuildWorld();
    // Keep the character standing on the new ground rather than floating or buried.
    const groundCentreY = this.groundY - this.world.halfSize;
    if (this.character.y > groundCentreY) this.character.y = groundCentreY;
  }

  setCharacterSize(size: number): void {
    if (size === this.characterSize) return;
    this.characterSize = size;
    this.world.halfSize = size / 2;
    this.resetToStart();
  }

  /** Put the character back at the start of the world and re-lay the stars. */
  resetToStart(): void {
    const c = this.character;
    c.x = this.viewportWidth * CAMERA_LEAD;
    c.y = this.groundY - this.world.halfSize;
    c.vx = 0;
    c.vy = 0;
    c.isOnGround = true;
    c.facingRight = true;
    c.isJumping = false;
    c.justLanded = false;
    c.squashStretch = 1;
    c.tilt = 0;
    this.prevX = c.x;
    this.prevY = c.y;

    this.resetStars();
    this.score = 0;
    this.finishTriggered = false;
    this.levelComplete = false;
  }

  /** Switch level. Obstacles, stars, score and position all reset, as they always have. */
  changeScene(scene: Scene): void {
    this.scene = scene;
    this.rebuildWorld();
    this.resetToStart();
  }

  private rebuildWorld(): void {
    this.world.groundY = this.groundY;
    this.world.halfSize = this.characterSize / 2;
    this.obstacles = getObstaclesForScene(this.scene, this.groundY);
    this.world.obstacles = this.obstacles;
  }

  private resetStars(): void {
    const fresh = generateStars(this.scene, this.groundY);
    // Reuse the array so anything holding a reference to it — the DOM star layer — keeps
    // seeing the live data instead of a stale copy.
    this.stars.length = 0;
    for (let i = 0; i < fresh.length; i++) this.stars.push(fresh[i]);
  }

  // ── Events ─────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to a discrete game event.
   *
   * @returns an unsubscribe function.
   */
  on(type: GameEventType, handler: (event: GameEvent) => void): () => void {
    return this.emitter.on(type, handler);
  }

  /** Drop every subscriber. Call on unmount. */
  dispose(): void {
    this.emitter.clear();
  }

  // ── Simulation ─────────────────────────────────────────────────────────────────

  /**
   * Advance the whole game by one fixed logic tick.
   *
   * @param dt Seconds. Always the fixed tick from the accumulator, never a raw frame time.
   */
  step(dt: number): void {
    const c = this.character;
    this.prevX = c.x;
    this.prevY = c.y;

    stepCharacter(c, this.input, this.world, dt);

    this.checkFinish();
    this.collectStars();
  }

  private checkFinish(): void {
    if (this.finishTriggered) return;
    if (this.character.x < this.finishX - this.world.halfSize) return;
    this.finishTriggered = true;
    this.levelComplete = true;
    this.emitter.emit({ type: "levelComplete", score: this.score });
  }

  private collectStars(): void {
    const reach = STAR_RADIUS + this.world.halfSize;
    // The pickup point is the character's upper body, not the centre of the box — a
    // 180 px box around a child's drawing is mostly empty space at the top.
    const px = this.character.x;
    const py = this.character.y - this.characterSize / 4;

    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      if (s.collected) continue;
      const dx = px - s.worldX;
      if (dx >= reach || dx <= -reach) continue;
      const dy = py - s.worldY;
      if (dy >= reach || dy <= -reach) continue;

      s.collected = true;
      this.score += POINTS_PER_STAR;
      this.emitter.emit({ type: "starCollected", id: s.id, score: this.score });
      this.emitter.emit({ type: "score", score: this.score });
    }
  }
}
