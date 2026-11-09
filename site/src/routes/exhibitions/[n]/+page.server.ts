import { content } from '$lib/server/content';
import { loadExhibition } from '$lib/server/exhibitions';
import { bookActions } from '$lib/server/book';
import { PAGE_CACHE } from '$lib/server/cache';
import type { Actions, PageServerLoad } from './$types';

const PREVIEW = 6;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const data = await loadExhibition(params.n);
	const { exhibition } = data;
	const book = exhibition.status === 'open' ? await content().book(exhibition.number) : [];
	setHeaders(PAGE_CACHE);
	const firstImage = exhibition.chapters.flatMap((c) => c.works).find((w) => w.image)?.image;
	return {
		...data,
		book: book.slice(0, PREVIEW),
		bookTotal: book.length,
		title: exhibition.title,
		description:
			exhibition.status === 'open'
				? `online exhibition ${exhibition.number}, lorem ipsum art group. ${exhibition.withLines.replace(/\n/g, ' ')}`
				: `online exhibition ${exhibition.number}, lorem ipsum art group, opens soon.`,
		image: firstImage?.src,
		updated: exhibition.updated
	};
};

export const actions: Actions = bookActions;
