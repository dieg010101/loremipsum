import { content } from '$lib/server/content';
import { formatDate, timeline } from '$lib/format';
import { PAGE_CACHE } from '$lib/server/cache';
import { website } from '$lib/seo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders, url }) => {
	const source = content();
	const now = source.now();
	const { current, next, earlier } = timeline(await source.exhibitions(), now);
	const [showing, settings, statement] = await Promise.all([
		current ? source.exhibition(current.number) : null,
		source.settings(),
		source.home()
	]);
	const image = showing?.chapters.flatMap((c) => c.works).find((w) => w.image)?.image?.src;

	setHeaders(PAGE_CACHE);
	return {
		// written in sanity ("Home"): when it's there, it's all the page says.
		statement,
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
		earlier: earlier.slice(0, 2).map((e) => ({ number: e.number, title: e.title })),
		image,
		schema: website(
			url.origin,
			settings.description,
			settings.instagram
				? [new URL(settings.instagram.replace(/^@/, ''), 'https://instagram.com/').href]
				: []
		)
	};
};
