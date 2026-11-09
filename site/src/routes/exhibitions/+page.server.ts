import { content } from '$lib/server/content';
import { timeline, yearOf } from '$lib/format';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const source = content();
	const now = source.now();
	const { open, upcoming, current } = timeline(await source.exhibitions(), now);

	// open ones, newest first, grouped by the year they opened.
	const years: { year: number; exhibitions: typeof open }[] = [];
	for (const e of open) {
		const year = yearOf(e.opens);
		const group = years.at(-1);
		if (group?.year === year) group.exhibitions.push(e);
		else years.push({ year, exhibitions: [e] });
	}

	setHeaders(PAGE_CACHE);
	return {
		next: upcoming[0] ?? null,
		years,
		count: open.length,
		current: current?.number ?? null,
		title: 'exhibitions',
		description: 'every exhibition lorem ipsum has made. every one is still open.'
	};
};
