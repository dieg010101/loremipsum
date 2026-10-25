import { sanity, CACHE } from '$lib/server/sanity';
import { WORK_CARD, toWorkCard, type RawWorkCard } from '$lib/server/works';
import { statusOf, today } from '$lib/server/exhibitions';
import type { PageServerLoad } from './$types';

type RawExhibition = {
	slug: string;
	title: string;
	year: number;
	openingDate?: string;
	closingDate?: string;
	worksNote?: string;
	works: RawWorkCard[] | null;
};

// works are listed through their exhibitions, in the order set there, newest show first.
const query = `*[_type == "exhibition" && defined(slug.current)]
	| order(coalesce(openingDate, "9999") desc){
		"slug": slug.current,
		title,
		year,
		openingDate,
		closingDate,
		worksNote,
		"works": works[]->${WORK_CARD}
	}`;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const exhibitions = await sanity.fetch<RawExhibition[]>(query);
	const selected = url.searchParams.get('exhibition');

	const seen = new Set<string>();
	const works = exhibitions
		.filter((e) => !selected || e.slug === selected)
		.flatMap((e) => e.works ?? [])
		// a work shown twice appears once.
		.filter((w) => w?.slug && !seen.has(w.slug) && seen.add(w.slug))
		.map(toWorkCard);

	// before the first reveal, the upcoming show says when works go up.
	const now = today();
	const upcoming = exhibitions.findLast((e) => statusOf(e, now) !== 'past');

	setHeaders(CACHE);

	return {
		works,
		selected,
		// only shows with works to show are worth filtering by.
		exhibitions: exhibitions
			.filter((e) => e.works?.length)
			.map((e) => ({ slug: e.slug, title: `${e.title} (${e.year})` })),
		emptyNote: upcoming?.worksNote ?? null
	};
};
