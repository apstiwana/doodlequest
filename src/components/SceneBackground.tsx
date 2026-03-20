import { useEffect, useRef } from "react";
import { Scene } from "@/types/game";

interface SceneBackgroundProps {
  scene: Scene;
  cameraX: number;
}

// World is 3x viewport width = 3600px
export const WORLD_WIDTH = 3600;

// Pre-computed stable decorative data
const TREE_XS = [80, 220, 380, 520, 680, 820, 980, 1120, 1280, 1420, 1580, 1720, 1880, 2020, 2180, 2320, 2480, 2620, 2780, 2920, 3080, 3220, 3380, 3520];
const TREE_SCALES_ALL = TREE_XS.map((_, i) => 0.65 + (i % 5) * 0.12);
const STAR_DATA = Array.from({ length: 200 }, (_, i) => ({
  cx: ((i * 137.5) % WORLD_WIDTH).toFixed(1),
  cy: ((i * 73.1) % 550).toFixed(1),
  r: (1 + (i % 3) * 0.8).toFixed(1),
  op: (0.3 + (i % 5) * 0.14).toFixed(2),
}));
const SPACE_STAR_DATA = Array.from({ length: 350 }, (_, i) => ({
  cx: ((i * 89.3) % WORLD_WIDTH).toFixed(1),
  cy: ((i * 53.7) % 580).toFixed(1),
  r: (0.5 + (i % 4) * 0.7).toFixed(1),
  op: (0.2 + (i % 6) * 0.13).toFixed(2),
}));
const CLOUD_DATA = [
  [100,80,1.2],[450,50,0.9],[850,100,1.1],[1200,60,0.8],[1550,85,1.0],
  [1900,55,1.15],[2250,90,0.85],[2600,70,1.05],[2950,50,0.9],[3300,80,1.0],
];
const FLOWER_XS = [120,280,450,680,880,1100,1350,1600,1850,2050,2300,2550,2800,3000,3250,3480];

