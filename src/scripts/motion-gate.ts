/** Media query that, when it matches, means the guest asked for less motion. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Single source of truth for "may we animate?", following live changes. */
export interface MotionGate {
  /** True when animations, smooth scrolling and particles are allowed. */
  readonly allowed: boolean;
  /** Calls `listener` with the new value whenever the preference changes. */
  subscribe(listener: (allowed: boolean) => void): () => void;
}

type ChangeListener = (event: { matches: boolean }) => void;

/** The part of MediaQueryList the gate needs (easy to fake in tests). */
export interface MotionQuery {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: ChangeListener): void;
}

/** Usage: `createMotionGate(window.matchMedia(REDUCED_MOTION_QUERY))`. */
export function createMotionGate(query: MotionQuery): MotionGate {
  let allowed = !query.matches;
  const listeners = new Set<(allowed: boolean) => void>();

  query.addEventListener('change', (event) => {
    allowed = !event.matches;
    for (const listener of listeners) listener(allowed);
  });

  return {
    get allowed() {
      return allowed;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
