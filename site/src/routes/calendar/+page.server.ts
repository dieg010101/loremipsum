import { content } from '$lib/server/content';
import { timeline } from '$lib/format';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

// the openings, in your own calendar: subscribe to all of them, or add one.
export const load: PageServerLoad = async ({ setHeaders }) => {
	const source = content();
	const { upcoming } = timeline(await source.exhibitions(), source.now());
	setHeaders(PAGE_CACHE);
	return {
		upcoming: upcoming.map((e) => ({
			number: e.number,
			title: e.title,
			opens: e.opens,
			credit: e.credit ?? (e.artists.length ? e.artists.join(', ') : null)
		})),
		title: 'calendar',
		description:
			'every lorem ipsum opening in your own calendar: subscribe once in apple calendar, google calendar or outlook, and new exhibitions turn up by themselves.'
	};
};