// ─── Forest animated layer ───────────────────────────────────────────────────
function ForestAnimatedLayer() {
  // Birds: simple 2-wing birds flying across
  const birds = [
    { startX: -100, y: 80,  speed: 0.6, size: 1.0, delay: 0 },
    { startX: -300, y: 140, speed: 0.45, size: 0.75, delay: 4 },
    { startX: -500, y: 60,  speed: 0.55, size: 0.85, delay: 8 },
    { startX: -200, y: 110, speed: 0.5,  size: 0.9,  delay: 12 },
    { startX: -400, y: 170, speed: 0.4,  size: 0.7,  delay: 16 },
  ];
  // Butterflies
  const butterflies = [
    { x: 200, y: 200, speed: 0.3, delay: 2 },
    { x: 800, y: 250, speed: 0.25, delay: 6 },
    { x: 1500, y: 180, speed: 0.35, delay: 10 },
  ];
  // Deer silhouette on ground
  const deer = [
    { x: 600, delay: 0, dir: 1 },
    { x: 1800, delay: 5, dir: -1 },
    { x: 2900, delay: 2, dir: 1 },
  ];

  return (
    <>
      {/* Birds */}
      {birds.map((b, i) => (
        <div
          key={`bird-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: b.y,
            animation: `fly-across ${(WORLD_WIDTH / (60 * b.speed)).toFixed(0)}s linear ${b.delay}s infinite`,
            fontSize: `${18 * b.size}px`,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        >
          🐦
        </div>
      ))}
      {/* Butterflies */}
      {butterflies.map((b, i) => (
        <div
          key={`butterfly-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: b.x,
            top: b.y,
            animation: `butterfly-flutter 3s ${b.delay}s ease-in-out infinite`,
            fontSize: "20px",
          }}
        >
          🦋
        </div>
      ))}
      {/* Deer */}
      {deer.map((d, i) => (
        <div
          key={`deer-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: d.x,
            bottom: 115,
            animation: `deer-graze 6s ${d.delay}s ease-in-out infinite`,
            fontSize: "36px",
            transform: d.dir === -1 ? "scaleX(-1)" : undefined,
          }}
        >
          🦌
        </div>
      ))}
      {/* Squirrel */}
      <div className="absolute pointer-events-none" style={{ left: 1200, bottom: 118, animation: "squirrel-hop 4s 1s ease-in-out infinite", fontSize: "24px" }}>🐿️</div>
      <div className="absolute pointer-events-none" style={{ left: 2400, bottom: 118, animation: "squirrel-hop 4s 3s ease-in-out infinite", fontSize: "24px" }}>🐿️</div>
      {/* Rabbit */}
      <div className="absolute pointer-events-none" style={{ left: 400, bottom: 116, animation: "rabbit-hop 2.5s 0.5s ease-in-out infinite", fontSize: "28px" }}>🐰</div>
      <div className="absolute pointer-events-none" style={{ left: 2100, bottom: 116, animation: "rabbit-hop 2.5s 2s ease-in-out infinite", fontSize: "28px" }}>🐰</div>
    </>
  );
}

// ─── Underwater animated layer ───────────────────────────────────────────────
function UnderwaterAnimatedLayer() {
  const bigFish = [
    { y: 180, speed: 0.5, delay: 0, emoji: "🐠", size: 28 },
    { y: 280, speed: 0.4, delay: 5, emoji: "🐡", size: 32 },
    { y: 150, speed: 0.6, delay: 9, emoji: "🐟", size: 24 },
    { y: 320, speed: 0.35, delay: 14, emoji: "🦈", size: 40 },
    { y: 240, speed: 0.45, delay: 3, emoji: "🐠", size: 26 },
  ];
  const submarines = [
    { y: 260, speed: 0.25, delay: 6, color: "#FFE66D" },
    { y: 180, speed: 0.2, delay: 15, color: "#FF6B6B" },
  ];
  const jellyfish = [
    { x: 300, y: 150, delay: 0 },
    { x: 900, y: 200, delay: 2 },
    { x: 1600, y: 130, delay: 4 },
    { x: 2300, y: 170, delay: 1 },
    { x: 3000, y: 220, delay: 3 },
  ];

  return (
    <>
      {/* Fish swimming across */}
      {bigFish.map((f, i) => (
        <div
          key={`fish-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: f.y,
            animation: `fly-across ${(WORLD_WIDTH / (60 * f.speed)).toFixed(0)}s linear ${f.delay}s infinite`,
            fontSize: f.size,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
          }}
        >
          {f.emoji}
        </div>
      ))}
      {/* Submarines */}
      {submarines.map((s, i) => (
        <div
          key={`sub-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: s.y,
            animation: `fly-across ${(WORLD_WIDTH / (60 * s.speed)).toFixed(0)}s linear ${s.delay}s infinite`,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
          }}
        >
          <svg width="90" height="44" viewBox="0 0 90 44">
            {/* Sub body */}
            <ellipse cx="45" cy="26" rx="40" ry="16" fill={s.color} stroke="#555" strokeWidth="2"/>
            {/* Conning tower */}
            <rect x="30" y="8" width="20" height="18" rx="4" fill={s.color} stroke="#555" strokeWidth="1.5"/>
            {/* Periscope */}
            <line x1="38" y1="8" x2="38" y2="0" stroke="#555" strokeWidth="3" strokeLinecap="round"/>
            <line x1="38" y1="0" x2="48" y2="0" stroke="#555" strokeWidth="3" strokeLinecap="round"/>
            {/* Propeller */}
            <circle cx="8" cy="26" r="8" fill="none" stroke="#888" strokeWidth="2.5"/>
            <line x1="8" y1="18" x2="8" y2="34" stroke="#888" strokeWidth="3" strokeLinecap="round"/>
            <line x1="0" y1="26" x2="16" y2="26" stroke="#888" strokeWidth="3" strokeLinecap="round"/>
            {/* Window */}
            <circle cx="60" cy="26" r="7" fill="#40B4CA" stroke="#fff" strokeWidth="2"/>
            <circle cx="60" cy="26" r="3" fill="#87CEEB" opacity="0.8"/>
            {/* Bubbles */}
            <circle cx="78" cy="14" r="3" fill="white" opacity="0.4"/>
            <circle cx="83" cy="8" r="2" fill="white" opacity="0.3"/>
          </svg>
        </div>
      ))}
      {/* Jellyfish bobbing */}
      {jellyfish.map((j, i) => (
        <div
          key={`jelly-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: j.x,
            top: j.y,
            animation: `jellyfish-bob 4s ${j.delay}s ease-in-out infinite`,
            fontSize: "32px",
          }}
        >
          🪼
        </div>
      ))}
      {/* Whale */}
      <div className="absolute pointer-events-none" style={{ top: 300, animation: `fly-across 120s 20s linear infinite`, fontSize: "48px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>🐋</div>
      {/* Octopus on ground */}
      <div className="absolute pointer-events-none" style={{ left: 700, bottom: 120, animation: "squirrel-hop 5s 1s ease-in-out infinite", fontSize: "40px" }}>🐙</div>
      <div className="absolute pointer-events-none" style={{ left: 2200, bottom: 120, animation: "squirrel-hop 5s 3s ease-in-out infinite", fontSize: "36px" }}>🦑</div>
    </>
  );
}

