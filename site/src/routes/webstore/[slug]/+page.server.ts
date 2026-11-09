import { error } from '@sveltejs/kit';
import { content } from '$lib/server/content';
import { PAGE_CACHE } from '$lib/server/cache';
import { workHref } from '$lib/work';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const source = content();
	const [work, settings, works] = await Promise.all([
		source.storeItem(params.slug),
		source.settings(),
		source.works()
	]);
	if (!work) error(404, 'not in the webstore');

	const more = works
		.filter((w) => w.artist.slug === work.artist.slug && w.title !== work.title)
		.slice(0, 3)
		.map((w) => ({ title: w.title, href: workHref(w) }));

	setHeaders(PAGE_CACHE);
	return {
		work,
		more,
		shipsFrom: settings.shipsFrom,
		moneySplit: settings.moneySplit,
		shipping: settings.shipping,
		title: `${work.title}, ${work.artist.name}`,
		description: `${work.artist.name}, ${work.title}, ${work.year}. ${[work.store?.size, work.store?.edition].filter(Boolean).join(', ')}.`,
		image: work.image?.src
	};
};
