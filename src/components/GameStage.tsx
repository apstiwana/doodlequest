import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Scene } from "@/types/game";
import { SceneSelector } from "./SceneSelector";
import { SceneBackground } from "./SceneBackground";
import { ObstaclesLayer } from "./Obstacles";
import { FinishLine } from "./FinishLine";
import { LevelComplete } from "./LevelComplete";
import { CollectibleStarsLayer } from "./CollectibleStars";
import { useLanguage } from "@/context/LanguageContext";
import {
  FixedTimestepLoop,
  FrameMeter,
  GameCore,
  GROUND_OFFSET,
  MOVING_VX,
  POINTS_PER_STAR,
  WORLD_WIDTH,
} from "@/game";

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

const CHAR_IMG_CLASS = "w-full h-full object-contain object-bottom";
const SCENE_TRANSITION_MS = 400;

/** `?debug` on the URL turns on the frame-time overlay S4.1 asks for. */
function debugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("debug");
}

/**
 * The playable stage.
 *
 * **The game loop is not in React.** `GameCore` owns the simulation in a plain object,
 * `FixedTimestepLoop` steps it at a fixed 60 Hz, and this component's only job each frame
 * is to write a handful of `transform`s onto elements it already rendered. There is no
 * `setState` anywhere in the frame path — React is told about the game only on discrete
 * events (a star collected, the level finished) through the core's emitter, which is what
 * S4.1 requires and what ARCHITECTURE.md §14 rule 2 forbids breaking.
 *
 * Rendering is still DOM/SVG on purpose. ARCH's migration sequence keeps DOM rendering for
 * this step so that the diagnosis — React reconciling several hundred SVG nodes per frame
 * — is proven fixed before the canvas renderer (E5) changes the picture too.
 */
