import type { ExhibitionSummary, Medium, Sale } from './types';

// everything date-shaped is read in the gallery's own time zone, so a show opens
// at 10:00 cet for everyone and "day 6 of 30" turns over at local midnight.
export const TIME_ZONE = 'Europe/Paris';

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

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

const partsFormat = new Intl.DateTimeFormat('en-GB', {
	timeZone: TIME_ZONE,
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	hourCycle: 'h23'
});

function parts(iso: string | Date): Parts {
	const values = Object.fromEntries(
		partsFormat.formatToParts(new Date(iso)).map((p) => [p.type, Number(p.value)])
	);
	return {
		year: values.year,
		month: values.month,
		day: values.day,
		hour: values.hour,
		minute: values.minute
	};
}

/** whole days on the gallery's calendar, comparable across months. */
function calendarDay(iso: string | Date) {
	const p = parts(iso);
	return Math.round(Date.UTC(p.year, p.month - 1, p.day) / 86_400_000);
}

// citation dates follow each style's own rules, capitals and all.
const MLA_MONTHS = 'Jan. Feb. Mar. Apr. May June July Aug. Sept. Oct. Nov. Dec.'.split(' ');
const FULL_MONTHS = MONTHS.map((m) => m[0].toUpperCase() + m.slice(1));

