/**
 * V3 motion with GSAP + ScrollTrigger: intro entrance and opening, staggered
 * hero text, photo parallax, floating chapter titles, photo-band strips and
 * sheet reveals. Everything is created inside `gsap.matchMedia()` for
 * "no-preference" motion, so it is reverted (inline styles removed, triggers
 * killed) as soon as the guest asks for reduced motion.
 *
 * Only transforms and opacity are animated.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MOTION_ALLOWED = '(prefers-reduced-motion: no-preference)';
/** Same breakpoint as the hero's landscape photo (Hero.astro, switchAt="4/3"). */
const WIDE_SCREEN = '(min-aspect-ratio: 4/3)';

/** V3 `.rise.go > :nth-child(n)` delays, in seconds. */
const RISE_DELAYS = [0.35, 0.45, 0.6, 0.75, 0.9];
const RISE_OFFSET_PX = 22;
/** V3 parallax constants. */
const PHOTO_SHIFT_PERCENT = 18;
const PHOTO_ZOOM = 1.14;
/**
 * Softer hero zoom on landscape screens (user decision, T3b). It was needed
 * because 1.14 clipped the headband of the earlier hero photo; the "Luz de
 * hadas" photo has headroom at either zoom, and the subtler landscape motion
 * is kept as approved. Portrait keeps V3's 1.14 (Hero.astro lifts the photo
 * so the zoomed face stays clear of the copy).
 */
const HERO_WIDE_ZOOM = 1.06;
const PHOTO_ZOOM_SCREENS = 1.2;
const FLOAT_RISE = 0.35; // of the viewport height per screen scrolled
const FLOAT_FADE_START = 0.15; // screens
const FLOAT_FADE_END = 0.6; // screens
const STRIP_SHIFT_PERCENT = 30;
/**
 * Intro backdrop (blurred hero copy): slow idle "breathing" zoom, then a focus
 * pull on open. EDGE_BLEED must match `--edge-bleed` in Intro.astro.
 */
const BACKDROP_EDGE_BLEED = 1.12;
const BACKDROP_IDLE_ZOOM = 1.08;
const BACKDROP_IDLE_SECONDS = 12;
const INTRO_EXIT_SECONDS = 0.9;

export interface Motion {
  /** Plays the curtain entrance (star, eyebrow, name, button). */
  enterIntro(intro: HTMLElement): void;
  /** Fades the curtain out while the hero text rises; resolves when done. */
  openIntro(intro: HTMLElement): Promise<void>;
}

const still: Motion = {
  enterIntro: () => {},
  openIntro: () => Promise.resolve(),
};

function hostOf(element: Element): Element | null {
  return element.closest('[data-chapter]');
}

function setupPhotoParallax(wideScreen: boolean): void {
  for (const photo of gsap.utils.toArray<HTMLElement>('[data-parallax="photo"]')) {
    const host = hostOf(photo);
    if (!host) continue;
    const zoom = wideScreen && host.matches('[data-chapter="1"]') ? HERO_WIDE_ZOOM : PHOTO_ZOOM;
    // Approach: the photo settles from -18% while its chapter scrolls into view.
    gsap.fromTo(
      photo,
      { yPercent: -PHOTO_SHIFT_PERCENT },
      { yPercent: 0, ease: 'none', scrollTrigger: { trigger: host, start: 'top bottom', end: 'top top', scrub: true } },
    );
    // Stuck: it zooms out to 1 while the sheet covers it.
    gsap.fromTo(
      photo,
      { scale: zoom },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: host,
          start: 'top top',
          end: () => `+=${window.innerHeight * PHOTO_ZOOM_SCREENS}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  }
}

function setupFloatingText(): void {
  for (const copy of gsap.utils.toArray<HTMLElement>('[data-parallax="float"]')) {
    const host = hostOf(copy);
    if (!host) continue;
    gsap
      .timeline({
        scrollTrigger: {
          trigger: host,
          start: 'top top',
          end: () => `+=${window.innerHeight * FLOAT_FADE_END}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .to(copy, { y: () => -window.innerHeight * FLOAT_RISE * FLOAT_FADE_END, ease: 'none', duration: FLOAT_FADE_END }, 0)
      .to(copy, { opacity: 0, ease: 'none', duration: FLOAT_FADE_END - FLOAT_FADE_START }, FLOAT_FADE_START);
  }
}

function setupStrips(): void {
  const band = document.querySelector('[data-chapter="2"]');
  if (!band) return;
  const scrollTrigger = { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true };
  gsap.fromTo('[data-parallax="strip"]', { xPercent: 0 }, { xPercent: -STRIP_SHIFT_PERCENT, ease: 'none', scrollTrigger });
  gsap.fromTo(
    '[data-parallax="strip-reverse"]',
    { xPercent: -STRIP_SHIFT_PERCENT },
    { xPercent: 0, ease: 'none', scrollTrigger: { ...scrollTrigger } },
  );
}

/** Not in V3: sheet content eases in once as it enters the viewport. */
function setupSheetReveals(): void {
  for (const block of gsap.utils.toArray<HTMLElement>('.sheet > *')) {
    gsap.from(block, {
      opacity: 0,
      y: 24,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: block, start: 'top 90%', once: true },
    });
  }
}

