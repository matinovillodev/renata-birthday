/**
 * Motion layer entry (bundled by Astro, loaded as a deferred module).
 *
 * Content never depends on this script: without it the page is fully
 * visible. If anything here fails, the curtain is removed and nothing stays
 * inert, so the guest is never trapped.
 */
import { initMotion } from './animations';
import { initFairyDust } from './fairy-dust';
import { initIntro } from './intro';
import { initMapFacade } from './map-facade';
import { createMotionGate, REDUCED_MOTION_QUERY } from './motion-gate';
import { initScrollSpy } from './scroll-spy';
import { initSmoothScroll } from './smooth-scroll';

const root = document.documentElement;

function start(): void {
  const gate = createMotionGate(window.matchMedia(REDUCED_MOTION_QUERY));
  const smooth = initSmoothScroll(gate);
  const motion = initMotion();
  const overlay = document.querySelector<HTMLElement>('[data-fairy-dust]');
  const dust = overlay ? initFairyDust(overlay, gate) : { burst: () => {}, prefetch: () => {} };

  initScrollSpy(Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')));
  initIntro({ motion, smooth, dust });

  // From now on the intro button belongs to this script (see bootstrap.ts).
  root.dataset.motion = 'ready';
}

// Independent of the motion layer: a motion failure must not hide the map button.
try {
  initMapFacade();
} catch (error) {
  console.error('Map preview failed; the Google Maps link still works.', error);
}

try {
  start();
} catch (error) {
  root.classList.remove('intro', 'intro-opening');
  document.querySelectorAll<HTMLElement>('[inert]').forEach((el) => (el.inert = false));
  console.error('Invitation motion layer failed; showing the static page.', error);
}
