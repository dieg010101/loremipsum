import { sanity, CACHE } from '$lib/server/sanity';
import type { PageServerLoad } from './$types';

type Item = { _id: string; title: string; url: string };

const query = `*[_type == "journalPage"][0]{
	intro,
	"substack": substack[]->{ _id, title, url },
	"books": books[]->{ _id, title, url },
	"essays": essays[]->{ _id, title, url },
	"blogs": blogs[]->{ _id, title, url }
}`;

export const load: PageServerLoad = async ({ setHeaders }) => {
	const page = await sanity.fetch<{
		intro?: string;
		substack?: Item[];
		books?: Item[];
		essays?: Item[];
		blogs?: Item[];
	} | null>(query);

	const list = (items?: Item[]) => (items ?? []).filter((i) => i?.url);

	setHeaders(CACHE);

	return {
		intro:
			page?.intro ||
			'miscellany of lorem ipsum art group interests and in-house writing projects, including our substack articles.',
		sections: {
			substack: list(page?.substack),
			books: list(page?.books),
			essays: list(page?.essays),
			blogs: list(page?.blogs)
		}
	};
};
