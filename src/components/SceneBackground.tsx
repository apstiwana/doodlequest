import { Scene } from "@/types/game";

interface SceneBackgroundProps {
  scene: Scene;
}

// Pre-computed values to avoid Math.random() in render
const TREE_SCALES = [0.9, 0.7, 1.0, 0.8, 1.1, 0.75, 0.95, 0.65, 0.85];
const STAR_DATA = Array.from({ length: 80 }, (_, i) => ({
  cx: ((i * 137.5) % 1200).toFixed(1),
  cy: ((i * 73.1) % 550).toFixed(1),
  r: (1 + (i % 3) * 0.8).toFixed(1),
  op: (0.3 + (i % 5) * 0.14).toFixed(2),
}));
const SPACE_STAR_DATA = Array.from({ length: 150 }, (_, i) => ({
  cx: ((i * 89.3) % 1200).toFixed(1),
  cy: ((i * 53.7) % 580).toFixed(1),
  r: (0.5 + (i % 4) * 0.7).toFixed(1),
  op: (0.2 + (i % 6) * 0.13).toFixed(2),
}));

const ForestBg = () => (
  <svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#87CEEB" />
        <stop offset="60%" stopColor="#B0E0E6" />
        <stop offset="100%" stopColor="#90EE90" />
      </linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#sky)" />
    {/* Clouds */}
    {[[100,80,1.2],[350,50,0.9],[700,100,1.1],[950,60,0.8]].map(([x,y,s],i) => (
      <g key={i} transform={`translate(${x},${y}) scale(${s})`} opacity="0.85">
        <ellipse cx="0" cy="0" rx="60" ry="30" fill="white" />
        <ellipse cx="-25" cy="5" rx="40" ry="25" fill="white" />
        <ellipse cx="30" cy="5" rx="45" ry="25" fill="white" />
      </g>
    ))}
    {/* Trees back row */}
    {[50,180,320,460,600,740,880,1020,1150].map((x,i) => (
      <g key={i} transform={`translate(${x},480) scale(${TREE_SCALES[i]})`}>
        <rect x="-8" y="0" width="16" height="80" fill="#8B4513" />
        <ellipse cx="0" cy="-40" rx="45" ry="55" fill="#2E8B57" />
        <ellipse cx="-10" cy="-20" rx="38" ry="48" fill="#3CB371" />
      </g>
    ))}
    {/* Ground */}
    <rect x="0" y="575" width="1200" height="125" fill="#4a7c59" />
    <rect x="0" y="575" width="1200" height="20" fill="#5d9e6c" />
    {/* Flowers */}
    {[120,250,450,650,800,1000].map((x,i) => (
      <g key={i} transform={`translate(${x},577)`}>
        <rect x="-1" y="-12" width="2" height="12" fill="#3d6b45" />
        <circle cx="0" cy="-14" r="5" fill={["#FF6B6B","#FFE66D","#FF69B4","#FF6B6B"][i%4]} />
      </g>
    ))}
  </svg>
);

const UnderwaterBg = () => (
  <svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#006994" />
        <stop offset="50%" stopColor="#0099CC" />
        <stop offset="100%" stopColor="#40B4CA" />
      </linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#ocean)" />
    {/* Bubbles */}
    {[80,200,400,550,700,850,1050,1150].map((x,i) => (
      <g key={i}>
        <circle cx={x} cy={100+i*30} r={4+i%4*3} fill="white" opacity="0.25" />
        <circle cx={x+30} cy={200+i*20} r={3+i%3*2} fill="white" opacity="0.2" />
      </g>
    ))}
    {/* Coral */}
    {[100,250,500,720,900,1100].map((x,i) => (
      <g key={i} transform={`translate(${x},560)`}>
        <rect x="-4" y="-50" width="8" height="50" fill={["#FF6B6B","#FF8C69","#FF7F50","#FFB6C1","#FF6347"][i%5]} rx="4" />
        <circle cx="0" cy="-52" r="8" fill={["#FF6B6B","#FF8C69","#FF7F50","#FFB6C1","#FF6347"][i%5]} />
        <circle cx="-12" cy="-40" r="6" fill={["#FF8C69","#FF7F50","#FF6B6B","#FF6347","#FFB6C1"][i%5]} />
        <circle cx="12" cy="-35" r="6" fill={["#FF7F50","#FF6B6B","#FFB6C1","#FF8C69","#FF6347"][i%5]} />
      </g>
    ))}
    {/* Sandy ground */}
    <rect x="0" y="575" width="1200" height="125" fill="#C2A06E" />
    <rect x="0" y="575" width="1200" height="15" fill="#D4B483" />
    {/* Fish */}
    {[[200,200],[500,300],[800,150],[1000,250]].map(([x,y],i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="20" ry="12" fill={["#FF6B6B","#FFE66D","#4ECDC4","#FF8C69"][i]} />
        <polygon points="-20,0 -32,-10 -32,10" fill={["#FF6B6B","#FFE66D","#4ECDC4","#FF8C69"][i]} />
        <circle cx="12" cy="-2" r="3" fill="#222" />
      </g>
    ))}
  </svg>
);