// ─── City animated layer ─────────────────────────────────────────────────────
function CityAnimatedLayer() {
  const planes = [
    { y: 60,  speed: 0.55, delay: 0, size: 32, emoji: "✈️" },
    { y: 110, speed: 0.4,  delay: 8, size: 28, emoji: "✈️" },
    { y: 40,  speed: 0.6,  delay: 15, size: 30, emoji: "✈️" },
  ];
  const helicopters = [
    { y: 170, speed: 0.3, delay: 4, color: "#FF6B6B" },
    { y: 220, speed: 0.25, delay: 12, color: "#4ECDC4" },
  ];
  const blimps = [
    { y: 90, speed: 0.15, delay: 7 },
  ];

  return (
    <>
      {/* Planes */}
      {planes.map((p, i) => (
        <div
          key={`plane-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: p.y,
            animation: `fly-across ${(WORLD_WIDTH / (60 * p.speed)).toFixed(0)}s linear ${p.delay}s infinite`,
            fontSize: p.size,
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.4))",
          }}
        >
          {p.emoji}
        </div>
      ))}
      {/* Helicopters */}
      {helicopters.map((h, i) => (
        <div
          key={`heli-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: h.y,
            animation: `fly-across ${(WORLD_WIDTH / (60 * h.speed)).toFixed(0)}s linear ${h.delay}s infinite`,
          }}
        >
          <svg width="80" height="48" viewBox="0 0 80 48">
            {/* Body */}
            <ellipse cx="42" cy="32" rx="24" ry="13" fill={h.color} stroke="#333" strokeWidth="1.5"/>
            {/* Tail */}
            <line x1="18" y1="32" x2="4" y2="28" stroke={h.color} strokeWidth="6" strokeLinecap="round"/>
            <ellipse cx="4" cy="26" rx="6" ry="4" fill={h.color} stroke="#333" strokeWidth="1"/>
            {/* Skids */}
            <line x1="30" y1="44" x2="58" y2="44" stroke="#555" strokeWidth="3" strokeLinecap="round"/>
            <line x1="35" y1="44" x2="35" y2="38" stroke="#555" strokeWidth="2"/>
            <line x1="53" y1="44" x2="53" y2="38" stroke="#555" strokeWidth="2"/>
            {/* Main rotor (animated) */}
            <line x1="10" y1="20" x2="70" y2="20" stroke="#888" strokeWidth="3" strokeLinecap="round" style={{ transformOrigin: "40px 20px", animation: "spin-rotor 0.15s linear infinite" }}/>
            <line x1="40" y1="4" x2="40" y2="36" stroke="#888" strokeWidth="3" strokeLinecap="round" style={{ transformOrigin: "40px 20px", animation: "spin-rotor 0.15s linear infinite" }}/>
            {/* Window */}
            <circle cx="50" cy="29" r="7" fill="#87CEEB" stroke="#fff" strokeWidth="1.5"/>
          </svg>
        </div>
      ))}
      {/* Blimp */}
      {blimps.map((b, i) => (
        <div
          key={`blimp-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: b.y,
            animation: `fly-across ${(WORLD_WIDTH / (60 * b.speed)).toFixed(0)}s linear ${b.delay}s infinite`,
          }}
        >
          <svg width="120" height="55" viewBox="0 0 120 55">
            <ellipse cx="60" cy="24" rx="55" ry="22" fill="#FF6B6B"/>
            <ellipse cx="55" cy="20" rx="30" ry="10" fill="white" opacity="0.2"/>
            <text x="28" y="30" fontSize="14" fill="white" fontWeight="bold" fontFamily="sans-serif">DOODLE</text>
            <line x1="40" y1="46" x2="55" y2="44" stroke="#555" strokeWidth="2"/>
            <line x1="60" y1="46" x2="65" y2="44" stroke="#555" strokeWidth="2"/>
            <line x1="80" y1="46" x2="65" y2="44" stroke="#555" strokeWidth="2"/>
            <rect x="40" y="44" width="40" height="12" rx="3" fill="#FFE66D" stroke="#555" strokeWidth="1.5"/>
          </svg>
        </div>
      ))}
      {/* Cars on ground */}
      <div className="absolute pointer-events-none" style={{ bottom: 112, animation: `fly-across 25s 0s linear infinite`, fontSize: "32px" }}>🚗</div>
      <div className="absolute pointer-events-none" style={{ bottom: 112, animation: `fly-across 30s 8s linear infinite`, fontSize: "32px" }}>🚕</div>
      <div className="absolute pointer-events-none" style={{ bottom: 115, animation: `fly-across 40s 3s linear infinite`, fontSize: "36px" }}>🚌</div>
    </>
  );
}

// ─── Moon / Space alien layer ─────────────────────────────────────────────────
function AlienLayer({ scene }: { scene: "moon" | "space" }) {
  const ufoColors = ["#4ECDC4", "#FF6B6B", "#FFE66D", "#c084fc", "#60efff"];
  const ufos = [
    { y: 80,  speed: 0.3, delay: 0, color: ufoColors[0], size: 1 },
    { y: 160, speed: 0.25, delay: 6, color: ufoColors[1], size: 0.8 },
    { y: 60,  speed: 0.4, delay: 12, color: ufoColors[2], size: 1.1 },
    { y: 200, speed: 0.2, delay: 18, color: ufoColors[3], size: 0.9 },
  ];

  return (
    <>
      {ufos.map((u, i) => (
        <div
          key={`ufo-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: u.y,
            animation: `fly-across ${(WORLD_WIDTH / (60 * u.speed)).toFixed(0)}s linear ${u.delay}s infinite`,
            transform: `scale(${u.size})`,
            transformOrigin: "left center",
          }}
        >
          <svg width="80" height="48" viewBox="0 0 80 48">
            {/* UFO beam */}
            <polygon points="28,32 52,32 65,48 15,48" fill={u.color} opacity="0.18"/>
            {/* UFO dome */}
            <ellipse cx="40" cy="22" rx="20" ry="14" fill="#c8d8f8" stroke={u.color} strokeWidth="2"/>
            <ellipse cx="38" cy="18" rx="10" ry="7" fill="white" opacity="0.3"/>
            {/* UFO body */}
            <ellipse cx="40" cy="30" rx="32" ry="10" fill={u.color} stroke={u.color} strokeWidth="1"/>
            <ellipse cx="40" cy="30" rx="28" ry="7" fill={u.color} opacity="0.7"/>
            {/* Lights */}
            {[-16, -8, 0, 8, 16].map((dx, j) => (
              <circle key={j} cx={40 + dx} cy={30} r="3"
                fill={j % 2 === 0 ? "#FFE66D" : "#FF6B6B"}
                style={{ animation: `ufo-blink 0.8s ${j * 0.16}s ease-in-out infinite` }}
              />
            ))}
            {/* Alien inside dome */}
            <text x="33" y="27" fontSize="13">👽</text>
          </svg>
        </div>
      ))}
      {/* Rockets for space scene */}
      {scene === "space" && (
        <>
          <div className="absolute pointer-events-none" style={{ top: 130, animation: `fly-across 90s 3s linear infinite`, fontSize: "36px", filter: "drop-shadow(0 0 8px #c084fc)" }}>🚀</div>
          <div className="absolute pointer-events-none" style={{ top: 280, animation: `fly-across 110s 25s linear infinite`, fontSize: "28px", filter: "drop-shadow(0 0 6px #60efff)" }}>🛸</div>
        </>
      )}
      {/* Astronaut on the moon */}
      {scene === "moon" && (
        <>
          <div className="absolute pointer-events-none" style={{ left: 1200, bottom: 116, animation: "squirrel-hop 8s 2s ease-in-out infinite", fontSize: "36px" }}>👨‍🚀</div>
          <div className="absolute pointer-events-none" style={{ left: 2500, bottom: 116, animation: "squirrel-hop 8s 5s ease-in-out infinite", fontSize: "36px" }}>👩‍🚀</div>
          <div className="absolute pointer-events-none" style={{ top: 250, animation: `fly-across 80s 10s linear infinite`, fontSize: "32px", filter: "drop-shadow(0 0 6px #c0c8e0)" }}>🛸</div>
        </>
      )}
    </>
  );
}

