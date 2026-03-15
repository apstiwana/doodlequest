import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLanguage, Language } from "@/context/LanguageContext";

interface WelcomeScreenProps {
  onStart: (name: string) => void;
}

const FLAG: Record<Language, string> = { en: "🇬🇧", nl: "🇧🇪" };
const LANG_LABEL: Record<Language, string> = { en: "EN", nl: "NL" };
const OTHER_LANG: Record<Language, Language> = { en: "nl", nl: "en" };

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { language, setLanguage, t } = useLanguage();
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

  const toggleLang = () => setLanguage(OTHER_LANG[language]);

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

      {/* Language toggle — top right */}
      <button
        onClick={toggleLang}
        title={t.langLabel}
        className="fixed top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-md hover:bg-card transition-colors font-body text-sm font-semibold text-foreground"
      >
        <span className="text-base">{FLAG[OTHER_LANG[language]]}</span>
        <span className="text-xs text-muted-foreground">{LANG_LABEL[OTHER_LANG[language]]}</span>
      </button>

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
            {t.tagline}
          </p>
        </div>

        {/* Name input card */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-border/50 space-y-5 animate-bounce-in">
          <div className="space-y-2">
            <label className="font-display text-2xl text-foreground block">
              {t.whatIsYourName}
            </label>
            <p className="font-body text-sm text-muted-foreground">
              {t.nameWillCall}
            </p>
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder={t.namePlaceholder}
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
            {t.startAdventure}
            <Sparkles className="w-6 h-6" />
          </button>
        </div>

        {/* Decorative bottom hint */}
        <p className="font-body text-sm text-muted-foreground animate-wobble">
          {t.bottomHint}
        </p>
      </div>
    </div>
  );
}
