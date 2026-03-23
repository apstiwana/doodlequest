import { Scene } from "@/types/game";
import { WORLD_WIDTH } from "./SceneBackground";

export interface Star {
  id: number;
  worldX: number;  // world-space X
  worldY: number;  // world-space Y (screen Y)
  collected: boolean;
}

// Scene-specific star colors
const STAR_COLORS: Record<Scene, string[]> = {
  forest:     ["#FFE66D", "#90EE90", "#FFD700", "#ADFF2F"],
  underwater: ["#60efff", "#4ECDC4", "#FFE66D", "#87CEEB"],
  city:       ["#FFB347", "#FFE66D", "#FF69B4", "#c084fc"],
  moon:       ["#c0c8e0", "#E8E8FF", "#FFE66D", "#9090D0"],
  space:      ["#c084fc", "#60efff", "#FFE66D", "#FF69B4"],
};

// Generate deterministic star positions for each scene
export function generateStars(scene: Scene, groundY: number): Star[] {
  // Seed the positions so they're always the same per scene
  const seeds: number[] = [];
  for (let i = 0; i < scene.length; i++) seeds.push(scene.charCodeAt(i));
  const seed = seeds.reduce((a, b) => a + b, 0);

  const stars: Star[] = [];
  const count = 12;
  const step = (WORLD_WIDTH - 300) / count;

  for (let i = 0; i < count; i++) {
    // Pseudo-random but deterministic position within each segment
    const offset = ((seed * (i + 1) * 137) % 200) - 100;
    const heightVariant = ((seed * (i + 3) * 97) % 3); // 0,1,2 → ground, mid, high
    const heights = [
      groundY - 60,      // just above ground
      groundY - 140,     // mid-air
      groundY - 230,     // high
    ];

    stars.push({
      id: i,
      worldX: 200 + step * i + offset,
      worldY: heights[heightVariant],
      collected: false,
    });
  }
  return stars;
}

interface CollectibleStarsProps {
  stars: Star[];
  cameraX: number;
  scene: Scene;
}

export function CollectibleStarsLayer({ stars, cameraX, scene }: CollectibleStarsProps) {
  const colors = STAR_COLORS[scene];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => {
        if (star.collected) return null;
        const screenX = star.worldX - cameraX;
        if (screenX < -50 || screenX > window.innerWidth + 50) return null;

        const color = colors[star.id % colors.length];
        return (
          <div
            key={star.id}
            className="absolute"
            style={{
              left: screenX - 18,
              top: star.worldY - 18,
              width: 36,
              height: 36,
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
              className="absolute inset-0 flex items-center justify-center text-2xl animate-star-spin"
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
    </div>
  );
}

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
