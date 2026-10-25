import { sanity, CACHE, IMAGE, toImage, toShareImage, type RawImage } from '$lib/server/sanity';
import {
	formatDates,
	formatLocation,
	statusOf,
	today,
	type Dated,
	type Located
} from '$lib/server/exhibitions';
import { workLine } from '$lib/server/works';
import type { Image } from '$lib/types';
import type { PageServerLoad } from './$types';

type RawExhibition = Dated &
	Located & {
		slug: string;
		title: string;
		year: number;
		hours?: string;
		inviteUrl?: string;
		images: RawImage[] | null;
		works:
			| { slug: string; artist: string; title: string; year: number; image: RawImage | null }[]
			| null;
	};

const query = `*[_type == "exhibition" && defined(slug.current)]
	| order(coalesce(openingDate, "9999") desc){
		"slug": slug.current,
		title,
		year,
		openingDate,
		closingDate,
		datesNote,
		venue,
		address,
		city,
		hours,
		inviteUrl,
		"images": images[]${IMAGE},
		"works": works[]->{ "slug": slug.current, "artist": artist->name, title, year, "image": images[0]${IMAGE} }
	}`;

// each carousel slide says what it shows and links to it.
export type Slide = { image: Image; text: string; href: string };

export const load: PageServerLoad = async ({ setHeaders }) => {
	const all = await sanity.fetch<RawExhibition[]>(query);
	const now = today();

	const on = all.find((e) => statusOf(e, now) === 'current');
	const next = all.findLast((e) => statusOf(e, now) === 'upcoming');
	const last = all.find((e) => statusOf(e, now) === 'past');
	// between shows, the last one leads, marked closed.
	const show = on ?? next ?? last ?? null;
	const between = !on && !next;

	let slides: Slide[] = [];
	if (show) {
		const href = `/exhibitions/${show.slug}`;
		const workSlides = between
			? []
			: (show.works ?? []).flatMap((w) => {
					const image = toImage(w.image);
					return image ? [{ image, text: workLine(w), href: `/works/${w.slug}` }] : [];
				});
		slides = workSlides.length
			? workSlides
			: (show.images ?? []).flatMap((raw) => {
					const image = toImage(raw);
					return image
						? [{ image, text: image.caption || `${show.title} (${show.year})`, href }]
						: [];
				});
	}

	setHeaders(CACHE);

	return {
		between,
		slides,
		shareImage: toShareImage(show?.images?.[0]),
		show: show && {
			slug: show.slug,
			title: `${show.title} (${show.year})`,
			dates: formatDates(show),
			location: formatLocation(show),
			// hours and invite are only useful while you can still go.
			hours: between ? null : (show.hours ?? null),
			inviteUrl: between ? null : (show.inviteUrl ?? null)
		}
	};
};
