import { describe, expect, it } from 'vitest';
import {
	isOpen,
	clock,
	creditLine,
	dayStatus,
	fileSize,
	nextLabel,
	numberWord,
	tapeBar,
	tapeClock,
	timeline
} from './format';

// the demo clock: day 6 of exhibition 14.
const NOW = new Date('2026-11-06T12:00:00+01:00');
const e14 = { opens: '2026-11-01T10:00:00+01:00', newFor: 30 };

describe('the now line', () => {
	it('counts the days of a new exhibition', () => {
		expect(dayStatus(e14, NOW)).toBe('day 6 of 30');
		expect(dayStatus(e14, new Date('2026-11-01T18:00:00+01:00'))).toBe('opened today');
		expect(dayStatus(e14, new Date('2026-11-30T23:00:00+01:00'))).toBe('day 30 of 30');
	});
	it('says nothing before it opens or once it is no longer new', () => {
		expect(dayStatus(e14, new Date('2026-10-31T12:00:00+01:00'))).toBeNull();
		expect(dayStatus(e14, new Date('2026-12-01T12:00:00+01:00'))).toBeNull();
	});
	it('names the next one', () => {
		expect(nextLabel({ opens: '2026-12-01T10:00:00+01:00' }, NOW)).toBe('1 december');
		expect(
			nextLabel({ opens: '2026-12-01T10:00:00+01:00' }, new Date('2026-11-30T20:00:00+01:00'))
		).toBe('tomorrow');
		expect(nextLabel(null, NOW)).toBe('not announced yet');
	});
	it('counts days in paris, not utc', () => {
		// 00:30 in paris on the 2nd is still the 1st in utc.
		expect(dayStatus(e14, new Date('2026-11-02T00:30:00+01:00'))).toBe('day 2 of 30');
	});
});

describe('timeline', () => {
	const list = [
		{ n: 13, opens: '2026-10-01T10:00:00+02:00' },
		{ n: 15, opens: '2026-12-01T10:00:00+01:00' },
		{ n: 14, opens: '2026-11-01T10:00:00+01:00' }
	];
	it('finds what is on, what is next and what came before', () => {
		const t = timeline(list, NOW);
		expect(t.current?.n).toBe(14);
		expect(t.next?.n).toBe(15);
		expect(t.earlier.map((e) => e.n)).toEqual([13]);
	});
	it('switches over the moment the next one opens', () => {
		expect(timeline(list, new Date('2026-12-01T10:00:00+01:00')).current?.n).toBe(15);
		expect(timeline(list, new Date('2026-12-01T09:59:00+01:00')).current?.n).toBe(14);
	});
});

describe('words and numbers', () => {
	it('writes small numbers as words', () => {
		expect(numberWord(4)).toBe('four');
		expect(numberWord(14)).toBe('fourteen');
		expect(numberWord(21)).toBe('twenty-one');
		expect(numberWord(140)).toBe('140');
	});
	it('credits four artists, then counts the rest', () => {
		expect(creditLine(['a', 'b'])).toBe('a and b');
		expect(creditLine(['a', 'b', 'c', 'd', 'e', 'f'])).toBe('a, b, c, d and two more');
	});
	it('sizes files the way people say them', () => {
		expect(fileSize(3_000_000)).toBe('3 mb');
		expect(fileSize(6_100_000)).toBe('6.1 mb');
		expect(fileSize(210_000_000)).toBe('210 mb');
		expect(fileSize(42_000)).toBe('42 kb');
		expect(fileSize(null)).toBeNull();
	});
});

describe('players', () => {
	it('keeps time', () => {
		expect(clock(400)).toBe('6:40');
		expect(tapeClock(221)).toBe('03:41');
	});
	it('never shows Infinity or NaN for odd files', () => {
		expect(clock(Infinity)).toBe('0:00');
		expect(clock(NaN)).toBe('0:00');
		expect(tapeClock(Infinity)).toBe('00:00');
	});
	it('fills the tape bar as it plays', () => {
		expect(tapeBar(0, 724, 8)).toBe('[........]');
		expect(tapeBar(362, 724, 8)).toBe('[####....]');
		expect(tapeBar(9999, 724, 8)).toBe('[########]');
		expect(tapeBar(10, 0, 4)).toBe('[....]');
	});
});

describe('isOpen', () => {
	const now = new Date('2026-12-02T10:00:00Z');
	it('opens when its moment comes', () => {
		expect(isOpen({ opens: '2026-12-01T10:00:00Z' }, now)).toBe(true);
		expect(isOpen({ opens: '2026-12-03T10:00:00Z' }, now)).toBe(false);
	});
	it('stays announced while it has no works, whatever the date', () => {
		expect(isOpen({ opens: '2026-12-01T10:00:00Z', ready: false }, now)).toBe(false);
		expect(timeline([{ opens: '2026-12-01T10:00:00Z', ready: false }], now).next?.opens).toBe(
			'2026-12-01T10:00:00Z'
		);
	});
});