export function initMotion(): Motion {
  let current: Motion = still;
  const root = document.documentElement;

  // Re-created whenever either condition flips (e.g. a tablet is rotated).
  gsap.matchMedia().add({ motion: MOTION_ALLOWED, wide: WIDE_SCREEN }, (context) => {
    const { motion = false, wide = false } = context.conditions ?? {};
    if (!motion) return;

    setupPhotoParallax(wide);
    setupFloatingText();
    setupStrips();
    setupSheetReveals();

    const heroItems = gsap.utils.toArray<HTMLElement>('[data-rise] > *');
    if (root.classList.contains('intro')) {
      // Hidden behind the curtain until it opens (V3 ".rise.pre").
      gsap.set(heroItems, { opacity: 0, y: RISE_OFFSET_PX });
    }

    let backdropIdle: gsap.core.Tween | undefined;
    // The hero photo's own scale right now (set by the parallax tweens above).
    const heroPhoto = document.querySelector('#inicio [data-parallax="photo"]');
    const heroScale = () => (heroPhoto ? Number(gsap.getProperty(heroPhoto, 'scale')) || 1 : 1);

    const enterIntro = context.add('enterIntro', (intro: HTMLElement) => {
      const q = gsap.utils.selector(intro);
      const rest = heroScale() * BACKDROP_EDGE_BLEED;
      backdropIdle = gsap.fromTo(
        q('[data-intro-camera]'),
        { scale: rest },
        { scale: rest * BACKDROP_IDLE_ZOOM, duration: BACKDROP_IDLE_SECONDS, ease: 'sine.inOut', repeat: -1, yoyo: true },
      );
      gsap.from(q('.intro__star'), { scale: 0, rotation: -200, opacity: 0, duration: 1.2, delay: 0.1, ease: 'back.out(1.6)' });
      gsap.from(q('.intro__eyebrow'), { opacity: 0, y: 8, duration: 0.7, delay: 0.9, ease: 'power1.out' });
      gsap.from(q('.intro__name'), { opacity: 0, y: 16, scale: 0.96, duration: 1.1, delay: 1.05, ease: 'power3.out' });
      gsap.from(q('.intro__open'), { opacity: 0, y: 8, duration: 0.8, delay: 1.7, ease: 'power1.out' });
    }) as Motion['enterIntro'];

    const openIntro = context.add(
      'openIntro',
      (intro: HTMLElement) =>
        new Promise<void>((resolve) => {
          gsap.to(heroItems, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            delay: (index: number) => RISE_DELAYS[index] ?? RISE_DELAYS[RISE_DELAYS.length - 1],
          });
          // Focus pull: the blurred copy settles onto the hero's exact scale
          // while the curtain fades, so the sharp hero beneath comes into focus.
          backdropIdle?.kill();
          gsap.to(gsap.utils.selector(intro)('[data-intro-camera]'), {
            scale: heroScale(),
            duration: INTRO_EXIT_SECONDS,
            ease: 'power2.out',
          });
          gsap.to(intro, {
            opacity: 0,
            duration: INTRO_EXIT_SECONDS,
            ease: 'power2.inOut',
            onComplete: () => resolve(),
          });
        }),
    ) as Motion['openIntro'];

    current = { enterIntro, openIntro };
    return () => {
      current = still;
    };
  });

  // Layout settles after web fonts and images: recompute trigger positions.
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  return {
    enterIntro: (intro) => current.enterIntro(intro),
    openIntro: (intro) => current.openIntro(intro),
  };
}
