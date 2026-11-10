/**
 * the ways into someone's calendar, without anything to install or pay for:
 * - one opening: the .ics file (iphone, mac, outlook open it straight away) and a
 *   google calendar link (android's google calendar can't open a downloaded .ics).
 * - every opening, kept up to date: subscribe to /calendar.ics. webcal:// asks
 *   apple calendar and outlook to subscribe; google takes the address through its
 *   "add by url" link. subscribed calendars check back on their own (google about
 *   twice a day, apple as the file asks: daily).
 */

/** "with duis aute, irure dolor. online, at …/exhibitions/15. it stays open." */
export function openingText(credit: string | null | undefined, link: string) {
	const who = credit?.replace(/\s*\n\s*/g, ' ').trim();
	return `${who ? `with ${who.replace(/\.?$/, '.')} ` : ''}online, at ${link}. it stays open.`;
}

const stamp = (date: Date) =>
	date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');

/** google calendar's own "new event" page, filled in. the hour from opening. */
export function googleEventHref(
	e: { number: number; title: string; opens: string },
	link: string,
	credit?: string | null
) {
	const start = new Date(e.opens);
	const end = new Date(start.getTime() + 60 * 60 * 1000);
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: `${e.title}, exhibition ${e.number} opens`,
		dates: `${stamp(start)}/${stamp(end)}`,
		details: openingText(credit, link),
		location: link
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}

/** subscribe to every opening: apple and outlook through webcal, google by url. */
export function subscribeHrefs(origin: string) {
	const feed = `${origin}/calendar.ics`;
	const webcal = feed.replace(/^https?:/, 'webcal:');
	return {
		feed,
		webcal,
		google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
		outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feed)}&name=${encodeURIComponent('lorem ipsum')}`
	};
}
