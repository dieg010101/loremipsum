import { client } from '$lib/sanityClient';
import groq from 'groq';
import type { PageServerLoad } from './$types';

const query = groq`*[_type == "portfolioPost"] | order(date desc){
  title,
  client,
  "slug": slug.current,
  "coverUrl": coverImage.asset->url
}`;

export const load: PageServerLoad = async () => {
	const projects = await client.fetch(query);
	return { projects };
};
