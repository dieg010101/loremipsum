import { error } from '@sveltejs/kit';
import {
	sanity,
	CACHE,
	IMAGE,
	fileUrl,
	toImage,
	toShareImage,
	type RawImage
} from '$lib/server/sanity';
import {
	directionsUrl,
	formatDates,
	formatLocation,
	statusOf,
	today,
	type Dated,
	type Located
} from '$lib/server/exhibitions';
import type { Image } from '$lib/types';
import type { PageServerLoad } from './$types';

type File = { asset?: { url?: string } | null } | null;

type Raw = Dated &
	Located & {
		slug: string;
		title: string;
		year: number;
		hours?: string;
		inviteUrl?: string;
		concept?: string;
		images: RawImage[] | null;
		works: { slug: string; artist: string; title: string; year: number }[] | null;
		worksNote?: string;
		programs:
			| { when: string; what: string; recordingUrl?: string; recordingLabel?: string }[]
			| null;
		pressRelease: File;
		pressKit: File;
		coverage: { publication: string; title: string; url: string }[] | null;
		photoCredit?: string;
		photoArchive: File;
		later: (Dated & { slug: string; title: string; year: number })[];
	};

const FILE = `{ asset->{ url } }`;

const query = `*[_type == "exhibition" && slug.current == $slug][0]{
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
	concept,
	"images": images[]${IMAGE},
	"works": works[]->{ "slug": slug.current, "artist": artist->name, title, year },
	worksNote,
	programs,
	"pressRelease": pressRelease${FILE},
	"pressKit": pressKit${FILE},
	coverage,
	photoCredit,
	"photoArchive": photoArchive${FILE},
	"later": *[_type == "exhibition" && _id != ^._id && defined(slug.current)
		&& (!defined(openingDate) || openingDate > coalesce(^.closingDate, ^.openingDate, "0"))]
		| order(coalesce(openingDate, "9999") asc){ "slug": slug.current, title, year, openingDate, closingDate }
}`;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const e = await sanity.fetch<Raw | null>(query, { slug: params.slug });
	if (!e) error(404, 'not found');

	const now = today();
	const status = statusOf(e, now);
	const past = status === 'past';
	// after closing, the next show (if announced) is linked from the archive.
	const next = past ? e.later.find((l) => statusOf(l, now) !== 'past') : undefined;

	setHeaders(CACHE);

	return {
		exhibition: {
			slug: e.slug,
			title: `${e.title} (${e.year})`,
			status,
			dates: past ? `${formatDates(e)}. this exhibition has closed.` : formatDates(e),
			location: formatLocation(e),
			// visiting details go once the show has closed.
			hours: past ? null : (e.hours ?? null),
			inviteUrl: past ? null : (e.inviteUrl ?? null),
			calendar:
				!past && e.openingDate && e.closingDate ? `/exhibitions/${e.slug}/calendar.ics` : null,
			directions: past ? null : directionsUrl(e),
			concept: (e.concept ?? '').split(/\n\s*\n/).filter(Boolean),
			images: (e.images ?? []).map((i) => toImage(i)).filter((i): i is Image => !!i),
			works: (e.works ?? [])
				.filter((w) => w?.slug)
				.map((w) => ({ slug: w.slug, text: `${w.artist} — ${w.title} (${w.year})` })),
			worksNote: e.worksNote ?? 'works will be announced soon.',
			programs: (e.programs ?? []).map((p) => ({
				text: `${p.when} · ${p.what}`,
				recordingUrl: p.recordingUrl ?? null,
				recordingLabel: p.recordingLabel ?? 'recording'
			})),
			pressRelease: fileUrl(e.pressRelease),
			pressKit: fileUrl(e.pressKit),
			coverage: e.coverage ?? [],
			photoCredit: e.photoCredit ?? null,
			photoArchive: fileUrl(e.photoArchive),
			next: next ? { slug: next.slug, title: `${next.title} (${next.year})` } : null
		},
		shareImage: toShareImage(e.images?.[0])
	};
};
