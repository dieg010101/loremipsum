import { client } from '$lib/sanityClient';
import groq from 'groq';
import type { PageServerLoad } from './$types';
import imageUrlBuilder from '@sanity/image-url';
import { error } from '@sveltejs/kit';

const builder = imageUrlBuilder(client);
const urlFor = (source: any) => builder.image(source);

const query = groq`*[_type == "portfolioPost" && slug.current == $slug][0]{
  title,
  client,
  date,
  medium,
  dimensions,
  credit,
  description,
  isWebsite,
  gallery[]{
    image{
      asset,
      crop,
      hotspot,
      "assetMeta": asset->{
        _id,
        metadata{
          lqip,
          dimensions { width, height, aspectRatio }
        }
      }
    },
    caption,
    imageType
  }
}`;

type Variant = 'default' | 'websiteDesktop' | 'websiteMobile';

const widthsFor = (variant?: Variant): number[] => {
	if (variant === 'websiteDesktop') return [800, 1100, 1500, 1920];
	if (variant === 'websiteMobile') return [360, 480, 720, 1080];
	return [720, 960, 1200, 1600];
};

function effectiveAspectFromCrop(imageField: any): number | null {
	const md = imageField?.assetMeta?.metadata;
	const baseAR = md?.dimensions?.aspectRatio;
	if (!baseAR) return null;

	const crop = imageField?.crop || {};
	const wFactor = 1 - ((crop.left ?? 0) + (crop.right ?? 0));
	const hFactor = 1 - ((crop.top ?? 0) + (crop.bottom ?? 0));
	if (wFactor <= 0 || hFactor <= 0) return baseAR;
	return (baseAR * wFactor) / hFactor;
}

function buildImg(imageField: any, variant: Variant) {
	const widths = widthsFor(variant);
	const lqip = imageField?.assetMeta?.metadata?.lqip ?? null;
	if (variant === 'default' || variant === 'websiteMobile') {
		const baseW = widths[1] ?? widths[0];
		const src = urlFor(imageField).width(baseW).auto('format').quality(82).url();
		const srcset = widths
			.map((w) => urlFor(imageField).width(w).auto('format').quality(82).url() + ` ${w}w`)
			.join(', ');
		const effAR = effectiveAspectFromCrop(imageField);
		const h = effAR ? Math.round(baseW / effAR) : undefined;

		return { src, srcset, w: baseW, h, lqip, aspect: effAR ?? null };
	}
	if (variant === 'websiteDesktop') {
		const aspect = 16 / 9;
		const baseW = widths[1] ?? widths[0];
		const baseH = Math.round(baseW / aspect);

		const src = urlFor(imageField)
			.width(baseW)
			.height(baseH)
			.fit('crop')
			.auto('format')
			.quality(82)
			.url();

		const srcset = widths
			.map(
				(w) =>
					urlFor(imageField)
						.width(w)
						.height(Math.round(w / aspect))
						.fit('crop')
						.auto('format')
						.quality(82)
						.url() + ` ${w}w`
			)
			.join(', ');

		return { src, srcset, w: baseW, h: baseH, lqip, aspect };
	}
	return { src: '', srcset: '', w: undefined, h: undefined, lqip, aspect: null };
}

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const raw = await client.fetch(query, { slug: params.slug });
	if (!raw) throw error(404, 'Project not found');

	const gallery = (raw.gallery ?? []).map((g: any) => {
		const variant: Variant = (g.imageType ?? 'default') as Variant;
		const built = buildImg(g.image, variant);
		return {
			src: built.src,
			srcset: built.srcset,
			w: built.w,
			h: built.h,
			lqip: built.lqip,
			aspect: built.aspect as number | null,
			caption: g.caption ?? '',
			imageType: variant
		};
	});

	const project = {
		title: raw.title,
		client: raw.client,
		date: raw.date,
		medium: raw.medium,
		dimensions: raw.dimensions,
		credit: raw.credit,
		description: raw.description,
		isWebsite: Boolean(raw.isWebsite),
		gallery
	};

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
	});

	return { project };
};
