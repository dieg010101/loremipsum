import { client } from '$lib/sanityClient';
import groq from 'groq';
import type { PageServerLoad } from './$types';

const query = groq`{
  "projects": *[_type == "portfolioPost"] | order(date desc){
    title,
    "slug": slug.current,
    date,
    client,
    medium,
    dimensions,
    credit,
    description,
    "coverUrl": coverImage.asset->url,
    gallery[]{
      "src": image.asset->url,
      caption
    }
  },
  "clients": array::unique(
    *[_type == "portfolioPost" && defined(client)]
      | order(client asc)
      .client
  )
}`;

export const load: PageServerLoad = async () => {
	return await client.fetch(query);
};
