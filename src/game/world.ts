import type { ObstacleBox, Scene, StarState } from "./types";

/**
 * World geometry and level data.
 *
 * This used to live inside `SceneBackground.tsx`, `Obstacles.tsx` and
 * `CollectibleStars.tsx`, which meant the simulation could not be run without React. It
 * is plain data and plain functions now; the components import it, not the other way
 * round.
 */

/** The world is three viewport-widths wide. */
export const WORLD_WIDTH = 3600;

/** Logical height of every background SVG, anchored to the bottom of the viewport. */
export const WORLD_HEIGHT = 700;

type ObstacleConfig = { x: number; w: number; h: number; type: string };

const OBSTACLE_CONFIG: Record<Scene, ObstacleConfig[]> = {
  forest: [
    { x: 550, w: 55, h: 34, type: "log" },
    { x: 900, w: 40, h: 38, type: "rock" },
    { x: 1300, w: 60, h: 32, type: "log" },
    { x: 1700, w: 45, h: 36, type: "rock" },
    { x: 2100, w: 55, h: 34, type: "log" },
    { x: 2550, w: 65, h: 30, type: "stump" },
    { x: 2950, w: 50, h: 38, type: "rock" },
    { x: 3300, w: 55, h: 34, type: "log" },
  ],
  underwater: [
    { x: 500, w: 50, h: 36, type: "coral" },
    { x: 850, w: 40, h: 34, type: "shell" },
    { x: 1250, w: 55, h: 36, type: "coral" },
    { x: 1650, w: 45, h: 34, type: "rock" },
    { x: 2050, w: 55, h: 36, type: "coral" },
    { x: 2450, w: 50, h: 34, type: "shell" },
    { x: 2850, w: 60, h: 36, type: "coral" },
    { x: 3250, w: 50, h: 34, type: "rock" },
  ],
  city: [
    { x: 480, w: 50, h: 34, type: "barrel" },
    { x: 880, w: 60, h: 32, type: "crate" },
    { x: 1280, w: 45, h: 38, type: "barrel" },
    { x: 1680, w: 60, h: 34, type: "crate" },
    { x: 2080, w: 50, h: 32, type: "barrel" },
    { x: 2480, w: 65, h: 30, type: "crate" },
    { x: 2880, w: 50, h: 38, type: "barrel" },
    { x: 3280, w: 60, h: 34, type: "crate" },
  ],
  moon: [
    { x: 520, w: 55, h: 32, type: "moonrock" },
    { x: 920, w: 45, h: 36, type: "crater" },
    { x: 1320, w: 60, h: 32, type: "moonrock" },
    { x: 1720, w: 50, h: 36, type: "crater" },
    { x: 2120, w: 55, h: 34, type: "moonrock" },
    { x: 2520, w: 65, h: 32, type: "crater" },
    { x: 2920, w: 55, h: 36, type: "moonrock" },
    { x: 3320, w: 50, h: 34, type: "crater" },
  ],
  space: [
    { x: 500, w: 50, h: 36, type: "asteroid" },
    { x: 900, w: 60, h: 34, type: "crate" },
    { x: 1300, w: 50, h: 38, type: "asteroid" },
    { x: 1700, w: 60, h: 34, type: "crate" },
    { x: 2100, w: 55, h: 36, type: "asteroid" },
    { x: 2500, w: 65, h: 32, type: "crate" },
    { x: 2900, w: 55, h: 38, type: "asteroid" },
    { x: 3300, w: 60, h: 34, type: "crate" },
  ],
};

/**
 * Build the obstacle boxes for a scene.
 *
 * Called on mount, on scene change and on resize — never inside the loop, because it
 * allocates.
 *
 * @param scene   Which level's furniture to build.
 * @param groundY Screen-space Y of the ground surface; obstacles rest their bottom edge on it.
 */
export function getObstaclesForScene(scene: Scene, groundY: number): ObstacleBox[] {
  return OBSTACLE_CONFIG[scene].map(({ x, w, h, type }) => ({
    x,
    y: groundY - h / 2, // centre Y, so the bottom edge sits exactly on groundY
    width: w,
    height: h,
    type,
  }));
}

/**
 * Deterministic star layout for a scene. Same scene and ground height always produce the
 * same twelve positions, so a level is the same every time a child replays it.
 *
 * @param scene   Which level.
 * @param groundY Screen-space Y of the ground surface.
 */
export function generateStars(scene: Scene, groundY: number): StarState[] {
  let seed = 0;
  for (let i = 0; i < scene.length; i++) seed += scene.charCodeAt(i);

  const stars: StarState[] = [];
  const count = 12;
  const step = (WORLD_WIDTH - 300) / count;
  const heights = [
    groundY - 60, // just above the ground
    groundY - 140, // mid-air
    groundY - 230, // high
  ];

  for (let i = 0; i < count; i++) {
    const offset = ((seed * (i + 1) * 137) % 200) - 100;
    const heightVariant = (seed * (i + 3) * 97) % 3;
    stars.push({
      id: i,
      worldX: 200 + step * i + offset,
      worldY: heights[heightVariant],
      collected: false,
    });
  }
  return stars;
}
