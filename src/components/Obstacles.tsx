import { Scene } from "@/types/game";

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

const makeObstacles = (scene: Scene, groundY: number): Obstacle[] => {
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
    y: groundY - h / 2,  // center Y so bottom edge sits on groundY
    width: w,
    height: h,
    type,
  }));
};

function ObstacleSvg({ type, width, height }: { type: string; width: number; height: number }) {
  const w = width;
  const h = height;

  if (type === "log") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.7))" }}>
      {/* Main log body */}
      <rect x="3" y="7" width={w - 6} height={h - 7} rx="5" fill="#6B3210" stroke="#3d1c08" strokeWidth="1.5" />
      {/* Top end cap */}
      <ellipse cx={w / 2} cy="7" rx={(w - 6) / 2} ry="7" fill="#A0522D" stroke="#6B3210" strokeWidth="1.5" />
      {/* Inner ring */}
      <ellipse cx={w / 2} cy="7" rx={(w - 16) / 2} ry="5" fill="#CD853F" stroke="#A0522D" strokeWidth="1" />
      {/* Center dot */}
      <circle cx={w / 2} cy="7" r="3" fill="#D2691E" />
      {/* Bark grain lines */}
      <line x1="5" y1="18" x2={w - 5} y2="18" stroke="#3d1c08" strokeWidth="1.5" opacity="0.7" />
      <line x1="5" y1="26" x2={w - 5} y2="26" stroke="#3d1c08" strokeWidth="1.5" opacity="0.7" />
      {/* Top highlight */}
      <ellipse cx={w / 2 - 5} cy="5" rx={(w - 20) / 4} ry="3" fill="white" opacity="0.18" />
    </svg>
  );

  if (type === "rock" || type === "moonrock") {
    const fill   = type === "moonrock" ? "#6B7280" : "#4B5563";
    const stroke = type === "moonrock" ? "#374151" : "#1f2937";
    const light  = type === "moonrock" ? "#C0C8D0" : "#9CA3AF";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.8))" }}>
        <polygon
          points={`${w * 0.1},${h} ${w * 0.04},${h * 0.5} ${w * 0.28},${h * 0.08} ${w * 0.65},${h * 0.03} ${w * 0.95},${h * 0.38} ${w},${h}`}
          fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round"
        />
        {/* Light face */}
        <polygon
          points={`${w * 0.04},${h * 0.5} ${w * 0.28},${h * 0.08} ${w * 0.55},${h * 0.06} ${w * 0.3},${h * 0.45}`}
          fill={light} opacity="0.55"
        />
        {/* Shine spot */}
        <ellipse cx={w * 0.28} cy={h * 0.2} rx={w * 0.08} ry={h * 0.06} fill="white" opacity="0.25" />
      </svg>
    );
  }

  if (type === "stump") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.7))" }}>
      {/* Trunk */}
      <rect x={w * 0.14} y={h * 0.28} width={w * 0.72} height={h * 0.72} rx="4" fill="#5a3a10" stroke="#3a2208" strokeWidth="1.5" />
      {/* Top ring */}
      <ellipse cx={w / 2} cy={h * 0.28} rx={w * 0.38} ry={h * 0.14} fill="#9B6B28" stroke="#6B3A10" strokeWidth="1.5" />
      <ellipse cx={w / 2} cy={h * 0.28} rx={w * 0.24} ry={h * 0.09} fill="#C49A40" />
      <circle cx={w / 2} cy={h * 0.28} r={w * 0.08} fill="#D4AA55" />
      {/* Bark lines */}
      <line x1={w * 0.18} y1={h * 0.52} x2={w * 0.82} y2={h * 0.52} stroke="#3a2208" strokeWidth="1.5" opacity="0.6" />
      <line x1={w * 0.18} y1={h * 0.7}  x2={w * 0.82} y2={h * 0.7}  stroke="#3a2208" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );

  if (type === "coral") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.8))" }}>
      {[
        { cx: w * 0.2,  color: "#FF3333", tip: "#FF7755", strokeC: "#CC1100" },
        { cx: w * 0.52, color: "#FF5500", tip: "#FFA060", strokeC: "#CC3300" },
        { cx: w * 0.8,  color: "#FF2266", tip: "#FF88AA", strokeC: "#CC0044" },
      ].map((c, i) => (
        <g key={i}>
          <rect
            x={c.cx - 6} y={h * 0.15 - i * 10}
            width="12" height={h * 0.85 + i * 10}
            fill={c.color} rx="6"
            stroke={c.strokeC} strokeWidth="1.5"
          />
          <circle cx={c.cx} cy={h * 0.15 - i * 10} r="9" fill={c.tip} stroke={c.strokeC} strokeWidth="1.5" />
          {/* Shine */}
          <circle cx={c.cx - 2} cy={h * 0.18 - i * 10} r="3" fill="white" opacity="0.35" />
        </g>
      ))}
    </svg>
  );

  if (type === "shell") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.75))" }}>
      {/* Shadow base */}
      <ellipse cx={w / 2} cy={h * 0.72} rx={w * 0.44} ry={h * 0.4} fill="#B8960A" opacity="0.5" />
      {/* Main shell */}
      <ellipse cx={w / 2} cy={h * 0.65} rx={w * 0.42} ry={h * 0.37} fill="#F5D020" stroke="#C8940A" strokeWidth="2" />
      {/* Ridges */}
      {[-1, 0, 1].map(i => (
        <line key={i} x1={w / 2 + i * 9} y1={h * 0.3} x2={w / 2 + i * 13} y2={h * 0.98}
          stroke="#B8840A" strokeWidth="2" opacity="0.7" />
      ))}
      {/* Shine */}
      <ellipse cx={w / 2 - 6} cy={h * 0.42} rx={w * 0.12} ry={h * 0.1} fill="white" opacity="0.3" />
    </svg>
  );

  if (type === "barrel") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.75))" }}>
      {/* Body */}
      <rect x={w * 0.1} y={h * 0.04} width={w * 0.8} height={h * 0.92} rx="9"
        fill="#7B3A0A" stroke="#3d1c05" strokeWidth="2" />
      {/* Metal bands */}
      {[0.18, 0.5, 0.82].map((t, i) => (
        <rect key={i} x={w * 0.06} y={h * t - 4} width={w * 0.88} height="8" rx="4"
          fill="#2a1205" stroke="#111" strokeWidth="1" />
      ))}
      {/* Highlight streak */}
      <rect x={w * 0.2} y={h * 0.08} width={w * 0.12} height={h * 0.8} rx="6"
        fill="white" opacity="0.12" />
    </svg>
  );

  if (type === "crate") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.75))" }}>
      {/* Body */}
      <rect x="2" y="2" width={w - 4} height={h - 4} rx="4"
        fill="#C8A464" stroke="#7A4E22" strokeWidth="3" />
      {/* X braces */}
      <line x1="2" y1="2" x2={w - 2} y2={h - 2} stroke="#7A4E22" strokeWidth="2.5" opacity="0.7" />
      <line x1={w - 2} y1="2" x2="2" y2={h - 2} stroke="#7A4E22" strokeWidth="2.5" opacity="0.7" />
      {/* Horizontal band */}
      <rect x="2" y={h / 2 - 3} width={w - 4} height="6" fill="#7A4E22" opacity="0.6" />
      {/* Vertical band */}
      <rect x={w / 2 - 3} y="2" width="6" height={h - 4} fill="#7A4E22" opacity="0.6" />
      {/* Top highlight */}
      <rect x="4" y="4" width={w - 8} height="5" rx="2" fill="white" opacity="0.15" />
    </svg>
  );

  if (type === "crater") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.9))" }}>
      {/* Rim */}
      <ellipse cx={w / 2} cy={h * 0.65} rx={w * 0.47} ry={h * 0.37}
        fill="#5B6270" stroke="#2d3340" strokeWidth="2" />
      {/* Inner bowl */}
      <ellipse cx={w / 2} cy={h * 0.68} rx={w * 0.3} ry={h * 0.24} fill="#374151" />
      {/* Rim highlight */}
      <ellipse cx={w * 0.35} cy={h * 0.5} rx={w * 0.15} ry={h * 0.07}
        fill="#C0C8D0" opacity="0.45" />
    </svg>
  );

  if (type === "asteroid") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: "drop-shadow(0 3px 8px rgba(150,80,255,0.5))" }}>
      {/* Body */}
      <polygon
        points={`${w * 0.1},${h * 0.9} ${w * 0.04},${h * 0.5} ${w * 0.18},${h * 0.08} ${w * 0.55},${h * 0.03} ${w * 0.92},${h * 0.18} ${w * 0.96},${h * 0.65} ${w * 0.75},${h * 0.96}`}
        fill="#374151" stroke="#6d28d9" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Surface craters */}
      <circle cx={w * 0.35} cy={h * 0.35} r={w * 0.1} fill="#1f2937" stroke="#4B5563" strokeWidth="1" opacity="0.9" />
      <circle cx={w * 0.65} cy={h * 0.6}  r={w * 0.08} fill="#1f2937" stroke="#4B5563" strokeWidth="1" opacity="0.9" />
      {/* Light face */}
      <polygon
        points={`${w * 0.1},${h * 0.9} ${w * 0.04},${h * 0.5} ${w * 0.18},${h * 0.08}`}
        fill="#6B7280" opacity="0.5"
      />
      {/* Glow */}
      <polygon
        points={`${w * 0.55},${h * 0.03} ${w * 0.92},${h * 0.18} ${w * 0.7},${h * 0.12}`}
        fill="white" opacity="0.15"
      />
    </svg>
  );

  // fallback
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="2" y="2" width={w - 4} height={h - 4} rx="6" fill="#4B5563" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}

interface ObstaclesLayerProps {
  scene: Scene;
  cameraX: number;
  groundY: number;
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
