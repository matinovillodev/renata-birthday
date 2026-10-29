/** Human-readable Spanish labels for the event start, as the V3 design shows them. */
export interface EventDateLabels {
  /** Capitalized weekday, day and month without a comma, e.g. `Sábado 28 de noviembre`. */
  dayLabel: string;
  /** 24-hour time followed by `hs`, e.g. `13:30 hs`. */
  timeLabel: string;
}

const LOCALE = 'es-AR';

/**
 * Formats an ISO 8601 date-time into the day and time labels of the
 * invitation, evaluated in `timeZone` so the output never depends on the
 * machine that builds the site.
 *
 * The labels are composed from `Intl.DateTimeFormat#formatToParts` instead of
 * `format()` because the default `es-AR` output (`sábado, 28 de noviembre`)
 * has a lowercase weekday and a comma that the design does not use.
 *
 * @param iso Date-time with an explicit offset, e.g. `2026-11-28T13:30:00-03:00`.
 * @param timeZone IANA time zone, e.g. `America/Argentina/Cordoba`.
 * @throws {RangeError} When `iso` cannot be parsed or `timeZone` is unknown.
 */
export function formatEventDate(iso: string, timeZone: string): EventDateLabels {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`formatEventDate: invalid date "${iso}".`);
  }

  const day = formatParts(date, timeZone, { weekday: 'long', day: 'numeric', month: 'long' });
  const time = formatParts(date, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

  return {
    dayLabel: `${capitalize(pick(day, 'weekday'))} ${pick(day, 'day')} de ${pick(day, 'month')}`,
    timeLabel: `${pick(time, 'hour')}:${pick(time, 'minute')} hs`,
  };
}

function formatParts(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone }).formatToParts(date);
}

function pick(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const part = parts.find((candidate) => candidate.type === type);
  if (!part) {
    throw new Error(`formatEventDate: Intl returned no "${type}" part.`);
  }
  return part.value;
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}
