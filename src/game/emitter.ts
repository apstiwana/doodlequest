import type { GameEvent, GameEventType } from "./types";

type Handler = (event: GameEvent) => void;

/**
 * A ~30-line typed event emitter — the entire interface between the game core and React.
 *
 * Deliberately not an EventTarget: `CustomEvent` needs a DOM, and the whole point of
 * `src/game/` is that it runs in a plain Node process under vitest with no DOM at all.
 */
export class Emitter {
  private handlers = new Map<GameEventType, Set<Handler>>();

  /**
   * Subscribe to one event type.
   *
   * @returns an unsubscribe function; call it from a React effect's cleanup.
   */
  on(type: GameEventType, handler: Handler): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
    };
  }

  /**
   * Fire an event. A throwing handler is logged and swallowed so that one bad subscriber
   * cannot kill the game loop mid-frame.
   */
  emit(event: GameEvent): void {
    const set = this.handlers.get(event.type);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(event);
      } catch (err) {
        console.error(`[game] handler for "${event.type}" threw`, err);
      }
    }
  }

  /** Drop every subscriber. Called when the game core is torn down. */
  clear(): void {
    this.handlers.clear();
  }
}
