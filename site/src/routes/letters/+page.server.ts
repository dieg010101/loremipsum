import { content } from '$lib/server/content';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const source = content();
	const [entries, settings] = await Promise.all([source.journal(), source.settings()]);
	setHeaders(PAGE_CACHE);
	return {
		entries,
		intro: settings.journalIntro,
		title: 'letters',
		description:
			settings.journalIntro ||
			'letters from lorem ipsum to everyone who follows it, and what has been written about us.'
	};
};
