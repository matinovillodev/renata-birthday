import { describe, expect, it } from 'vitest';
import { formatEventDate } from '../lib/event-date';
import { plainSpaces } from '../lib/text';
import { copy, event } from './event';

/**
 * Consistency guards for the hand-edited invitation data. They catch the
 * mistakes a quick personalization is most likely to introduce.
 */
describe('event data', () => {
  it('keeps the RSVP message identical to the approved V3 template', () => {
    expect(event.rsvp.message).toBe(
      '¡Hola! Confirmo mi asistencia al primer cumpleaños de Renata.\n\nNombre: \nCantidad de personas: ',
    );
  });

  it('keeps the WhatsApp display number and digits in sync', () => {
    expect(event.whatsapp.display.replace(/\D/g, '')).toBe(event.whatsapp.digits);
  });

  it('points the map embed at the venue coordinates', () => {
    const { lat, lng } = event.venue.coordinates;
    expect(event.venue.mapEmbedUrl).toContain(`${lat},${lng}`);
  });

  it('uses the venue confirmed by the family (2026-10-30)', () => {
    expect(event.venue.name).toBe('Centro de Jubilados 12 de Mayo');
    expect(event.venue.mapsShareUrl).toBe('https://maps.app.goo.gl/E9QZ5DrBoGMBTAQG8');
    expect(event.venue.coordinates).toEqual({ lat: -31.352343, lng: -64.1810758 });
  });

  it('has a start date that reads as Saturday 28 November at 13:30', () => {
    expect(formatEventDate(event.startsAt, event.timeZone)).toEqual({
      weekday: 'sábado',
      date: '28 de noviembre',
      time: 'a las 13:30',
    });
  });

  it('writes the details as one invitation sentence built from the data', () => {
    const date = formatEventDate(event.startsAt, event.timeZone);
    expect(plainSpaces(copy.details.sentence(date))).toBe(
      'El sábado 28 de noviembre, a las 13:30, en el Centro de Jubilados 12 de Mayo.',
    );
    // A line may only break between phrases, never inside "a las 13:30".
    expect(copy.details.sentence(date)).toContain('a\u00A0las\u00A013:30');
    expect(copy.details.sentence(date)).toContain('en\u00A0el\u00A0Centro');
  });

  it('continues the hero lead-in and name with the date', () => {
    const date = formatEventDate(event.startsAt, event.timeZone);
    expect(plainSpaces(`${copy.hero.leadIn} ${copy.hero.name} ${copy.hero.when(date)}`)).toBe(
      'Te invitamos al primer cumpleaños de Renata el sábado 28 de noviembre, a las 13:30',
    );
  });

  it('writes no tracked-caps labels or middle-dot strings in the copy', () => {
    const texts = JSON.stringify(copy);
    expect(texts).not.toContain('·');
    expect(texts).not.toMatch(/Capítulo/);
  });

  it('derives the visible name-dependent copy from the data fields', () => {
    expect(copy.hero.name).toBe(event.childName);
    expect(copy.map.iframeTitle).toBe('Mapa de ubicación del Centro de Jubilados 12 de Mayo');
  });
});
