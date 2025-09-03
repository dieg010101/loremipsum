import { client } from '$lib/sanityClient';
import groq from 'groq';
import type { PageServerLoad } from './$types';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(client);
const urlFor = (source: any) => builder.image(source);

const query = groq`{
  "ordered": *[_type == "pinnedOrder"][0].pinnedPosts[]->{
    title,
    "slug": slug.current,
    pinned,
    date,
    client,
    medium,
    dimensions,
    credit,
    description,
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
    }
  },
  "pinned": *[_type == "portfolioPost" && pinned == true]
    | order(date desc){
      title,
      "slug": slug.current,
      pinned,
      date,
      client,
      medium,
      dimensions,
      credit,
      description,
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
      }
    },
  "recent": *[_type == "portfolioPost"]
    | order(date desc)[0...8]{
      title,
      "slug": slug.current,
      pinned,
      date,
      client,
      medium,
      dimensions,
      credit,
      description,
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
      }
    },
  "clients": array::unique(
    *[_type == "portfolioPost" && defined(client)]
      | order(client asc)
      .client
  )
}`;

export const load: PageServerLoad = async ({ setHeaders }) => {
	const data = await client.fetch(query);

	const chosen = (data?.ordered ?? []).length
		? data.ordered
		: (data?.pinned ?? []).length
			? data.pinned
			: (data?.recent ?? []);
	const targetW = 600;
	const targetH = 800;
	const containerAR = targetW / targetH;

	const projects = (chosen ?? []).map((p: any) => {
		const cover = p?.cover;
		const md = cover?.asset?.metadata;
		const srcAspect: number | null = md?.dimensions?.aspectRatio ?? null;
		const useContain = srcAspect == null ? true : srcAspect >= containerAR;

		const url1x = cover
			? useContain
				? urlFor(cover).width(targetW).auto('format').url()
				: urlFor(cover).width(targetW).height(targetH).fit('crop').auto('format').url()
			: undefined;

		const url2x = cover
			? useContain
				? urlFor(cover)
						.width(targetW * 2)
						.auto('format')
						.url()
				: urlFor(cover)
						.width(targetW * 2)
						.height(targetH * 2)
						.fit('crop')
						.auto('format')
						.url()
			: undefined;

		return {
			...p,
			coverUrl: url1x,
			coverSrcSet: url1x && url2x ? `${url1x} 1x, ${url2x} 2x` : undefined,
			coverLqip: md?.lqip ?? null,
			coverWidth: targetW,
			coverHeight: targetH,
			coverAspect: srcAspect
		};
	});

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
	});

	return {
		projects,
		clients: data?.clients ?? []
	};
};
