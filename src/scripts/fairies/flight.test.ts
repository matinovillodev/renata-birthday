import { describe, expect, it } from 'vitest';
import { buildFlights, createRateLimiter, FAIRY_SIZE } from './flight';

const VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

type Side = 'left' | 'right' | 'top' | 'bottom' | 'inside';

function exitSide(point: { x: number; y: number }, viewport: { width: number; height: number }): Side {
  if (point.x <= -FAIRY_SIZE) return 'left';
  if (point.x >= viewport.width + FAIRY_SIZE) return 'right';
  if (point.y <= -FAIRY_SIZE) return 'top';
  if (point.y >= viewport.height + FAIRY_SIZE) return 'bottom';
  return 'inside';
}

describe.each(VIEWPORTS)('buildFlights at $width x $height', (viewport) => {
  const origin = { x: viewport.width / 2, y: viewport.height * 0.6 };
  const flights = buildFlights(viewport, origin);

  it('makes three fairies', () => {
    expect(flights).toHaveLength(3);
  });

  it('starts every fairy around the origin', () => {
    for (const { path } of flights) {
      expect(Math.hypot(path[0].x - origin.x, path[0].y - origin.y)).toBeLessThanOrEqual(40);
    }
  });

  it('ends every flight fully off-screen, each through a different side', () => {
    const sides = flights.map(({ path }) => exitSide(path[path.length - 1], viewport));
    expect(sides).not.toContain('inside');
    expect(new Set(sides).size).toBe(3);
  });

  it('flies along curves (several waypoints) for 2 to 3 seconds, staggered', () => {
    for (const { path, duration } of flights) {
      expect(path.length).toBeGreaterThanOrEqual(4);
      expect(duration).toBeGreaterThanOrEqual(2);
      expect(duration).toBeLessThanOrEqual(3);
    }
    const delays = flights.map(({ delay }) => delay);
    expect(delays[0]).toBe(0);
    expect([...delays].sort((a, b) => a - b)).toEqual(delays);
    expect(new Set(delays).size).toBe(3);
  });
});

describe('createRateLimiter', () => {
  it('lets the first call through, then at most one call per interval', () => {
    const allow = createRateLimiter(100);
    expect(allow(1000)).toBe(true);
    expect(allow(1050)).toBe(false);
    expect(allow(1099)).toBe(false);
    expect(allow(1100)).toBe(true);
    expect(allow(1150)).toBe(false);
  });

  it('keeps separate limiters independent', () => {
    const a = createRateLimiter(100);
    const b = createRateLimiter(100);
    expect(a(0)).toBe(true);
    expect(b(10)).toBe(true);
  });
});
