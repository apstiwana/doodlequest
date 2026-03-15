import { useState, useEffect, useRef } from "react";

interface SpeechBubbleProps {
  text: string;
  visible: boolean;
  characterX: number;
  characterY: number;
  onDismiss?: () => void;
}

export function SpeechBubble({ text, visible, characterX, characterY, onDismiss }: SpeechBubbleProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && text) {
      setIsAnimatingOut(false);
      setDisplayedText("");

      if (intervalRef.current) clearInterval(intervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

      const words = text.split(" ");
      let wordIndex = 0;

      intervalRef.current = setInterval(() => {
        if (wordIndex < words.length) {
          setDisplayedText(words.slice(0, wordIndex + 1).join(" "));
          wordIndex++;
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Auto-dismiss after reading time
          const readTime = Math.max(3000, text.length * 50);
          dismissTimerRef.current = setTimeout(() => {
            setIsAnimatingOut(true);
            setTimeout(() => onDismiss?.(), 300);
          }, readTime);
        }
      }, 120);
    }

    if (!visible) {
      setDisplayedText("");
      setIsAnimatingOut(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [visible, text]);

  if (!visible && !isAnimatingOut) return null;

  // Position bubble above the character, stay within screen
  const bubbleLeft = Math.min(Math.max(characterX - 100, 8), window.innerWidth - 230);
  const bubbleBottom = window.innerHeight - characterY + 80;

  return (
    <div
      className={`fixed z-30 pointer-events-none select-none ${isAnimatingOut ? "animate-bubble-dismiss" : "animate-bubble-pop"}`}
      style={{
        left: bubbleLeft,
        bottom: bubbleBottom,
        maxWidth: 220,
      }}
    >
      {/* Bubble */}
      <div className="relative bg-card border-2 border-primary/30 rounded-3xl px-4 py-3 shadow-xl shadow-primary/20">
        <p className="font-body font-semibold text-foreground text-sm leading-snug min-h-[2em]">
          {displayedText}
          {displayedText.length < text.length && (
            <span className="inline-block w-1.5 h-4 bg-primary/70 ml-0.5 animate-pulse rounded-full align-middle" />
          )}
        </p>

        {/* Tail pointing down */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "14px solid hsl(var(--card))",
            filter: "drop-shadow(0 2px 0 hsl(var(--primary)/0.3))",
          }}
        />
      </div>
    </div>
  );
}
