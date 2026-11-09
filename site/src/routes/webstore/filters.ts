import type { Work } from '$lib/types';

export const SHOW = [
	{ key: null, label: 'everything', short: 'everything' },
	{ key: 'painting', label: 'paintings', short: 'paintings' },
	{ key: 'print', label: 'prints and editions', short: 'prints' },
	{ key: 'book', label: 'books and tapes', short: 'books' },
	{ key: 'under-1000', label: 'under $1,000', short: null }
] as const;

export const SORT = ['newest', 'price', 'artist'] as const;
export type Show = (typeof SHOW)[number]['key'];
export type Sort = (typeof SORT)[number];
export type Filters = { show: Show; sort: Sort };

export function readFilters(params: URLSearchParams): Filters {
	const show = params.get('show');
	const sort = params.get('sort');
	return {
		show: (SHOW.find((s) => s.key === show)?.key ?? null) as Show,
		sort: SORT.includes(sort as Sort) ? (sort as Sort) : 'newest'
	};
}

export function filterHref(current: Filters, change: Partial<Filters>) {
	const next = { ...current, ...change };
	const params = new URLSearchParams();
	if (next.show) params.set('show', next.show);
	if (next.sort !== 'newest') params.set('sort', next.sort);
	const query = params.toString();
	return query ? `/webstore?${query}` : '/webstore';
}

const amount = (w: Work) => (w.sale.kind === 'available' ? w.sale.amount : Infinity);
const collator = new Intl.Collator('en', { sensitivity: 'base' });

export function apply(items: Work[], f: Filters) {
	const shown = items.filter((w) => {
		if (!f.show) return true;
		if (f.show === 'under-1000') return amount(w) < 1000;
		return w.store?.category === f.show;
	});
	if (f.sort === 'price') return [...shown].sort((a, b) => amount(a) - amount(b));
	if (f.sort === 'artist')
		return [...shown].sort(
			(a, b) => collator.compare(a.artist.name, b.artist.name) || collator.compare(a.title, b.title)
		);
	return shown; // newest first, as the store comes.
}
