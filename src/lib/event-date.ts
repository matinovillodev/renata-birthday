/**
 * The event start, written two ways: as phrases for the hero sentence ("el
 * sábado 28 de noviembre, a las 13:30") and as the labels of the details
 * items ("Sábado 28 de noviembre", "13:30 hs").
 */
export interface EventDatePhrases {
  /** Lowercase weekday, e.g. `sábado`. */
  weekday: string;
  /** Day and month, e.g. `28 de noviembre`. */
  date: string;
  /** 24-hour time introduced as Spanish does, e.g. `a las 13:30` (`a la 1:15` at one o'clock). */
  time: string;
  /** Details item "Día": capitalized weekday, day and month, e.g. `Sábado 28 de noviembre`. */
  dayLabel: string;
  /** Details item "Hora": two-digit 24-hour time followed by `hs`, e.g. `13:30 hs`. */
  timeLabel: string;
}

const LOCALE = 'es-AR';

/**
 * Formats an ISO 8601 date-time into the phrases and labels of the invitation, evaluated
 * in `timeZone` so the output never depends on the machine that builds the
 * site.
 *
 * Built from `Intl.DateTimeFormat#formatToParts` so each phrase can be placed
 * in a sentence (and kept on one line) on its own.
 *
 * @param iso Date-time with an explicit offset, e.g. `2026-11-28T13:30:00-03:00`.
 * @param timeZone IANA time zone, e.g. `America/Argentina/Cordoba`.
 * @throws {RangeError} When `iso` cannot be parsed or `timeZone` is unknown.
 */
export function formatEventDate(iso: string, timeZone: string): EventDatePhrases {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`formatEventDate: invalid date "${iso}".`);
  }

  const day = formatParts(date, timeZone, { weekday: 'long', day: 'numeric', month: 'long' });
  const time = formatParts(date, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  // Intl pads the hour ("09"); a written invitation says "a las 9:05".
  const hour = Number(pick(time, 'hour'));
  const weekday = pick(day, 'weekday');
  const dayAndMonth = `${pick(day, 'day')} de ${pick(day, 'month')}`;

  return {
    weekday: weekday.toLocaleLowerCase(LOCALE),
    date: dayAndMonth,
    time: `${hour === 1 ? 'a la' : 'a las'} ${hour}:${pick(time, 'minute')}`,
    dayLabel: `${weekday.charAt(0).toLocaleUpperCase(LOCALE)}${weekday.slice(1)} ${dayAndMonth}`,
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
