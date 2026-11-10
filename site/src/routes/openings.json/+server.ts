import { json } from '@sveltejs/kit';
import { content } from '$lib/server/content';
import { timeline } from '$lib/format';
import type { RequestHandler } from './$types';

// what's open now, for the sheet's script: each hour it sends "it's open" to the
// people who asked on an exhibition's page, once that exhibition is here to see.
// open means the date has come and the works are in (the same test as the site's).
export const GET: RequestHandler = async ({ url }) => {
	const source = content();
	const { open } = timeline(await source.exhibitions(), source.now());
	return json(
		open.slice(0, 6).map((e) => ({
			number: e.number,
			title: e.title,
			opens: e.opens,
			url: `${url.origin}/exhibitions/${e.number}`,
			with: e.credit ?? (e.artists.length ? e.artists.join(', ') : null)
		})),
		{ headers: { 'cache-control': 'public, max-age=60, s-maxage=300' } }
	);
};
