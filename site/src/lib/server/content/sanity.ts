import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { defineQuery } from 'groq';
import { env } from '$env/dynamic/private';
import type {
	Chapter,
	Exhibition,
	FileLink,
	Image,
	JournalEntry,
	JournalPost,
	Medium,
	Page,
	Paragraph,
	Rich,
	Sale,
	Settings,
	Span,
	StoreInfo,
	Work
} from '$lib/types';
import { fileSize } from '$lib/format';
import { instagramUrl } from '$lib/instagram';
import type { ContentSource } from './source';
import { bookEntries, signBook, takeDownBook } from '../backend';

const API_VERSION = '2025-02-19';

let clients: { read: SanityClient } | null = null;

// the site only reads sanity: published content, through the cdn, with no token.
// what visitors send goes to the sheet (see backend.ts).
function sanity() {
	clients ??= {
		read: createClient({
			projectId: env.SANITY_PROJECT_ID,
			dataset: env.SANITY_DATASET || 'production',
			apiVersion: API_VERSION,
			useCdn: true,
			perspective: 'published'
		})
	};
	return clients;
}

// ---------------------------------------------------------------- projections

const FILE = `{ "url": asset->url, "bytes": asset->size, pages }`;

const IMAGE = `{
	alt,
	"asset": asset->{
		_id, url, size, originalFilename,
		"width": metadata.dimensions.width,
		"height": metadata.dimensions.height,
		"color": metadata.palette.dominant.background
	},
	crop, hotspot
}`;

const WORK = `{
	_id,
	_createdAt,
	title,
	year,
	medium,
	lines,
	note,
	sale,
	checkoutUrl,
	"artist": artist->{ name, "slug": slug.current },
	"image": image${IMAGE},
	text{ paragraphs[]{ text, note }, excerpt, "pdf": pdf${FILE}, original },
	sound{ "src": file.asset->url, duration, sides, transcript, "download": file${FILE} },
	video{
		"src": file.asset->url, duration, loop,
		"tracks": tracks[]{ lang, label, "src": file.asset->url },
		"download": file${FILE}
	},
	pdf{ "file": file${FILE}, "cover": cover${IMAGE} },
	website{ url, source, note, needsComputer },
	record{ added, sha256, photograph, provenance, rights },
	"store": select(store.inStore == true => store{
		"slug": slug.current, category, size, edition, about, "added": coalesce(added, ^._createdAt)
	})
}`;

const SUMMARY = `{
	number, title, opens, newFor, credit,
	"artists": chapters[].artist->name
}`;

const EXHIBITIONS_QUERY = defineQuery(
	`*[_type == "exhibition" && defined(number) && defined(opens)] | order(opens desc) ${SUMMARY}`
);

const EXHIBITION_QUERY = defineQuery(`*[_type == "exhibition" && number == $number][0]{
	number, title, opens, newFor, withLines, organisedBy, languages, text, signature,
	summary, announcedWith, _updatedAt,
	"chapters": chapters[]{
		"artist": artist->{
			name, "slug": slug.current, bio, website, instagram, about
		},
		"works": works[]->${WORK}
	},
	"files": {
		"pdf": files.pdf${FILE},
		"zip": files.zip${FILE},
		"pressRelease": files.pressRelease${FILE},
		"list": files.list${FILE}
	},
	colophon
}`);

const WORKS_QUERY = defineQuery(`*[_type == "exhibition" && defined(number) && opens <= now()]
	| order(opens desc){
		number, title,
		"chapters": chapters[]{ "works": works[]->${WORK} }
	}`);

const STORE_QUERY =
	defineQuery(`*[_type == "work" && store.inStore == true && defined(store.slug.current)]
	| order(coalesce(store.added, _createdAt) desc){
		...${WORK},
		"in": *[_type == "exhibition" && references(^._id)] | order(opens asc)[0]{ number, title }
	}`);

const STORE_ITEM_QUERY =
	defineQuery(`*[_type == "work" && store.inStore == true && store.slug.current == $slug][0]{
	...${WORK},
	"in": *[_type == "exhibition" && references(^._id)] | order(opens asc)[0]{ number, title }
}`);

const JOURNAL_QUERY =
	defineQuery(`*[_type == "journalEntry" && defined(slug.current)] | order(date desc){
	"slug": slug.current, date, title, "kind": select(kind == "substack" => "press", kind), author,
	"href": coalesce(href, file.asset->url)
}`);

