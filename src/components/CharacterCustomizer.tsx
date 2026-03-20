import { useState } from "react";
import { Sparkles, RefreshCw, Maximize2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Slider } from "@/components/ui/slider";

interface CharacterCustomizerProps {
  playerName: string;
  imageDataUrl: string;
  description: string;
  onComplete: (imageDataUrl: string, description: string, size: number, colorFilter: string) => void;
  onBack: () => void;
}

// Slider value maps 1–3 (100%–300%); actual pixel size = value * BASE_SIZE
// BASE_SIZE=80 → 80px at 100%, 240px at 300%
const SIZE_SCALE_MIN = 1;   // 100%
const SIZE_SCALE_MAX = 3;   // 300%
const SIZE_SCALE_DEFAULT = 1.5; // 150% starting point → 120px
const BASE_SIZE = 80;

export function CharacterCustomizer({
  playerName,
  imageDataUrl,
  description,
  onComplete,
  onBack,
}: CharacterCustomizerProps) {
  const { t } = useLanguage();
  // scale: 1 = 100%, 3 = 300%. Actual pixel size = scale * BASE_SIZE
  const [scale, setScale] = useState(SIZE_SCALE_DEFAULT);
  const pixelSize = Math.round(scale * BASE_SIZE);

  const cssFilter = "drop-shadow(2px 6px 8px rgba(0,0,0,0.25))";

  const displayPercent = Math.round(scale * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/30 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2 animate-float inline-block">🎮</div>
          <h2 className="font-display text-3xl text-primary mb-1">
            {t.customizeTitle}
          </h2>
          <p className="font-body text-muted-foreground">
            {t.customizeSubtitle(playerName)}
          </p>
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-lg space-y-6">

          {/* Character Preview */}
          <div
            className="relative mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-muted/40 to-background flex items-end justify-center"
            style={{ width: 240, height: 240 }}
          >
            {/* checkerboard-style subtle grid to show transparency */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(hsl(var(--muted)/0.4) 0% 25%, transparent 0% 50%)",
                backgroundSize: "20px 20px",
              }}
            />
            <img
              src={imageDataUrl}
              alt="Your character"
              className="relative z-10 object-contain animate-char-idle"
              style={{
                width: pixelSize * 2,
                height: pixelSize * 2,
                maxWidth: "100%",
                maxHeight: "100%",
                filter: cssFilter,
              }}
            />
          </div>

          {/* Size section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-primary" />
                <span className="font-body font-semibold text-sm text-foreground">
                  {t.customizeSize}
                </span>
              </div>
              <span className="font-body text-sm text-muted-foreground">
                {displayPercent}%
              </span>
            </div>
            <Slider
              min={SIZE_SCALE_MIN}
              max={SIZE_SCALE_MAX}
              step={0.05}
              value={[scale]}
              onValueChange={([v]) => setScale(v)}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground font-body">100%</span>
              <span className="text-xs text-muted-foreground font-body">300%</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-border font-body font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t.tryAgain}
            </button>
            <button
              onClick={() => onComplete(imageDataUrl, description, pixelSize, cssFilter)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-primary text-primary-foreground font-display text-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
            >
              <Sparkles className="w-5 h-5" />
              {t.letsGo}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
