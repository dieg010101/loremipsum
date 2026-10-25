import { error } from '@sveltejs/kit';
import { sanity, CACHE, IMAGE, toImage, toShareImage, type RawImage } from '$lib/server/sanity';
import { formatDates, statusOf, type Dated } from '$lib/server/exhibitions';
import { workLine } from '$lib/server/works';
import type { Image } from '$lib/types';
import type { PageServerLoad } from './$types';

type Raw = {
	_id: string;
	slug: string;
	artist: string;
	title: string;
	year: number;
	images: RawImage[] | null;
	medium?: string;
	dimensions?: string;
	credit?: string;
	availability?: string;
	description?: string;
	exhibition:
		| (Dated & {
				slug: string;
				title: string;
				year: number;
				works: { slug: string; artist: string; title: string }[] | null;
		  })
		| null;
};

const query = `*[_type == "work" && slug.current == $slug][0]{
	_id,
	"slug": slug.current,
	"artist": artist->name,
	title,
	year,
	"images": images[]${IMAGE},
	medium,
	dimensions,
	credit,
	availability,
	description,
	"exhibition": *[_type == "exhibition" && references(^._id)]
		| order(coalesce(openingDate, "9999") desc)[0]{
			"slug": slug.current,
			title,
			year,
			openingDate,
			closingDate,
			datesNote,
			"works": works[]->{ "slug": slug.current, "artist": artist->name, title }
		}
}`;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const work = await sanity.fetch<Raw | null>(query, { slug: params.slug });
	if (!work) error(404, 'not found');

	const show = work.exhibition;
	// previous / next walk through the show in the order set on the exhibition.
	const siblings = (show?.works ?? []).filter((w) => w?.slug);
	const at = siblings.findIndex((w) => w.slug === work.slug);
	const sibling = (i: number) =>
		at >= 0 && siblings[i]
			? { slug: siblings[i].slug, text: `${siblings[i].artist}, ${siblings[i].title}` }
			: null;

	setHeaders(CACHE);

	return {
		work: {
			slug: work.slug,
			artist: work.artist,
			title: work.title,
			year: work.year,
			line: workLine(work),
			images: (work.images ?? []).map((i) => toImage(i)).filter((i): i is Image => !!i),
			medium: work.medium ?? null,
			dimensions: work.dimensions ?? null,
			credit: work.credit ?? null,
			availability: work.availability ?? 'available',
			description: work.description ?? null
		},
		show: show && {
			slug: show.slug,
			title: `${show.title} (${show.year})`,
			past: statusOf(show) === 'past',
			dates: formatDates(show)
		},
		previous: sibling(at - 1),
		next: sibling(at + 1),
		shareImage: toShareImage(work.images?.[0])
	};
};
