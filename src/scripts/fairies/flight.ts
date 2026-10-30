/**
 * Fairy flights when the invitation opens: three curved paths that start
 * around the "Abrir invitación" button and leave the screen through the left,
 * the top and the right, staggered. Pure geometry, so it is unit-tested; the
 * DOM/GSAP side lives in ./index.ts.
 */

/** Rendered fairy size in CSS px (Fairies.astro). */
export const FAIRY_SIZE = 44;

export interface Point {
  x: number;
  y: number;
}

export interface FairyFlight {
  /** Waypoints in viewport px for GSAP MotionPathPlugin (curved through them). */
  path: Point[];
  /** Seconds in the air. */
  duration: number;
  /** Seconds after the button press. */
  delay: number;
}

interface Viewport {
  width: number;
  height: number;
}

/** Off-screen margin so the fairy (and its glow) is fully gone at the end. */
const EXIT_MARGIN = FAIRY_SIZE * 1.5;

export function buildFlights(viewport: Viewport, origin: Point): FairyFlight[] {
  const { width: w, height: h } = viewport;
  const at = (dx: number, dy: number): Point => ({ x: origin.x + dx * w, y: origin.y + dy * h });

  return [
    {
      // Out to the left, after a loop up and around.
      path: [
        { x: origin.x - 28, y: origin.y - 6 },
        at(-0.24, -0.12),
        at(-0.08, -0.3),
        at(-0.3, -0.38),
        { x: -EXIT_MARGIN, y: h * 0.18 },
      ],
      duration: 2.4,
      delay: 0,
    },
    {
      // Straight-ish up, swaying left and right.
      path: [
        { x: origin.x, y: origin.y - 24 },
        at(0.14, -0.18),
        at(-0.12, -0.36),
        at(0.06, -0.5),
        { x: origin.x + w * 0.02, y: -EXIT_MARGIN },
      ],
      duration: 2.8,
      delay: 0.18,
    },
    {
      // Out to the right, dipping first.
      path: [
        { x: origin.x + 28, y: origin.y - 6 },
        at(0.2, 0.06),
        at(0.32, -0.16),
        at(0.18, -0.32),
        { x: w + EXIT_MARGIN, y: h * 0.24 },
      ],
      duration: 2.6,
      delay: 0.36,
    },
  ];
}

/**
 * Returns a gate that lets at most one call through per `intervalMs`
 * (used to cap the sparkle trail emission rate).
 */
export function createRateLimiter(intervalMs: number): (now: number) => boolean {
  let last = Number.NEGATIVE_INFINITY;
  return (now) => {
    if (now - last < intervalMs) return false;
    last = now;
    return true;
  };
}
