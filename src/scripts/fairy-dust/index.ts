/**
 * Fairy dust on tap (V3): a burst of sparkles and butterflies wherever the
 * guest touches. The tsParticles chunk loads on the first tap (or when idle
 * behind the intro), only while motion is allowed. The overlay never takes
 * pointer events, so links and buttons keep working.
 */
import type { MotionGate } from '../motion-gate';
import type { FairyDust } from './engine';

export interface FairyDustController {
  /** Bursts at viewport coordinates (CSS px); no-op under reduced motion. */
  burst(x: number, y: number, scale?: number): void;
  /** Starts loading the particle engine in the background. */
  prefetch(): void;
}

export function initFairyDust(overlay: HTMLElement, gate: MotionGate): FairyDustController {
  let dust: Promise<FairyDust> | undefined;

  const load = () => {
    dust ??= import('./engine')
      .then(({ createFairyDust }) => createFairyDust(overlay))
      .catch((error: unknown) => {
        dust = undefined; // let a later tap retry
        throw error;
      });
    return dust;
  };

  const burst = (x: number, y: number, scale = 1) => {
    if (!gate.allowed) return;
    load()
      .then((instance) => instance.burst(x, y, scale))
      .catch(() => {
        // Decorative only: a failed load must never affect the invitation.
      });
  };

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button > 0) return;
      burst(event.clientX, event.clientY);
    },
    { passive: true },
  );

  gate.subscribe((allowed) => {
    if (allowed || !dust) return;
    const current = dust;
    dust = undefined;
    current.then((instance) => instance.destroy()).catch(() => {});
  });

  return {
    burst,
    prefetch() {
      if (!gate.allowed) return;
      const start = () => void load().catch(() => {});
      if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2000 });
      else setTimeout(start, 1200);
    },
  };
}
