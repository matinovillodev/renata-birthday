/**
 * Fairies flying out when the invitation opens (lazy chunk, loaded behind the
 * intro). Decorative only: the layer never takes pointer events or focus, it
 * is fixed (no layout shift), and every fairy node is removed after landing
 * off-screen. Only called with motion allowed and the intro actually shown
 * (src/scripts/intro.ts).
 */
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { buildFlights, createRateLimiter, FAIRY_SIZE, type Point } from './flight';

gsap.registerPlugin(MotionPathPlugin);

/** At most one trail sparkle per fairy every 70 ms (~14/s each). */
const TRAIL_INTERVAL_MS = 70;
/** Trail sparkles drop from the fairy's skirt, slightly below its center. */
const TRAIL_OFFSET_Y = FAIRY_SIZE * 0.25;
const FADE_IN_SECONDS = 0.35;

export interface FlyOptions {
  /** `[data-fairies]` layer holding the fairy `<template>`. */
  layer: HTMLElement;
  /** Viewport point the fairies start around (the open button's center). */
  origin: Point;
  /** Called with viewport coordinates to drop a trail sparkle. */
  onTrail?: (x: number, y: number) => void;
}

/** Resolves once every fairy has left the screen and been removed. */
export function flyFairies({ layer, origin, onTrail }: FlyOptions): Promise<void> {
  const template = layer.querySelector<HTMLTemplateElement>('template[data-fairy-template]');
  const model = template?.content.firstElementChild;
  if (!model) return Promise.resolve();

  const flights = buildFlights({ width: window.innerWidth, height: window.innerHeight }, origin);

  return new Promise((resolve) => {
    let flying = flights.length;

    flights.forEach((flight, index) => {
      const fairy = model.cloneNode(true) as HTMLElement;
      fairy.dataset.fairy = String(index);
      layer.append(fairy);

      const allowTrail = createRateLimiter(TRAIL_INTERVAL_MS);
      const [start] = flight.path;
      gsap.set(fairy, { x: start.x, y: start.y, opacity: 0, scale: 0.6 });

      gsap
        .timeline({
          delay: flight.delay,
          onComplete: () => {
            fairy.remove();
            flying -= 1;
            if (flying === 0) resolve();
          },
        })
        .to(fairy, { opacity: 1, scale: 1, duration: FADE_IN_SECONDS, ease: 'power1.out' }, 0)
        .to(
          fairy,
          {
            motionPath: { path: flight.path, curviness: 1.25 },
            duration: flight.duration,
            ease: 'sine.inOut',
            onUpdate: () => {
              if (!onTrail || !allowTrail(performance.now())) return;
              const x = Number(gsap.getProperty(fairy, 'x'));
              const y = Number(gsap.getProperty(fairy, 'y'));
              onTrail(x, y + TRAIL_OFFSET_Y);
            },
          },
          0,
        );
    });
  });
}
