import { redirect } from '@sveltejs/kit';
import { content } from '$lib/server/content';
import { timeline } from '$lib/format';
import type { RequestHandler } from './$types';

// any open exhibition but the one you came from.
export const GET: RequestHandler = async ({ request, setHeaders }) => {
	const source = content();
	const { open } = timeline(await source.exhibitions(), source.now());
	const from = request.headers.get('referer')?.match(/\/exhibitions\/(\d+)/)?.[1];
	const choices = open.filter((e) => String(e.number) !== from);
	const pick = (choices.length ? choices : open)[
		Math.floor(Math.random() * Math.max(1, (choices.length ? choices : open).length))
	];
	setHeaders({ 'cache-control': 'no-store' });
	redirect(302, pick ? `/exhibitions/${pick.number}` : '/exhibitions');
};
