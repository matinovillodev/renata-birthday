import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl } from './whatsapp';

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me link with the message as the text parameter', () => {
    expect(buildWhatsAppUrl('5493517622809', 'Hola')).toBe('https://wa.me/5493517622809?text=Hola');
  });

  it('strips every non-digit character from the phone number', () => {
    expect(buildWhatsAppUrl('+54 9 3517 62-2809', 'Hola')).toBe(
      'https://wa.me/5493517622809?text=Hola',
    );
  });

  it('URL-encodes spaces, accents, inverted punctuation and line breaks', () => {
    expect(buildWhatsAppUrl('5493517622809', '¡Hola! Sí\n\nNombre: ')).toBe(
      'https://wa.me/5493517622809?text=%C2%A1Hola!%20S%C3%AD%0A%0ANombre%3A%20',
    );
  });

  it('throws when the phone number is empty', () => {
    expect(() => buildWhatsAppUrl('', 'Hola')).toThrow(/phone/i);
  });

  it('throws when the phone number has no digits at all', () => {
    expect(() => buildWhatsAppUrl('+ - ( )', 'Hola')).toThrow(/phone/i);
  });
});