/** a date for a citation: mla "1 Nov. 2026", chicago "November 1, 2026", iso "2026-11-01". */
export function citeDate(iso: string | Date, style: 'mla' | 'chicago' | 'iso') {
	const p = parts(iso);
	if (style === 'mla') return `${p.day} ${MLA_MONTHS[p.month - 1]} ${p.year}`;
	if (style === 'chicago') return `${FULL_MONTHS[p.month - 1]} ${p.day}, ${p.year}`;
	return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** "1 november 2026", or "1 november" without the year. */
export function formatDate(iso: string | Date, withYear = true) {
	const p = parts(iso);
	return `${p.day} ${MONTHS[p.month - 1]}${withYear ? ` ${p.year}` : ''}`;
}

/** "6 nov", for the visitors' book. */
export function shortDate(iso: string | Date) {
	const p = parts(iso);
	return `${p.day} ${MONTHS[p.month - 1].slice(0, 3)}`;
}

/** "3 nov 2026", for the journal. */
export function journalDate(iso: string | Date) {
	return `${shortDate(iso)} ${parts(iso).year}`;
}

/** "november 2026". */
export function monthYear(iso: string | Date) {
	const p = parts(iso);
	return `${MONTHS[p.month - 1]} ${p.year}`;
}

export function yearOf(iso: string | Date) {
	return parts(iso).year;
}

/** "10:00 cet" (or cest in summer). */
export function formatTime(iso: string | Date) {
	const p = parts(iso);
	const date = new Date(iso);
	// the offset from utc tells winter from summer time.
	const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
	const offset = (((p.hour + p.minute / 60 - utcHour) % 24) + 24) % 24;
	const zone = offset === 2 ? 'cest' : 'cet';
	return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')} ${zone}`;
}

/** "1 november 2026, 10:00 cet". */
export function formatDateTime(iso: string | Date) {
	return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/** days from now until then, on the calendar (0 = today). */
export function daysUntil(iso: string, now: Date) {
	return calendarDay(iso) - calendarDay(now);
}

/** which day of the show this is: 1 on opening day. */
export function dayOf(opens: string, now: Date) {
	return calendarDay(now) - calendarDay(opens) + 1;
}

/** the last day an exhibition is new: opened + newFor - 1 days. */
export function newUntil(e: { opens: string; newFor: number }) {
	const d = new Date(e.opens);
	d.setUTCDate(d.getUTCDate() + e.newFor - 1);
	return d;
}

/**
 * open once its moment has come, and only if there's something in it: an exhibition
 * whose date passes before its works are in stays announced, instead of opening empty.
 */
export function isOpen(e: { opens: string; ready?: boolean }, now: Date) {
	return e.ready !== false && new Date(e.opens).getTime() <= now.getTime();
}

/** the one on view (the newest that has opened), the next one and the ones before. */
export function timeline<T extends { opens: string; ready?: boolean }>(
	exhibitions: T[],
	now: Date
) {
	const sorted = [...exhibitions].sort((a, b) => b.opens.localeCompare(a.opens));
	const open = sorted.filter((e) => isOpen(e, now));
	const upcoming = sorted.filter((e) => !isOpen(e, now)).reverse();
	return {
		current: open[0] ?? null,
		next: upcoming[0] ?? null,
		earlier: open.slice(1),
		open,
		upcoming
	};
}

/** "day 6 of 30", "opened today", or nothing once it's no longer new. */
export function dayStatus(e: { opens: string; newFor: number }, now: Date) {
	const day = dayOf(e.opens, now);
	if (day < 1) return null;
	if (day === 1) return 'opened today';
	if (day <= e.newFor) return `day ${day} of ${e.newFor}`;
	return null;
}

/** "1 december", "tomorrow" or "not announced yet". */
export function nextLabel(next: { opens: string } | null, now: Date) {
	if (!next) return 'not announced yet';
	if (daysUntil(next.opens, now) === 1) return 'tomorrow';
	return formatDate(next.opens, false);
}

/** "in 25 days", "tomorrow", "today". */
export function inDays(iso: string, now: Date) {
	const days = daysUntil(iso, now);
	if (days <= 0) return 'today';
	if (days === 1) return 'tomorrow';
	return `in ${days} days`;
}

const usd = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** "$4,800". */
export function price(amount: number) {
	return `$${usd.format(amount)}`;
}

const FREE: Record<Medium, string> = {
	text: 'free to read',
	pdf: 'free to download',
	website: 'free to visit',
	sound: 'free to listen',
	video: 'free to watch',
	image: 'free to look at'
};

/** the sale line of a label: "available, $4,800", "edition of 5 + 2 ap, price on request". */
export function saleText(sale: Sale, medium: Medium) {
	switch (sale.kind) {
		case 'notForSale':
			return 'not for sale';
		case 'sold':
			return 'sold';
		case 'reserved':
			return `reserved until ${formatDate(sale.until, false)}`;
		case 'free':
			return sale.label ?? FREE[medium];
		case 'onRequest':
			return sale.edition ? `${sale.edition}, price on request` : 'price on request';
		case 'available':
			return `${sale.edition ?? 'available'}, ${price(sale.amount)}${sale.per ? ` ${sale.per}` : ''}`;
	}
}

/** can it be bought, and can you ask about it? */
export function saleActions(sale: Sale) {
	return {
		buy: sale.kind === 'available',
		ask: sale.kind === 'available' || sale.kind === 'onRequest'
	};
}

/** "6.1 mb", "22 mb", "3 mb". */
export function fileSize(bytes: number | null | undefined) {
	if (!bytes) return null;
	const mb = bytes / 1_000_000;
	if (mb < 0.1) return `${Math.max(1, Math.round(bytes / 1000))} kb`;
	if (mb >= 10) return `${Math.round(mb)} mb`;
	const rounded = Math.round(mb * 10) / 10;
	return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} mb`;
}

/** "6:40" for video. */
export function clock(seconds: number) {
	const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "03:41" for the tape. */
export function tapeClock(seconds: number) {
	const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** "[######..........]": how far along, in characters. */
export function tapeBar(position: number, duration: number, cells = 32) {
	const filled = duration > 0 ? Math.min(cells, Math.round((position / duration) * cells)) : 0;
	return `[${'#'.repeat(filled)}${'.'.repeat(cells - filled)}]`;
}

const SMALL = [
	'zero',
	'one',
	'two',
	'three',
	'four',
	'five',
	'six',
	'seven',
	'eight',
	'nine',
	'ten',
	'eleven',
	'twelve',
	'thirteen',
	'fourteen',
	'fifteen',
	'sixteen',
	'seventeen',
	'eighteen',
	'nineteen'
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** "fourteen", "twenty-one"; numerals past 99. */
export function numberWord(n: number) {
	if (n < 20) return SMALL[n];
	if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${SMALL[n % 10]}` : '');
	return String(n);
}

/** "2,140". */
export function count(n: number) {
	return usd.format(n);
}

/** "3f9a 1c07 b2e4 …": the first 32 hex characters, in fours. */
export function hashGroups(hex: string) {
	return (hex.slice(0, 32).match(/.{1,4}/g) ?? []).join(' ');
}

/** "a, b, c, d and four more". */
export function creditLine(names: string[], shown = 4) {
	if (names.length <= shown) return listJoin(names);
	return `${names.slice(0, shown).join(', ')} and ${numberWord(names.length - shown)} more`;
}

/** "a, b and c". */
export function listJoin(items: string[]) {
	if (items.length <= 1) return items.join('');
	return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/** what the exhibitions list says after the title. */
export function summaryCredit(e: ExhibitionSummary) {
	return e.credit ?? creditLine(e.artists);
}

export function slugify(s: string) {
	return s
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/** the price line in the webstore: "$4,800", "$300 a roll", "sold", "price on request". */
export function storePrice(sale: Sale, medium: Medium) {
	if (sale.kind === 'available') return `${price(sale.amount)}${sale.per ? ` ${sale.per}` : ''}`;
	if (sale.kind === 'onRequest') return 'price on request';
	return saleText(sale, medium);
}
