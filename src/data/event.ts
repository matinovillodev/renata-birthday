/**
 * Invitation data: the ONE file to edit when personalizing the invitation.
 *
 * - `event` holds the facts (who, when, where, how to RSVP).
 * - `copy` holds every visible Spanish text of the approved V3 design
 *   ("Inmersiva con parallax"), copied verbatim. Texts that mention the child
 *   or the venue are built from `event` so a fact is never written twice.
 *
 * The date is NOT stored as text: the page derives its phrases ("sábado",
 * "28 de noviembre", "a las 13:30") from `event.startsAt` with
 * `formatEventDate` (src/lib/event-date.ts), and the copy below writes them
 * into sentences. Each phrase is kept on one line (`keepTogether`), so a line
 * only breaks between phrases.
 *
 * Unknown facts must be written as `[PLACEHOLDER: …]`; never invent them.
 */
import type { EventDatePhrases } from '../lib/event-date';
import { keepTogether } from '../lib/text';

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

/** "el sábado 28 de noviembre, a las 13:30": lines break only between the three phrases. */
function when(date: EventDatePhrases, article: 'el' | 'El'): string {
  return `${keepTogether(`${article} ${date.weekday}`)} ${keepTogether(date.date)}, ${keepTogether(date.time)}`;
}

/**
 * Visible copy, grouped in page order, in Renata's voice (first person: "Te
 * invito a mi primer cumpleaños"); alt texts describe the photos in third
 * person and the WhatsApp message is the guest's. Written like a printed invitation:
 * sentence case and no labels above headings; the details panel lists day,
 * time and place as items (user decision, H10).
 *
 * Register note: V3 contains two voseo imperatives, kept verbatim and marked
 * with `REGISTER:` below until the neutral-Spanish wording is decided.
 */
export const copy = {
  /** Browser tab title: V3 document title without its " — Inmersiva" variant suffix. */
  documentTitle: `Invitación de ${childName}`,

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
    /** Italic line above the name. */
    leadIn: 'Mi primer cumpleaños',
    name: childName,
    openButton: 'Abrir invitación',
  },

  /** Chapter I: full-bleed hero photo. The lead-in, then the name, then the date line. */
  hero: {
    photoAlt: `${childName} vestida de hada, sonriendo`,
    leadIn: 'Te invito a mi primer cumpleaños',
    name: childName,
    when: (date: EventDatePhrases) => when(date, 'el'),
    rsvpButton: 'Confirmar asistencia',
    // REGISTER: voseo imperative ("Deslizá"), kept verbatim from V3.
    scrollHint: 'Deslizá para entrar al bosque',
  },

  /** Ivory sheet that slides over the hero. */
  invitation: {
    heading: 'Un año lleno de magia',
    body: 'Estoy por cumplir mi primer añito y quiero celebrarlo rodeada de las personas que me acompañan con tanto cariño. ¡Me encantaría que seas parte de este día tan especial!',
  },

  /** Chapter II photo title. */
  chapterDay: {
    photoAlt: `${childName} con alas de hada, apoyada en un banquito en un bosque encantado`,
    title: 'El gran día',
  },

  /**
   * Peach sheet: day, time and place as items (icon, label, value). The values
   * come from `event` (`dayLabel`, `timeLabel`, `venue.name`).
   */
  details: {
    dayLabel: 'Día',
    timeLabel: 'Hora',
    placeLabel: 'Lugar',
  },

  /**
   * The facts as one sentence, for the link preview (meta description):
   * "El sábado 28 de noviembre, a las 13:30, en el Centro de Jubilados 12 de Mayo."
   * "en el" travels with the venue's first word, so it never ends a line.
   */
  factsSentence: (date: EventDatePhrases) => `${when(date, 'El')}, ${keepTogether('en el')}\u00A0${venueName}.`,

  /**
   * "How to get there": an illustrated preview of the venue (no Google
   * request) with a link to Google Maps and a button that loads the
   * interactive map in its place.
   */
  map: {
    heading: 'Cómo llegar',
    openInMaps: 'Abrir en Google Maps',
    loadMap: 'Ver el mapa interactivo',
    /** Accessible name of the map iframe once it is loaded. */
    iframeTitle: `Mapa de ubicación del ${venueName}`,
  },

  /** Chapter III photo title. */
  chapterRsvp: {
    photoAlt: `${childName} sentada entre hongos de cuento, mirando hacia arriba`,
    title: '¿Me acompañan?',
  },

  /** WhatsApp RSVP block. The page never claims the RSVP was sent. */
  rsvp: {
    // REGISTER: voseo imperative ("Confirmá"), kept verbatim from V3.
    heading: 'Confirmá tu asistencia',
    button: 'Confirmar por WhatsApp',
  },

  /** Closing footer: only the farewell (the facts are already in the details panel). */
  closing: {
    heading: '¡Te espero!',
  },
} as const;
