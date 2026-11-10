import { content } from '$lib/server/content';
import { saleText } from '$lib/format';
import { PAGE_CACHE } from '$lib/server/cache';
import { workHref } from '$lib/work';
import type { PageServerLoad } from './$types';

// every work as one line of text. filtering and sorting happen in the page, from
// the address, so changing them never waits on the server.
export const load: PageServerLoad = async ({ setHeaders }) => {
	const works = await content().works();
	setHeaders(PAGE_CACHE);
	return {
		rows: works.map((w) => ({
			key: `${w.exhibition?.number ?? 's'}.${w.index}`,
			artist: w.artist.name,
			title: w.title,
			year: w.year,
			medium: w.medium,
			exhibition: w.exhibition?.number ?? null,
			sale: saleText(w.sale, w.medium),
			forSale: w.sale.kind === 'available' || w.sale.kind === 'onRequest',
			href: workHref(w)
		})),
		artists: new Set(works.map((w) => w.artist.name)).size,
		title: 'index',
		description:
			'every work in every lorem ipsum exhibition, as text: artist, title, year, medium and whether it’s for sale.'
	};
};
