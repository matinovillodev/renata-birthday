import { describe, expect, it } from 'vitest';
import { formatEventDate } from '../lib/event-date';
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

  it('has a start date that renders as the V3 day and time labels', () => {
    expect(formatEventDate(event.startsAt, event.timeZone)).toEqual({
      dayLabel: 'Sábado 28 de noviembre',
      timeLabel: '13:30 hs',
    });
  });

  it('derives the visible name-dependent copy from the data fields', () => {
    expect(copy.hero.name).toBe(event.childName);
    expect(copy.map.description).toContain(event.venue.name);
  });
});
