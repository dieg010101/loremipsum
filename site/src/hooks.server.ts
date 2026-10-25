import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// pages from the old studio site.
	if (path === '/portfolio' || path.startsWith('/gallery/')) redirect(301, '/works');

	// the webstore stays closed until STORE_OPEN=true, unless ?preview=<STORE_PREVIEW_KEY>.
	if ((path === '/webstore' || path.startsWith('/webstore/')) && path !== '/webstore/coming-soon') {
		const preview = event.url.searchParams.get('preview');
		const previewing = Boolean(env.STORE_PREVIEW_KEY) && preview === env.STORE_PREVIEW_KEY;
		if (env.STORE_OPEN !== 'true' && !previewing) redirect(307, '/webstore/coming-soon');
	}

	return resolve(event);
};
