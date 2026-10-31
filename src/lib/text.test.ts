import { describe, expect, it } from 'vitest';
import { keepTogether, plainSpaces } from './text';

describe('keepTogether', () => {
  it('joins the words of a phrase with no-break spaces', () => {
    expect(keepTogether('a las 13:30')).toBe('a\u00A0las\u00A013:30');
  });

  it('leaves a single word untouched', () => {
    expect(keepTogether('sábado')).toBe('sábado');
  });
});

describe('plainSpaces', () => {
  it('turns no-break spaces back into ordinary spaces (for meta tags)', () => {
    expect(plainSpaces('el\u00A0sábado 28\u00A0de\u00A0noviembre')).toBe('el sábado 28 de noviembre');
  });
});
