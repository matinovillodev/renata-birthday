/**
 * Fairy-dust burst, engine-agnostic: what V3's tap animation does (eight
 * sparkles flying outwards, two butterflies floating up) and its translation
 * into tsParticles v4 particle options.
 *
 * Unit notes (tsParticles 4.5 source):
 * - plugin-move advances `speed / 2` CSS px per 60fps frame and multiplies the
 *   velocity by `1 - decay` every frame, so the travel is ~ (speed / 2) / decay;
 * - updater-opacity changes opacity by `speed / 100` per frame;
 * - updater-rotate turns `speed / 360` radians per frame.
 */

/** Hard cap of live particles; the oldest are deleted first on rapid taps. */
export const MAX_PARTICLES = 60;

const FRAMES_PER_SECOND = 60;
const MOVE_SPEED_FACTOR = 2; // inverse of plugin-move's `half`
const OPACITY_SPEED_UNIT = 100;
const ROTATE_SPEED_UNIT = 360;
const SPARKLE_DECAY = 0.08; // fast start, soft landing (V3 cubic-bezier(.2,.7,.3,1))
const BUTTERFLY_DECAY = 0.03; // slower glide upwards
const SPARKLE_LIFE = 1.1;
const BUTTERFLY_LIFE = 1.6;

export type BurstShape = 'sparkle' | 'butterfly';

export interface BurstParticle {
  shape: BurstShape;
  /** V3 palette color. */
  color: string;
  /** Radius in CSS px. */
  radius: number;
  /** Travel direction in degrees, canvas convention (0 = right, 90 = down). */
  direction: number;
  /** Travel distance in CSS px. */
  distance: number;
  /** Lifetime in seconds (fully faded at the end). */
  life: number;
  /** Rotation over the lifetime in degrees; negative = counter-clockwise. */
  spin: number;
}

const GOLD = '#D8B76A';
const LIGHT_GOLD = '#F3DFA6';
const PINK = '#E7B8C0';

/** V3 keyframes fd1..fd10: end offset (px), diameter (px), color, rotation. */
const V3_TRAJECTORIES: ReadonlyArray<{ shape: BurstShape; dx: number; dy: number; size: number; color: string; spin: number }> = [
  { shape: 'sparkle', dx: -64, dy: -58, size: 16, color: GOLD, spin: -40 },
  { shape: 'sparkle', dx: 0, dy: -88, size: 10, color: LIGHT_GOLD, spin: 30 },
  { shape: 'sparkle', dx: 62, dy: -62, size: 22, color: GOLD, spin: 45 },
  { shape: 'sparkle', dx: 90, dy: -4, size: 10, color: PINK, spin: -30 },
  { shape: 'sparkle', dx: 64, dy: 56, size: 16, color: LIGHT_GOLD, spin: 60 },
  { shape: 'sparkle', dx: 6, dy: 86, size: 10, color: GOLD, spin: -50 },
  { shape: 'sparkle', dx: -60, dy: 60, size: 16, color: PINK, spin: 35 },
  { shape: 'sparkle', dx: -92, dy: 6, size: 22, color: GOLD, spin: -60 },
  { shape: 'butterfly', dx: -44, dy: -120, size: 20, color: PINK, spin: 8 },
  { shape: 'butterfly', dx: 52, dy: -126, size: 20, color: PINK, spin: -8 },
];

/**
 * Particles of one burst. `scale` enlarges distance and size (the intro uses
 * 1.8, as V3 does) without changing the timing.
 */
export function buildBurst(scale = 1): BurstParticle[] {
  return V3_TRAJECTORIES.map(({ shape, dx, dy, size, color, spin }) => ({
    shape,
    color,
    radius: (size / 2) * scale,
    direction: (Math.atan2(dy, dx) * 180) / Math.PI,
    distance: Math.hypot(dx, dy) * scale,
    life: shape === 'sparkle' ? SPARKLE_LIFE : BUTTERFLY_LIFE,
    spin,
  }));
}

const TRAIL_COLORS = [GOLD, LIGHT_GOLD, PINK];

/**
 * One tiny sparkle dropped behind a flying fairy: it drifts down a little and
 * fades in ~0.7 s. `random` returns values in [0, 1) (Math.random by default).
 */
export function buildTrail(random: () => number = Math.random): BurstParticle[] {
  return [
    {
      shape: 'sparkle',
      color: TRAIL_COLORS[Math.floor(random() * TRAIL_COLORS.length)],
      radius: 2 + random() * 1.8,
      direction: 70 + random() * 40,
      distance: 10 + random() * 10,
      life: 0.6 + random() * 0.25,
      spin: 30,
    },
  ];
}

/** tsParticles v4 override options for one particle of a burst. */
export function toParticleOptions(particle: BurstParticle) {
  const decay = particle.shape === 'sparkle' ? SPARKLE_DECAY : BUTTERFLY_DECAY;
  const frames = particle.life * FRAMES_PER_SECOND;
  const spinRadians = (Math.abs(particle.spin) * Math.PI) / 180;
  return {
    shape: { type: particle.shape },
    paint: { fill: { enable: true, color: { value: particle.color } } },
    size: { value: particle.radius },
    move: {
      enable: true,
      direction: particle.direction,
      angle: { offset: 0, value: 0 },
      speed: MOVE_SPEED_FACTOR * particle.distance * decay,
      decay,
      straight: true,
    },
    opacity: {
      value: { min: 0, max: 1 },
      animation: {
        enable: true,
        mode: 'decrease',
        startValue: 'max',
        destroy: 'min',
        sync: true,
        speed: OPACITY_SPEED_UNIT / frames,
      },
    },
    rotate: {
      value: 0,
      direction: particle.spin < 0 ? 'counter-clockwise' : 'clockwise',
      animation: { enable: true, sync: true, speed: (ROTATE_SPEED_UNIT * spinRadians) / frames },
    },
  } as const;
}

/** Container options: an empty, transparent canvas inside the overlay element. */
export function containerOptions() {
  return {
    fullScreen: { enable: false },
    detectRetina: true,
    fpsLimit: 60,
    pauseOnBlur: true,
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 0, limit: { mode: 'delete', value: MAX_PARTICLES } },
    },
  } as const;
}
