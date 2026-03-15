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
    <rect x="0" y="575" width={WORLD_WIDTH} height="125" fill="#4a7c59" />
    <rect x="0" y="575" width={WORLD_WIDTH} height="20" fill="#5d9e6c" />
    {/* Ground detail patches */}
    {Array.from({length: 24}, (_,i) => (
      <ellipse key={i} cx={80+i*150} cy="579" rx="30" ry="6" fill="#3d6b45" opacity="0.5" />
    ))}
    {/* Flowers */}
    {FLOWER_XS.map((x,i) => (
      <g key={i} transform={`translate(${x},577)`}>
        <rect x="-1" y="-12" width="2" height="12" fill="#3d6b45" />
        <circle cx="0" cy="-14" r="5" fill={["#FF6B6B","#FFE66D","#FF69B4","#FF6B6B","#FFD700"][i%5]} />
      </g>
    ))}
    {/* Mushrooms */}
    {[340, 760, 1340, 1960, 2540, 3100].map((x,i) => (
      <g key={i} transform={`translate(${x},562)`}>
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
    {/* Fish */}
    {[[200,180],[600,280],[1000,140],[1400,240],[1800,180],[2200,260],[2600,160],[3000,220],[3400,190]].map(([x,y],i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="22" ry="13" fill={["#FF6B6B","#FFE66D","#4ECDC4","#FF8C69","#FF69B4"][i%5]} />
        <polygon points="-22,0 -36,-12 -36,12" fill={["#FF6B6B","#FFE66D","#4ECDC4","#FF8C69","#FF69B4"][i%5]} />
        <circle cx="13" cy="-2" r="3" fill="#222" />
      </g>
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
    {/* Earth + Sun in sky, at different spots */}
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
      </div>
    </div>
  );
}
