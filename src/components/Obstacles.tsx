import { Scene } from "@/types/game";

export interface Obstacle {
  x: number;       // world x center
  y: number;       // world y center (top of ground = same as character ground level)
  width: number;
  height: number;
  type: string;
}

// Ground Y in world coords = window.innerHeight - 90 (GROUND_OFFSET)
// Obstacles sit ON the ground, so their bottom = groundY + characterHalfSize
// We define them by world-x and dimensions; GameStage handles collision

const makeObstacles = (scene: Scene, groundY: number): Obstacle[] => {
  // Spread obstacles across world width ~3600, avoiding start area (<400)
  const configs: { x: number; w: number; h: number; type: string }[] = {
    forest: [
      { x: 550,  w: 55, h: 34, type: "log" },
      { x: 900,  w: 40, h: 38, type: "rock" },
      { x: 1300, w: 60, h: 32, type: "log" },
      { x: 1700, w: 45, h: 36, type: "rock" },
      { x: 2100, w: 55, h: 34, type: "log" },
      { x: 2550, w: 65, h: 30, type: "stump" },
      { x: 2950, w: 50, h: 38, type: "rock" },
      { x: 3300, w: 55, h: 34, type: "log" },
    ],
    underwater: [
      { x: 500,  w: 50, h: 36, type: "coral" },
      { x: 850,  w: 40, h: 34, type: "shell" },
      { x: 1250, w: 55, h: 36, type: "coral" },
      { x: 1650, w: 45, h: 34, type: "rock" },
      { x: 2050, w: 55, h: 36, type: "coral" },
      { x: 2450, w: 50, h: 34, type: "shell" },
      { x: 2850, w: 60, h: 36, type: "coral" },
      { x: 3250, w: 50, h: 34, type: "rock" },
    ],
    city: [
      { x: 480,  w: 50, h: 34, type: "barrel" },
      { x: 880,  w: 60, h: 32, type: "crate" },
      { x: 1280, w: 45, h: 38, type: "barrel" },
      { x: 1680, w: 60, h: 34, type: "crate" },
      { x: 2080, w: 50, h: 32, type: "barrel" },
      { x: 2480, w: 65, h: 30, type: "crate" },
      { x: 2880, w: 50, h: 38, type: "barrel" },
      { x: 3280, w: 60, h: 34, type: "crate" },
    ],
    moon: [
      { x: 520,  w: 55, h: 32, type: "moonrock" },
      { x: 920,  w: 45, h: 36, type: "crater" },
      { x: 1320, w: 60, h: 32, type: "moonrock" },
      { x: 1720, w: 50, h: 36, type: "crater" },
      { x: 2120, w: 55, h: 34, type: "moonrock" },
      { x: 2520, w: 65, h: 32, type: "crater" },
      { x: 2920, w: 55, h: 36, type: "moonrock" },
      { x: 3320, w: 50, h: 34, type: "crater" },
    ],
    space: [
      { x: 500,  w: 50, h: 36, type: "asteroid" },
      { x: 900,  w: 60, h: 34, type: "crate" },
      { x: 1300, w: 50, h: 38, type: "asteroid" },
      { x: 1700, w: 60, h: 34, type: "crate" },
      { x: 2100, w: 55, h: 36, type: "asteroid" },
      { x: 2500, w: 65, h: 32, type: "crate" },
      { x: 2900, w: 55, h: 38, type: "asteroid" },
      { x: 3300, w: 60, h: 34, type: "crate" },
    ],
  }[scene];

  return configs.map(({ x, w, h, type }) => ({
    x,
    y: groundY - h / 2,
    width: w,
    height: h,
    type,
  }));
};

