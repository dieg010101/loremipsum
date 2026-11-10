import { error, redirect } from '@sveltejs/kit';
import { isOpen } from '$lib/format';
import { content } from '$lib/server/content';
import { exhibitionNumber } from '$lib/server/exhibitions';
import type { PageServerLoad } from './$types';

const PER_PAGE = 10;

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const number = exhibitionNumber(params.n);
	const source = content();
	const exhibition = await source.exhibition(number);
	if (!exhibition || !isOpen(exhibition, source.now())) error(404, 'no such exhibition');

	const raw = url.searchParams.get('page');
	const pageNumber = raw === null ? 1 : Number(raw);
	if (!Number.isInteger(pageNumber) || pageNumber < 1) redirect(302, url.pathname);

	const entries = await source.book(number);
	const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
	if (pageNumber > pages) redirect(302, pages > 1 ? `${url.pathname}?page=${pages}` : url.pathname);

	// the book changes when an entry goes up: cache briefly.
	setHeaders({ 'cache-control': 'public, max-age=30, s-maxage=60' });
	return {
		exhibition: { number, title: exhibition.title },
		entries: entries.slice((pageNumber - 1) * PER_PAGE, pageNumber * PER_PAGE),
		total: entries.length,
		page: pageNumber,
		pages,
		title: `visitors’ book, ${exhibition.title}`,
		description: `the visitors’ book for exhibition ${number}, ${exhibition.title}.`,
		updated: entries[0]?.date ?? exhibition.updated
	};
};
