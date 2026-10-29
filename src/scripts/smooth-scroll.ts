/**
 * Lenis smooth scrolling, only while motion is allowed. Touch scrolling stays
 * native (`syncTouch: false`). Lenis is driven by GSAP's ticker and feeds
 * ScrollTrigger, and in-page anchor links scroll through it (then move focus
 * to the target so keyboard users continue from there).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import type { MotionGate } from './motion-gate';

export interface SmoothScroll {
  /** Locks scrolling (intro curtain). */
  stop(): void;
  /** Unlocks scrolling. */
  start(): void;
}

export function initSmoothScroll(gate: MotionGate): SmoothScroll {
  let lenis: Lenis | undefined;
  let locked = false;

  const create = () => {
    if (lenis) return;
    lenis = new Lenis({ autoRaf: false, syncTouch: false, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    if (locked) lenis.stop();
  };

  const destroy = () => {
    lenis?.destroy();
    lenis = undefined;
  };

  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  if (gate.allowed) create();
  gate.subscribe((allowed) => (allowed ? create() : destroy()));

  document.addEventListener('click', (event) => {
    if (!lenis || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
    const id = link ? decodeURIComponent(link.hash.slice(1)) : '';
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    history.pushState(null, '', `#${id}`);
    lenis.scrollTo(target, {
      onComplete: () => {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
    });
  });

  return {
    stop() {
      locked = true;
      lenis?.stop();
    },
    start() {
      locked = false;
      lenis?.start();
    },
  };
}