const CityBg = () => (
  <svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="citysky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFB347" />
        <stop offset="40%" stopColor="#FFD4A3" />
        <stop offset="100%" stopColor="#B0C4DE" />
      </linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#citysky)" />
    {/* Buildings back */}
    {[[0,300,120,275],[130,350,90,250],[230,280,110,295],[350,320,130,255],[490,260,100,315],[600,380,140,220],[750,300,110,275],[870,350,95,250],[975,280,120,295],[1105,340,95,235]].map(([x,h,w,bh],i) => (
      <g key={i}>
        <rect x={x} y={700-bh} width={w} height={bh} fill={["#708090","#778899","#696969","#808080","#6B7B8D"][i%5]} />
        {/* Windows */}
        {[...Array(Math.floor((bh-30)/40))].map((_,row) =>
          [...Array(Math.floor(w/30)-1)].map((_,col) => (
            <rect key={`${row}-${col}`} x={x+15+col*30} y={700-bh+20+row*40} width={14} height={18}
              fill={Math.random()>0.3 ? "#FFE66D" : "#2D3436"} opacity="0.9" rx="2" />
          ))
        )}
      </g>
    ))}
    {/* Sidewalk */}
    <rect x="0" y="575" width="1200" height="125" fill="#94a3b8" />
    <rect x="0" y="575" width="1200" height="15" fill="#cbd5e1" />
    {/* Road markings */}
    {[0,100,200,300,400,500,600,700,800,900,1000,1100].map((x,i) => (
      <rect key={i} x={x+10} y="610" width="60" height="8" fill="white" opacity="0.5" rx="4" />
    ))}
    {/* Street lights */}
    {[150,450,750,1050].map((x,i) => (
      <g key={i} transform={`translate(${x},490)`}>
        <rect x="-3" y="0" width="6" height="85" fill="#4a5568" />
        <rect x="-3" y="0" width="35" height="5" fill="#4a5568" rx="2" />
        <circle cx="32" cy="3" r="8" fill="#FFE66D" opacity="0.9" />
      </g>
    ))}
  </svg>
);

const MoonBg = () => (
  <svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="moonspace" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0a0a1a" />
      </radialGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#moonspace)" />
    {/* Stars */}
    {STAR_DATA.map((s,i) => (
      <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.op} />
    ))}
    {/* Earth in sky */}
    <circle cx="980" cy="120" r="70" fill="#1E90FF" opacity="0.9" />
    <ellipse cx="960" cy="105" rx="25" ry="18" fill="#2E8B57" opacity="0.9" />
    <ellipse cx="1000" cy="135" rx="20" ry="15" fill="#2E8B57" opacity="0.9" />
    <circle cx="980" cy="120" r="70" fill="white" opacity="0.08" />
    {/* Moon surface */}
    <rect x="0" y="575" width="1200" height="125" fill="#8B9099" />
    <rect x="0" y="575" width="1200" height="18" fill="#A0A8B0" />
    {/* Craters */}
    {[[150,590,40],[350,595,30],[600,582,50],[800,595,25],[1050,590,35]].map(([x,y,r],i) => (
      <g key={i}>
        <ellipse cx={x} cy={y} rx={r} ry={r*0.4} fill="#6B7280" opacity="0.6" />
        <ellipse cx={x} cy={y} rx={r*0.6} ry={r*0.25} fill="#9CA3AF" opacity="0.4" />
      </g>
    ))}
    {/* Moon rocks */}
    {[100,280,500,720,950].map((x,i) => (
      <ellipse key={i} cx={x} cy={575} rx={15+i*3} ry={10+i*2} fill="#7B8290" />
    ))}
  </svg>
);

const SpaceBg = () => (
  <svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="deepspace" cx="40%" cy="40%">
        <stop offset="0%" stopColor="#1a0a2e" />
        <stop offset="60%" stopColor="#0d0a20" />
        <stop offset="100%" stopColor="#050510" />
      </radialGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#deepspace)" />
    {/* Stars lots */}
    {[...Array(150)].map((_,i) => (
      <circle key={i} cx={Math.random()*1200} cy={Math.random()*580} r={Math.random()*3} fill="white" opacity={0.2+Math.random()*0.8} />
    ))}
    {/* Nebula */}
    <ellipse cx="300" cy="200" rx="200" ry="120" fill="#9B59B6" opacity="0.08" />
    <ellipse cx="900" cy="150" rx="180" ry="100" fill="#3498DB" opacity="0.08" />
    {/* Planets */}
    <circle cx="200" cy="130" r="55" fill="#E67E22" />
    <ellipse cx="200" cy="130" rx="80" ry="15" stroke="#D68910" strokeWidth="3" fill="none" opacity="0.5" />
    <circle cx="900" cy="100" r="35" fill="#C0392B" />
    {/* Floating rocks */}
    {[[400,450],[600,400],[800,430],[1000,410],[200,480]].map(([x,y],i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <polygon points="0,-20 15,-5 10,15 -10,15 -15,-5" fill="#6B7280" />
        <polygon points="0,-20 15,-5 10,15 -10,15 -15,-5" fill="#9CA3AF" opacity="0.3" stroke="none" />
      </g>
    ))}
    {/* Space ground / platform */}
    <rect x="0" y="575" width="1200" height="125" fill="#1e1b4b" />
    <rect x="0" y="575" width="1200" height="18" fill="#2d2a5e" />
    {/* Stars on ground */}
    {[100,300,500,700,900,1100].map((x,i) => (
      <text key={i} x={x} y={595} fontSize="12" fill="#FFE66D" opacity="0.5">✦</text>
    ))}
  </svg>
);

export function SceneBackground({ scene }: SceneBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {scene === "forest" && <ForestBg />}
      {scene === "underwater" && <UnderwaterBg />}
      {scene === "city" && <CityBg />}
      {scene === "moon" && <MoonBg />}
      {scene === "space" && <SpaceBg />}
    </div>
  );
}
