import type { Handle } from '@sveltejs/kit';
import { STORE_OPEN, STORE_PREVIEW_KEY } from '$env/static/private';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isWebstore = path === '/webstore' || path.startsWith('/webstore/');
	const isAnnouncement = path === '/webstore/coming-soon';

	const previewParam = event.url.searchParams.get('preview');
	const hasPreview = previewParam && STORE_PREVIEW_KEY && previewParam === STORE_PREVIEW_KEY;

	if (isWebstore && !isAnnouncement) {
		if (STORE_OPEN !== 'true' && !hasPreview) {
			return Response.redirect(new URL('/webstore/coming-soon', event.url), 307);
		}
	}

	return resolve(event);
};
