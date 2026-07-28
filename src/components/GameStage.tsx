import { useState, useEffect, useRef, useCallback } from "react";
import { Scene, SCENE_CONFIG, CharacterPhysics } from "@/types/game";
import { SceneSelector } from "./SceneSelector";
import { SceneBackground, WORLD_WIDTH } from "./SceneBackground";
import { ObstaclesLayer, getObstaclesForScene } from "./Obstacles";
import { FinishLine } from "./FinishLine";
import { LevelComplete } from "./LevelComplete";
import { CollectibleStarsLayer, generateStars, Star } from "./CollectibleStars";
import { useLanguage } from "@/context/LanguageContext";

interface GameStageProps {
  playerName: string;
  characterImageUrl: string;
  /**
   * Currently unused: it fed the retired AI dialogue call (S0.2). Kept on the
   * props because the upload/customise flow already produces it and the local phrase
   * bank (S8.1) will consume it.
   */
  characterDescription: string;
  characterSize?: number;
  colorFilter?: string;
}

const GRAVITY = 0.55;
const JUMP_FORCE = -18;
const MOVE_SPEED = 5;
const GROUND_OFFSET = 90; // px from bottom
// Camera: character sits at ~40% from left when scrolling
const CAMERA_LEAD = 0.4;

export function GameStage({ playerName, characterImageUrl, characterSize = 180, colorFilter }: GameStageProps) {
  const { t } = useLanguage();
  const CHARACTER_SIZE = characterSize;
  const charFilter = colorFilter
    ? colorFilter
    : "drop-shadow(3px 6px 8px rgba(0,0,0,0.35)) contrast(1.05) saturate(1.15)";
  const [scene, setScene] = useState<Scene>("forest");
  const [sceneTransition, setSceneTransition] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);
  const starsRef = useRef<Star[]>([]);
  const scoreRef = useRef(0);

  // Physics
  const physicsRef = useRef<CharacterPhysics>({
    x: 0, y: 0, vx: 0, vy: 0,
    isOnGround: true, facingRight: true,
    isJumping: false, squashStretch: 1, tilt: 0,
  });
  const [physicsDisplay, setPhysicsDisplay] = useState({ ...physicsRef.current });

  const keysRef = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const justLandedRef = useRef(false);
  const finishTriggeredRef = useRef(false);
  const sceneRef = useRef(scene);

  useEffect(() => { sceneRef.current = scene; }, [scene]);

  // Initialize position + stars
  useEffect(() => {
    const groundY = window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2;
    physicsRef.current = {
      x: window.innerWidth * CAMERA_LEAD,
      y: groundY,
      vx: 0, vy: 0,
      isOnGround: true, facingRight: true,
      isJumping: false, squashStretch: 1, tilt: 0,
    };
    setPhysicsDisplay({ ...physicsRef.current });
    const initial = generateStars("forest", window.innerHeight - GROUND_OFFSET);
    starsRef.current = initial;
    setStars([...initial]);
    scoreRef.current = 0;
    setScore(0);
  }, []);

  // Character dialogue and text-to-speech previously ran through two Lovable AI edge
  // functions. Those are retired with the Supabase project (S0.2), so the character is
  // silent for now; the curated local phrase bank in S8.1 is what brings dialogue
  // back, without a network round trip or an AI bill.

  // Scene change — reset to start of world
  const handleSceneChange = useCallback((newScene: Scene) => {
    if (newScene === scene) return;
    setSceneTransition(true);
    setTimeout(() => {
      setScene(newScene);
      const groundY = window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2;
      physicsRef.current = {
        ...physicsRef.current,
        x: window.innerWidth * CAMERA_LEAD,
        y: groundY,
        vx: 0, vy: 0,
        isOnGround: true,
      };
      setPhysicsDisplay({ ...physicsRef.current });
      setSceneTransition(false);
      finishTriggeredRef.current = false;
      // Reset stars for new scene
      const fresh = generateStars(newScene, window.innerHeight - GROUND_OFFSET);
      starsRef.current = fresh;
      setStars([...fresh]);
      scoreRef.current = 0;
      setScore(0);
    }, 400);
  }, [scene, CHARACTER_SIZE]);

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
        }
        newVy = 0;
        onGround = true;
        p.isJumping = false;
      }

      // Horizontal bounds — clamp to world width
      let newX = p.x + newVx;
      const edgeMargin = CHARACTER_SIZE / 2;
      if (newX < edgeMargin) {
        newX = edgeMargin;
      } else if (newX > WORLD_WIDTH - edgeMargin) {
        newX = WORLD_WIDTH - edgeMargin;
      }

      // Check finish line (FINISH_X = WORLD_WIDTH - 80)
      const FINISH_X = WORLD_WIDTH - 80;
      if (!finishTriggeredRef.current && newX >= FINISH_X - CHARACTER_SIZE / 2) {
        finishTriggeredRef.current = true;
        setLevelComplete(true);
      }

      // Obstacle collision (push back horizontally, can jump over top)
      const trueGroundY = window.innerHeight - GROUND_OFFSET;
      const obstacles = getObstaclesForScene(sceneRef.current, trueGroundY);
      const charHalf = CHARACTER_SIZE / 2;
      const charTop = newY - charHalf;
      const charBottom = newY + charHalf;

      for (const obs of obstacles) {
        const obsLeft = obs.x - obs.width / 2;
        const obsRight = obs.x + obs.width / 2;
        const obsTop = obs.y - obs.height / 2;
        const obsBottom = obs.y + obs.height / 2;

        // AABB overlap check
        const overlapX = newX + charHalf > obsLeft && newX - charHalf < obsRight;
        const overlapY = charBottom > obsTop && charTop < obsBottom;

        if (overlapX && overlapY) {
          // If the character's feet are above the top of the obstacle (jumping over),
          // let them land on top instead of being pushed sideways
          const prevCharBottom = p.y + charHalf;
          if (prevCharBottom <= obsTop + 8 && newVy >= 0) {
            // Land on top of obstacle
            newY = obsTop - charHalf;
            newVy = 0;
            onGround = true;
            p.isJumping = false;
            if (!justLandedRef.current) {
              justLandedRef.current = true;
            }
          } else {
            // Push character out horizontally
            const fromLeft = p.x - charHalf < obsLeft;
            if (fromLeft) {
              newX = obsLeft - charHalf;
            } else {
              newX = obsRight + charHalf;
            }
          }
        }
      }

      // Star collection
      const STAR_RADIUS = 40;
      let collected = false;
      const updatedStars = starsRef.current.map((s) => {
        if (s.collected) return s;
        const dx = newX - s.worldX;
        const dy = (newY - CHARACTER_SIZE / 4) - s.worldY; // use upper-body center
        if (Math.abs(dx) < STAR_RADIUS + CHARACTER_SIZE / 2 && Math.abs(dy) < STAR_RADIUS + CHARACTER_SIZE / 2) {
          collected = true;
          return { ...s, collected: true };
        }
        return s;
      });
      if (collected) {
        starsRef.current = updatedStars;
        setStars([...updatedStars]);
        scoreRef.current += 10;
        setScore(scoreRef.current);
      }

      // Squash-stretch
      let squashStretch = 1;
      if (!onGround && newVy < -4) squashStretch = 1.25;
      if (!onGround && newVy > 4) squashStretch = 0.85;
      if (onGround && justLandedRef.current) squashStretch = 1.3;

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
  }, [CHARACTER_SIZE]);

  // Key listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " ") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Mobile controls
  const handleMobileKey = (key: string, down: boolean) => {
    if (down) keysRef.current.add(key);
    else keysRef.current.delete(key);
  };

  // Camera: scroll so character stays ~40% from left of screen
  const viewW = window.innerWidth;
  const rawCameraX = physicsDisplay.x - viewW * CAMERA_LEAD;
  const cameraX = Math.max(0, Math.min(rawCameraX, WORLD_WIDTH - viewW));
  // Screen position of character = worldX - cameraX
  const charScreenX = physicsDisplay.x - cameraX;

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Scene background — scrolls with camera */}
      <div className={sceneTransition ? "animate-scene-transition" : ""}>
        <SceneBackground scene={scene} cameraX={cameraX} />
      </div>

      {/* Obstacles */}
      <ObstaclesLayer
        scene={scene}
        cameraX={cameraX}
        groundY={window.innerHeight - GROUND_OFFSET}
      />

      {/* Collectible Stars */}
      <CollectibleStarsLayer
        stars={stars}
        cameraX={cameraX}
        scene={scene}
      />

      {/* Finish line */}
      <FinishLine
        scene={scene}
        cameraX={cameraX}
        groundY={window.innerHeight - GROUND_OFFSET}
      />

      {/* Character */}
      {(() => {
        const isMoving = Math.abs(physicsDisplay.vx) > 0.5;
        const isAirborne = !physicsDisplay.isOnGround;
        const animClass = isAirborne
          ? "animate-char-jump"
          : isMoving
          ? "animate-char-run"
          : "animate-char-idle";

        return (
          <div
            className="absolute pointer-events-none"
            style={{
              left: charScreenX - CHARACTER_SIZE / 2,
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
            <img
              src={characterImageUrl}
              alt="Your character"
              className={`w-full h-full object-contain object-bottom ${animClass}`}
              style={{ filter: charFilter }}
              draggable={false}
            />
          </div>
        );
      })()}

      {/* Ground shadow */}
      <div
        className="absolute pointer-events-none rounded-full bg-black/20 blur-sm"
        style={{
          left: charScreenX - 30,
          top: window.innerHeight - GROUND_OFFSET + 2,
          width: 60,
          height: 12,
          transform: `scaleX(${physicsDisplay.squashStretch})`,
          opacity: physicsDisplay.isOnGround ? 0.4 : Math.max(0, 0.4 - Math.abs(physicsDisplay.y - (window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2)) / 400),
        }}
      />

      {/* Scene selector */}
      <SceneSelector currentScene={scene} onSceneChange={handleSceneChange} />

      {/* Score HUD */}
      <div className="fixed top-4 left-4 z-20 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl px-4 py-2 shadow-md">
        <span className="text-xl" style={{ filter: "drop-shadow(0 0 6px #FFE66D)" }}>⭐</span>
        <span className="font-display text-2xl text-foreground">{Math.round(score / 10)}</span>
        <span className="font-body text-xs text-muted-foreground">stars</span>
      </div>

      {/*
        The mute toggle, speech bubble, chat panel and talk button lived here. All four
        existed only to drive the retired AI dialogue and text-to-speech endpoints
        (S0.2); leaving the controls in place would have given a child buttons that
        silently do nothing. They come back with the local phrase bank in S8.1.
      */}

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
        {t.controlsHint}
      </div>

      {/* Level complete celebration */}
      {levelComplete && (
        <LevelComplete
          scene={scene}
          playerName={playerName}
          score={score}
          onContinue={() => {
            setLevelComplete(false);
            finishTriggeredRef.current = false;
            const groundY = window.innerHeight - GROUND_OFFSET - CHARACTER_SIZE / 2;
            physicsRef.current = {
              ...physicsRef.current,
              x: window.innerWidth * CAMERA_LEAD,
              y: groundY,
              vx: 0, vy: 0,
              isOnGround: true,
            };
            setPhysicsDisplay({ ...physicsRef.current });
            // Reset stars for replay
            const fresh = generateStars(scene, window.innerHeight - GROUND_OFFSET);
            starsRef.current = fresh;
            setStars([...fresh]);
            scoreRef.current = 0;
            setScore(0);
          }}
        />
      )}
    </div>
  );
}