const ForestBg = () => (
  <svg viewBox={`0 0 ${WORLD_WIDTH} 700`} xmlns="http://www.w3.org/2000/svg" width={WORLD_WIDTH} height="100%">
    <defs>
      <linearGradient id="sky-f" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#87CEEB" />
        <stop offset="60%" stopColor="#B0E0E6" />
        <stop offset="100%" stopColor="#90EE90" />
      </linearGradient>
    </defs>
    <rect width={WORLD_WIDTH} height="700" fill="url(#sky-f)" />
    {/* Clouds */}
    {CLOUD_DATA.map(([x,y,s],i) => (
      <g key={i} transform={`translate(${x},${y}) scale(${s})`} opacity="0.85">
        <ellipse cx="0" cy="0" rx="60" ry="30" fill="white" />
        <ellipse cx="-25" cy="5" rx="40" ry="25" fill="white" />
        <ellipse cx="30" cy="5" rx="45" ry="25" fill="white" />
      </g>
    ))}
    {/* Back tree row */}
    {TREE_XS.map((x,i) => (
      <g key={i} transform={`translate(${x},480) scale(${TREE_SCALES_ALL[i]})`}>
        <rect x="-8" y="0" width="16" height="80" fill="#8B4513" />
        <ellipse cx="0" cy="-40" rx="45" ry="55" fill="#2E8B57" />
        <ellipse cx="-10" cy="-20" rx="38" ry="48" fill="#3CB371" />
      </g>
    ))}
    {/* Ground */}
    <rect x="0" y="610" width={WORLD_WIDTH} height="90" fill="#4a7c59" />
    <rect x="0" y="610" width={WORLD_WIDTH} height="20" fill="#5d9e6c" />
    {/* Ground detail patches */}
    {Array.from({length: 24}, (_,i) => (
      <ellipse key={i} cx={80+i*150} cy="614" rx="30" ry="6" fill="#3d6b45" opacity="0.5" />
    ))}
    {/* Flowers */}
    {FLOWER_XS.map((x,i) => (
      <g key={i} transform={`translate(${x},612)`}>
        <rect x="-1" y="-12" width="2" height="12" fill="#3d6b45" />
        <circle cx="0" cy="-14" r="5" fill={["#FF6B6B","#FFE66D","#FF69B4","#FF6B6B","#FFD700"][i%5]} />
      </g>
    ))}
    {/* Mushrooms */}
    {[340, 760, 1340, 1960, 2540, 3100].map((x,i) => (
      <g key={i} transform={`translate(${x},597)`}>
        <rect x="-4" y="-14" width="8" height="14" fill="#FAEBD7" />
        <ellipse cx="0" cy="-16" rx="14" ry="10" fill={i%2===0?"#FF6B6B":"#FFE66D"} />
        <circle cx="-5" cy="-19" r="2.5" fill="white" opacity="0.8" />
        <circle cx="4" cy="-17" r="2" fill="white" opacity="0.8" />
      </g>
    ))}
  </svg>
);

