import { loadPage } from '$lib/server/pages';
import { PAGE_CACHE } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders(PAGE_CACHE);
	return loadPage('privacy');
};
