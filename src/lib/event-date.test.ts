import { describe, expect, it } from 'vitest';
import { formatEventDate } from './event-date';

const CORDOBA = 'America/Argentina/Cordoba';

describe('formatEventDate', () => {
  it('formats the party start the way the V3 design shows it', () => {
    expect(formatEventDate('2026-11-28T13:30:00-03:00', CORDOBA)).toEqual({
      dayLabel: 'Sábado 28 de noviembre',
      timeLabel: '13:30 hs',
    });
  });

  it('renders the labels in the given time zone, not the machine one', () => {
    // 23:30 in Córdoba is already 02:30 of the next day in UTC.
    expect(formatEventDate('2026-11-28T23:30:00-03:00', 'UTC')).toEqual({
      dayLabel: 'Domingo 29 de noviembre',
      timeLabel: '02:30 hs',
    });
  });

  it('uses a 24-hour clock with two-digit hours and minutes', () => {
    expect(formatEventDate('2026-11-28T09:05:00-03:00', CORDOBA).timeLabel).toBe('09:05 hs');
  });

  it('throws on a date string that cannot be parsed', () => {
    expect(() => formatEventDate('not-a-date', CORDOBA)).toThrow(/invalid/i);
  });
});
