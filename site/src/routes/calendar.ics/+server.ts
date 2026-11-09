import { content } from '$lib/server/content';
import { calendar } from '$lib/server/ics';
import { FILE_CACHE } from '$lib/server/cache';
import type { RequestHandler } from './$types';

// every opening, past and announced: subscribe once and new ones turn up.
export const GET: RequestHandler = async ({ url }) => {
	const source = content();
	const all = await source.exhibitions();
	const body = calendar(
		all.map((e) => ({
			number: e.number,
			title: e.title,
			opens: e.opens,
			url: `${url.origin}/exhibitions/${e.number}`,
			description: `with ${e.credit ?? e.artists.join(', ')}. online, at ${url.origin}/exhibitions/${e.number}. it stays open.`
		})),
		source.now(),
		{
			name: 'lorem ipsum',
			description: 'every opening at lorem ipsum, an online gallery. new ones appear here.'
		}
	);
	return new Response(body, {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			// opened in a browser it downloads; a calendar app subscribing reads it either way.
			'content-disposition': 'inline; filename="lorem-ipsum.ics"',
			...FILE_CACHE
		}
	});
};
