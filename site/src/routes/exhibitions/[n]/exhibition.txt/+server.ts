import { error } from '@sveltejs/kit';
import { isOpen } from '$lib/format';
import { content } from '$lib/server/content';
import { exhibitionNumber } from '$lib/server/exhibitions';
import { exhibitionText } from '$lib/exhibition';
import { FILE_CACHE } from '$lib/server/cache';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const source = content();
	const e = await source.exhibition(exhibitionNumber(params.n));
	if (!e || !isOpen(e, source.now())) error(404, 'no such exhibition');
	return new Response(exhibitionText(e, url.origin), {
		headers: { 'content-type': 'text/plain; charset=utf-8', ...FILE_CACHE }
	});
};
