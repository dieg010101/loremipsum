import { describe, expect, it } from 'vitest';
import { filterHref, group, matches, readFilters, type Row } from './filters';

const row = (r: Partial<Row>): Row =>
	({
		key: '14.1',
		artist: 'a',
		title: 't',
		year: '2026',
		medium: 'image',
		exhibition: 14,
		sale: '',
		forSale: false,
		href: '/',
		...r
	}) as Row;

describe('index filters', () => {
	it('reads the address, ignoring anything unknown', () => {
		expect(readFilters(new URLSearchParams('show=sound&forSale=1&sort=year&q=%20lorem '))).toEqual({
			show: 'sound',
			forSale: true,
			sort: 'year',
			q: 'lorem'
		});
		expect(readFilters(new URLSearchParams('show=nope&sort=nope'))).toEqual({
			show: null,
			forSale: false,
			sort: 'artist',
			q: ''
		});
	});
	it('leaves defaults out of the address', () => {
		const none = readFilters(new URLSearchParams());
		expect(filterHref(none, {})).toBe('/index');
		expect(filterHref(none, { show: 'video', sort: 'title' })).toBe('/index?show=video&sort=title');
	});
	it('counts a pdf as a text, and finds without accents or case', () => {
		const f = readFilters(new URLSearchParams('show=text'));
		expect(matches(row({ medium: 'pdf' }), f)).toBe(true);
		expect(matches(row({ medium: 'image' }), f)).toBe(false);
		expect(matches(row({ artist: 'Élit Sed' }), readFilters(new URLSearchParams('q=elit')))).toBe(
			true
		);
	});
	it('groups by artist, then year, then catalogue number', () => {
		const rows = [
			row({ key: '14.6', artist: 'elit sedutempor', title: 'magna aliqua', year: '2026' }),
			row({ key: '14.5', artist: 'elit sedutempor', title: 'ut labore', year: '2026' }),
			row({ key: '14.1', artist: 'aliqua magna', title: 'sed do', year: '2026' }),
			row({ key: '14.0', artist: 'aliqua magna', title: 'consectetur', year: '2025' })
		];
		const groups = group(rows, 'artist');
		expect(groups.map((g) => g.key)).toEqual(['a', 'e']);
		expect(groups[0].rows.map((r) => r.title)).toEqual(['consectetur', 'sed do']);
		expect(groups[1].rows.map((r) => r.title)).toEqual(['ut labore', 'magna aliqua']);
	});
});
