import type { Exhibition, JournalPost, Work } from './types';

/**
 * what search engines read about a page (schema.org, as json-ld): who we are, what
 * an exhibition is and when, what a work is and who made it, what's for sale.
 * addresses are made whole with the site's own origin.
 */
type Thing = Record<string, unknown>;

const NAME = 'lorem ipsum art group';

export const gallery = (origin: string, description?: string, sameAs: string[] = []): Thing => ({
	'@type': 'Organization',
	name: NAME,
	url: `${origin}/`,
	logo: `${origin}/web-app-manifest-512x512.png`,
	...(description ? { description } : {}),
	...(sameAs.length ? { sameAs } : {})
});

export const whole = (origin: string, address: string | null | undefined) =>
	address ? new URL(address, origin).href : undefined;

export function website(origin: string, description: string, sameAs: string[]): Thing {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{ '@type': 'WebSite', name: NAME, url: `${origin}/`, description },
			gallery(origin, description, sameAs)
		]
	};
}

export function exhibitionEvent(origin: string, e: Exhibition, image?: string): Thing {
	const url = `${origin}/exhibitions/${e.number}`;
	return {
		'@context': 'https://schema.org',
		'@type': 'ExhibitionEvent',
		name: e.title,
		url,
		startDate: e.opens,
		eventStatus: 'https://schema.org/EventScheduled',
		eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
		location: { '@type': 'VirtualLocation', url },
		isAccessibleForFree: true,
		organizer: gallery(origin),
		...(e.summary ? { description: e.summary } : {}),
		...(image ? { image: whole(origin, image) } : {}),
		...(e.chapters.length
			? { performer: e.chapters.map((c) => ({ '@type': 'Person', name: c.artist.name })) }
			: {})
	};
}

const KIND: Record<Work['medium'], string> = {
	image: 'VisualArtwork',
	video: 'VideoObject',
	sound: 'AudioObject',
	text: 'CreativeWork',
	pdf: 'Book',
	website: 'WebSite'
};

/** a work, wherever it is shown; `url` is the page it's on. */
export function artwork(origin: string, work: Work, url: string): Thing {
	const image = whole(origin, work.image?.src);
	const thing: Thing = {
		'@context': 'https://schema.org',
		'@type': KIND[work.medium],
		name: work.title,
		url,
		creator: { '@type': 'Person', name: work.artist.name },
		dateCreated: work.year,
		...(image ? { image } : {}),
		...(work.lines[0] ? { artMedium: work.lines[0] } : {}),
		...(work.exhibition
			? {
					isPartOf: {
						'@type': 'ExhibitionEvent',
						name: work.exhibition.title,
						url: `${origin}/exhibitions/${work.exhibition.number}`
					}
				}
			: {})
	};
	// sound and video: where the file is and how long it runs.
	const media = work.video ?? work.sound;
	if (media) {
		thing.contentUrl = whole(origin, media.src);
		if (media.duration > 0) thing.duration = isoDuration(media.duration);
		thing.uploadDate = work.record.added;
		if (work.medium === 'video') {
			thing.thumbnailUrl = image;
			thing.description = `${work.title}, ${work.artist.name}, ${work.year}`;
		}
	}
	return thing;
}

/** a webstore piece: the work, plus its price when it has one. */
export function product(origin: string, work: Work, url: string): Thing {
	const sale = work.sale;
	const availability =
		sale.kind === 'available'
			? 'InStock'
			: sale.kind === 'sold'
				? 'SoldOut'
				: sale.kind === 'reserved'
					? 'OutOfStock'
					: null;
	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: `${work.title}, ${work.artist.name}`,
		url,
		brand: { '@type': 'Brand', name: work.artist.name },
		...(work.image ? { image: whole(origin, work.image.src) } : {}),
		description: [work.lines[0], work.store?.size, work.store?.edition].filter(Boolean).join(', '),
		...(sale.kind === 'available'
			? {
					offers: {
						'@type': 'Offer',
						url,
						price: sale.amount,
						priceCurrency: 'USD',
						availability: `https://schema.org/${availability}`,
						seller: gallery(origin)
					}
				}
			: availability
				? {
						offers: {
							'@type': 'Offer',
							url,
							availability: `https://schema.org/${availability}`,
							seller: gallery(origin)
						}
					}
				: {})
	};
}

export function article(origin: string, post: JournalPost, description: string): Thing {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: post.title,
		url: `${origin}/letters/${post.slug}`,
		datePublished: post.date,
		description,
		author: post.author ? { '@type': 'Person', name: post.author } : gallery(origin),
		publisher: gallery(origin)
	};
}

/** 723 → "PT12M3S". */
export function isoDuration(seconds: number) {
	const s = Math.round(seconds);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s % 60 || !(h || m) ? `${s % 60}S` : ''}`;
}

/** json-ld for a <script> tag: nothing in it can close the tag early. */
export const jsonld = (thing: Thing) =>
	`<script type="application/ld+json">${JSON.stringify(thing).replace(/</g, '\\u003c')}</script>`;
