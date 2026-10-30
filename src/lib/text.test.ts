import { describe, expect, it } from 'vitest';
import { keepTogether, plainSpaces } from './text';

describe('keepTogether', () => {
  it('joins the words of a phrase with no-break spaces', () => {
    expect(keepTogether('a las 13:30')).toBe('a las 13:30');
  });

  it('leaves a single word untouched', () => {
    expect(keepTogether('sábado')).toBe('sábado');
  });
});

describe('plainSpaces', () => {
  it('turns no-break spaces back into ordinary spaces (for meta tags)', () => {
    expect(plainSpaces('el sábado 28 de noviembre')).toBe('el sábado 28 de noviembre');
  });
});
