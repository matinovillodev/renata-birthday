import { describe, expect, it, vi } from 'vitest';
import { bootstrap, bootstrapScript } from './bootstrap';

type Listener = (event: { target: unknown }) => void;

function fakeDocument() {
  const classes = new Set<string>();
  const listeners: Listener[] = [];
  const doc = {
    documentElement: {
      classList: {
        add: (name: string) => classes.add(name),
        remove: (name: string) => classes.delete(name),
        contains: (name: string) => classes.has(name),
      },
      dataset: {} as Record<string, string | undefined>,
    },
    addEventListener: vi.fn((_type: string, listener: Listener) => listeners.push(listener)),
  };
  const click = (target: unknown) => listeners.forEach((listener) => listener({ target }));
  return { doc, classes, click };
}

/** A click target inside (or outside) the intro's "Abrir invitación" button. */
const target = (insideOpenButton: boolean) => ({
  closest: (selector: string) => (insideOpenButton && selector === '[data-intro-open]' ? {} : null),
});

describe('bootstrap', () => {
  it('marks the page as scripted and shows the intro on a plain visit', () => {
    const { doc, classes } = fakeDocument();
    bootstrap(doc as never, '');
    expect([...classes]).toEqual(['js', 'intro']);
  });

  it('treats a bare "#" like a plain visit', () => {
    const { doc, classes } = fakeDocument();
    bootstrap(doc as never, '#');
    expect(classes.has('intro')).toBe(true);
  });

  it('skips the intro on a deep link so the shared section is visible', () => {
    const { doc, classes } = fakeDocument();
    bootstrap(doc as never, '#confirmar');
    expect([...classes]).toEqual(['js']);
    expect(doc.addEventListener).not.toHaveBeenCalled();
  });

  it('lets the open button dismiss the intro while the motion script is not running', () => {
    const { doc, classes, click } = fakeDocument();
    bootstrap(doc as never, '');
    click(target(true));
    expect(classes.has('intro')).toBe(false);
  });

  it('leaves the open button to the motion script once it is ready', () => {
    const { doc, classes, click } = fakeDocument();
    bootstrap(doc as never, '');
    doc.documentElement.dataset.motion = 'ready';
    click(target(true));
    expect(classes.has('intro')).toBe(true);
  });

  it('ignores clicks outside the open button', () => {
    const { doc, classes, click } = fakeDocument();
    bootstrap(doc as never, '');
    click(target(false));
    click(null);
    expect(classes.has('intro')).toBe(true);
  });
});

describe('bootstrapScript', () => {
  it('is self-contained: it runs with only document and location in scope', () => {
    const { doc, classes } = fakeDocument();
    new Function('document', 'location', bootstrapScript)(doc, { hash: '' });
    expect([...classes]).toEqual(['js', 'intro']);
  });
});
