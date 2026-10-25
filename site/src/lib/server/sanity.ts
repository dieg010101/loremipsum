import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN } from '$env/static/private';
import type { Image } from '$lib/types';

const config = {
	projectId: SANITY_PROJECT_ID,
	dataset: SANITY_DATASET,
	apiVersion: '2025-02-19'
};

// published content through the cdn, for page loads.
export const sanity = createClient({ ...config, useCdn: true, perspective: 'published' });

// authenticated, for writing contact messages.
export const sanityWrite = createClient({ ...config, useCdn: false, token: SANITY_TOKEN });

// pages are cached at the edge for 5 minutes and served stale while refreshing.
export const CACHE = {
	'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
};

// groq projection for a captionedImage; pass the result to toImage().
export const IMAGE = `{
	caption,
	alt,
	"image": image{ crop, hotspot, asset->{ _id, metadata{ lqip, dimensions{ width, height } } } }
}`;

export type RawImage = {
	caption?: string | null;
	alt?: string | null;
	image?: {
		crop?: { top: number; bottom: number; left: number; right: number } | null;
		hotspot?: unknown;
		asset?: {
			_id: string;
			metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
		} | null;
	} | null;
};

const builder = imageUrlBuilder({ projectId: config.projectId, dataset: config.dataset });
const WIDTHS = [480, 800, 1200, 1600, 2200];

// cards are cropped to this shape around the editor's hotspot.
export const CARD_ASPECT = 234 / 286;

// aspect: crop to this width / height ratio instead of keeping the whole image.
export function toImage(raw: RawImage | null | undefined, aspect?: number): Image | null {
	const asset = raw?.image?.asset;
	if (!asset?._id || !raw?.image) return null;

	// the size after the editor's crop, so the browser can reserve the right space.
	const dims = asset.metadata?.dimensions ?? { width: 1200, height: 1600 };
	const crop = raw.image.crop;
	let width = Math.round(dims.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0)));
	let height = Math.round(dims.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0)));
	if (aspect) {
		// the largest box of that shape that fits inside the image.
		if (width / height > aspect) width = Math.round(height * aspect);
		else height = Math.round(width / aspect);
	}

	const url = (w: number) => {
		const b = builder.image(raw.image!).width(w).auto('format').quality(82);
		return (aspect ? b.height(Math.round(w / aspect)).fit('crop') : b.fit('max')).url();
	};
	const widths = WIDTHS.filter((w) => w < width).concat(Math.min(width, WIDTHS.at(-1)!));

	return {
		src: url(Math.min(aspect ? 800 : 1200, width)),
		srcset: [...new Set(widths)].map((w) => `${url(w)} ${w}w`).join(', '),
		width,
		height,
		lqip: asset.metadata?.lqip ?? null,
		alt: raw.alt || raw.caption || '',
		caption: raw.caption ?? ''
	};
}

// a fixed-size crop for link previews (1200 x 630).
export function toShareImage(raw: RawImage | null | undefined): string | null {
	if (!raw?.image?.asset?._id) return null;
	return builder.image(raw.image).width(1200).height(630).fit('crop').auto('format').url();
}

export function fileUrl(file: { asset?: { url?: string } | null } | null | undefined) {
	return file?.asset?.url ?? null;
}
