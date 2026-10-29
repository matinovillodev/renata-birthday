/**
 * Scroll spy for the side navigation (V3 rule): the active section is the
 * last one whose top has crossed 40% of the viewport height; at the very
 * bottom of the page the last section wins even if it is short.
 *
 * It listens to native scroll events, so it works with Lenis and also with
 * reduced motion (no Lenis).
 */

const ACTIVE_LINE = 0.4;
const BOTTOM_TOLERANCE_PX = 4;

/**
 * @param tops Top of each section relative to the viewport, in page order.
 * @returns Index of the active section, or -1 when there are no sections.
 */
export function activeSectionIndex(tops: readonly number[], viewportHeight: number, atBottom: boolean): number {
  if (tops.length === 0) return -1;
  if (atBottom) return tops.length - 1;
  const line = viewportHeight * ACTIVE_LINE;
  let active = 0;
  tops.forEach((top, index) => {
    if (top <= line) active = index;
  });
  return active;
}

/** Marks the side-nav link of the section in view with `aria-current="true"`. */
export function initScrollSpy(links: readonly HTMLAnchorElement[]): void {
  const entries = links
    .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter((entry): entry is { link: HTMLAnchorElement; section: HTMLElement } => entry.section !== null);
  if (entries.length === 0) return;

  let current = -1;
  let scheduled = false;

  const update = () => {
    scheduled = false;
    const root = document.documentElement;
    const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - BOTTOM_TOLERANCE_PX;
    const tops = entries.map(({ section }) => section.getBoundingClientRect().top);
    const active = activeSectionIndex(tops, window.innerHeight, atBottom);
    if (active === current) return;
    current = active;
    entries.forEach(({ link }, index) => {
      if (index === active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
