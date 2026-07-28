import { memo } from "react";
import { Scene } from "@/types/game";
import type { StarState } from "@/game/types";

/**
 * Star *positions and collection* are simulation state and live in `src/game/` from S4.1
 * onwards (`world.ts` lays them out, `core.ts` collects them). This file draws them.
 */
export type Star = StarState;

// Scene-specific star colors
const STAR_COLORS: Record<Scene, string[]> = {
  forest:     ["#FFE66D", "#90EE90", "#FFD700", "#ADFF2F"],
  underwater: ["#60efff", "#4ECDC4", "#FFE66D", "#87CEEB"],
  city:       ["#FFB347", "#FFE66D", "#FF69B4", "#c084fc"],
  moon:       ["#c0c8e0", "#E8E8FF", "#FFE66D", "#9090D0"],
  space:      ["#c084fc", "#60efff", "#FFE66D", "#FF69B4"],
};

interface CollectibleStarsProps {
  /**
   * The live star array owned by the game core. It is mutated in place, so this component
   * cannot detect a collection from the array's identity — `version` is what tells it.
   */
  stars: Star[];
  scene: Scene;
  /** Bumped by `GameStage` once per star collected. The only reason this re-renders. */
  version: number;
}

/**
 * Draws the twelve uncollected stars in **world** coordinates, inside the layer the loop
 * scrolls. Memoized and camera-free for the same reason as `ObstaclesLayer`: re-rendering
 * to cull off-screen stars meant re-rendering every frame.
 */
export const CollectibleStarsLayer = memo(function CollectibleStarsLayer({
  stars,
  scene,
}: CollectibleStarsProps) {
  const colors = STAR_COLORS[scene];

  return (
    <>
      {stars.map((star) => {
        if (star.collected) return null;

        const color = colors[star.id % colors.length];
        return (
          <div
            key={star.id}
            className="absolute pointer-events-none"
            style={{
              left: star.worldX - 36,
              top: star.worldY - 36,
              width: 72,
              height: 72,
            }}
          >
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full animate-sparkle"
              style={{
                background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
                transform: "scale(2)",
                animationDelay: `${(star.id * 0.3) % 1.5}s`,
              }}
            />
            {/* Star emoji with sparkle */}
            <div
              className="absolute inset-0 flex items-center justify-center text-5xl animate-star-spin"
              style={{
                animationDuration: `${2 + (star.id % 3) * 0.5}s`,
                filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}88)`,
              }}
            >
              ⭐
            </div>
          </div>
        );
      })}
    </>
  );
});

/** Collect animation: burst of mini-stars flying outward */
export function StarCollectBurst({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - 30, top: y - 30, width: 60, height: 60 }}
    >
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={i}
          className="absolute text-sm"
          style={{
            left: "50%",
            top: "50%",
            animation: `star-burst-out 0.5s ${i * 0.04}s ease-out forwards`,
            ["--deg" as string]: `${deg}deg`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
}
