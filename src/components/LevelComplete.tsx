import { useEffect, useState } from "react";
import { Scene } from "@/types/game";

interface LevelCompleteProps {
  scene: Scene;
  playerName: string;
  score: number;
  onContinue: () => void;
}

const SCENE_DATA: Record<Scene, { emoji: string; label: string; color: string; secondary: string }> = {
  forest:    { emoji: "🌲", label: "Forest",    color: "#2E8B57", secondary: "#90EE90" },
  underwater:{ emoji: "🐠", label: "Underwater", color: "#006994", secondary: "#4ECDC4" },
  city:      { emoji: "🏙️", label: "City",       color: "#4a5568", secondary: "#FFB347" },
  moon:      { emoji: "🌙", label: "Moon",       color: "#1a1a2e", secondary: "#c0c8e0" },
  space:     { emoji: "🚀", label: "Space",      color: "#1a0a2e", secondary: "#c084fc" },
};

const CONFETTI_COLORS = ["#FF6B6B","#FFE66D","#4ECDC4","#FF8C69","#FF69B4","#c084fc","#60efff","#fff"];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 1.8 + Math.random() * 1.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 10,
    rotate: Math.random() * 360,
    shape: i % 3, // 0=rect, 1=circle, 2=star
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.shape === 1 ? p.size : p.size * 0.6,
            background: p.color,
            borderRadius: p.shape === 1 ? "50%" : p.shape === 0 ? "2px" : "0",
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            opacity: 0,
            clipPath: p.shape === 2 ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : undefined,
          }}
        />
      ))}
    </div>
  );
}

function StarBurst({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block text-4xl"
      style={{ animation: `star-burst 0.6s ${delay}s cubic-bezier(0.34, 1.56, 0.64, 1) both` }}
    >
      ⭐
    </span>
  );
}

export function LevelComplete({ scene, playerName, score, onContinue }: LevelCompleteProps) {
  const [show, setShow] = useState(false);
  const d = SCENE_DATA[scene];

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <Confetti />

      <div
        className="relative text-center px-8 py-10 rounded-3xl shadow-2xl mx-4 max-w-sm w-full"
        style={{
          background: `linear-gradient(135deg, ${d.color}ee, ${d.secondary}44)`,
          border: `3px solid ${d.secondary}`,
          boxShadow: `0 0 60px ${d.secondary}88, 0 8px 40px rgba(0,0,0,0.6)`,
          transform: show ? "scale(1)" : "scale(0.5)",
          opacity: show ? 1 : 0,
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
        }}
      >
        {/* Trophy emoji bouncing */}
        <div
          className="text-7xl mb-3"
          style={{ animation: "trophy-bounce 0.8s 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
        >
          🏆
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          <StarBurst delay={0.5} />
          <StarBurst delay={0.7} />
          <StarBurst delay={0.9} />
        </div>

        <h1
          className="font-display text-5xl text-white mb-2 drop-shadow-lg"
          style={{ textShadow: `0 0 20px ${d.secondary}` }}
        >
          Level Clear!
        </h1>

        <p className="font-body text-white/90 text-lg mb-1">
          Amazing job, <strong>{playerName}</strong>!
        </p>
        <p className="font-body text-white/70 text-base mb-4">
          You finished the {d.emoji} {d.label} level!
        </p>

        {/* Score */}
        <div
          className="flex items-center justify-center gap-3 mb-6 px-6 py-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
        >
          <span className="text-3xl">⭐</span>
          <div className="text-left">
            <p className="font-display text-4xl text-white leading-none">{Math.round(score / 10)}</p>
            <p className="font-body text-white/70 text-xs">stars collected</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="font-display text-2xl px-8 py-4 rounded-2xl text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${d.secondary}, ${d.color})`,
            border: `2px solid white`,
            boxShadow: `0 4px 20px ${d.secondary}88`,
          }}
        >
          Play Again 🎮
        </button>

        <a
          href="https://buy.stripe.com/bJecN61zY4Bw6wddRC0RG00"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-5 font-body text-sm text-white/60 hover:text-white transition-colors text-center leading-relaxed"
        >
          💝 If you got some happiness or a moment with your child,
          <br />
          consider leaving a tip so that I can improve :)
        </a>
      </div>
    </div>
  );
}
