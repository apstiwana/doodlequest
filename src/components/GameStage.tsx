import { useState, useEffect, useRef, useCallback } from "react";
import { Scene, SCENE_CONFIG, CharacterPhysics } from "@/types/game";
import { SceneSelector } from "./SceneSelector";
import { SpeechBubble } from "./SpeechBubble";
import { SceneBackground } from "./SceneBackground";
import { Volume2, VolumeX, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameStageProps {
  playerName: string;
  characterImageUrl: string;
  characterDescription: string;
}

type DialogueTrigger = "scene_change" | "idle" | "jump_land" | "edge_reached" | "chat";

const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const CHARACTER_SIZE = 100;
const GROUND_OFFSET = 90; // px from bottom

export function GameStage({ playerName, characterImageUrl, characterDescription }: GameStageProps) {
  const { toast } = useToast();
  const [scene, setScene] = useState<Scene>("forest");
  const [sceneTransition, setSceneTransition] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Dialogue
  const [bubble, setBubble] = useState<{ text: string; visible: boolean }>({ text: "", visible: false });

  // Physics
  const physicsRef = useRef<CharacterPhysics>({
    x: 0, y: 0, vx: 0, vy: 0,
    isOnGround: true, facingRight: true,
    isJumping: false, squashStretch: 1, tilt: 0,
  });
  const [physicsDisplay, setPhysicsDisplay] = useState({ ...physicsRef.current });

  const keysRef = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const justLandedRef = useRef(false);
  const edgeTriggeredRef = useRef(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const isMutedRef = useRef(isMuted);
  const sceneRef = useRef(scene);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { sceneRef.current = scene; }, [scene]);

  // Initialize position
  useEffect(() => {
    const groundY = window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2;
    physicsRef.current = {
      x: window.innerWidth / 2,
      y: groundY,
      vx: 0, vy: 0,
      isOnGround: true, facingRight: true,
      isJumping: false, squashStretch: 1, tilt: 0,
    };
    setPhysicsDisplay({ ...physicsRef.current });
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (isMutedRef.current) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch (e) {
      console.error("TTS error:", e);
    }
  }, []);

  const getCharacterDialogue = useCallback(async (
    triggerType: DialogueTrigger,
    message = "Say hello!"
  ) => {
    setIsThinking(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/character-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          message,
          playerName,
          scene: sceneRef.current,
          characterDescription,
          triggerType,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (response.status === 429 || response.status === 402) {
          toast({ description: err.error, variant: "destructive" });
        }
        return;
      }

      const data = await response.json();
      const reply = data.reply;

      setBubble({ text: reply, visible: true });
      speakText(reply);
    } catch (e) {
      console.error("chat error:", e);
    } finally {
      setIsThinking(false);
    }
  }, [playerName, characterDescription, speakText, toast]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!bubble.visible) {
        getCharacterDialogue("idle");
      }
    }, 5000);
  }, [bubble.visible, getCharacterDialogue]);

  // Scene change
  const handleSceneChange = useCallback((newScene: Scene) => {
    if (newScene === scene) return;
    setSceneTransition(true);
    setTimeout(() => {
      setScene(newScene);
      const groundY = window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2;
      physicsRef.current = {
        ...physicsRef.current,
        x: window.innerWidth / 2,
        y: groundY,
        vx: 0, vy: 0,
        isOnGround: true,
      };
      setPhysicsDisplay({ ...physicsRef.current });
      setSceneTransition(false);
      setBubble({ text: "", visible: false });
      setTimeout(() => getCharacterDialogue("scene_change"), 600);
    }, 400);
  }, [scene, getCharacterDialogue]);

  // Physics loop
  useEffect(() => {
    const loop = () => {
      const p = physicsRef.current;
      const groundY = window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2;
      const keys = keysRef.current;

      let newVx = 0;
      if (keys.has("ArrowLeft") || keys.has("a")) newVx = -MOVE_SPEED;
      if (keys.has("ArrowRight") || keys.has("d")) newVx = MOVE_SPEED;

      // Jump
      let newVy = p.vy + GRAVITY;
      if ((keys.has("ArrowUp") || keys.has("w") || keys.has(" ")) && p.isOnGround) {
        newVy = JUMP_FORCE;
        p.isJumping = true;
        justLandedRef.current = false;
      }

      // Gravity & ground
      let newY = p.y + newVy;
      let onGround = false;
      if (newY >= groundY) {
        newY = groundY;
        if (!p.isOnGround && !justLandedRef.current) {
          justLandedRef.current = true;
          // Trigger jump land dialogue occasionally
          if (Math.abs(p.vy) > 10) {
            getCharacterDialogue("jump_land");
          }
        }
        newVy = 0;
        onGround = true;
        p.isJumping = false;
      }

      // Horizontal bounds with edge trigger
      let newX = p.x + newVx;
      const edgeMargin = 50;
      if (newX < edgeMargin) {
        newX = edgeMargin;
        if (!edgeTriggeredRef.current) {
          edgeTriggeredRef.current = true;
          getCharacterDialogue("edge_reached");
          setTimeout(() => { edgeTriggeredRef.current = false; }, 8000);
        }
      } else if (newX > window.innerWidth - edgeMargin) {
        newX = window.innerWidth - edgeMargin;
        if (!edgeTriggeredRef.current) {
          edgeTriggeredRef.current = true;
          getCharacterDialogue("edge_reached");
          setTimeout(() => { edgeTriggeredRef.current = false; }, 8000);
        }
      } else {
        edgeTriggeredRef.current = false;
      }

      // Squash-stretch
      let squashStretch = 1;
      if (!onGround && newVy < -4) squashStretch = 1.25; // stretch going up
      if (!onGround && newVy > 4) squashStretch = 0.85;   // stretch going down
      if (onGround && justLandedRef.current) squashStretch = 1.3; // squash on land

      // Tilt when moving
      const tilt = newVx > 0 ? 8 : newVx < 0 ? -8 : 0;

      // Facing
      const facingRight = newVx >= 0 ? true : (newVx < 0 ? false : p.facingRight);

      physicsRef.current = {
        x: newX, y: newY,
        vx: newVx, vy: newVy,
        isOnGround: onGround,
        facingRight,
        isJumping: p.isJumping,
        squashStretch,
        tilt,
      };

      setPhysicsDisplay({ ...physicsRef.current });
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [getCharacterDialogue]);

  // Key listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      resetIdleTimer();
      if (e.key === "t" || e.key === "T") {
        setChatOpen((prev) => !prev);
        setTimeout(() => chatInputRef.current?.focus(), 100);
      }
      if (e.key === " ") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [resetIdleTimer]);

  // Initial greeting
  useEffect(() => {
    const timer = setTimeout(() => getCharacterDialogue("scene_change"), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");
    setChatOpen(false);
    await getCharacterDialogue("chat", msg);
  };

  // Mobile controls
  const handleMobileKey = (key: string, down: boolean) => {
    if (down) keysRef.current.add(key);
    else keysRef.current.delete(key);
    resetIdleTimer();
  };

  const groundY = window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2;
  const charScaleX = (physicsDisplay.facingRight ? 1 : -1) * 1;
  const charScaleY = physicsDisplay.isOnGround && !physicsDisplay.isJumping
    ? 1 / physicsDisplay.squashStretch
    : physicsDisplay.squashStretch;
  const charScaleXFinal = Math.abs(1 / physicsDisplay.squashStretch) * (physicsDisplay.facingRight ? 1 : -1);

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Scene background */}
      <div className={sceneTransition ? "animate-scene-transition" : ""}>
        <SceneBackground scene={scene} />
      </div>

      {/* Speech bubble */}
      <SpeechBubble
        text={bubble.text}
        visible={bubble.visible}
        characterX={physicsDisplay.x}
        characterY={physicsDisplay.y}
        onDismiss={() => setBubble((prev) => ({ ...prev, visible: false }))}
      />

      {/* Character */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: physicsDisplay.x - CHARACTER_SIZE / 2,
          top: physicsDisplay.y - CHARACTER_SIZE / 2,
          width: CHARACTER_SIZE,
          height: CHARACTER_SIZE,
          transform: `
            scaleX(${physicsDisplay.facingRight ? physicsDisplay.squashStretch : -physicsDisplay.squashStretch})
            scaleY(${1 / Math.max(physicsDisplay.squashStretch, 0.5)})
            rotate(${physicsDisplay.tilt}deg)
          `,
          transition: "transform 0.05s ease-out",
          transformOrigin: "bottom center",
        }}
      >
        {isThinking && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
        <img
          src={characterImageUrl}
          alt="Your character"
          className="w-full h-full object-contain"
          style={{
            filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.3)) contrast(1.1) saturate(1.2)",
            mixBlendMode: "multiply",
          }}
          draggable={false}
        />
      </div>

      {/* Ground shadow */}
      <div
        className="absolute pointer-events-none rounded-full bg-black/20 blur-sm"
        style={{
          left: physicsDisplay.x - 30,
          top: window.innerHeight - GROUND_OFFSET + 2,
          width: 60,
          height: 12,
          transform: `scaleX(${physicsDisplay.squashStretch})`,
          opacity: physicsDisplay.isOnGround ? 0.4 : Math.max(0, 0.4 - (groundY - physicsDisplay.y) / 400),
        }}
      />

      {/* Scene selector */}
      <SceneSelector currentScene={scene} onSceneChange={handleSceneChange} />

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={() => setIsMuted((m) => !m)}
          className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-md border border-border/50 flex items-center justify-center shadow-md hover:bg-card transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-28 right-4 z-30 animate-bounce-in">
          <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-3xl p-4 shadow-xl w-72">
            <p className="font-body text-sm text-muted-foreground mb-2">
              💬 Talk to your character!
            </p>
            <div className="flex gap-2">
              <input
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 rounded-2xl border border-border bg-background font-body text-sm focus:outline-none focus:border-primary"
                maxLength={150}
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim()}
                className="px-3 py-2 rounded-2xl bg-primary text-primary-foreground font-body text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-right talk button */}
      <button
        onClick={() => {
          setChatOpen((prev) => !prev);
          setTimeout(() => chatInputRef.current?.focus(), 100);
        }}
        className="fixed bottom-28 right-4 w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-xl shadow-secondary/30 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-20"
        style={{ display: chatOpen ? "none" : "flex" }}
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* Mobile D-Pad */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 md:hidden">
        <button
          onPointerDown={() => handleMobileKey("ArrowUp", true)}
          onPointerUp={() => handleMobileKey("ArrowUp", false)}
          onPointerLeave={() => handleMobileKey("ArrowUp", false)}
          className="w-12 h-12 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 flex items-center justify-center text-xl shadow-md active:bg-primary active:text-primary-foreground"
        >
          ⬆️
        </button>
        <div className="flex gap-1">
          <button
            onPointerDown={() => handleMobileKey("ArrowLeft", true)}
            onPointerUp={() => handleMobileKey("ArrowLeft", false)}
            onPointerLeave={() => handleMobileKey("ArrowLeft", false)}
            className="w-12 h-12 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 flex items-center justify-center text-xl shadow-md active:bg-primary active:text-primary-foreground"
          >
            ⬅️
          </button>
          <div className="w-12 h-12" />
          <button
            onPointerDown={() => handleMobileKey("ArrowRight", true)}
            onPointerUp={() => handleMobileKey("ArrowRight", false)}
            onPointerLeave={() => handleMobileKey("ArrowRight", false)}
            className="w-12 h-12 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 flex items-center justify-center text-xl shadow-md active:bg-primary active:text-primary-foreground"
          >
            ➡️
          </button>
        </div>
      </div>

      {/* Controls hint */}
      <div className="fixed bottom-4 left-4 z-10 font-body text-xs text-white/50 hidden md:block">
        ← → Move • ↑ / Space Jump • T Chat
      </div>
    </div>
  );
}
