import { redirect, type Handle } from '@sveltejs/kit';
import { isLanguage } from '$lib/languages';
import { readPreview, STUDIO_ORIGINS } from '$lib/server/preview';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	// the short address printed in citations: loremipsum.art/e/14 and /e/14/2.
	const short = pathname.match(/^\/e\/(\d+)(\/\d+)?\/?$/);
	if (short) redirect(301, `/exhibitions/${short[1]}${short[2] ?? ''}${search}`);

	// addresses from the old sites.
	if (pathname === '/works' || pathname.startsWith('/works/') || pathname === '/portfolio')
		redirect(301, '/index');
	if (pathname.startsWith('/gallery/')) redirect(301, '/index');
	if (pathname.startsWith('/webstore/coming-soon')) redirect(301, '/webstore');
	// the journal became letters.
	if (pathname === '/journal' || pathname.startsWith('/journal/'))
		redirect(301, `/letters${pathname.slice('/journal'.length)}${search}`);

	const asked = event.url.searchParams.get('lang');
	const lang = isLanguage(asked) ? asked : 'en';
	event.locals.lang = lang;
	event.locals.preview = await readPreview(event.cookies);

	// only languages with translations count (see TRANSLATED), so <html lang> always
	// names the language the words are actually in.
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});

	// a quiet, strict baseline for every response.
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
	if (event.locals.preview) {
		// drafts: never kept anywhere, and shown only inside the studio's preview tab.
		response.headers.set('cache-control', 'private, no-store');
		const csp = response.headers.get('content-security-policy');
		if (csp)
			response.headers.set(
				'content-security-policy',
				csp
					.replace(/frame-ancestors [^;]*/, `frame-ancestors 'self' ${STUDIO_ORIGINS.join(' ')}`)
					// the preview page listens to sanity for changes (see PreviewBar).
					.replace(/connect-src ([^;]*)/, `connect-src $1 https://*.api.sanity.io`)
			);
	} else if (!response.headers.has('x-frame-options') && !pathname.startsWith('/demo/'))
		response.headers.set('x-frame-options', 'SAMEORIGIN');

	return response;
};
