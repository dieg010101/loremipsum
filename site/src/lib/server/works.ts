import type { WorkCard } from '$lib/types';
import { CARD_ASPECT, IMAGE, toImage, type RawImage } from './sanity';

export const WORK_CARD = `{
	"slug": slug.current,
	"artist": artist->name,
	title,
	year,
	"image": images[0]${IMAGE}
}`;

export type RawWorkCard = Omit<WorkCard, 'image'> & { image: RawImage | null };

export function toWorkCard(raw: RawWorkCard): WorkCard {
	return { ...raw, image: toImage(raw.image, CARD_ASPECT) };
}

// "nia calloway, sovereign static (2023)"
export function workLine(w: { artist: string; title: string; year: number }) {
	return `${w.artist}, ${w.title} (${w.year})`;
}
