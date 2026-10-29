import { describe, expect, it } from 'vitest';
import { activeSectionIndex } from './scroll-spy';

const VIEWPORT = 1000; // 40% line at 400px

describe('activeSectionIndex', () => {
  it('returns -1 when there are no sections', () => {
    expect(activeSectionIndex([], VIEWPORT, false)).toBe(-1);
  });

  it('keeps the first section active before any other reaches the 40% line', () => {
    expect(activeSectionIndex([0, 900, 2000], VIEWPORT, false)).toBe(0);
  });

  it('activates the last section whose top has passed the 40% line', () => {
    expect(activeSectionIndex([-1500, -200, 400, 1200], VIEWPORT, false)).toBe(2);
  });

  it('activates the first section even if its top is still below the line', () => {
    expect(activeSectionIndex([600, 1600], VIEWPORT, false)).toBe(0);
  });

  it('activates the last section at the bottom of the page, even if it is short', () => {
    expect(activeSectionIndex([-3000, -900, 700], VIEWPORT, true)).toBe(2);
  });
});