const UnderwaterBg = () => (
  <svg viewBox={`0 0 ${WORLD_WIDTH} 700`} xmlns="http://www.w3.org/2000/svg" width={WORLD_WIDTH} height="100%">
    <defs>
      <linearGradient id="ocean-u" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#006994" />
        <stop offset="50%" stopColor="#0099CC" />
        <stop offset="100%" stopColor="#40B4CA" />
      </linearGradient>
    </defs>
    <rect width={WORLD_WIDTH} height="700" fill="url(#ocean-u)" />
    {/* Bubbles */}
    {Array.from({length:40},(_,i) => (
      <g key={i}>
        <circle cx={(i*90+40)%WORLD_WIDTH} cy={80+i*15} r={3+i%5*2} fill="white" opacity="0.2" />
        <circle cx={(i*90+70)%WORLD_WIDTH} cy={160+i*10} r={2+i%4*2} fill="white" opacity="0.15" />
      </g>
    ))}
    {/* Coral clusters */}
    {Array.from({length:18},(_,i) => {
      const x = 100 + i*200;
      const colors = ["#FF6B6B","#FF8C69","#FF7F50","#FFB6C1","#FF6347","#4ECDC4"];
      return (
        <g key={i} transform={`translate(${x},560)`}>
          {[-12,0,12].map((dx,j) => (
            <g key={j} transform={`translate(${dx},0)`}>
              <rect x="-4" y={-40-j*8} width="8" height={40+j*8} fill={colors[(i+j)%6]} rx="4" />
              <circle cx="0" cy={-42-j*8} r="7" fill={colors[(i+j+1)%6]} />
            </g>
          ))}
        </g>
      );
    })}
    {/* Sandy ground */}
    <rect x="0" y="575" width={WORLD_WIDTH} height="125" fill="#C2A06E" />
    <rect x="0" y="575" width={WORLD_WIDTH} height="15" fill="#D4B483" />
    {/* Seashells */}
    {Array.from({length:20},(_,i)=>(
      <ellipse key={i} cx={150+i*180} cy="582" rx="8" ry="5" fill={["#FFB6C1","#F0E68C","#E6D5C3"][i%3]} opacity="0.7"/>
    ))}
  </svg>
);

