import { useState } from "react";
import { Sparkles, RefreshCw, Palette, Maximize2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Slider } from "@/components/ui/slider";

interface CharacterCustomizerProps {
  playerName: string;
  imageDataUrl: string;
  description: string;
  onComplete: (imageDataUrl: string, description: string, size: number, colorFilter: string) => void;
  onBack: () => void;
}

const COLOR_PRESETS = [
  { label: "Original", hue: null, saturate: 1, brightness: 1 },
  { label: "Red",      hue: 0,    saturate: 2, brightness: 1 },
  { label: "Orange",   hue: 30,   saturate: 2, brightness: 1 },
  { label: "Yellow",   hue: 55,   saturate: 2, brightness: 1 },
  { label: "Green",    hue: 120,  saturate: 2, brightness: 1 },
  { label: "Cyan",     hue: 185,  saturate: 2, brightness: 1 },
  { label: "Blue",     hue: 220,  saturate: 2, brightness: 1 },
  { label: "Purple",   hue: 280,  saturate: 2, brightness: 1 },
  { label: "Pink",     hue: 330,  saturate: 2, brightness: 1 },
  { label: "Ghost",    hue: null, saturate: 0, brightness: 1.4 },
  { label: "Golden",   hue: 45,   saturate: 3, brightness: 1.1 },
  { label: "Dark",     hue: null, saturate: 1, brightness: 0.4 },
];

const SIZE_MIN = 80;
const SIZE_MAX = 280;
const SIZE_DEFAULT = 180;

export function CharacterCustomizer({
  playerName,
  imageDataUrl,
  description,
  onComplete,
  onBack,
}: CharacterCustomizerProps) {
  const { t } = useLanguage();
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [size, setSize] = useState(SIZE_DEFAULT);

  const preset = COLOR_PRESETS[selectedPreset];

  const cssFilter = (() => {
    const parts: string[] = [
      "drop-shadow(2px 6px 8px rgba(0,0,0,0.25))",
      `saturate(${preset.saturate})`,
      `brightness(${preset.brightness})`,
    ];
    if (preset.hue !== null) parts.push(`hue-rotate(${preset.hue}deg)`);
    return parts.join(" ");
  })();

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
                width: size,
                height: size,
                maxWidth: "100%",
                maxHeight: "100%",
                filter: cssFilter,
              }}
            />
          </div>

          {/* Colour section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-primary" />
              <span className="font-body font-semibold text-sm text-foreground">
                {t.customizeColor}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map((p, i) => {
                const swatchFilter = [
                  `saturate(${p.saturate})`,
                  `brightness(${p.brightness})`,
                  p.hue !== null ? `hue-rotate(${p.hue}deg)` : "",
                ].filter(Boolean).join(" ");

                return (
                  <button
                    key={p.label}
                    onClick={() => setSelectedPreset(i)}
                    title={p.label}
                    className={`
                      relative flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all
                      ${selectedPreset === i
                        ? "border-primary scale-105 shadow-md shadow-primary/20"
                        : "border-transparent hover:border-border"
                      }
                    `}
                  >
                    <div
                      className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center"
                      style={{ background: "hsl(var(--muted)/0.4)" }}
                    >
                      <img
                        src={imageDataUrl}
                        alt={p.label}
                        className="w-full h-full object-contain"
                        style={{ filter: swatchFilter }}
                      />
                    </div>
                    <span className="text-[9px] font-body text-muted-foreground leading-none">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
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
                {Math.round((size / SIZE_DEFAULT) * 100)}%
              </span>
            </div>
            <Slider
              min={SIZE_MIN}
              max={SIZE_MAX}
              step={10}
              value={[size]}
              onValueChange={([v]) => setSize(v)}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground font-body">{t.customizeTiny}</span>
              <span className="text-xs text-muted-foreground font-body">{t.customizeGiant}</span>
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
              onClick={() => onComplete(imageDataUrl, description, size, cssFilter)}
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
