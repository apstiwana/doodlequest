import { useState } from "react";
import { Sparkles, Star } from "lucide-react";

interface WelcomeScreenProps {
  onStart: (name: string) => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [name, setName] = useState("");
  const [shake, setShake] = useState(false);

  const handleStart = () => {
    if (!name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onStart(name.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/40 via-background to-primary/10 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Floating background stars */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute text-accent/60 animate-sparkle pointer-events-none select-none"
          style={{
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
            fontSize: `${16 + Math.random() * 24}px`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
          }}
        >
          ⭐
        </div>
      ))}

      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        {/* Logo area */}
        <div className="space-y-3">
          <div className="relative inline-block">
            <div className="text-8xl animate-float inline-block">🎨</div>
            <div className="absolute -top-2 -right-2 text-3xl animate-star-spin">✨</div>
          </div>

          <h1 className="font-display text-6xl md:text-7xl text-primary drop-shadow-sm leading-none">
            Doodle
            <br />
            <span className="text-secondary">Quest</span>
          </h1>

          <p className="font-body text-muted-foreground text-lg">
            Bring your drawings to life! 🌟
          </p>
        </div>

        {/* Name input card */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-border/50 space-y-5 animate-bounce-in">
          <div className="space-y-2">
            <label className="font-display text-2xl text-foreground block">
              What's your name? 👋
            </label>
            <p className="font-body text-sm text-muted-foreground">
              Your drawing will call you by name!
            </p>
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder="Type your name here..."
            maxLength={20}
            className={`
              w-full px-5 py-4 rounded-2xl border-2 bg-background
              font-body text-xl text-center text-foreground
              placeholder:text-muted-foreground/50
              focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20
              transition-all duration-200
              ${shake ? "border-destructive animate-bounce" : "border-border hover:border-primary/50"}
            `}
          />

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="
              w-full py-4 px-8 rounded-2xl
              bg-primary text-primary-foreground
              font-display text-2xl
              shadow-lg shadow-primary/30
              hover:opacity-90 hover:shadow-xl hover:shadow-primary/40
              active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-200
              flex items-center justify-center gap-3
            "
          >
            <Sparkles className="w-6 h-6" />
            Start Adventure!
            <Sparkles className="w-6 h-6" />
          </button>
        </div>

        {/* Decorative bottom hint */}
        <p className="font-body text-sm text-muted-foreground animate-wobble">
          🖼️ Upload a drawing • 🌍 Explore 5 worlds • 💬 Chat with your character
        </p>
      </div>
    </div>
  );
}
