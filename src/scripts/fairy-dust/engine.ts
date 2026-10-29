/**
 * Lazy chunk (dynamic import on the first tap): tsParticles engine with only
 * the plugins the burst needs, drawing into the fixed fairy-dust overlay.
 */
import { tsParticles, type Container } from '@tsparticles/engine';
import { loadHexColorPlugin } from '@tsparticles/plugin-hex-color';
import { loadMovePlugin } from '@tsparticles/plugin-move';
import { loadOpacityUpdater } from '@tsparticles/updater-opacity';
import { loadPaintUpdater } from '@tsparticles/updater-paint';
import { loadRotateUpdater } from '@tsparticles/updater-rotate';
import { loadSizeUpdater } from '@tsparticles/updater-size';
import { buildBurst, containerOptions, toParticleOptions } from './burst';
import { loadFairyShapes } from './shapes';

/** Longest particle life (1.6 s) plus a margin: then the canvas loop can sleep. */
const IDLE_PAUSE_MS = 1800;

export interface FairyDust {
  /** Bursts at viewport coordinates (CSS px). */
  burst(x: number, y: number, scale?: number): void;
  destroy(): void;
}

let pluginsLoaded: Promise<void> | undefined;

function loadPlugins(): Promise<void> {
  pluginsLoaded ??= (async () => {
    await loadHexColorPlugin(tsParticles);
    await loadMovePlugin(tsParticles);
    await loadPaintUpdater(tsParticles);
    await loadOpacityUpdater(tsParticles);
    await loadSizeUpdater(tsParticles);
    await loadRotateUpdater(tsParticles);
    await loadFairyShapes(tsParticles);
  })();
  return pluginsLoaded;
}

export async function createFairyDust(element: HTMLElement): Promise<FairyDust> {
  await loadPlugins();
  const container: Container | undefined = await tsParticles.load({ element, options: containerOptions() });
  if (!container) {
    throw new Error('Fairy dust: tsParticles could not create its container.');
  }

  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  return {
    burst(x, y, scale = 1) {
      // Particle positions are canvas pixels (CSS px times the pixel ratio).
      const ratio = container.retina.pixelRatio;
      container.play();
      for (const particle of buildBurst(scale)) {
        container.particles.addParticle({ x: x * ratio, y: y * ratio }, toParticleOptions(particle) as never);
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => container.pause(), IDLE_PAUSE_MS);
    },
    destroy() {
      clearTimeout(idleTimer);
      container.destroy();
    },
  };
}
