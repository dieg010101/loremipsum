import { error } from '@sveltejs/kit';
import { sanity } from '$lib/server/sanity';
import { formatLocation } from '$lib/server/exhibitions';
import type { RequestHandler } from './$types';

type Raw = {
	title: string;
	year: number;
	openingDate?: string;
	closingDate?: string;
	hours?: string;
	venue?: string;
	address?: string;
	city?: string;
};

const query = `*[_type == "exhibition" && slug.current == $slug][0]{
	title, year, openingDate, closingDate, hours, venue, address, city
}`;

// ics text needs commas, semicolons and backslashes escaped.
const escape = (s: string) => s.replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
const compact = (iso: string) => iso.replaceAll('-', '');

function dayAfter(iso: string) {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

// an all-day event spanning the show, for "add to calendar".
export const GET: RequestHandler = async ({ params, url }) => {
	const e = await sanity.fetch<Raw | null>(query, { slug: params.slug });
	if (!e?.openingDate || !e.closingDate) error(404, 'not found');

	const page = `${url.origin}/exhibitions/${params.slug}`;
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//lorem ipsum art group//exhibitions//EN',
		'BEGIN:VEVENT',
		`UID:${params.slug}@${url.host}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
		`DTSTART;VALUE=DATE:${compact(e.openingDate)}`,
		`DTEND;VALUE=DATE:${compact(dayAfter(e.closingDate))}`,
		`SUMMARY:${escape(`${e.title} (${e.year}) · lorem ipsum art group`)}`,
		`LOCATION:${escape(formatLocation(e) ?? '')}`,
		`DESCRIPTION:${escape([e.hours, page].filter(Boolean).join('\n'))}`,
		`URL:${page}`,
		'END:VEVENT',
		'END:VCALENDAR'
	];

	return new Response(lines.join('\r\n'), {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="${params.slug}.ics"`,
			'cache-control': 'public, max-age=300'
		}
	});
};
