import { client } from '$lib/sanityClient';
import groq from 'groq';
import type { PageServerLoad } from './$types';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(client);
const urlFor = (source: any) => builder.image(source);

const query = groq`{
  "projects": *[_type == "portfolioPost"] | order(date desc){
    title,
    client,
    "slug": slug.current,
    "cover": coverImage{
      asset->{
        url,
        metadata{
          lqip,
          dimensions{width, height, aspectRatio}
        }
      },
      crop,
      hotspot
    },
    "categories": categories[]->{
      title,
      "slug": slug.current
    }
  },
  "categories": *[_type == "category" && count(*[_type == "portfolioPost" && references(^._id)]) > 0]
    | order(title asc){
      title,
      "slug": slug.current
    }
}`;

export const load: PageServerLoad = async ({ setHeaders }) => {
	const { projects: rawProjects, categories } = await client.fetch(query);
	const widths = [240, 360, 480, 600]; // enough for 3-column grid
	const aspect = 5 / 4;

	const projects = (rawProjects ?? []).map((p: any) => {
		const cover = p?.cover;
		const md = cover?.asset?.metadata;

		const srcset = cover
			? widths
					.map(
						(w) =>
							urlFor(cover)
								.width(w)
								.height(Math.round(w * aspect))
								.fit('crop')
								.auto('format')
								.url() + ` ${w}w`
					)
					.join(', ')
			: undefined;

		const coverUrl = cover
			? urlFor(cover)
					.width(480)
					.height(Math.round(480 * aspect))
					.fit('crop')
					.auto('format')
					.url()
			: undefined;

		return {
			title: p.title,
			client: p.client,
			slug: p.slug,
			categories: p.categories ?? [],
			coverUrl,
			coverSrcSet: srcset,
			coverLqip: md?.lqip ?? null,
			coverWidth: 480,
			coverHeight: Math.round(480 * aspect)
		};
	});

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
	});

	return { projects, categories: categories ?? [] };
};
