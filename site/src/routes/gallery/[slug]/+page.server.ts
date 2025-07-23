import { client } from '$lib/sanityClient';
import groq from 'groq';
import type { PageServerLoad } from './$types';

const query = groq`*[_type == "portfolioPost" && slug.current == $slug][0]{
  title,
  client,
  date,
  medium,
  dimensions,
  credit,
  description,
  gallery[]{
    "src": image.asset->url,
    caption
  }
}`;

export const load: PageServerLoad = async ({ params }) => {
	const project = await client.fetch(query, { slug: params.slug });
	if (!project) {
		return { status: 404 };
	}
	return { project };
};
