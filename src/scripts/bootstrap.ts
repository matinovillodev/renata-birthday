/**
 * Runs inline in <head>, before first paint (see Base.astro):
 *
 * - adds `js` to <html> (the page is scripted);
 * - adds `intro` to <html> to show the "Abrir invitación" curtain, except on
 *   deep links (`#confirmar`, ...), which must land on their section;
 * - never traps the guest: until the motion script reports
 *   `data-motion="ready"` on <html>, the open button simply removes the
 *   curtain, so a failed or slow bundle still leaves the page usable.
 *
 * It is serialized with Function#toString, so it must stay self-contained:
 * no imports and no references to anything outside its own body.
 */
export function bootstrap(doc: Document, hash: string): void {
  const root = doc.documentElement;
  root.classList.add('js');
  if (hash.length > 1) {
    return;
  }
  root.classList.add('intro');
  doc.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (root.dataset.motion === 'ready' || !target || typeof target.closest !== 'function') {
      return;
    }
    if (target.closest('[data-intro-open]')) {
      root.classList.remove('intro');
    }
  });
}

/** Inline script source for <head>. */
export const bootstrapScript = `(${bootstrap.toString()})(document, location.hash);`;
