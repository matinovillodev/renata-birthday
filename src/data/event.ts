/**
 * Invitation data: the ONE file to edit when personalizing the invitation.
 *
 * - `event` holds the facts (who, when, where, how to RSVP).
 * - `copy` holds every visible Spanish text of the approved V3 design
 *   ("Inmersiva con parallax"), copied verbatim. Texts that mention the child
 *   or the venue are built from `event` so a fact is never written twice.
 *
 * The date and time lines ("Sábado 28 de noviembre · 13:30 hs") are NOT
 * stored as text: the page derives them from `event.startsAt` with
 * `formatEventDate` (src/lib/event-date.ts), joined by `copy.dateTimeSeparator`.
 *
 * Unknown facts must be written as `[PLACEHOLDER: …]`; never invent them.
 */

/** Facts about the party. Every field is rendered somewhere on the page. */
export interface EventData {
  /** First name of the birthday child, as shown in the headings. */
  readonly childName: string;
  /** Party theme; drives the fairy art direction. */
  readonly theme: string;
  /**
   * Start of the party as ISO 8601 with an explicit UTC offset. Keep the
   * offset: the labels are computed from this instant in `timeZone`.
   */
  readonly startsAt: string;
  /** IANA time zone in which the date and time labels are shown. */
  readonly timeZone: string;
  readonly venue: {
    /** Venue name exactly as guests should read it. */
    readonly name: string;
    /** Short Google Maps share link ("Share → Copy link"). */
    readonly mapsShareUrl: string;
    /** Venue coordinates in decimal degrees (what the share link resolves to). */
    readonly coordinates: { readonly lat: number; readonly lng: number };
    /**
     * `src` of the embedded Google Maps `<iframe>`. This coordinate-based URL
     * works without an API key; it can be replaced by the official `src` from
     * Google Maps "Share → Embed a map" for the same place.
     */
    readonly mapEmbedUrl: string;
  };
  readonly whatsapp: {
    /** Number as shown to guests. */
    readonly display: string;
    /** Same number with digits only (country code + area code + number), used by wa.me. */
    readonly digits: string;
  };
  readonly rsvp: {
    /** Last day to confirm as an ISO date, or `null` when there is no deadline (nothing is shown). */
    readonly deadline: string | null;
    /**
     * Message pre-filled in WhatsApp. It leaves blanks for the guest's name and
     * the number of attendees; the guest still has to press send.
     */
    readonly message: string;
  };
}

const childName = 'Renata';
/*
 * Venue confirmed by the family on 2026-10-30. The share link resolves to the
 * Google place "Centro de Jubilados y Pensionados 12 de Mayo - Jorge Newbery";
 * guests read the shorter name below.
 */
const venueName = 'Centro de Jubilados 12 de Mayo';
const venueCoordinates = { lat: -31.352343, lng: -64.1810758 } as const;

export const event: EventData = {
  childName,
  theme: 'Hadas',
  startsAt: '2026-11-28T13:30:00-03:00',
  timeZone: 'America/Argentina/Cordoba',
  venue: {
    name: venueName,
    mapsShareUrl: 'https://maps.app.goo.gl/E9QZ5DrBoGMBTAQG8',
    coordinates: venueCoordinates,
    mapEmbedUrl: `https://maps.google.com/maps?q=${venueCoordinates.lat},${venueCoordinates.lng}&z=16&hl=es&output=embed`,
  },
  whatsapp: {
    display: '+54 9 3517 62-2809',
    digits: '5493517622809',
  },
  rsvp: {
    deadline: null,
    message: `¡Hola! Confirmo mi asistencia al primer cumpleaños de ${childName}.\n\nNombre: \nCantidad de personas: `,
  },
};

/**
 * Visible copy of the V3 design, grouped in page order.
 *
 * Register note: V3 contains two voseo imperatives, kept verbatim and marked
 * with `REGISTER:` below until the neutral-Spanish wording is decided.
 */
export const copy = {
  /** Browser tab title: V3 document title without its " — Inmersiva" variant suffix. */
  documentTitle: `Invitación de ${childName}`,
  /** Joins the day and time labels in the hero and closing lines. */
  dateTimeSeparator: ' · ',

  /** Fixed side navigation (one entry per section anchor, in page order). */
  nav: {
    ariaLabel: 'Secciones',
    items: [
      { id: 'inicio', label: 'Inicio' },
      { id: 'invitacion', label: 'Invitación' },
      { id: 'el-gran-dia', label: 'El gran día' },
      { id: 'como-llegar', label: 'Cómo llegar' },
      { id: 'confirmar', label: 'Confirmar' },
    ],
  },

  /** Full-screen opening curtain shown before the invitation. */
  intro: {
    eyebrow: 'Primer cumpleaños',
    name: childName,
    openButton: 'Abrir invitación',
  },

  /** Chapter I: full-bleed hero photo. */
  hero: {
    photoAlt: `${childName} vestida de hada, sonriendo`,
    eyebrow: 'Te invitamos al primer cumpleaños de',
    name: childName,
    rsvpButton: 'Confirmar asistencia',
    // REGISTER: voseo imperative ("Deslizá"), kept verbatim from V3.
    scrollHint: 'Deslizá para entrar al bosque',
  },

  /** Ivory sheet that slides over the hero. */
  invitation: {
    heading: 'Un año lleno de magia',
    body: `${childName} está por cumplir su primer añito y queremos celebrarlo rodeados de las personas que la acompañan con tanto cariño. ¡Nos encantaría que seas parte de este día tan especial!`,
  },

  /** Chapter II photo title. */
  chapterDay: {
    photoAlt: `${childName} con alas de hada, apoyada en un banquito en un bosque encantado`,
    eyebrow: 'Capítulo II',
    title: 'El gran día',
  },

  /** Sand sheet with the day, time and place. Values come from `event`. */
  details: {
    heading: 'Te esperamos',
    dayLabel: 'Día',
    timeLabel: 'Hora',
    placeLabel: 'Lugar',
  },

  /** "How to get there" heading above the embedded map. */
  map: {
    heading: 'Cómo llegar',
    /** Accessible name of the map iframe (not visible; not in V3, which only had a mock map). */
    iframeTitle: `Mapa de ubicación del ${venueName}`,
  },

  /** Chapter III photo title. */
  chapterRsvp: {
    photoAlt: `${childName} sentada entre hongos de cuento, mirando hacia arriba`,
    eyebrow: 'Capítulo III',
    title: '¿Nos acompañan?',
  },

  /** WhatsApp RSVP block. The page never claims the RSVP was sent. */
  rsvp: {
    // REGISTER: voseo imperative ("Confirmá"), kept verbatim from V3.
    heading: 'Confirmá tu asistencia',
    button: 'Confirmar por WhatsApp',
  },

  /** Closing footer; the date line and venue below it come from `event`. */
  closing: {
    heading: '¡Te esperamos!',
  },
} as const;
