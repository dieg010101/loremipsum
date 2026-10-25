import { sanity } from '$lib/server/sanity';
import { statusOf, today } from '$lib/server/exhibitions';
import type { Settings } from '$lib/types';
import type { LayoutServerLoad } from './$types';

const query = `{
	"settings": *[_type == "siteSettings"][0]{ about, email, instagram },
	"exhibitions": *[_type == "exhibition" && defined(slug.current)]
		| order(coalesce(openingDate, "9999") desc){ "slug": slug.current, openingDate, closingDate }
}`;

const FALLBACK: Settings = {
	about:
		'lorem ipsum is a blank slate for discussion and experience, functioning both as a gallery and gathering space.',
	email: 'contact@loremipsumartgroup.com',
	instagram: 'loremipsumartgroup'
};

export const load: LayoutServerLoad = async () => {
	const data = await sanity.fetch<{
		settings: Partial<Settings> | null;
		exhibitions: { slug: string; openingDate?: string; closingDate?: string }[];
	}>(query);

	// the show on view, else the next one announced, else the last one.
	const now = today();
	const on = data.exhibitions.find((e) => statusOf(e, now) === 'current');
	const next = data.exhibitions.findLast((e) => statusOf(e, now) === 'upcoming');
	const last = data.exhibitions.find((e) => statusOf(e, now) === 'past');

	return {
		settings: {
			...FALLBACK,
			...Object.fromEntries(Object.entries(data.settings ?? {}).filter(([, v]) => v))
		},
		featuredExhibition: (on ?? next ?? last)?.slug ?? null
	};
};
