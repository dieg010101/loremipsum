import type { Medium } from '$lib/types';

export type Row = {
	key: string;
	artist: string;
	title: string;
	year: string;
	medium: Medium;
	exhibition: number | null;
	sale: string;
	forSale: boolean;
	href: string;
};

export const SHOW = [
	['everything', null],
	['images', 'image'],
	['video', 'video'],
	['sound', 'sound'],
	['texts', 'text'],
	['websites', 'website']
] as const;

export const SORT = ['artist', 'title', 'year', 'exhibition'] as const;
export type Sort = (typeof SORT)[number];

export type Filters = { show: Medium | null; forSale: boolean; sort: Sort; q: string };

const MEDIA = new Set<string>(['image', 'video', 'sound', 'text', 'website', 'pdf']);

export function readFilters(params: URLSearchParams): Filters {
	const show = params.get('show');
	const sort = params.get('sort');
	return {
		show: show && MEDIA.has(show) ? (show as Medium) : null,
		forSale: params.get('forSale') === '1',
		sort: SORT.includes(sort as Sort) ? (sort as Sort) : 'artist',
		q: (params.get('q') ?? '').trim()
	};
}

/** the address for a change of filters; defaults are left out. */
export function filterHref(current: Filters, change: Partial<Filters>) {
	const next = { ...current, ...change };
	const params = new URLSearchParams();
	if (next.show) params.set('show', next.show);
	if (next.forSale) params.set('forSale', '1');
	if (next.sort !== 'artist') params.set('sort', next.sort);
	if (next.q) params.set('q', next.q);
	const query = params.toString();
	return query ? `/index?${query}` : '/index';
}

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function matches(row: Row, f: Filters) {
	if (f.show && row.medium !== f.show && !(f.show === 'text' && row.medium === 'pdf')) return false;
	if (f.forSale && !row.forSale) return false;
	if (f.q) {
		const q = fold(f.q);
		if (!fold(`${row.artist} ${row.title}`).includes(q)) return false;
	}
	return true;
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** sorted rows, in groups: a letter, a year or an exhibition. */
export function group(rows: Row[], sort: Sort) {
	const keyOf = (r: Row): string => {
		switch (sort) {
			case 'artist':
				return fold(r.artist).charAt(0) || '#';
			case 'title':
				return fold(r.title).charAt(0) || '#';
			case 'year':
				return r.year.slice(0, 4);
			case 'exhibition':
				return r.exhibition === null ? 'webstore' : String(r.exhibition);
		}
	};
	const compare = (a: Row, b: Row) => {
		switch (sort) {
			case 'artist':
				// one artist's works in the order they were made, then as catalogued.
				return (
					collator.compare(a.artist, b.artist) ||
					collator.compare(a.year, b.year) ||
					collator.compare(a.key, b.key)
				);
			case 'title':
				return collator.compare(a.title, b.title);
			case 'year':
				return collator.compare(b.year, a.year) || collator.compare(a.artist, b.artist);
			case 'exhibition':
				return (b.exhibition ?? -1) - (a.exhibition ?? -1) || collator.compare(a.key, b.key);
		}
	};
	const groups: { key: string; rows: Row[] }[] = [];
	for (const row of [...rows].sort(compare)) {
		const key = keyOf(row);
		const last = groups.at(-1);
		if (last?.key === key) last.rows.push(row);
		else groups.push({ key, rows: [row] });
	}
	return groups;
}
