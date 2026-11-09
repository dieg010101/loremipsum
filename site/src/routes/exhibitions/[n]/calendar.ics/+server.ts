import { error } from '@sveltejs/kit';
import { content } from '$lib/server/content';
import { exhibitionNumber } from '$lib/server/exhibitions';
import { calendar } from '$lib/server/ics';
import { FILE_CACHE } from '$lib/server/cache';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const source = content();
	const e = await source.exhibition(exhibitionNumber(params.n));
	if (!e) error(404, 'no such exhibition');
	const link = `${url.origin}/exhibitions/${e.number}`;
	const body = calendar(
		[
			{
				number: e.number,
				title: e.title,
				opens: e.opens,
				url: link,
				updated: e.updated,
				description: `${e.announcedWith ? `with ${e.announcedWith.replace(/\s*\n\s*/g, ' ').replace(/\.?$/, '.')} ` : ''}online, at ${link}. it stays open.`
			}
		],
		source.now(),
		{ name: `lorem ipsum ${e.number}` }
	);
	return new Response(body, {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="lorem-ipsum-${e.number}.ics"`,
			...FILE_CACHE
		}
	});
};
