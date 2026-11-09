// a small ical (rfc 5545) calendar: one event per exhibition opening. the whole
// calendar at /calendar.ics can be subscribed to, and new openings turn up in it.

/** text values: backslash, semicolon, comma and newline are escaped. */
const escape = (s: string) =>
	s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const stamp = (iso: string | Date) =>
	new Date(iso)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');

const encoder = new TextEncoder();

/**
 * lines longer than 75 octets are folded: a line break and one space. counted in
 * utf-8 bytes, and never inside a character, so accented titles survive.
 */
export function fold(line: string) {
	const out: string[] = [];
	let current = '';
	let bytes = 0;
	for (const char of line) {
		const size = encoder.encode(char).length;
		// the first line holds 75 octets; continuations hold 74 after their leading space.
		const limit = out.length === 0 ? 75 : 74;
		if (bytes + size > limit) {
			out.push(current);
			current = '';
			bytes = 0;
		}
		current += char;
		bytes += size;
	}
	out.push(current);
	return out.join('\r\n ');
}

export type CalendarEvent = {
	number: number;
	title: string;
	opens: string;
	url: string;
	description: string;
	/** when it was last edited, so calendar apps notice a change. */
	updated?: string;
};

type Options = { name?: string; description?: string };

export function calendar(
	events: CalendarEvent[],
	now: Date,
	{ name = 'lorem ipsum', description }: Options = {}
) {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//lorem ipsum art group//exhibitions//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escape(name)}`,
		...(description ? [`X-WR-CALDESC:${escape(description)}`] : []),
		// subscribed calendars check back once a day.
		'REFRESH-INTERVAL;VALUE=DURATION:P1D',
		'X-PUBLISHED-TTL:P1D'
	];
	for (const e of events) {
		const start = new Date(e.opens);
		const end = new Date(start.getTime() + 60 * 60 * 1000);
		lines.push(
			'BEGIN:VEVENT',
			`UID:exhibition-${e.number}@loremipsum.art`,
			`DTSTAMP:${stamp(now)}`,
			...(e.updated ? [`LAST-MODIFIED:${stamp(e.updated)}`] : []),
			`DTSTART:${stamp(start)}`,
			`DTEND:${stamp(end)}`,
			`SUMMARY:${escape(`${e.title}, exhibition ${e.number} opens`)}`,
			`DESCRIPTION:${escape(e.description)}`,
			`URL:${e.url}`,
			'TRANSP:TRANSPARENT',
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
