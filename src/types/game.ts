export type Scene = 'forest' | 'underwater' | 'city' | 'moon' | 'space';

export interface GameState {
  playerName: string;
  characterImageUrl: string;
  currentScene: Scene;
}

/**
 * @deprecated Superseded by `CharacterState` in `src/game/types.ts` (S4.1). Velocities
 * there are per second, not per frame. Nothing imports this any more — it is left in place
 * rather than removed because deleting is Angad's call, not an agent's; see the S4.1
 * change note.
 */
export interface CharacterPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isOnGround: boolean;
  facingRight: boolean;
  isJumping: boolean;
  squashStretch: number; // 1 = normal, <1 = squash, >1 = stretch
  tilt: number; // degrees
}

export interface DialogueLine {
  text: string;
  id: string;
}

export const SCENE_CONFIG: Record<Scene, {
  label: string;
  emoji: string;
  bgGradient: string;
  groundColor: string;
  groundHeight: number;
  greeting: string;
}> = {
  forest: {
    label: 'Forest',
    emoji: '🌲',
    bgGradient: 'from-green-300 via-emerald-200 to-sky-300',
    groundColor: 'bg-green-600',
    groundHeight: 80,
    greeting: "Wow, a magical forest! I can smell the trees! 🌲",
  },
  underwater: {
    label: 'Underwater',
    emoji: '🌊',
    bgGradient: 'from-blue-600 via-cyan-400 to-teal-300',
    groundColor: 'bg-yellow-700',
    groundHeight: 80,
    greeting: "Glub glub! We're underwater! Look at those fish! 🐠",
  },
  city: {
    label: 'City',
    emoji: '🏙️',
    bgGradient: 'from-slate-400 via-blue-200 to-orange-100',
    groundColor: 'bg-slate-600',
    groundHeight: 80,
    greeting: "A big city! So many buildings and cars! 🏙️",
  },
  moon: {
    label: 'Moon',
    emoji: '🌙',
    bgGradient: 'from-slate-900 via-slate-700 to-slate-500',
    groundColor: 'bg-slate-400',
    groundHeight: 80,
    greeting: "One small step! We're on the moon! 🌙 It's so quiet here.",
  },
  space: {
    label: 'Space',
    emoji: '🚀',
    bgGradient: 'from-indigo-950 via-purple-900 to-slate-900',
    groundColor: 'bg-indigo-900',
    groundHeight: 80,
    greeting: "Whoooosh! We're in SPACE! Look at all the stars! ⭐",
  },
};
