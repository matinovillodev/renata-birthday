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
      dayLabel: 'Sábado 28 de noviembre',
      timeLabel: '13:30 hs',
    });
  });

  it('writes the facts as one sentence for the link preview, built from the data', () => {
    const date = formatEventDate(event.startsAt, event.timeZone);
    expect(plainSpaces(copy.factsSentence(date))).toBe(
      'El sábado 28 de noviembre, a las 13:30, en el Centro de Jubilados 12 de Mayo.',
    );
    // A line may only break between phrases, never inside "a las 13:30".
    expect(copy.factsSentence(date)).toContain('a\u00A0las\u00A013:30');
    expect(copy.factsSentence(date)).toContain('en\u00A0el\u00A0Centro');
  });

  it('shows the hero lead-in, then the name, then the date line', () => {
    const date = formatEventDate(event.startsAt, event.timeZone);
    expect(copy.hero.leadIn).toBe('Te invito a mi primer cumpleaños');
    expect(copy.hero.name).toBe('Renata');
    expect(plainSpaces(copy.hero.when(date))).toBe('el sábado 28 de noviembre, a las 13:30');
  });

  it('speaks in Renata\'s voice (first person) on the page', () => {
    expect(copy.intro.leadIn).toBe('Mi primer cumpleaños');
    expect(copy.invitation.body).toBe(
      'Estoy por cumplir mi primer añito y quiero celebrarlo rodeada de las personas que me acompañan con tanto cariño. ¡Me encantaría que seas parte de este día tan especial!',
    );
    expect(copy.chapterRsvp.title).toBe('¿Me acompañan?');
    expect(copy.closing.heading).toBe('¡Te espero!');
    // No family "we" left in the visible copy (alt texts describe the photos in third person).
    const { hero, chapterDay, chapterRsvp, ...visible } = copy;
    const spoken = JSON.stringify([visible, hero.leadIn, chapterDay.title, chapterRsvp.title]);
    expect(spoken).not.toMatch(/\b(invitamos|queremos|esperamos|Nos encantaría|Nos acompañan)\b/);
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
