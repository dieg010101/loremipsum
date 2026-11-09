import { describe, expect, it } from 'vitest';
import { calendar, fold } from './ics';

describe('calendar', () => {
	const ics = calendar(
		[
			{
				number: 15,
				title: 'nemo, enim; ipsam',
				opens: '2026-12-01T10:00:00+01:00',
				url: 'https://loremipsum.art/exhibitions/15',
				description: 'x'.repeat(200)
			}
		],
		new Date('2026-11-06T12:00:00Z')
	);

	it('is a valid calendar with crlf line ends', () => {
		expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
		expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
		expect(ics).toContain('DTSTART:20261201T090000Z');
	});

	it('escapes commas and semicolons in text', () => {
		expect(ics).toContain('SUMMARY:nemo\\, enim\\; ipsam\\, exhibition 15 opens');
	});

	it('tells subscribed calendars to check back', () => {
		expect(ics).toContain('REFRESH-INTERVAL;VALUE=DURATION:P1D');
	});

	it('folds long lines at 75 octets', () => {
		for (const line of ics.split('\r\n'))
			expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
	});
});

describe('fold', () => {
	it('counts bytes, not characters, and never splits one', () => {
		const line = `SUMMARY:${'é’'.repeat(40)}`;
		const folded = fold(line);
		for (const part of folded.split('\r\n'))
			expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
		expect(folded.replace(/\r\n /g, '')).toBe(line);
	});
});
