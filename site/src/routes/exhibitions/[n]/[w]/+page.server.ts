import { error, redirect } from '@sveltejs/kit';
import { content } from '$lib/server/content';
import { exhibitionNumber } from '$lib/server/exhibitions';
import { PAGE_CACHE } from '$lib/server/cache';
import { worksOf } from '$lib/exhibition';
import { plain } from '$lib/rich';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const number = exhibitionNumber(params.n);
	if (!/^\d{1,3}$/.test(params.w)) error(404, 'no such work');
	const index = Number(params.w);
	if (String(index) !== params.w) redirect(301, `/exhibitions/${number}/${index}`);

	const source = content();
	const exhibition = await source.exhibition(number);
	if (!exhibition || new Date(exhibition.opens) > source.now()) error(404, 'no such work');

	const works = worksOf(exhibition);
	const at = works.findIndex((w) => w.index === index);
	if (at < 0) error(404, 'no such work');
	const work = works[at];
	const chapter = exhibition.chapters.find((c) => c.works.includes(work))!;

	setHeaders(PAGE_CACHE);
	return {
		exhibition: { number: exhibition.number, title: exhibition.title },
		work,
		images: works.filter((w) => w.medium === 'image' && w.image),
		previous: works[at - 1]
			? { index: works[at - 1].index, number: works[at - 1].number, title: works[at - 1].title }
			: null,
		next: works[at + 1]
			? { index: works[at + 1].index, number: works[at + 1].number, title: works[at + 1].title }
			: null,
		artist: chapter.artist.name,
		title: `${work.title}, ${work.artist.name}`,
		description: work.note
			? plain(work.note)
			: `${work.number}, ${work.title}, ${work.year}. ${work.lines.join(', ')}.`,
		image: work.image?.src,
		updated: exhibition.updated
	};
};
