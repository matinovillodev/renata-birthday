/**
 * Builds a WhatsApp "click to chat" link that opens a conversation with
 * `phoneDigits` and pre-fills `message` in the composer.
 *
 * The link only prepares the message; the guest still has to press send in
 * WhatsApp, so callers must never present opening it as a confirmed RSVP.
 *
 * @param phoneDigits International phone number. Any non-digit character
 *   (`+`, spaces, dashes, parentheses) is stripped, so a display-formatted
 *   number such as `+54 9 3517 62-2809` is accepted.
 * @param message Plain-text message; it is URL-encoded here.
 * @throws {Error} When the phone number contains no digits.
 * @see https://faq.whatsapp.com/5913398998672934
 */
export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const digits = phoneDigits.replace(/\D/g, '');
  if (digits.length === 0) {
    throw new Error('buildWhatsAppUrl: the phone number must contain at least one digit.');
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
