import { error } from '@sveltejs/kit';
import { htmlToText } from '$lib/server/plain';
import { FILE_CACHE } from '$lib/server/cache';
import type { RequestHandler } from './$types';

// the plain text version of any page: /plain/exhibitions/14.
export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const path = `/${params.path ?? ''}`;
	if (path.startsWith('/plain')) error(404, 'no such page');
	const res = await fetch(path + url.search, { headers: { accept: 'text/html' } });
	if (!res.ok || !res.headers.get('content-type')?.includes('text/html'))
		error(404, 'no such page');
	const text = htmlToText(await res.text(), url.origin);
	return new Response(`${url.origin}${path}\n\n${text}`, {
		headers: { 'content-type': 'text/plain; charset=utf-8', ...FILE_CACHE }
	});
};