export function GameStage({
  playerName,
  characterImageUrl,
  characterSize = 180,
  colorFilter,
}: GameStageProps) {
  const { t } = useLanguage();
  const charFilter = colorFilter
    ? colorFilter
    : "drop-shadow(3px 6px 8px rgba(0,0,0,0.35)) contrast(1.05) saturate(1.15)";

  const [scene, setScene] = useState<Scene>("forest");
  const [sceneTransition, setSceneTransition] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [score, setScore] = useState(0);
  /** Bumped on each collection so the star layer can drop the collected node. */
  const [starVersion, setStarVersion] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1024 : window.innerWidth,
    height: typeof window === "undefined" ? 768 : window.innerHeight,
  }));

  // The simulation. Created once, lives outside React's render cycle entirely.
  const coreRef = useRef<GameCore | null>(null);
  if (coreRef.current === null) {
    coreRef.current = new GameCore({
      scene: "forest",
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      characterSize,
    });
  }
  const core = coreRef.current;

  // Elements the loop writes to directly.
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const propLayerRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const charInnerRef = useRef<HTMLDivElement>(null);
  const charImgRef = useRef<HTMLImageElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sceneTimerRef = useRef<number | null>(null);

  // How many times React has committed this component. Printed by the dev overlay: this
  // is the number that used to climb by 60 every second. No dependency array on purpose —
  // it counts commits.
  const commitsRef = useRef(0);
  useEffect(() => {
    commitsRef.current += 1;
  });

  const debugRef = useRef<boolean | null>(null);
  if (debugRef.current === null) debugRef.current = debugEnabled();
  const debug = debugRef.current;

  // ── The frame path ───────────────────────────────────────────────────────────────
  // `useLayoutEffect`, so the first `render(0)` below lands before the browser paints.
  // With a plain `useEffect` the character would be drawn once at the top-left corner
  // before the first animation frame moved it — a visible flash on entering the game.
  useLayoutEffect(() => {
    const meter = new FrameMeter();
    // Last values written to the DOM, so an unchanged frame costs no style write at all.
    let lastCam = Number.NaN;
    let lastCharTransform = "";
    let lastInnerTransform = "";
    let lastAnim = "";
    let lastShadowTransform = "";
    let lastShadowOpacity = "";
    let stepsThisFrame = 0;
    const half = characterSize / 2;

    const render = (alpha: number) => {
      const c = core.character;

      // Interpolate between the previous and the current tick. This is what lets a 120 Hz
      // display show smooth motion from a 60 Hz simulation (ARCHITECTURE.md §6.1).
      const x = core.prevX + (c.x - core.prevX) * alpha;
      const y = core.prevY + (c.y - core.prevY) * alpha;
      const cam = Math.round(core.cameraX(x) * 10) / 10;

      if (cam !== lastCam) {
        const layerTransform = `translate3d(${-cam}px,0,0)`;
        if (bgLayerRef.current) bgLayerRef.current.style.transform = layerTransform;
        if (propLayerRef.current) propLayerRef.current.style.transform = layerTransform;
        lastCam = cam;
      }

      const screenX = x - cam;
      const charTransform = `translate3d(${screenX - half}px,${y - half}px,0)`;
      if (charTransform !== lastCharTransform && charRef.current) {
        charRef.current.style.transform = charTransform;
        lastCharTransform = charTransform;
      }

      const squash = c.squashStretch;
      const innerTransform =
        `scaleX(${c.facingRight ? squash : -squash}) ` +
        `scaleY(${1 / Math.max(squash, 0.5)}) ` +
        `rotate(${c.tilt}deg)`;
      if (innerTransform !== lastInnerTransform && charInnerRef.current) {
        charInnerRef.current.style.transform = innerTransform;
        lastInnerTransform = innerTransform;
      }

      const isMoving = c.vx > MOVING_VX || c.vx < -MOVING_VX;
      const anim = !c.isOnGround
        ? "animate-char-jump"
        : isMoving
          ? "animate-char-run"
          : "animate-char-idle";
      if (anim !== lastAnim && charImgRef.current) {
        charImgRef.current.className = `${CHAR_IMG_CLASS} ${anim}`;
        lastAnim = anim;
      }

      const groundTop = core.groundY;
      const shadowTransform = `translate3d(${screenX - 30}px,${groundTop + 2}px,0) scaleX(${squash})`;
      const shadowOpacity = c.isOnGround
        ? "0.4"
        : String(Math.max(0, 0.4 - Math.abs(y - (groundTop - half)) / 400));
      if (shadowRef.current) {
        if (shadowTransform !== lastShadowTransform) {
          shadowRef.current.style.transform = shadowTransform;
          lastShadowTransform = shadowTransform;
        }
        if (shadowOpacity !== lastShadowOpacity) {
          shadowRef.current.style.opacity = shadowOpacity;
          lastShadowOpacity = shadowOpacity;
        }
      }

      if (debug) {
        meter.sample(
          typeof performance === "undefined" ? 0 : performance.now(),
          stepsThisFrame,
        );
        if (overlayRef.current) {
          overlayRef.current.textContent =
            `${meter.fps.toFixed(1)} fps · avg ${meter.averageMs.toFixed(2)} ms · ` +
            `worst ${meter.worstMs.toFixed(1)} ms · over-budget ${meter.longFrames}/${meter.frames} · ` +
            `ticks ${meter.steps} · React commits ${commitsRef.current}`;
        }
      }
      stepsThisFrame = 0;
    };

    const loop = new FixedTimestepLoop({
      step: (dt) => {
        stepsThisFrame++;
        core.step(dt);
      },
      render,
    });
    render(0);
    loop.start();
    return () => loop.stop();
  }, [core, characterSize, debug]);

  // ── Discrete events: the only way React hears about the game ─────────────────────
  useEffect(() => {
    const offScore = core.on("score", (e) => {
      if (e.type === "score") setScore(e.score);
    });
    const offStar = core.on("starCollected", () => setStarVersion((v) => v + 1));
    const offComplete = core.on("levelComplete", () => setLevelComplete(true));
    return () => {
      offScore();
      offStar();
      offComplete();
    };
  }, [core]);

  // ── Input ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      core.setKey(e.key, true);
      if (e.key === " ") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => core.setKey(e.key, false);
    // A held key does not generate a keyup if the window loses focus, so the character
    // would otherwise keep running while the child is somewhere else entirely.
    const release = () => core.clearInput();

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", release);
    };
  }, [core]);

  const handleMobileKey = useCallback(
    (key: string, down: boolean) => core.setKey(key, down),
    [core],
  );

  // ── Viewport ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      core.setViewport(width, height);
      // A resize is a discrete event, so re-rendering the world layers here is fine —
      // it is not in the frame path.
      setViewport({ width, height });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [core]);

  // A no-op in practice — the customiser fixes the size before the game mounts — but a
  // silent mismatch between the drawn size and the collision box would be a nasty bug.
  useEffect(() => {
    core.setCharacterSize(characterSize);
  }, [core, characterSize]);

  // ── Scene change ─────────────────────────────────────────────────────────────────
  const handleSceneChange = useCallback(
    (newScene: Scene) => {
      if (newScene === core.scene) return;
      // Ignore a second tap while a transition is already in flight; two overlapping
      // timers would leave the core and React disagreeing about which scene is loaded.
      if (sceneTimerRef.current !== null) return;
      setSceneTransition(true);
      sceneTimerRef.current = window.setTimeout(() => {
        sceneTimerRef.current = null;
        core.changeScene(newScene);
        setScene(newScene);
        setScore(0);
        setStarVersion((v) => v + 1);
        setLevelComplete(false);
        setSceneTransition(false);
      }, SCENE_TRANSITION_MS);
    },
    [core],
  );

  useEffect(
    () => () => {
      if (sceneTimerRef.current !== null) window.clearTimeout(sceneTimerRef.current);
      core.dispose();
    },
    [core],
  );

  const groundTop = viewport.height - GROUND_OFFSET;

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Scene background — the loop scrolls it by writing a transform on bgLayerRef */}
      <div className={sceneTransition ? "animate-scene-transition" : ""}>
        <SceneBackground scene={scene} layerRef={bgLayerRef} />
      </div>

      {/*
        World-space prop layer. Obstacles, stars and the finish flag are positioned by
        their world X inside this one element, and the loop scrolls the element. Before
        S4.1 each of them took `cameraX` as a prop and re-rendered every frame to cull
        itself; twenty-one absolutely positioned nodes are cheaper than that was.
      */}
      <div
        ref={propLayerRef}
        data-testid="prop-layer"
        className="absolute top-0 left-0 h-full pointer-events-none"
        style={{ width: WORLD_WIDTH, willChange: "transform" }}
      >
        <ObstaclesLayer scene={scene} groundY={groundTop} />
        <CollectibleStarsLayer stars={core.stars} scene={scene} version={starVersion} />
        <FinishLine scene={scene} groundY={groundTop} />
      </div>

      {/*
        Character. The outer element carries position (written every frame, no CSS
        transition — a transition on movement would fight the simulation); the inner one
        carries squash/stretch and lean, where the 50 ms ease is what sells the impact.
      */}
      <div
        ref={charRef}
        data-testid="character"
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: characterSize, height: characterSize, willChange: "transform" }}
      >
        <div
          ref={charInnerRef}
          className="w-full h-full"
          style={{ transformOrigin: "bottom center", transition: "transform 0.05s ease-out" }}
        >
          <img
            ref={charImgRef}
            src={characterImageUrl}
            alt="Your character"
            className={`${CHAR_IMG_CLASS} animate-char-idle`}
            style={{ filter: charFilter }}
            draggable={false}
          />
        </div>
      </div>

      {/* Ground shadow */}
      <div
        ref={shadowRef}
        className="absolute top-0 left-0 pointer-events-none rounded-full bg-black/20 blur-sm"
        style={{ width: 60, height: 12, willChange: "transform, opacity" }}
      />

      {/* Scene selector */}
      <SceneSelector currentScene={scene} onSceneChange={handleSceneChange} />

      {/* Score HUD — updated on the score event, not on frames */}
      <div className="fixed top-4 left-4 z-20 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl px-4 py-2 shadow-md">
        <span className="text-xl" style={{ filter: "drop-shadow(0 0 6px #FFE66D)" }}>⭐</span>
        <span data-testid="score" className="font-display text-2xl text-foreground">
          {Math.round(score / POINTS_PER_STAR)}
        </span>
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

      {/* Frame-time overlay (?debug) — the before/after evidence S4.1 asks for */}
      {debug && (
        <div
          ref={overlayRef}
          className="fixed top-4 right-4 z-30 font-mono text-[10px] leading-tight text-white bg-black/70 rounded-lg px-2 py-1 pointer-events-none"
        />
      )}

      {/* Level complete celebration */}
      {levelComplete && (
        <LevelComplete
          scene={scene}
          playerName={playerName}
          score={score}
          onContinue={() => {
            core.resetToStart();
            setLevelComplete(false);
            setScore(0);
            setStarVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
