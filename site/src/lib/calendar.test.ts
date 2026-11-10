import { describe, expect, it } from 'vitest';
import { googleEventHref, openingText, subscribeHrefs } from './calendar';

describe('calendar links', () => {
	const e = { number: 15, title: 'nemo enim ipsam', opens: '2026-12-01T10:00:00+01:00' };
	const link = 'https://loremipsum.art/exhibitions/15';

	it('fills in google calendar with the opening hour, in utc', () => {
		const url = new URL(googleEventHref(e, link, 'duis aute, irure dolor'));
		expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
		expect(url.searchParams.get('action')).toBe('TEMPLATE');
		expect(url.searchParams.get('dates')).toBe('20261201T090000Z/20261201T100000Z');
		expect(url.searchParams.get('text')).toBe('nemo enim ipsam, exhibition 15 opens');
		expect(url.searchParams.get('details')).toBe(
			`with duis aute, irure dolor. online, at ${link}. it stays open.`
		);
	});

	it('says nothing about who when nobody is named yet', () => {
		expect(openingText(null, link)).toBe(`online, at ${link}. it stays open.`);
		expect(openingText('  ', link)).toBe(`online, at ${link}. it stays open.`);
	});

	it('subscribes by webcal, and google by its add-by-url link', () => {
		const s = subscribeHrefs('https://loremipsum.art');
		expect(s.webcal).toBe('webcal://loremipsum.art/calendar.ics');
		expect(s.google).toBe(
			'https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2Floremipsum.art%2Fcalendar.ics'
		);
	});
});
