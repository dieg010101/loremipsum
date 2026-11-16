import { redirect, type Handle } from '@sveltejs/kit';
import { isLanguage } from '$lib/languages';
import { readPreview, STUDIO_ORIGINS } from '$lib/server/preview';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	const short = pathname.match(/^\/e\/(\d+)(\/\d+)?\/?$/);
	if (short) redirect(301, `/exhibitions/${short[1]}${short[2] ?? ''}${search}`);

	if (pathname === '/works' || pathname.startsWith('/works/') || pathname === '/portfolio')
		redirect(301, '/index');
	if (pathname.startsWith('/gallery/')) redirect(301, '/index');
	if (pathname.startsWith('/webstore/coming-soon')) redirect(301, '/webstore');
	if (pathname === '/journal' || pathname.startsWith('/journal/'))
		redirect(301, `/letters${pathname.slice('/journal'.length)}${search}`);

	const asked = event.url.searchParams.get('lang');
	const lang = isLanguage(asked) ? asked : 'en';
	event.locals.lang = lang;
	event.locals.preview = await readPreview(event.cookies);

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});

	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
	if (event.locals.preview) {
		response.headers.set('cache-control', 'private, no-store');
		const csp = response.headers.get('content-security-policy');
		if (csp)
			response.headers.set(
				'content-security-policy',
				csp
					.replace(/frame-ancestors [^;]*/, `frame-ancestors 'self' ${STUDIO_ORIGINS.join(' ')}`)
					.replace(/connect-src ([^;]*)/, `connect-src $1 https://*.api.sanity.io`)
			);
	} else if (!response.headers.has('x-frame-options') && !pathname.startsWith('/demo/'))
		response.headers.set('x-frame-options', 'SAMEORIGIN');

	return response;
};
