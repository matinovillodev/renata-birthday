import { describe, expect, it } from 'vitest';
import { formatEventDate } from './event-date';

const CORDOBA = 'America/Argentina/Cordoba';

describe('formatEventDate', () => {
  it('returns the phrases the invitation sentence is written with', () => {
    expect(formatEventDate('2026-11-28T13:30:00-03:00', CORDOBA)).toEqual({
      weekday: 'sábado',
      date: '28 de noviembre',
      time: 'a las 13:30',
    });
  });

  it('renders the phrases in the given time zone, not the machine one', () => {
    // 23:30 in Córdoba is already 02:30 of the next day in UTC.
    expect(formatEventDate('2026-11-28T23:30:00-03:00', 'UTC')).toEqual({
      weekday: 'domingo',
      date: '29 de noviembre',
      time: 'a las 2:30',
    });
  });

  it('uses a 24-hour clock without a leading zero on the hour', () => {
    expect(formatEventDate('2026-11-28T09:05:00-03:00', CORDOBA).time).toBe('a las 9:05');
    expect(formatEventDate('2026-11-28T18:00:00-03:00', CORDOBA).time).toBe('a las 18:00');
  });

  it('says "a la" for one o\'clock, as Spanish does', () => {
    expect(formatEventDate('2026-11-28T13:15:00-03:00', 'UTC').time).toBe('a las 16:15');
    expect(formatEventDate('2026-11-28T01:15:00-03:00', CORDOBA).time).toBe('a la 1:15');
  });

  it('throws on a date string that cannot be parsed', () => {
    expect(() => formatEventDate('not-a-date', CORDOBA)).toThrow(/invalid/i);
  });
});
