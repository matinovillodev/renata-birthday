/**
 * Map facade (#como-llegar): the page shows an illustrated preview of the
 * venue and requests nothing from Google until the guest presses "Ver el mapa
 * interactivo"; then the Google Maps iframe takes the preview's place and
 * receives focus. The "Abrir en Google Maps" link works without this script.
 *
 * Markup contract (EventDetails.astro): `[data-map]` carries the embed URL in
 * `data-map-src` and the iframe title in `data-map-title`; inside it,
 * `[data-map-canvas]` is replaced and `[data-map-load]` (rendered `hidden`, so
 * it only appears when this script runs) triggers the load.
 */
export function initMapFacade(root: ParentNode = document): void {
  const map = root.querySelector<HTMLElement>('[data-map]');
  const canvas = map?.querySelector<HTMLElement>('[data-map-canvas]');
  const button = map?.querySelector<HTMLButtonElement>('[data-map-load]');
  const src = map?.dataset.mapSrc;
  if (!map || !canvas || !button || !src) return;

  button.hidden = false;
  button.addEventListener(
    'click',
    () => {
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = map.dataset.mapTitle ?? '';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.className = 'map__frame';
      canvas.replaceChildren(iframe);
      map.dataset.mapLoaded = '';
      button.remove();
      // The button is gone: keyboard users continue from the map itself.
      iframe.focus({ preventScroll: true });
    },
    { once: true },
  );
}
