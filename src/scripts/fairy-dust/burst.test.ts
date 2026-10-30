import { describe, expect, it } from 'vitest';
import { buildBurst, buildTrail, containerOptions, MAX_PARTICLES, toParticleOptions } from './burst';

const V3_COLORS = ['#D8B76A', '#F3DFA6', '#E7B8C0'];

describe('buildTrail', () => {
  const sequence = (values: number[]) => {
    let index = 0;
    return () => values[index++ % values.length];
  };

  it('drops one tiny V3 sparkle that drifts down and fades quickly', () => {
    const trail = buildTrail(sequence([0.5]));
    expect(trail).toHaveLength(1);
    const [sparkle] = trail;
    expect(sparkle.shape).toBe('sparkle');
    expect(V3_COLORS).toContain(sparkle.color);
    expect(sparkle.radius).toBeLessThanOrEqual(4);
    expect(sparkle.life).toBeGreaterThanOrEqual(0.5);
    expect(sparkle.life).toBeLessThanOrEqual(0.9);
    // Canvas angles: 90 is straight down; the drift stays roughly downwards.
    expect(sparkle.direction).toBeGreaterThan(45);
    expect(sparkle.direction).toBeLessThan(135);
  });

  it('varies color, size and drift with the random source', () => {
    const low = buildTrail(sequence([0]))[0];
    const high = buildTrail(sequence([0.99]))[0];
    expect(low.color).not.toBe(high.color);
    expect(low.radius).not.toBe(high.radius);
    expect(low.direction).not.toBe(high.direction);
  });
});

describe('buildBurst', () => {
  it('makes eight sparkles and two butterflies, like the V3 burst', () => {
    const burst = buildBurst();
    expect(burst.filter((p) => p.shape === 'sparkle')).toHaveLength(8);
    expect(burst.filter((p) => p.shape === 'butterfly')).toHaveLength(2);
  });

  it('uses only V3 gold and pink colors', () => {
    for (const particle of buildBurst()) expect(V3_COLORS).toContain(particle.color);
  });

  it('keeps every lifetime between 1.1 and 1.6 seconds', () => {
    for (const particle of buildBurst()) {
      expect(particle.life).toBeGreaterThanOrEqual(1.1);
      expect(particle.life).toBeLessThanOrEqual(1.6);
    }
  });

  it('spreads the sparkles all around the tap and sends the butterflies upwards', () => {
    const burst = buildBurst();
    const quadrants = new Set(
      burst
        .filter((p) => p.shape === 'sparkle')
        .map((p) => Math.floor((((p.direction % 360) + 360) % 360) / 90)),
    );
    expect(quadrants.size).toBe(4);
    for (const butterfly of burst.filter((p) => p.shape === 'butterfly')) {
      // Canvas angles: -90 is straight up.
      expect(butterfly.direction).toBeGreaterThan(-135);
      expect(butterfly.direction).toBeLessThan(-45);
    }
  });

  it('scales distance and size for the bigger intro burst', () => {
    const [small] = buildBurst(1);
    const [big] = buildBurst(1.8);
    expect(big.distance).toBeCloseTo(small.distance * 1.8);
    expect(big.radius).toBeCloseTo(small.radius * 1.8);
    expect(big.life).toBe(small.life);
  });
});

describe('toParticleOptions', () => {
  const sparkle = buildBurst()[0];
  const options = toParticleOptions(sparkle);

  it('draws the particle with its shape and color', () => {
    expect(options.shape.type).toBe(sparkle.shape);
    expect(options.paint.fill).toEqual({ enable: true, color: { value: sparkle.color } });
    expect(options.size.value).toBe(sparkle.radius);
  });

  it('moves in the exact direction, decelerating to cover the planned distance', () => {
    expect(options.move.direction).toBe(sparkle.direction);
    expect(options.move.angle).toEqual({ offset: 0, value: 0 });
    // tsParticles moves speed / 2 CSS px per frame; decay shrinks the speed every frame.
    expect((options.move.speed / 2) / options.move.decay).toBeCloseTo(sparkle.distance);
  });

  it('fades out linearly over the lifetime and is then destroyed', () => {
    const { animation } = options.opacity;
    expect(animation.destroy).toBe('min');
    expect(animation.sync).toBe(true);
    // Opacity drops speed / 100 per 60fps frame: from 1 to 0 in `life` seconds.
    expect(animation.speed / 100 * 60 * sparkle.life).toBeCloseTo(1);
  });

  it('turns by the planned angle over the lifetime', () => {
    const { rotate } = options;
    const radiansPerFrame = rotate.animation.speed / 360;
    const degrees = (radiansPerFrame * 60 * sparkle.life * 180) / Math.PI;
    expect(degrees).toBeCloseTo(Math.abs(sparkle.spin));
    expect(rotate.direction).toBe(sparkle.spin < 0 ? 'counter-clockwise' : 'clockwise');
  });
});

describe('containerOptions', () => {
  it('caps live particles so rapid taps stay smooth, deleting the oldest', () => {
    const options = containerOptions();
    expect(options.particles.number).toEqual({ value: 0, limit: { mode: 'delete', value: MAX_PARTICLES } });
    expect(MAX_PARTICLES).toBeGreaterThanOrEqual(30);
    expect(MAX_PARTICLES).toBeLessThanOrEqual(80);
  });

  it('draws into the given element instead of taking over the full screen', () => {
    expect(containerOptions().fullScreen).toEqual({ enable: false });
  });
});
