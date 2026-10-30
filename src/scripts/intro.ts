/**
 * Intro curtain ("Abrir invitación"), shown when the inline bootstrap added
 * `intro` to <html> (plain visits, not deep links).
 *
 * While it is up: scrolling is locked (CSS + Lenis stopped), the content
 * behind it is `inert`, and the open button has focus. Opening plays the V3
 * burst and fade (instantly under reduced motion), then unlocks everything
 * and moves focus to the hero heading. With motion allowed, three fairies
 * also fly out from the button, leaving sparkle trails (src/scripts/fairies).
 */
import type { FairyDustController } from './fairy-dust';
import type { Motion } from './animations';
import { REDUCED_MOTION_QUERY } from './motion-gate';
import type { SmoothScroll } from './smooth-scroll';

/** V3 intro burst is 1.8 times the tap burst. */
const INTRO_BURST_SCALE = 1.8;

const motionAllowed = () => !window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** Loads the fairy flight chunk (shared by the idle prefetch and the launch). */
const loadFairies = () => import('./fairies');

/** Fairies fly out from the open button; decorative, so failures are ignored. */
function launchFairies(button: HTMLElement, dust: FairyDustController): void {
  const layer = document.querySelector<HTMLElement>('[data-fairies]');
  if (!layer || !motionAllowed()) return;
  const box = button.getBoundingClientRect();
  const origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  loadFairies()
    .then(({ flyFairies }) => flyFairies({ layer, origin, onTrail: (x, y) => dust.trail?.(x, y) }))
    .catch(() => {});
}

interface IntroDeps {
  motion: Motion;
  smooth: SmoothScroll;
  dust: FairyDustController;
}

export function initIntro({ motion, smooth, dust }: IntroDeps): void {
  const root = document.documentElement;
  const intro = document.querySelector<HTMLElement>('[data-intro]');
  const button = intro?.querySelector<HTMLButtonElement>('[data-intro-open]');
  if (!intro || !button || !root.classList.contains('intro')) return;

  // Everything outside the curtain: the side nav and the rest of <main>.
  const behind = [
    document.querySelector<HTMLElement>('.side-nav'),
    ...Array.from(intro.parentElement?.children ?? []).filter((el) => el !== intro),
  ].filter((el): el is HTMLElement => el instanceof HTMLElement);

  behind.forEach((el) => (el.inert = true));
  smooth.stop();
  window.scrollTo(0, 0);
  motion.enterIntro(intro);
  button.focus({ preventScroll: true });
  dust.prefetch();
  if (motionAllowed()) {
    const prefetch = () => void loadFairies().catch(() => {});
    if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch, { timeout: 2000 });
    else setTimeout(prefetch, 1200);
  }

  let opening = false;
  button.addEventListener('click', async () => {
    if (opening) return;
    opening = true;
    // The guest always lands on the hero, even if the locked page was
    // scrolled programmatically while the curtain was up.
    window.scrollTo(0, 0);
    root.classList.add('intro-opening'); // lifts the fairy-dust layer above the curtain
    const burstOrigin = intro.querySelector('[data-intro-burst]')?.getBoundingClientRect();
    if (burstOrigin) dust.burst(burstOrigin.left, burstOrigin.top, INTRO_BURST_SCALE);
    launchFairies(button, dust);

    await motion.openIntro(intro);

    root.classList.remove('intro', 'intro-opening');
    behind.forEach((el) => (el.inert = false));
    smooth.start();
    document.querySelector<HTMLElement>('[data-rise] h1')?.focus({ preventScroll: true });
  });
}