const JOURNAL_POST_QUERY = defineQuery(`*[_type == "journalEntry" && slug.current == $slug][0]{
	"slug": slug.current, date, title, "kind": select(kind == "substack" => "press", kind), author,
	"href": coalesce(href, file.asset->url),
	byline, paragraphs[]{ text, note }
}`);

const PAGE_QUERY = defineQuery(
	`*[_id == $id][0]{ intro, sections[]{ heading, body }, _updatedAt }`
);

const SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]`);

const UPDATED_QUERY = defineQuery(
	`*[_type in ["exhibition", "work", "artist", "journalEntry", "aboutPage", "privacyPage", "siteSettings"]] | order(_updatedAt desc)[0]._updatedAt`
);

// ------------------------------------------------------------------- mapping

type Block = {
	_type: string;
	children?: { _type: string; text?: string; marks?: string[] }[];
	markDefs?: { _key: string; _type: string; href?: string }[];
};

/** portable text paragraphs to rich text, one per block. */
export function toParagraphs(blocks: Block[] | null | undefined): Rich[] {
	return (blocks ?? [])
		.filter((b) => b._type === 'block')
		.map((block) =>
			(block.children ?? []).map((child): Span => {
				const marks = child.marks ?? [];
				const link = block.markDefs?.find((d) => marks.includes(d._key) && d._type === 'link');
				return {
					text: child.text ?? '',
					...(marks.includes('em') ? { em: true } : {}),
					...(marks.includes('strong') ? { strong: true } : {}),
					...(link?.href ? { href: link.href } : {})
				};
			})
		);
}

/** a short rich field: its blocks, joined by line breaks. */
export function toRich(blocks: Block[] | null | undefined): Rich {
	const paragraphs = toParagraphs(blocks);
	return paragraphs.flatMap((p, i) => (i ? [{ text: '\n' }, ...p] : p));
}

const WIDTHS = [480, 800, 1200, 1600, 2400, 3200, 4000];

type RawImage = {
	alt?: string;
	asset?: {
		_id: string;
		url: string;
		size?: number;
		originalFilename?: string;
		width: number;
		height: number;
		color?: string;
	};
	crop?: unknown;
	hotspot?: unknown;
} | null;

function toImage(raw: RawImage | undefined, alt: string): Image | null {
	if (!raw?.asset) return null;
	const builder = imageUrlBuilder(sanity().read);
	const { width, height } = raw.asset;
	const url = (w: number, q = 82) =>
		builder
			.image(raw as never)
			.width(w)
			.fit('max')
			.auto('format')
			.quality(q)
			.url();
	const widths = WIDTHS.filter((w) => w < width).concat(width);
	return {
		src: url(Math.min(1200, width)),
		srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
		// full size: every pixel there is, at high quality.
		full: url(width, 92),
		fullSrcset: widths.map((w) => `${url(w, 92)} ${w}w`).join(', '),
		width,
		height,
		color: raw.asset.color ?? '#eeeeee',
		alt: raw.alt || alt,
		size: fileSize(raw.asset.size)
	};
}

function toFile(
	raw: { url?: string; bytes?: number; pages?: number } | null | undefined
): FileLink | null {
	if (!raw?.url) return null;
	return { url: raw.url, bytes: raw.bytes ?? null, pages: raw.pages ?? null };
}

type RawSale = {
	kind?: Sale['kind'];
	amount?: number;
	edition?: string;
	per?: string;
	label?: string;
	until?: string;
} | null;

function toSale(raw: RawSale): Sale {
	switch (raw?.kind) {
		case 'available':
			return { kind: 'available', amount: raw.amount ?? 0, edition: raw.edition, per: raw.per };
		case 'onRequest':
			return { kind: 'onRequest', edition: raw.edition };
		case 'free':
			return { kind: 'free', label: raw.label };
		case 'sold':
			return { kind: 'sold' };
		case 'reserved':
			return { kind: 'reserved', until: raw.until ?? new Date().toISOString() };
		default:
			return { kind: 'notForSale' };
	}
}

const paragraphs = (raw: { text: Block[]; note?: Block[] }[] | null | undefined): Paragraph[] =>
	(raw ?? []).map((p) => ({ text: toRich(p.text), note: p.note?.length ? toRich(p.note) : null }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawWork = any;

function toWork(
	raw: RawWork,
	where: { exhibition: { number: number; title: string } | null; index: number; number: string }
): Work {
	const title: string = raw.title ?? '';
	const artist = raw.artist ?? { name: '', slug: '' };
	const image = toImage(raw.image, `${title}, by ${artist.name}`);
	const record = raw.record ?? {};
	const text = raw.text?.paragraphs?.length
		? {
				paragraphs: paragraphs(raw.text.paragraphs),
				excerpt: raw.text.excerpt ?? 3,
				moreWords: null,
				pdf: toFile(raw.text.pdf),
				original: raw.text.original?.href ? raw.text.original : null
			}
		: null;
	return {
		...where,
		artist,
		title,
		year: raw.year ?? '',
		medium: (raw.medium ?? 'image') as Medium,
		lines: raw.lines ?? [],
		note: raw.note?.length ? toRich(raw.note) : null,
		sale: toSale(raw.sale),
		checkoutUrl: raw.checkoutUrl ?? null,
		image,
		text,
		sound: raw.sound?.src
			? {
					src: raw.sound.src,
					duration: raw.sound.duration ?? 0,
					sides: raw.sound.sides ?? null,
					transcript: raw.sound.transcript?.length ? toParagraphs(raw.sound.transcript) : null,
					download: toFile(raw.sound.download)
				}
			: null,
		video: raw.video?.src
			? {
					src: raw.video.src,
					duration: raw.video.duration ?? 0,
					loop: raw.video.loop ?? false,
					tracks: (raw.video.tracks ?? []).filter((t: { src?: string }) => t.src),
					download: toFile(raw.video.download)
				}
			: null,
		pdf: raw.pdf?.file?.url
			? {
					file: toFile(raw.pdf.file)!,
					cover: toImage(raw.pdf.cover, `the cover of ${title}`),
					title
				}
			: null,
		website: raw.website?.url
			? {
					url: raw.website.url,
					source: raw.website.source ?? null,
					note: raw.website.note ?? null,
					needsComputer: raw.website.needsComputer ?? false
				}
			: null,
		record: {
			added: record.added ?? raw._createdAt,
			file: raw.image?.asset
				? {
						name: raw.image.asset.originalFilename ?? `${title}.jpg`,
						width: raw.image.asset.width,
						height: raw.image.asset.height,
						bytes: raw.image.asset.size ?? 0
					}
				: null,
			sha256: record.sha256 ? String(record.sha256).replace(/\s+/g, '').toLowerCase() : null,
			photograph: record.photograph ?? null,
			provenance:
				record.provenance ??
				(where.exhibition
					? `the artist; lorem ipsum art group, exhibition ${where.exhibition.number}`
					: 'the artist; lorem ipsum art group'),
			rights: record.rights ?? 'the artist keeps every right. you may look as long as you like.'
		},
		store: raw.store
			? ({
					slug: raw.store.slug,
					category: raw.store.category ?? 'other',
					size: raw.store.size ?? null,
					edition: raw.store.edition ?? null,
					about: raw.store.about?.length ? toParagraphs(raw.store.about) : null,
					added: raw.store.added ?? record.added ?? raw._createdAt
				} satisfies StoreInfo)
			: null
	};
}

/** numbers each work: 1.1, 1.2, 2.1 … and 1, 2, 3 … for its address. */
function toChapters(
	raw: { artist?: RawWork; works?: RawWork[] }[] | null | undefined,
	exhibition: { number: number; title: string }
): Chapter[] {
	let index = 0;
	return (raw ?? [])
		.filter((c) => c.artist)
		.map((c, i) => ({
			number: i + 1,
			artist: {
				name: c.artist.name,
				slug: c.artist.slug,
				bio: c.artist.bio?.length ? toRich(c.artist.bio) : null,
				about: c.artist.about?.length ? toRich(c.artist.about) : null,
				website: c.artist.website ?? null,
				instagram: instagramUrl(c.artist.instagram)
			},
			works: (c.works ?? [])
				.filter(Boolean)
				.map((w, j) => toWork(w, { exhibition, index: ++index, number: `${i + 1}.${j + 1}` }))
		}));
}

const textOr = (value: unknown, fallback: string) =>
	typeof value === 'string' && value.trim() ? value : fallback;

// ------------------------------------------------------------------- source

export const sanitySource: ContentSource = {
	now: () => new Date(),

	async settings(): Promise<Settings> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const s: any = (await sanity().read.fetch(SETTINGS_QUERY)) ?? {};
		return {
			email: textOr(s.email, 'hello@loremipsum.art'),
			instagram: textOr(s.instagram, 'loremipsumartgroup'),
			description: textOr(
				s.description,
				'an online gallery for work in any medium. no rooms, no opening hours, no address. every exhibition stays open.'
			),
			shortDescription: textOr(
				s.shortDescription,
				'an online gallery for work in any medium. every exhibition stays open.'
			),
			moneySplit: toParagraphs(s.moneySplit),
			shipping: toParagraphs(s.shipping),
			shipsFrom: textOr(s.shipsFrom, ''),
			storeIntro: textOr(s.storeIntro, ''),
			journalIntro: textOr(s.journalIntro, ''),
			contactAside: toParagraphs(s.contactAside)
		};
	},

	async updated() {
		const latest = await sanity().read.fetch<string | null>(UPDATED_QUERY);
		return latest ?? new Date().toISOString();
	},

	async exhibitions() {
		const rows = await sanity().read.fetch(EXHIBITIONS_QUERY);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return rows.map((e: any) => ({
			number: e.number,
			title: e.title ?? '',
			opens: e.opens,
			newFor: e.newFor ?? 30,
			artists: (e.artists ?? []).filter(Boolean),
			credit: e.credit ?? null
		}));
	},

	async exhibition(number) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const e: any = await sanity().read.fetch(EXHIBITION_QUERY, { number });
		if (!e) return null;
		const ref = { number: e.number, title: e.title ?? '' };
		const colophon = e.colophon ?? {};
		const result: Exhibition = {
			...ref,
			opens: e.opens,
			newFor: e.newFor ?? 30,
			status: new Date(e.opens) <= new Date() ? 'open' : 'announced',
			withLines: e.withLines ?? '',
			organisedBy: toRich(e.organisedBy),
			languages: toRich(e.languages),
			text: toParagraphs(e.text),
			signature: e.signature ?? null,
			summary: e.summary ?? '',
			announcedWith: e.announcedWith ?? null,
			chapters: toChapters(e.chapters, ref),
			files: {
				pdf: toFile(e.files?.pdf),
				zip: toFile(e.files?.zip),
				zipBytes: e.files?.zip?.bytes ?? null,
				pressRelease: toFile(e.files?.pressRelease),
				list: toFile(e.files?.list)
			},
			colophon: {
				translations: colophon.translations ?? null,
				images: colophon.images ?? null,
				thanks: colophon.thanks ?? null,
				press: colophon.press?.length ? toRich(colophon.press) : null
			},
			updated: e._updatedAt
		};
		return result;
	},

	async works() {
		const rows = await sanity().read.fetch(WORKS_QUERY);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return rows.flatMap((e: any) =>
			toChapters(e.chapters, { number: e.number, title: e.title }).flatMap((c) => c.works)
		);
	},

	async store() {
		const rows = await sanity().read.fetch(STORE_QUERY);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return rows.map((w: any) => toWork(w, { exhibition: w.in ?? null, index: 0, number: '' }));
	},

	async storeItem(slug) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const w: any = await sanity().read.fetch(STORE_ITEM_QUERY, { slug });
		return w ? toWork(w, { exhibition: w.in ?? null, index: 0, number: '' }) : null;
	},

	async journal(): Promise<JournalEntry[]> {
		return sanity().read.fetch(JOURNAL_QUERY);
	},

	async journalPost(slug): Promise<JournalPost | null> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const j: any = await sanity().read.fetch(JOURNAL_POST_QUERY, { slug });
		if (!j || j.href) return null;
		return {
			slug: j.slug,
			date: j.date,
			title: j.title,
			kind: j.kind,
			author: j.author ?? null,
			href: null,
			byline: toRich(j.byline),
			paragraphs: paragraphs(j.paragraphs)
		};
	},

	async page(name): Promise<Page | null> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const p: any = await sanity().read.fetch(PAGE_QUERY, { id: `${name}Page` });
		if (!p) return null;
		return {
			intro: toRich(p.intro),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			sections: (p.sections ?? []).map((s: any) => ({
				heading: s.heading ?? '',
				body: toParagraphs(s.body)
			})),
			updated: p._updatedAt
		};
	},

	book: (number) => bookEntries(number),

	sign: signBook,

	takeDown: takeDownBook
};
