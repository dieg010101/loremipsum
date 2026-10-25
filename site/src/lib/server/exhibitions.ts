import type { ExhibitionCard, Status } from '$lib/types';
import { CARD_ASPECT, IMAGE, toImage, type RawImage } from './sanity';

// "today" is read in the gallery's time zone, so a show turns "past" at local midnight.
const TIME_ZONE = 'America/Los_Angeles';

const MONTHS = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december'
];

export function today() {
	// en-CA formats as yyyy-mm-dd, the same shape as sanity date fields.
	return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}

export type Dated = {
	openingDate?: string | null;
	closingDate?: string | null;
	datesNote?: string | null;
};

export function statusOf(e: Dated, now = today()): Status {
	if (e.closingDate && now > e.closingDate) return 'past';
	if (e.openingDate && now >= e.openingDate) return 'current';
	return 'upcoming';
}

function day(iso: string, withYear: boolean) {
	const [y, m, d] = iso.split('-').map(Number);
	return `${MONTHS[m - 1]} ${d}${withYear ? `, ${y}` : ''}`;
}

// "march 6 – april 12, 2026", or the editor's note while dates are not set.
export function formatDates(e: Dated) {
	const { openingDate: open, closingDate: close } = e;
	if (open && close) {
		const sameYear = open.slice(0, 4) === close.slice(0, 4);
		return sameYear
			? `${day(open, false)} – ${day(close, false)}, ${close.slice(0, 4)}`
			: `${day(open, true)} – ${day(close, true)}`;
	}
	if (open) return `opens ${day(open, true)}`;
	return e.datesNote || 'dates to be announced.';
}

export type Located = { venue?: string | null; address?: string | null; city?: string | null };

export function formatLocation(e: Located) {
	if (!e.venue) return null;
	return [e.venue, e.address, e.city].filter(Boolean).join(', ');
}

export function directionsUrl(e: Located) {
	if (!e.venue) return null;
	const query = [e.venue, e.address, e.city].filter(Boolean).join(', ');
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// what every exhibition card needs.
export const EXHIBITION_CARD = `{
	"slug": slug.current,
	title,
	year,
	openingDate,
	closingDate,
	datesNote,
	"image": images[0]${IMAGE}
}`;

export type RawExhibitionCard = Dated & {
	slug: string;
	title: string;
	year: number;
	image: RawImage | null;
};

export function toExhibitionCard(raw: RawExhibitionCard, now = today()): ExhibitionCard {
	return {
		slug: raw.slug,
		title: raw.title,
		year: raw.year,
		status: statusOf(raw, now),
		dates: formatDates(raw),
		image: toImage(raw.image, CARD_ASPECT)
	};
}
