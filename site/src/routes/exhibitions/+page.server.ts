import { sanity, CACHE } from '$lib/server/sanity';
import {
	EXHIBITION_CARD,
	toExhibitionCard,
	today,
	type RawExhibitionCard
} from '$lib/server/exhibitions';
import type { Status } from '$lib/types';
import type { PageServerLoad } from './$types';

const query = `*[_type == "exhibition" && defined(slug.current)]
	| order(coalesce(openingDate, "9999") desc)${EXHIBITION_CARD}`;

const STATUSES: Status[] = ['current', 'upcoming', 'past'];

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const now = today();
	const all = (await sanity.fetch<RawExhibitionCard[]>(query)).map((e) => toExhibitionCard(e, now));
	const param = url.searchParams.get('status') as Status | null;
	const status = param && STATUSES.includes(param) ? param : null;

	setHeaders(CACHE);

	return {
		status,
		exhibitions: status ? all.filter((e) => e.status === status) : all,
		// with nothing on or announced, a placeholder card keeps the page open-ended.
		nothingAhead: !all.some((e) => e.status !== 'past')
	};
};
