/**
 * Intro curtain ("Abrir invitación"), shown when the inline bootstrap added
 * `intro` to <html> (plain visits, not deep links).
 *
 * While it is up: scrolling is locked (CSS + Lenis stopped), the content
 * behind it is `inert`, and the open button has focus. Opening plays the V3
 * burst and fade (instantly under reduced motion), then unlocks everything
 * and moves focus to the hero heading.
 */
import type { FairyDustController } from './fairy-dust';
import type { Motion } from './animations';
import type { SmoothScroll } from './smooth-scroll';

/** V3 intro burst is 1.8 times the tap burst. */
const INTRO_BURST_SCALE = 1.8;

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

  let opening = false;
  button.addEventListener('click', async () => {
    if (opening) return;
    opening = true;
    root.classList.add('intro-opening'); // lifts the fairy-dust layer above the curtain
    const burstOrigin = intro.querySelector('[data-intro-burst]')?.getBoundingClientRect();
    if (burstOrigin) dust.burst(burstOrigin.left, burstOrigin.top, INTRO_BURST_SCALE);

    await motion.openIntro(intro);

    root.classList.remove('intro', 'intro-opening');
    behind.forEach((el) => (el.inert = false));
    smooth.start();
    document.querySelector<HTMLElement>('[data-rise] h1')?.focus({ preventScroll: true });
  });
}
