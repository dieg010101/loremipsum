import { content } from '$lib/server/content';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const source = content();
	const [items, settings] = await Promise.all([source.store(), source.settings()]);
	setHeaders(PAGE_CACHE);
	return {
		items,
		intro: settings.storeIntro,
		title: 'webstore',
		description:
			settings.storeIntro || 'work for sale from the exhibitions, and editions made for the store.'
	};
};