const CityBg = () => {
  const buildings = [
    [0,300,120,275],[150,350,90,250],[260,280,110,295],[390,320,130,255],
    [540,260,100,315],[660,380,140,220],[820,300,110,275],[950,350,95,250],
    [1065,280,120,295],[1205,340,95,235],[1320,310,115,265],[1455,360,100,240],
    [1575,285,125,290],[1720,330,110,260],[1850,265,105,320],[1975,350,130,240],
    [2125,295,115,270],[2260,345,100,245],[2380,275,120,300],[2520,325,135,260],
    [2675,290,110,285],[2805,355,95,230],[2920,270,125,310],[3065,340,105,250],
    [3190,300,120,270],[3330,355,95,240],[3445,285,115,290],
  ];
  return (
    <svg viewBox={`0 0 ${WORLD_WIDTH} 700`} xmlns="http://www.w3.org/2000/svg" width={WORLD_WIDTH} height="100%">
      <defs>
        <linearGradient id="citysky-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="40%" stopColor="#FFD4A3" />
          <stop offset="100%" stopColor="#B0C4DE" />
        </linearGradient>
      </defs>
      <rect width={WORLD_WIDTH} height="700" fill="url(#citysky-c)" />
      {/* Buildings */}
      {buildings.map(([x,_,w,bh],i) => (
        <g key={i}>
          <rect x={x} y={700-bh} width={w} height={bh} fill={["#708090","#778899","#696969","#808080","#6B7B8D","#5a6a7a"][i%6]} />
          {Array.from({length:Math.floor((bh-30)/40)},(_,row)=>
            Array.from({length:Math.floor(w/30)-1},(_,col)=>(
              <rect key={`${row}-${col}`} x={x+15+col*30} y={700-bh+20+row*40} width={14} height={18}
                fill={(row+col+i)%4!==0?"#FFE66D":"#2D3436"} opacity="0.9" rx="2"/>
            ))
          )}
        </g>
      ))}
      {/* Sidewalk */}
      <rect x="0" y="575" width={WORLD_WIDTH} height="125" fill="#94a3b8" />
      <rect x="0" y="575" width={WORLD_WIDTH} height="15" fill="#cbd5e1" />
      {/* Road dashes */}
      {Array.from({length:36},(_,i)=>(
        <rect key={i} x={i*100+10} y="610" width="60" height="8" fill="white" opacity="0.45" rx="4"/>
      ))}
      {/* Street lights */}
      {Array.from({length:12},(_,i)=>(
        <g key={i} transform={`translate(${150+i*300},490)`}>
          <rect x="-3" y="0" width="6" height="85" fill="#4a5568" />
          <rect x="-3" y="0" width="35" height="5" fill="#4a5568" rx="2" />
          <circle cx="32" cy="3" r="9" fill="#FFE66D" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
};

const MoonBg = () => (
  <svg viewBox={`0 0 ${WORLD_WIDTH} 700`} xmlns="http://www.w3.org/2000/svg" width={WORLD_WIDTH} height="100%">
    <defs>
      <radialGradient id="moonspace-m" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0a0a1a" />
      </radialGradient>
    </defs>
    <rect width={WORLD_WIDTH} height="700" fill="url(#moonspace-m)" />
    {STAR_DATA.map((s,i) => (
      <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.op} />
    ))}
    {/* Earth + Sun in sky */}
    <circle cx="980" cy="120" r="70" fill="#1E90FF" opacity="0.9" />
    <ellipse cx="960" cy="105" rx="25" ry="18" fill="#2E8B57" opacity="0.9" />
    <ellipse cx="1000" cy="135" rx="20" ry="15" fill="#2E8B57" opacity="0.9" />
    <circle cx="2500" cy="150" r="50" fill="#FFE66D" opacity="0.6" />
    <circle cx="3200" cy="100" r="35" fill="#1E90FF" opacity="0.5" />
    {/* Moon surface */}
    <rect x="0" y="575" width={WORLD_WIDTH} height="125" fill="#8B9099" />
    <rect x="0" y="575" width={WORLD_WIDTH} height="18" fill="#A0A8B0" />
    {/* Craters */}
    {Array.from({length:18},(_,i)=>{
      const x=150+i*200; const r=20+i%4*12;
      return (
        <g key={i}>
          <ellipse cx={x} cy={590} rx={r} ry={r*0.4} fill="#6B7280" opacity="0.6"/>
          <ellipse cx={x} cy={590} rx={r*0.6} ry={r*0.25} fill="#9CA3AF" opacity="0.4"/>
        </g>
      );
    })}
    {/* Rocks */}
    {Array.from({length:22},(_,i)=>(
      <ellipse key={i} cx={100+i*160} cy="575" rx={12+i%4*4} ry={8+i%3*3} fill="#7B8290"/>
    ))}
    {/* Flags */}
    {[800, 1800, 2800].map((x,i)=>(
      <g key={i} transform={`translate(${x},520)`}>
        <rect x="-2" y="0" width="4" height="55" fill="#aaa"/>
        <polygon points="2,0 32,10 2,20" fill={["#FF6B6B","#FFE66D","#4ECDC4"][i]}/>
      </g>
    ))}
  </svg>
);

const SpaceBg = () => (
  <svg viewBox={`0 0 ${WORLD_WIDTH} 700`} xmlns="http://www.w3.org/2000/svg" width={WORLD_WIDTH} height="100%">
    <defs>
      <radialGradient id="deepspace-s" cx="40%" cy="40%">
        <stop offset="0%" stopColor="#1a0a2e" />
        <stop offset="60%" stopColor="#0d0a20" />
        <stop offset="100%" stopColor="#050510" />
      </radialGradient>
    </defs>
    <rect width={WORLD_WIDTH} height="700" fill="url(#deepspace-s)" />
    {SPACE_STAR_DATA.map((s,i) => (
      <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.op} />
    ))}
    {/* Nebulae */}
    <ellipse cx="500" cy="200" rx="280" ry="140" fill="#9B59B6" opacity="0.07" />
    <ellipse cx="1400" cy="160" rx="220" ry="120" fill="#3498DB" opacity="0.07" />
    <ellipse cx="2200" cy="220" rx="260" ry="130" fill="#E74C3C" opacity="0.06" />
    <ellipse cx="3000" cy="180" rx="200" ry="110" fill="#F39C12" opacity="0.06" />
    {/* Planets */}
    <circle cx="250" cy="130" r="55" fill="#E67E22" />
    <ellipse cx="250" cy="130" rx="85" ry="16" stroke="#D68910" strokeWidth="3" fill="none" opacity="0.5" />
    <circle cx="1100" cy="100" r="40" fill="#C0392B" />
    <circle cx="1900" cy="80" r="60" fill="#8E44AD" opacity="0.9"/>
    <ellipse cx="1900" cy="80" rx="90" ry="18" stroke="#7D3C98" strokeWidth="3" fill="none" opacity="0.6"/>
    <circle cx="2800" cy="110" r="45" fill="#27AE60" opacity="0.85"/>
    <circle cx="3400" cy="90" r="30" fill="#E74C3C" />
    {/* Floating asteroid rocks */}
    {[[400,440],[700,390],[1000,420],[1300,400],[1600,450],[1900,410],[2200,430],[2500,400],[2800,440],[3100,410],[3400,390]].map(([x,y],i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <polygon points="0,-18 14,-4 10,14 -10,14 -14,-4" fill="#6B7280" />
        <polygon points="0,-18 14,-4 10,14 -10,14 -14,-4" fill="#9CA3AF" opacity="0.25" />
      </g>
    ))}
    {/* Space ground */}
    <rect x="0" y="575" width={WORLD_WIDTH} height="125" fill="#1e1b4b" />
    <rect x="0" y="575" width={WORLD_WIDTH} height="18" fill="#2d2a5e" />
    {Array.from({length:36},(_,i)=>(
      <text key={i} x={100+i*98} y="595" fontSize="12" fill="#FFE66D" opacity="0.45">✦</text>
    ))}
  </svg>
);

export function SceneBackground({ scene, cameraX }: SceneBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: WORLD_WIDTH,
          height: "100%",
          transform: `translateX(${-cameraX}px)`,
          willChange: "transform",
        }}
      >
        {scene === "forest" && <ForestBg />}
        {scene === "underwater" && <UnderwaterBg />}
        {scene === "city" && <CityBg />}
        {scene === "moon" && <MoonBg />}
        {scene === "space" && <SpaceBg />}

        {/* Animated overlays per scene */}
        {scene === "forest" && <ForestAnimatedLayer />}
        {scene === "underwater" && <UnderwaterAnimatedLayer />}
        {scene === "city" && <CityAnimatedLayer />}
        {scene === "moon" && <AlienLayer scene="moon" />}
        {scene === "space" && <AlienLayer scene="space" />}
      </div>
    </div>
  );
}
