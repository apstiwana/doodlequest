import { Scene } from "@/types/game";
import { WORLD_WIDTH } from "./SceneBackground";

// Finish line sits 80px from the right edge of the world
const FINISH_X = WORLD_WIDTH - 80;

interface FinishLineProps {
  scene: Scene;
  cameraX: number;
  groundY: number; // world groundY (top of ground strip)
}

const FLAG_COLORS: Record<Scene, { pole: string; flag1: string; flag2: string; banner: string; glow: string }> = {
  forest:    { pole: "#8B4513", flag1: "#FF6B6B", flag2: "#FFE66D", banner: "#2E8B57", glow: "#90EE90" },
  underwater:{ pole: "#C2A06E", flag1: "#4ECDC4", flag2: "#FFB6C1", banner: "#006994", glow: "#40B4CA" },
  city:      { pole: "#4a5568", flag1: "#FF6B6B", flag2: "#fff",    banner: "#FFB347", glow: "#FFE66D" },
  moon:      { pole: "#aaa",    flag1: "#FFE66D", flag2: "#fff",    banner: "#1a1a2e", glow: "#c0c8e0" },
  space:     { pole: "#8E44AD", flag1: "#E74C3C", flag2: "#FFE66D", banner: "#1a0a2e", glow: "#c084fc" },
};

const SCENE_LABEL: Record<Scene, string> = {
  forest:    "🌲 Finish!",
  underwater:"🐠 Finish!",
  city:      "🏙️ Finish!",
  moon:      "🌙 Finish!",
  space:     "🚀 Finish!",
};

export function FinishLine({ scene, cameraX, groundY }: FinishLineProps) {
  const screenX = FINISH_X - cameraX;

  // Don't render if off-screen
  if (screenX > window.innerWidth + 200 || screenX < -200) return null;

  const c = FLAG_COLORS[scene];
  const poleHeight = 140;
  const poleTop = groundY - poleHeight;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: screenX - 4, top: 0, width: 220, height: "100%" }}
    >
      {/* Checkered finish strip on the ground */}
      <div
        className="absolute"
        style={{
          left: -12,
          top: groundY - 4,
          width: 40,
          height: 18,
          background: `repeating-linear-gradient(
            90deg,
            #fff 0px, #fff 8px,
            #111 8px, #111 16px
          )`,
          opacity: 0.85,
          borderRadius: 2,
          boxShadow: "0 0 6px rgba(255,255,255,0.4)",
        }}
      />

      {/* Pole */}
      <div
        className="absolute"
        style={{
          left: 4,
          top: poleTop,
          width: 6,
          height: poleHeight,
          background: `linear-gradient(90deg, ${c.pole} 0%, #ddd 40%, ${c.pole} 100%)`,
          borderRadius: 3,
          boxShadow: `0 0 8px rgba(0,0,0,0.5)`,
        }}
      />

      {/* Waving flag */}
      <div
        className="absolute animate-flag-wave"
        style={{
          left: 10,
          top: poleTop + 4,
          width: 60,
          height: 36,
          background: `linear-gradient(135deg, ${c.flag1} 50%, ${c.flag2} 50%)`,
          clipPath: "polygon(0% 0%, 100% 15%, 100% 85%, 0% 100%)",
          boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
          transformOrigin: "left center",
        }}
      />

      {/* Banner / label */}
      <div
        className="absolute whitespace-nowrap font-bold text-sm px-3 py-1 rounded-full shadow-lg"
        style={{
          left: -10,
          top: poleTop - 36,
          background: c.banner,
          color: "#fff",
          border: `2px solid ${c.glow}`,
          boxShadow: `0 0 12px ${c.glow}88`,
          fontSize: "13px",
          letterSpacing: "0.03em",
        }}
      >
        {SCENE_LABEL[scene]}
      </div>
    </div>
  );
}