// Per-scene SVG renderers
function ObstacleSvg({ type, width, height }: { type: string; width: number; height: number }) {
  const w = width;
  const h = height;

  if (type === "log") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="4" y="8" width={w-8} height={h-8} rx="6" fill="#8B4513" />
      <ellipse cx={w/2} cy="8" rx={(w-8)/2} ry="7" fill="#A0522D" />
      <ellipse cx={w/2} cy="8" rx={(w-14)/2} ry="5" fill="#CD853F" />
      {/* grain lines */}
      <line x1="6" y1="20" x2={w-6} y2="20" stroke="#6B3410" strokeWidth="1.5" opacity="0.5" />
      <line x1="6" y1="30" x2={w-6} y2="30" stroke="#6B3410" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );

  if (type === "rock" || type === "moonrock") {
    const fill = type === "moonrock" ? "#8B9099" : "#6B7280";
    const light = type === "moonrock" ? "#A0A8B0" : "#9CA3AF";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon points={`${w*0.1},${h} ${w*0.05},${h*0.5} ${w*0.3},${h*0.1} ${w*0.65},${h*0.05} ${w*0.95},${h*0.4} ${w},${h}`} fill={fill} />
        <polygon points={`${w*0.05},${h*0.5} ${w*0.3},${h*0.1} ${w*0.55},${h*0.08}`} fill={light} opacity="0.5" />
      </svg>
    );
  }

  if (type === "stump") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x={w*0.15} y={h*0.3} width={w*0.7} height={h*0.7} rx="4" fill="#7B5230" />
      <ellipse cx={w/2} cy={h*0.3} rx={w*0.38} ry={h*0.14} fill="#A0722A" />
      <ellipse cx={w/2} cy={h*0.3} rx={w*0.24} ry={h*0.08} fill="#C49A40" />
      <line x1={w*0.2} y1={h*0.55} x2={w*0.8} y2={h*0.55} stroke="#5a3a18" strokeWidth="1.5" opacity="0.4" />
      <line x1={w*0.2} y1={h*0.7} x2={w*0.8} y2={h*0.7} stroke="#5a3a18" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );

  if (type === "coral") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {[w*0.2, w*0.5, w*0.78].map((cx, i) => (
        <g key={i}>
          <rect x={cx-5} y={h*0.2-i*8} width="10" height={h*0.8+i*8} fill={["#FF6B6B","#FF8C69","#FF7F50"][i]} rx="5" />
          <circle cx={cx} cy={h*0.2-i*8} r="8" fill={["#FF8C69","#FFA07A","#FF6347"][i]} />
        </g>
      ))}
    </svg>
  );

  if (type === "shell") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <ellipse cx={w/2} cy={h*0.65} rx={w*0.42} ry={h*0.38} fill="#F0E68C" />
      <ellipse cx={w/2} cy={h*0.65} rx={w*0.42} ry={h*0.38} fill="none" stroke="#D4B483" strokeWidth="2" />
      {[-1,0,1].map(i => (
        <line key={i} x1={w/2+i*8} y1={h*0.3} x2={w/2+i*12} y2={h} stroke="#D4B483" strokeWidth="1.5" opacity="0.6" />
      ))}
    </svg>
  );

  if (type === "barrel") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x={w*0.12} y={h*0.05} width={w*0.76} height={h*0.9} rx="8" fill="#8B4513" />
      {[0.22, 0.5, 0.78].map((t, i) => (
        <rect key={i} x={w*0.08} y={h*t - 3} width={w*0.84} height="6" rx="3" fill="#5a2d0c" />
      ))}
      <rect x={w*0.08} y={h*0.22-3} width={w*0.84} height="6" rx="3" fill="#D2691E" opacity="0.4" />
    </svg>
  );

  if (type === "crate") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="3" y="3" width={w-6} height={h-6} rx="4" fill="#D2B48C" stroke="#A0784A" strokeWidth="3" />
      <line x1="3" y1="3" x2={w-3} y2={h-3} stroke="#A0784A" strokeWidth="2" opacity="0.5" />
      <line x1={w-3} y1="3" x2="3" y2={h-3} stroke="#A0784A" strokeWidth="2" opacity="0.5" />
      <rect x="3" y={h/2-2} width={w-6} height="4" fill="#A0784A" opacity="0.5" />
      <rect x={w/2-2} y="3" width="4" height={h-6} fill="#A0784A" opacity="0.5" />
    </svg>
  );

  if (type === "crater") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <ellipse cx={w/2} cy={h*0.7} rx={w*0.45} ry={h*0.35} fill="#6B7280" />
      <ellipse cx={w/2} cy={h*0.7} rx={w*0.3} ry={h*0.22} fill="#4B5563" />
      <ellipse cx={w/2} cy={h*0.62} rx={w*0.3} ry={h*0.22} fill="none" stroke="#9CA3AF" strokeWidth="2" opacity="0.5" />
    </svg>
  );

  if (type === "asteroid") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={`${w*0.1},${h*0.9} ${w*0.05},${h*0.5} ${w*0.2},${h*0.1} ${w*0.55},${h*0.05} ${w*0.9},${h*0.2} ${w*0.95},${h*0.65} ${w*0.75},${h*0.95}`} fill="#4B5563" />
      <circle cx={w*0.35} cy={h*0.35} r={w*0.1} fill="#374151" opacity="0.8" />
      <circle cx={w*0.65} cy={h*0.6} r={w*0.08} fill="#374151" opacity="0.8" />
      <polygon points={`${w*0.1},${h*0.9} ${w*0.05},${h*0.5} ${w*0.2},${h*0.1}`} fill="#6B7280" opacity="0.4" />
    </svg>
  );

  // fallback box
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="2" y="2" width={w-4} height={h-4} rx="6" fill="#6B7280" />
    </svg>
  );
}

interface ObstaclesLayerProps {
  scene: Scene;
  cameraX: number;
  groundY: number; // screen groundY
}

export function getObstaclesForScene(scene: Scene, groundY: number): Obstacle[] {
  return makeObstacles(scene, groundY);
}

export function ObstaclesLayer({ scene, cameraX, groundY }: ObstaclesLayerProps) {
  const obstacles = makeObstacles(scene, groundY);

  return (
    <>
      {obstacles.map((obs, i) => {
        const screenX = obs.x - cameraX - obs.width / 2;
        const screenY = obs.y - obs.height / 2;
        // Only render if near viewport
        if (screenX > window.innerWidth + 100 || screenX < -obs.width - 100) return null;
        return (
          <div
            key={`${scene}-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: screenX,
              top: screenY,
              width: obs.width,
              height: obs.height,
            }}
          >
            <ObstacleSvg type={obs.type} width={obs.width} height={obs.height} />
          </div>
        );
      })}
    </>
  );
}
