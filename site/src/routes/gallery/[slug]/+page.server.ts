import { client } from '$lib/sanityClient';
import groq from 'groq';
import type { PageServerLoad } from './$types';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(client);
const urlFor = (source: any) => builder.image(source);

/*
 * For future reference, do not forget to add the crop and hotspot fields to the GROQ query.
 */
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
      asset->{
        _id,
        metadata{
          lqip,
          dimensions { width, height, aspectRatio }
        }
      },
      crop,
      hotspot
    },
    caption,
    imageType
  }
}`;

const forcedAspectFor = (
	variant?: 'default' | 'websiteDesktop' | 'websiteMobile'
): number | undefined => {
	if (variant === 'websiteDesktop') return 16 / 9;
	if (variant === 'default') return 3 / 4;
	return undefined;
};

const widthsFor = (variant?: 'default' | 'websiteDesktop' | 'websiteMobile'): number[] => {
	if (variant === 'websiteDesktop') return [800, 1100, 1500, 1920];
	if (variant === 'websiteMobile') return [360, 480, 720, 1080];
	return [480, 720, 960, 1200];
};

function effectiveAspectFromCrop(imageField: any): number | null {
	const md = imageField?.asset?.metadata;
	const baseAR = md?.dimensions?.aspectRatio;
	if (!baseAR) return null;
	const crop = imageField?.crop || {};
	const wFactor = 1 - ((crop.left ?? 0) + (crop.right ?? 0));
	const hFactor = 1 - ((crop.top ?? 0) + (crop.bottom ?? 0));
	if (wFactor <= 0 || hFactor <= 0) return baseAR;
	return (baseAR * wFactor) / hFactor;
}

function buildImg(imageField: any, variant: 'default' | 'websiteDesktop' | 'websiteMobile') {
	const widths = widthsFor(variant);
	const lqip = imageField?.asset?.metadata?.lqip ?? null;
	const forcedAR = forcedAspectFor(variant);

	if (variant === 'websiteMobile') {
		const effAR = effectiveAspectFromCrop(imageField) || 9 / 16;
		const baseW = widths[Math.min(1, widths.length - 1)];
		const baseH = Math.round(baseW / effAR);

		const src = urlFor(imageField).width(baseW).auto('format').quality(82).url();
		const srcset = widths
			.map((w) => urlFor(imageField).width(w).auto('format').quality(82).url() + ` ${w}w`)
			.join(', ');

		return { src, srcset, w: baseW, h: baseH, lqip };
	}

	const aspect = forcedAR ?? effectiveAspectFromCrop(imageField) ?? 1;
	const baseW = widths[Math.min(1, widths.length - 1)];
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

	return { src, srcset, w: baseW, h: baseH, lqip };
}

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const raw = await client.fetch(query, { slug: params.slug });

	if (!raw) {
		return { status: 404 };
	}

	const gallery = (raw.gallery ?? []).map((g: any) => {
		const variant = g.imageType ?? 'default';
		const built = buildImg(g.image, variant as 'default' | 'websiteDesktop' | 'websiteMobile');
		return {
			src: built.src,
			srcset: built.srcset,
			w: built.w,
			h: built.h,
			lqip: built.lqip,
			caption: g.caption ?? '',
			imageType: g.imageType as 'default' | 'websiteDesktop' | 'websiteMobile' | undefined
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
