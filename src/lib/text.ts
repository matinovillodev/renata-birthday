const NO_BREAK_SPACE = '\u00A0';

/**
 * Joins the words of a short phrase with no-break spaces, so a line never
 * ends inside it (e.g. "a las" alone at the end of a line, "13:30" below).
 * Lines may still break between phrases.
 */
export function keepTogether(phrase: string): string {
  return phrase.replaceAll(' ', NO_BREAK_SPACE);
}

/** Undoes `keepTogether` for text that is not laid out, such as meta tags. */
export function plainSpaces(text: string): string {
  return text.replaceAll(NO_BREAK_SPACE, ' ');
}
