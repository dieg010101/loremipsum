import type { PageServerLoad } from './$types';
import { client } from '$lib/sanityClient';
import groq from 'groq';

const query = groq`*[_type == "journalPage"][0]{
  intro,
  substack[]-> { _id, title, url },
  books[]->    { _id, title, url },
  essays[]->   { _id, title, url },
  blogs[]->    { _id, title, url }
}`;

export const load: PageServerLoad = async () => {
	const page = await client.fetch(query);

	return {
		intro: page?.intro ?? null,
		substack: page?.substack ?? [],
		books: page?.books ?? [],
		essays: page?.essays ?? [],
		blogs: page?.blogs ?? []
	};
};
