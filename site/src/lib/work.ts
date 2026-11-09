import type { Work } from './types';

/** a work's own address: /exhibitions/14/2, or its webstore page. */
export function workHref(work: Work) {
	if (work.exhibition) return `/exhibitions/${work.exhibition.number}/${work.index}`;
	return work.store ? `/webstore/${work.store.slug}` : '/index';
}

/** where it sits in its exhibition: /exhibitions/14#work-2. */
export function inExhibitionHref(work: Work) {
	return work.exhibition
		? `/exhibitions/${work.exhibition.number}#work-${work.index}`
		: workHref(work);
}

/** "14.2" for works in an exhibition, "store/slug" for webstore pieces. */
export function workKey(work: Work) {
	if (work.exhibition) return `${work.exhibition.number}.${work.index}`;
	return `store/${work.store?.slug ?? ''}`;
}

export function askHref(work: Work) {
	return `/contact?work=${encodeURIComponent(workKey(work))}`;
}

/** straight to checkout when there is one, otherwise a message saying you'd like it. */
export function buyHref(work: Work) {
	return work.checkoutUrl ?? `/contact?work=${encodeURIComponent(workKey(work))}&buy=1`;
}

export function recordHref(work: Work) {
	return `${workHref(work)}#record`;
}

/** the kind of thing it is, for the contents and the index. */
export const MEDIUM_NAME: Record<Work['medium'], string> = {
	image: 'image',
	text: 'text',
	sound: 'sound',
	video: 'video',
	pdf: 'pdf',
	website: 'website'
};
