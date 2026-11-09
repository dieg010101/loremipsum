import { content } from '$lib/server/content';
import { formatDate, timeline } from '$lib/format';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const source = content();
	const now = source.now();
	const { current, next, earlier } = timeline(await source.exhibitions(), now);
	const showing = current ? await source.exhibition(current.number) : null;

	setHeaders(PAGE_CACHE);
	return {
		onView: showing
			? {
					number: showing.number,
					title: showing.title,
					summary: showing.summary,
					artists: showing.chapters.map((c) => ({ name: c.artist.name, number: c.number }))
				}
			: null,
		next: next
			? { number: next.number, title: next.title, opens: formatDate(next.opens, false) }
			: null,
		earlier: earlier.slice(0, 2).map((e) => ({ number: e.number, title: e.title }))
	};
};
