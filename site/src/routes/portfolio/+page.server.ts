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

	const widths = [240, 360, 480, 600];
	const targetAspect = 4 / 5;

	const projects = (rawProjects ?? []).map((p: any) => {
		const cover = p?.cover;
		const md = cover?.asset?.metadata;
		const srcAspect: number | null = md?.dimensions?.aspectRatio ?? null;
		const useContain = srcAspect == null ? true : srcAspect >= targetAspect;

		const srcset = cover
			? widths
					.map((w) => {
						const b = urlFor(cover).width(w).auto('format');
						return (
							(useContain ? b : b.height(Math.round(w / targetAspect)).fit('crop')).url() + ` ${w}w`
						);
					})
					.join(', ')
			: undefined;

		const base480 = urlFor(cover).width(480).auto('format');
		const coverUrl = cover
			? (useContain ? base480 : base480.height(Math.round(480 / targetAspect)).fit('crop')).url()
			: undefined;

		return {
			title: p.title,
			client: p.client,
			slug: p.slug,
			categories: p.categories ?? [],
			coverUrl,
			coverSrcSet: srcset,
			coverLqip: md?.lqip ?? null,
			coverAspect: srcAspect,
			coverWidth: 480,
			coverHeight: Math.round(480 / targetAspect)
		};
	});

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
	});

	return { projects, categories: categories ?? [] };
};
