// the demo content: every word and image of the v3 figma, as data. the site runs on
// it while DEMO_CONTENT=true, so it can be built and checked before the real
// exhibitions are in sanity. the images are placeholders and must never go live.

import { rich } from '$lib/rich';
import type {
	BookEntry,
	Chapter,
	Exhibition,
	Image,
	JournalEntry,
	JournalPost,
	Medium,
	Page,
	Paragraph,
	Sale,
	Settings,
	StoreInfo,
	Work
} from '$lib/types';
import { IMAGES } from './images';

/** the demo's clock: the figma was drawn on 6 november 2026, day 6 of 30. */
export const DEMO_NOW = '2026-11-06T12:00:00+01:00';
export const UPDATED = '2026-11-06T09:00:00+01:00';

function image(name: keyof typeof IMAGES, alt: string): Image {
	const i = IMAGES[name];
	const src = `/demo/${name}.jpg`;
	return {
		src,
		srcset: `${src} ${i.width}w`,
		full: src,
		fullSrcset: `${src} ${i.width}w`,
		width: i.width,
		height: i.height,
		color: i.color,
		alt,
		size: i.label
	};
}

const p = (text: string, note?: string): Paragraph => ({
	text: rich(text),
	note: note ? rich(note) : null
});

const RIGHTS = 'the artist keeps every right. you may look as long as you like.';

type WorkInput = Partial<Work> & {
	title: string;
	year: string;
	medium: Medium;
	lines: string[];
	sale: Sale;
};

/** a chapter: one artist and their works, numbered 1.1, 1.2 … */
function chapter(
	exhibition: { number: number; title: string },
	artist: Chapter['artist'],
	works: WorkInput[],
	start: { chapter: number; index: number }
): Chapter {
	return {
		number: start.chapter,
		artist,
		works: works.map((w, i) => ({
			index: start.index + i,
			number: `${start.chapter}.${i + 1}`,
			exhibition,
			artist: { name: artist.name, slug: artist.slug },
			note: null,
			checkoutUrl: null,
			image: null,
			text: null,
			sound: null,
			video: null,
			pdf: null,
			website: null,
			store: null,
			...w,
			record: {
				added: '2026-11-01T10:00:00+01:00',
				file: null,
				sha256: null,
				photograph: null,
				provenance: `the artist; lorem ipsum art group, exhibition ${exhibition.number}`,
				rights: RIGHTS,
				...w.record
			}
		}))
	};
}

/** builds the chapters of one exhibition, numbering works as it goes. */
function chapters(
	exhibition: { number: number; title: string },
	list: [Chapter['artist'], WorkInput[]][]
): Chapter[] {
	let index = 1;
	return list.map(([artist, works], i) => {
		const c = chapter(exhibition, artist, works, { chapter: i + 1, index });
		index += works.length;
		return c;
	});
}

function artist(
	name: string,
	bio: string | null = null,
	about: string | null = null
): Chapter['artist'] {
	const slug = name.replace(/\s+/g, '-');
	return {
		name,
		slug,
		bio: bio ? rich(bio) : null,
		about: about ? rich(about) : null,
		website: bio ? `https://example.com/${slug}` : null,
		instagram: bio ? `https://instagram.com/${slug.replace(/-/g, '')}` : null
	};
}

function store(slug: string, s: Partial<StoreInfo> = {}): StoreInfo {
	return {
		slug,
		category: 'painting',
		size: null,
		edition: null,
		about: [
			rich(
				'adipiscing elit sed do eiusmod tempor, incididunt ut labore et dolore. magna aliqua ut enim ad minim, veniam quis nostrud exercitation ullamco. laboris nisi ut aliquip ex ea, commodo consequat duis aute irure. dolor in reprehenderit in voluptate velit, esse cillum dolore eu fugiat.'
			)
		],
		added: '2026-11-01T10:00:00+01:00',
		...s
	};
}

// ---------------------------------------------------------------- exhibition 14

const E14 = { number: 14, title: 'thinking for way too long' };

const ESSAY: Paragraph[] = [
	p(
		'lorem ipsum dolor sit amet consectetur, adipiscing elit sed do eiusmod. tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse.',
		'¹ lorem ipsum dolor sit amet consectetur, adipiscing elit sed do.'
	),
	p(
		'magna aliqua ut enim ad minim, veniam quis nostrud exercitation ullamco. laboris nisi ut aliquip ex ea, commodo consequat duis aute irure. dolor in reprehenderit in voluptate velit, esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia.',
		'² ut aliquip ex ea commodo consequat, duis aute irure dolor.'
	),
	p(
		'commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse cillum dolore eu fugiat nulla, pariatur excepteur sint occaecat cupidatat. non proident sunt in culpa qui officia deserunt mollit anim id est. laborum lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.'
	),
	// the rest of the essay, on the work's own page.
	...Array.from({ length: 16 }, (_, i) =>
		p(
			[
				'excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia. deserunt mollit anim id est laborum, lorem ipsum dolor sit amet. consectetur adipiscing elit sed do eiusmod, tempor incididunt ut labore et dolore. magna aliqua ut enim ad minim, veniam quis nostrud exercitation ullamco. laboris nisi ut aliquip ex ea, commodo consequat duis aute irure.',
				'dolor in reprehenderit in voluptate velit, esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia deserunt mollit anim id est laborum lorem ipsum dolor. sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. et dolore magna aliqua ut enim ad minim veniam quis nostrud.',
				'ut labore et dolore magna aliqua, ut enim ad minim veniam. quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo. consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum. dolore eu fugiat nulla pariatur excepteur, sint occaecat cupidatat non proident. sunt in culpa qui officia deserunt, mollit anim id est laborum.'
			][i % 3],
			i === 4
				? '³ tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim.'
				: undefined
		)
	)
];

const E14_CHAPTERS = chapters(E14, [
	[
		artist(
			'aliqua magna',
			'lorem ipsum dolor sit amet consectetur, adipiscing elit sed do eiusmod. tempor incididunt ut.',
			'lorem ipsum dolor sit amet consectetur, adipiscing elit sed do eiusmod. tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco.'
		),
		[
			{
				title: 'consectetur adipiscing',
				year: '2025',
				medium: 'image',
				lines: ['acrylic and silkscreen ink on linen', '101.6 × 101.6 cm'],
				sale: { kind: 'notForSale' },
				image: image(
					'shotmarilyns',
					'four square portraits of the same face, each in different colours.'
				),
				note: rich(
					'elit sed do eiusmod tempor incididunt, ut labore et dolore magna. aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. nisi ut.'
				),
				record: {
					added: '2026-11-01T10:00:00+01:00',
					file: { name: 'consectetur-adipiscing.jpg', width: 4000, height: 4000, bytes: 6_100_000 },
					sha256: '8c21e0f4a97b3d5512c6e08af93b7d40c1e2f5a6b7c8d9e0f1a2b3c4d5e6f708',
					photograph: 'sunt culpa, lorem, october 2026',
					provenance: 'the artist; lorem ipsum art group, exhibition 14',
					rights: RIGHTS
				}
			},
			{
				title: 'sed do eiusmod',
				year: '2026',
				medium: 'image',
				lines: ['acrylic and silkscreen ink on linen', '82 × 82 cm'],
				sale: { kind: 'available', amount: 4800 },
				image: image('flowers', 'four flowers, flat and bright, on a dark green ground.'),
				note: rich(
					'labore et dolore magna aliqua ut enim ad minim veniam quis nostrud. exercitation ullamco laboris nisi ut aliquip, ex ea commodo consequat duis aute.'
				),
				record: {
					added: '2026-11-01T10:00:00+01:00',
					file: { name: 'sed-do-eiusmod.jpg', width: 4000, height: 4000, bytes: 6_100_000 },
					sha256: '3f9a1c07b2e490d177ac0e52c4d01b7e5a6b9c8d7e6f50413a2b1c0d9e8f7a6b',
					photograph: 'sunt culpa, lorem, october 2026',
					provenance: 'the artist; lorem ipsum art group, exhibition 14',
					rights: RIGHTS
				},
				store: store('sed-do-eiusmod', {
					size: '82 × 82 cm, unframed',
					edition: 'unique',
					added: '2026-11-06T08:00:00+01:00'
				})
			}
		]
	],
	[
		artist(
			'dolor sitamet',
			'tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim. veniam quis.',
			'ut labore et dolore magna aliqua, ut enim ad minim veniam. quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo. consequat duis aute irure dolor in.'
		),
		[
			{
				title: 'tempor incididunt',
				year: '2024–26',
				medium: 'text',
				lines: ['an essay, 2,900 words', 'in italiano and english'],
				sale: { kind: 'free' },
				text: {
					paragraphs: ESSAY,
					excerpt: 3,
					moreWords: 2140,
					pdf: { url: '/demo/tempor-incididunt.pdf', bytes: 410_000, pages: 9 },
					original: { label: 'read the italian original', href: '?lang=it' }
				}
			}
		]
	],
	[
		artist(
			'elit sedutempor',
			'minim veniam quis nostrud exercitation ullamco, laboris nisi ut aliquip ex ea. commodo consequat.',
			'exercitation ullamco laboris nisi ut aliquip, ex ea commodo consequat duis aute. irure dolor in reprehenderit in voluptate, velit esse cillum dolore eu fugiat. nulla pariatur excepteur sint.'
		),
		[
			{
				title: 'ut labore et dolore',
				year: '2026',
				medium: 'image',
				lines: ['silkscreen ink on canvas', '120 × 142 cm'],
				sale: { kind: 'available', amount: 6200 },
				image: image('elvis', 'a standing figure in silver, holding a pistol at the hip.'),
				store: store('ut-labore-et-dolore', {
					size: '120 × 142 cm, unframed',
					edition: 'unique',
					added: '2026-11-06T07:00:00+01:00'
				})
			},
			{
				title: 'magna aliqua',
				year: '2026',
				medium: 'sound',
				lines: ['sound, two sides, 12:03', 'english and portuguese'],
				sale: { kind: 'available', amount: 40, edition: 'edition of 50 cassettes' },
				sound: {
					src: '/demo-media/magna-aliqua.mp3',
					duration: 723,
					sides: 'side a: ut aliquip ex ea commodo  ·  side b: incididunt ut labore et',
					transcript: [
						rich(
							'side a. ut aliquip ex ea commodo consequat, duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. eu fugiat nulla pariatur.'
						),
						rich(
							'side b. incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip.'
						)
					],
					download: { url: '/demo/magna-aliqua.mp3', bytes: 5_786_348 }
				}
			}
		]
	],
	[
		artist(
			'nostrud exerci',
			'ea commodo consequat duis aute irure, dolor in reprehenderit in voluptate. velit esse cillum.',
			'dolor in reprehenderit in voluptate velit, esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia deserunt mollit anim id.'
		),
		[
			{
				title: 'ut enim ad minim',
				year: '2025',
				medium: 'video',
				lines: ['single-channel video, colour, sound', '6:40, loops'],
				sale: { kind: 'onRequest', edition: 'edition of 5 + 2 ap' },
				image: image('carcrash', 'a still: a wrecked car on its roof, repeated in a grid.'),
				video: {
					src: '/demo-media/ut-enim-ad-minim.mp4',
					duration: 400,
					loop: true,
					tracks: [
						{ lang: 'en', label: 'english', src: '/demo-media/ut-enim-ad-minim.en.vtt' },
						{ lang: 'it', label: 'italiano', src: '/demo-media/ut-enim-ad-minim.it.vtt' }
					],
					download: { url: '/demo/ut-enim-ad-minim.mp4', bytes: 6_434_118 }
				}
			}
		]
	],
	[
		artist(
			'veniam quisnos',
			'velit esse cillum dolore eu fugiat, nulla pariatur excepteur sint occaecat. cupidatat non proident.',
			'excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia. deserunt mollit anim id est laborum, lorem ipsum dolor sit amet. consectetur adipiscing elit sed do eiusmod.'
		),
		[
			{
				title: 'quis nostrud',
				year: '2025',
				medium: 'image',
				lines: ['screenprint, edition of 20', '91 × 91 cm'],
				sale: { kind: 'available', amount: 900 },
				image: image('mao', 'a portrait in bright, uneven colours, the face lit pink.'),
				store: store('quis-nostrud', {
					category: 'print',
					size: '91 × 91 cm, unframed',
					edition: 'edition of 20',
					added: '2026-11-06T06:00:00+01:00'
				})
			},
			{
				title: 'exercitation ullamco',
				year: '2026',
				medium: 'pdf',
				lines: ['a book, as a pdf, 48 pages', 'a5, riso colours'],
				sale: { kind: 'free' },
				pdf: {
					file: { url: '/demo/exercitation-ullamco.pdf', bytes: 3_000_000, pages: 48 },
					cover: null,
					title: 'exercitation ullamco'
				}
			}
		]
	],
	[
		artist(
			'tempor incidunt',
			'cupidatat non proident sunt in culpa, qui officia deserunt mollit anim. id est laborum.',
			'anim id est laborum lorem ipsum, dolor sit amet consectetur adipiscing. elit sed do eiusmod tempor incididunt, ut labore et dolore magna. aliqua ut enim ad minim veniam.'
		),
		[
			{
				title: 'laboris nisi',
				year: '2026',
				medium: 'image',
				lines: ['oil on canvas', '177 × 137 cm'],
				sale: { kind: 'onRequest' },
				image: image('coke', 'a tall green bottle, drawn flat in black and white.'),
				store: store('laboris-nisi', {
					size: '177 × 137 cm, unframed',
					edition: 'unique',
					added: '2026-10-20T10:00:00+02:00'
				})
			},
			{
				title: 'ut aliquip ex ea',
				year: '2026',
				medium: 'website',
				lines: ['a website, html and javascript', 'runs as long as it stays open'],
				sale: { kind: 'free' },
				website: {
					url: '/demo/ut-aliquip-ex-ea/index.html',
					source: '/demo/ut-aliquip-ex-ea/index.html',
					note: 'best on a computer, with sound',
					needsComputer: true
				}
			}
		]
	],
	[
		artist(
			'labore etdolore',
			'id est laborum lorem ipsum dolor, sit amet consectetur adipiscing elit. sed do eiusmod.',
			'do eiusmod tempor incididunt ut labore, et dolore magna aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis.'
		),
		[
			{
				title: 'commodo consequat',
				year: '2024',
				medium: 'image',
				lines: ['silkscreen on canvas', '51 × 41 cm'],
				sale: { kind: 'sold' },
				image: image('orangemarilyn', 'a portrait on an orange ground, the hair yellow.'),
				store: store('commodo-consequat', {
					size: '51 × 41 cm',
					edition: 'unique',
					added: '2026-10-19T10:00:00+02:00'
				})
			}
		]
	],
	[
		artist(
			'ullamco laboris',
			'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad.',
			'minim veniam quis nostrud exercitation ullamco, laboris nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse cillum dolore eu fugiat.'
		),
		[
			{
				title: 'duis aute irure',
				year: '2025',
				medium: 'image',
				lines: ['acrylic on canvas, 32 panels', '51 × 41 cm each'],
				sale: { kind: 'notForSale' },
				image: image('soupcans', 'thirty-two small canvases in a grid, each a painted tin.'),
				record: {
					added: '2026-11-01T10:00:00+01:00',
					file: null,
					sha256: null,
					photograph: 'sunt culpa, lorem, october 2026',
					provenance: 'the artist; lorem ipsum art group, exhibition 14',
					rights: RIGHTS
				}
			}
		]
	]
]);

const EXHIBITION_14: Exhibition = {
	...E14,
	opens: '2026-11-01T10:00:00+01:00',
	newFor: 30,
	status: 'open',
	withLines: '8 artists, 12 works:\nimages, video, sound,\ntexts, a book and a website',
	organisedBy: rich('[lorem ipsum art group](/about)\ntext by dolor sitamet'),
	languages: rich('english\n[italiano](?lang=it) (original texts)\n[français](?lang=fr)'),
	text: [
		rich(
			'sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. et dolore magna aliqua ut enim ad minim veniam quis nostrud. exercitation ullamco laboris nisi ut aliquip, ex ea commodo consequat duis aute. irure dolor in reprehenderit in voluptate, velit esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia deserunt mollit anim id est laborum lorem ipsum dolor. sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. et dolore magna aliqua ut enim ad minim veniam.'
		)
	],
	signature: 'lorem ipsum, november 2026',
	summary:
		'paintings, prints, an essay in italian and english, a video, a tape, a book and a website',
	announcedWith: null,
	chapters: E14_CHAPTERS,
	files: {
		pdf: { url: '/demo/exhibition-14.pdf', bytes: 9_000_000, pages: 41 },
		zip: null,
		zipBytes: 210_000_000,
		pressRelease: { url: '/demo/press-release-14.pdf', bytes: 200_000 },
		list: { url: '/demo/list-of-works-14.pdf', bytes: 120_000, pages: 4 }
	},
	colophon: {
		translations:
			'dolor sitamet, italiano → english\nveniam quisnos, english → français\nlabore etdolore, english → español',
		images: 'all images courtesy of the artists.\nphotographs of 1.1 and 8.1 by sunt culpa.',
		thanks: 'in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla. pariatur.',
		press: rich(
			'[a conversation with elit sedutempor](/letters/ullamco-laboris-nisi-ut)\n[review in *lorem ipsum* (español)](https://example.com/review)\n[press release (.pdf)](/demo/press-release-14.pdf)'
		)
	},
	updated: UPDATED
};

// ------------------------------------------------- exhibition 15 (announced)

const EXHIBITION_15: Exhibition = {
	number: 15,
	title: 'nemo enim ipsam',
	opens: '2026-12-01T10:00:00+01:00',
	newFor: 30,
	status: 'announced',
	withLines: '',
	organisedBy: rich('[lorem ipsum art group](/about)'),
	languages: rich('english'),
	text: [
		rich(
			'do eiusmod tempor incididunt ut labore, et dolore magna aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse cillum dolore eu fugiat nulla, pariatur excepteur sint occaecat cupidatat. non proident sunt in culpa qui officia deserunt mollit anim id est. laborum lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.'
		)
	],
	signature: null,
	summary: '',
	announcedWith: 'duis aute, irure dolor, in reprehenderit and fugiat nulla',
	chapters: ['duis aute', 'irure dolor', 'in reprehenderit'].map((name, i) => ({
		number: i + 1,
		artist: artist(name),
		works: []
	})),
	files: { pdf: null, zip: null, zipBytes: null, pressRelease: null, list: null },
	colophon: { translations: null, images: null, thanks: null, press: null },
	updated: UPDATED
};

// --------------------------------------------- the earlier exhibitions, 1–13

type Earlier = {
	number: number;
	title: string;
	opens: string;
	credit: string;
	works: [string, string, string, Medium, Sale][];
};

const free = (label?: string): Sale => ({ kind: 'free', label });

const EARLIER: Earlier[] = [
	{
		number: 13,
		title: 'excepteur sint occaecat',
		opens: '2026-10-01T10:00:00+02:00',
		credit: 'minim veniam, quis nostrud, exercitation ullamco',
		works: [['elit sed', 'consectetur adipiscing elit', '2024', 'video', { kind: 'notForSale' }]]
	},
	{
		number: 12,
		title: 'cupidatat non proident',
		opens: '2026-09-01T10:00:00+02:00',
		credit: 'et dolore, magna aliqua, ut enim',
		works: [
			[
				'labore et',
				'eiusmod tempor incididunt',
				'2024',
				'text',
				{ kind: 'available', amount: 1200 }
			]
		]
	},
	{
		number: 11,
		title: 'sunt in culpa',
		opens: '2026-08-01T10:00:00+02:00',
		credit: 'sed do, eiusmod tempor, incididunt ut',
		works: [['ad minim', 'et dolore magna', '2024', 'sound', free('free to read')]]
	},
	{
		number: 10,
		title: 'qui officia deserunt',
		opens: '2025-12-01T10:00:00+01:00',
		credit: 'ipsum dolor, sit amet, consectetur adipiscing',
		works: [['laboris nisi', 'enim ad minim', '2024', 'image', { kind: 'sold' }]]
	},
	{
		number: 9,
		title: 'mollit anim',
		opens: '2025-11-01T10:00:00+01:00',
		credit: 'deserunt mollit, anim id, est laborum',
		works: [
			['consequat duis', 'nostrud exercitation ullamco', '2024', 'image', { kind: 'notForSale' }]
		]
	},
	{
		number: 8,
		title: 'id est laborum',
		opens: '2025-10-01T10:00:00+02:00',
		credit: 'non proident, sunt in, culpa qui',
		works: [['in voluptate', 'ut aliquip ex', '2024', 'video', { kind: 'available', amount: 1200 }]]
	},
	{
		number: 7,
		title: 'sed ut perspiciatis',
		opens: '2025-09-01T10:00:00+02:00',
		credit: 'fugiat nulla, pariatur excepteur, sint occaecat',
		works: [['fugiat nulla', 'consequat duis aute', '2025', 'text', free()]]
	},
	{
		number: 6,
		title: 'unde omnis iste',
		opens: '2025-08-01T10:00:00+02:00',
		credit: 'in voluptate, velit esse, cillum dolore',
		works: [['non proident', 'in reprehenderit in', '2025', 'sound', { kind: 'sold' }]]
	},
	{
		number: 5,
		title: 'natus error sit',
		opens: '2025-07-01T10:00:00+02:00',
		credit: 'consequat duis, aute irure, dolor in',
		works: [['deserunt mollit', 'esse cillum dolore', '2025', 'image', { kind: 'notForSale' }]]
	},
	{
		number: 4,
		title: 'voluptatem accusantium',
		opens: '2025-06-01T10:00:00+02:00',
		credit: 'laboris nisi, ut aliquip, ex ea',
		works: [
			[
				'ipsum dolor',
				'nulla pariatur excepteur',
				'2025',
				'image',
				{ kind: 'available', amount: 1200 }
			]
		]
	},
	{
		number: 3,
		title: 'doloremque laudantium',
		opens: '2025-05-01T10:00:00+02:00',
		credit: 'ad minim, veniam quis, nostrud exercitation',
		works: [['sed do', 'cupidatat non proident', '2025', 'video', free('free to read')]]
	},
	{
		number: 2,
		title: 'totam rem aperiam',
		opens: '2025-04-01T10:00:00+02:00',
		credit: 'labore et, dolore magna, aliqua ut',
		works: [['et dolore', 'culpa qui officia', '2025', 'text', { kind: 'sold' }]]
	},
	{
		number: 1,
		title: 'eaque ipsa quae',
		opens: '2025-03-01T10:00:00+01:00',
		credit: 'elit sed, do eiusmod, tempor incididunt',
		works: [['minim veniam', 'anim id est', '2025', 'sound', { kind: 'notForSale' }]]
	}
];

const MEDIUM_LINE: Record<Medium, string> = {
	image: 'acrylic on canvas',
	text: 'an essay',
	sound: 'sound',
	video: 'single-channel video',
	pdf: 'a book, as a pdf',
	website: 'a website'
};

function earlier(e: Earlier): Exhibition {
	const ref = { number: e.number, title: e.title };
	return {
		...ref,
		opens: e.opens,
		newFor: 30,
		status: 'open',
		withLines: `${e.works.length} ${e.works.length === 1 ? 'artist, 1 work' : 'artists'}`,
		organisedBy: rich('[lorem ipsum art group](/about)'),
		languages: rich('english'),
		text: EXHIBITION_14.text,
		signature: null,
		summary: '',
		announcedWith: null,
		chapters: chapters(
			ref,
			e.works.map(([name, title, year, medium, sale]) => [
				artist(name),
				[{ title, year, medium, sale, lines: [MEDIUM_LINE[medium]] }]
			])
		),
		files: { pdf: null, zip: null, zipBytes: null, pressRelease: null, list: null },
		colophon: { translations: null, images: null, thanks: null, press: null },
		updated: UPDATED
	};
}

export const EXHIBITIONS: Exhibition[] = [EXHIBITION_15, EXHIBITION_14, ...EARLIER.map(earlier)];

/** how the list of exhibitions credits each one. */
export const CREDITS: Record<number, string> = Object.fromEntries([
	[15, 'duis aute, irure dolor, in reprehenderit'],
	...EARLIER.map((e) => [e.number, e.credit])
]);

// ----------------------------------------- webstore pieces not in a show

function piece(
	artistName: string,
	title: string,
	img: keyof typeof IMAGES,
	sale: Sale,
	info: Partial<StoreInfo>,
	alt: string
): Work {
	return {
		index: 0,
		number: '',
		exhibition: null,
		artist: { name: artistName, slug: artistName.replace(/\s+/g, '-') },
		title,
		year: '2026',
		medium: 'image',
		lines: [info.category === 'print' ? 'screenprint' : 'acrylic on canvas', info.size ?? ''],
		note: null,
		sale,
		checkoutUrl: null,
		image: image(img, alt),
		text: null,
		sound: null,
		video: null,
		pdf: null,
		website: null,
		record: {
			added: info.added ?? UPDATED,
			file: null,
			sha256: null,
			photograph: null,
			provenance: 'the artist; lorem ipsum art group, webstore',
			rights: RIGHTS
		},
		store: store(title.replace(/\s+/g, '-'), info)
	};
}

export const STORE_ONLY: Work[] = [
	piece(
		'nostrud exerci',
		'velit esse cillum',
		'chair',
		{ kind: 'available', amount: 1200 },
		{ category: 'other', size: '60 × 80 cm', added: '2026-11-05T10:00:00+01:00' },
		'an empty chair, printed in black on a pale ground.'
	),
	piece(
		'veniam quisnos',
		'fugiat nulla',
		'cow',
		{ kind: 'available', amount: 300, per: 'a roll' },
		{
			category: 'print',
			size: 'wallpaper, 76 × 1000 cm a roll',
			edition: 'printed to order',
			added: '2026-11-04T10:00:00+01:00'
		},
		'a cow’s head, repeated, pink on yellow.'
	),
	piece(
		'labore etdolore',
		'pariatur excepteur',
		'prince',
		{ kind: 'available', amount: 3400 },
		{
			category: 'print',
			size: '101 × 81 cm',
			edition: 'edition of 10',
			added: '2026-11-03T10:00:00+01:00'
		},
		'a portrait in purple and orange.'
	),
	piece(
		'tempor incidunt',
		'occaecat cupidatat',
		'banana',
		{ kind: 'available', amount: 2100 },
		{
			category: 'print',
			size: '60 × 60 cm',
			edition: 'edition of 25',
			added: '2026-11-02T10:00:00+01:00'
		},
		'a single yellow banana on white.'
	),
	piece(
		'dolor sitamet',
		'non proident',
		'souppencil',
		{ kind: 'sold' },
		{ category: 'book', size: 'a book, 64 pages', added: '2026-11-01T09:00:00+01:00' },
		'a pencil drawing of a tin, the label half done.'
	),
	piece(
		'ullamco laboris',
		'sunt in culpa',
		'tornsoup',
		{ kind: 'onRequest' },
		{ category: 'book', size: 'a book, 120 pages', added: '2026-10-31T10:00:00+01:00' },
		'a tin with its label torn halfway down.'
	),
	piece(
		'elit sedutempor',
		'officia deserunt',
		'eightelvis',
		{ kind: 'onRequest' },
		{ category: 'painting', size: '200 × 370 cm', added: '2026-10-30T10:00:00+01:00' },
		'the same standing figure eight times, side by side.'
	)
];

// --------------------------------------------------------------- visitors’ book

const BOOK_LINES: [string, string | null, string | null, string][] = [
	[
		'lorem ipsum dolor sit amet consectetur, adipiscing.',
		'a.',
		'lorem',
		'2026-11-06T09:00:00+01:00'
	],
	[
		'tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim. veniam.',
		'k.',
		'ipsum',
		'2026-11-06T08:00:00+01:00'
	],
	[
		'minim veniam quis nostrud exercitation ullamco, laboris nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in.',
		'm. r.',
		'dolor',
		'2026-11-06T07:00:00+01:00'
	],
	[
		'ea commodo consequat duis aute irure, dolor in reprehenderit in voluptate. velit esse cillum dolore eu fugiat, nulla pariatur excepteur sint occaecat. cupidatat non proident.',
		null,
		null,
		'2026-11-05T20:00:00+01:00'
	],
	['velit esse cillum dolore eu fugiat, nulla.', 's.', 'sit amet', '2026-11-05T15:00:00+01:00'],
	[
		'cupidatat non proident sunt in culpa, qui officia deserunt mollit anim. id est.',
		'j.',
		'consectetur',
		'2026-11-05T11:00:00+01:00'
	],
	[
		'id est laborum lorem ipsum dolor, sit amet consectetur adipiscing elit. sed do eiusmod tempor incididunt ut labore et.',
		't.',
		'adipiscing',
		'2026-11-04T19:00:00+01:00'
	],
	[
		'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip. ex.',
		null,
		null,
		'2026-11-04T14:00:00+01:00'
	],
	['ut enim ad minim veniam quis nostrud.', 'e.', 'elit', '2026-11-04T09:00:00+01:00'],
	[
		'ut aliquip ex ea commodo consequat, duis aute irure dolor in reprehenderit. in.',
		'r.',
		'sed do',
		'2026-11-03T18:00:00+01:00'
	]
];

const OLDER_LINES = [
	'duis aute irure dolor in reprehenderit.',
	'excepteur sint occaecat cupidatat non proident.',
	'nulla pariatur, excepteur sint.',
	'qui officia deserunt mollit anim id est laborum.'
];

export const BOOK: Record<number, BookEntry[]> = {
	14: [
		...BOOK_LINES.map(([line, name, city, date], i) => ({
			id: `e14-${i}`,
			line,
			name,
			city,
			date
		})),
		// the older entries, back to opening day: 41 in all.
		...Array.from({ length: 31 }, (_, i) => ({
			id: `e14-old-${i}`,
			line: OLDER_LINES[i % OLDER_LINES.length],
			name: i % 3 === 0 ? null : `${'abcdefghijklmnopqrstuvwxyz'[i % 26]}.`,
			city: i % 3 === 0 ? null : 'lorem',
			date: new Date(
				Date.parse('2026-11-03T12:00:00+01:00') - (i + 1) * 2.5 * 3_600_000
			).toISOString()
		}))
	]
};

// ------------------------------------------------------------------ journal

export const JOURNAL: JournalEntry[] = [
	{
		slug: 'lorem-ipsum-dolor',
		date: '2026-11-03',
		title: 'lorem ipsum dolor sit',
		kind: 'letter',
		author: 'dolor sitamet',
		href: null
	},
	{
		slug: 'do-eiusmod-tempor-incididunt',
		date: '2026-10-20',
		title: 'do eiusmod tempor incididunt',
		kind: 'press',
		author: null,
		href: 'https://loremipsum.substack.com/p/do-eiusmod-tempor-incididunt'
	},
	{
		slug: 'aliqua-ut-enim-ad',
		date: '2026-10-02',
		title: 'aliqua ut enim ad',
		kind: 'pdf',
		author: null,
		href: '/demo/aliqua-ut-enim-ad.pdf'
	},
	{
		slug: 'ullamco-laboris-nisi-ut',
		date: '2026-09-14',
		title: 'ullamco laboris nisi ut',
		kind: 'conversation',
		author: null,
		href: null
	},
	{
		slug: 'duis-aute-irure-dolor',
		date: '2026-08-30',
		title: 'duis aute irure dolor',
		kind: 'press',
		author: null,
		href: 'https://loremipsum.substack.com/p/duis-aute-irure-dolor'
	},
	{
		slug: 'esse-cillum-dolore-eu',
		date: '2026-08-01',
		title: 'esse cillum dolore eu',
		kind: 'essay',
		author: null,
		href: null
	},
	{
		slug: 'occaecat-cupidatat-non-proident',
		date: '2026-07-09',
		title: 'occaecat cupidatat non proident',
		kind: 'pdf',
		author: null,
		href: '/demo/occaecat-cupidatat-non-proident.pdf'
	},
	{
		slug: 'deserunt-mollit-anim-id',
		date: '2026-06-18',
		title: 'deserunt mollit anim id',
		kind: 'press',
		author: null,
		href: 'https://loremipsum.substack.com/p/deserunt-mollit-anim-id'
	},
	{
		slug: 'sit-amet-consectetur-adipiscing',
		date: '2026-05-02',
		title: 'sit amet consectetur adipiscing',
		kind: 'conversation',
		author: null,
		href: null
	},
	{
		slug: 'incididunt-ut-labore-et',
		date: '2026-04-01',
		title: 'incididunt ut labore et',
		kind: 'essay',
		author: null,
		href: null
	}
];

const POST_PARAGRAPHS: Paragraph[] = [
	p(
		'lorem ipsum dolor sit amet consectetur, adipiscing elit sed do eiusmod. tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse cillum dolore eu fugiat nulla, pariatur excepteur sint occaecat cupidatat. non proident.',
		'¹ lorem ipsum dolor sit amet consectetur, adipiscing elit sed do eiusmod. tempor incididunt ut.'
	),
	p(
		'ut labore et dolore magna aliqua, ut enim ad minim veniam. quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo. consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum. dolore eu fugiat nulla pariatur excepteur, sint occaecat cupidatat non proident. sunt in culpa qui officia deserunt, mollit anim id est laborum. lorem ipsum.'
	),
	p(
		'exercitation ullamco laboris nisi ut aliquip, ex ea commodo consequat duis aute. irure dolor in reprehenderit in voluptate, velit esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia deserunt mollit anim id est laborum lorem ipsum dolor. sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.',
		'² in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla. pariatur excepteur sint.'
	),
	p(
		'dolor in reprehenderit in voluptate velit, esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia deserunt mollit anim id est laborum lorem ipsum dolor. sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. et dolore magna aliqua ut enim ad minim veniam quis nostrud. exercitation ullamco.'
	),
	p(
		'excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia. deserunt mollit anim id est laborum, lorem ipsum dolor sit amet. consectetur adipiscing elit sed do eiusmod, tempor incididunt ut labore et dolore. magna aliqua ut enim ad minim, veniam quis nostrud exercitation ullamco. laboris nisi ut aliquip ex ea, commodo consequat duis aute irure. dolor in.',
		'³ tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim. veniam quis.'
	),
	p(
		'anim id est laborum lorem ipsum, dolor sit amet consectetur adipiscing. elit sed do eiusmod tempor incididunt, ut labore et dolore magna. aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. nisi ut aliquip ex ea commodo, consequat duis aute irure dolor. in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla. pariatur excepteur sint.'
	)
];

export function journalPost(entry: JournalEntry): JournalPost {
	const first = entry.slug === 'lorem-ipsum-dolor';
	return {
		...entry,
		byline: first
			? rich(
					'by dolor sitamet, translated from the italian by veniam quisnos   ·   12 minutes   ·   [download as pdf](/demo/lorem-ipsum-dolor.pdf)   [read in italiano](?lang=it)'
				)
			: rich(entry.author ? `by ${entry.author}` : 'by lorem ipsum art group'),
		paragraphs: POST_PARAGRAPHS
	};
}

// --------------------------------------------------------- about, privacy

export const ABOUT: Page = {
	intro: rich(
		'lorem ipsum is an online gallery for work in any medium. consectetur adipiscing elit sed do eiusmod, tempor incididunt ut labore et dolore. magna aliqua ut enim ad minim, veniam quis nostrud exercitation ullamco. laboris nisi ut aliquip ex ea, commodo consequat duis aute irure. dolor in reprehenderit in voluptate velit, esse cillum dolore eu.'
	),
	sections: [
		{
			heading: 'what we do',
			body: [
				rich(
					'sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. et dolore magna aliqua ut enim ad minim veniam quis nostrud. exercitation ullamco laboris nisi ut aliquip, ex ea commodo consequat duis aute. irure dolor in reprehenderit in voluptate, velit esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia.'
				)
			]
		},
		{
			heading: 'how we pay artists',
			body: [
				rich(
					'every artist is paid $1,250 per exhibition, on the day it opens. tempor incididunt ut labore et dolore, magna aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in.'
				),
				rich(
					'sales: 70% to the artist, 30% to the gallery. in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla. pariatur excepteur sint occaecat cupidatat non proident sunt in.'
				)
			]
		},
		{
			heading: 'who we are',
			body: [
				rich(
					'sunt culpa, curator\nqui officia, design\ndeserunt mollit, build\nanim idest, translation'
				),
				rich(
					'minim veniam quis nostrud exercitation ullamco, laboris nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in reprehenderit.'
				)
			]
		},
		{
			heading: 'translation',
			body: [
				rich(
					'ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute. irure dolor in reprehenderit in voluptate, velit esse cillum dolore eu fugiat. nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia deserunt mollit anim id est laborum lorem ipsum dolor. sit amet consectetur.'
				)
			]
		},
		{
			heading: 'colophon',
			body: [
				rich(
					'type: helvetica neue.\nbuilt with sveltekit and sanity. hosted on cloudflare.\nno cookies, no trackers, no analytics.\n[plain text version of this site](/plain/)'
				)
			]
		},
		{
			heading: 'contact',
			body: [
				rich(
					'[hello@loremipsum.art](mailto:hello@loremipsum.art)\n[the contact form](/contact)\n[instagram](https://instagram.com/loremipsumartgroup)\n[newsletter](#newsletter)'
				)
			]
		}
	],
	updated: UPDATED
};

export const PRIVACY: Page = {
	intro: rich('the short version: we don’t track you. no cookies, no analytics, no pixels.'),
	sections: [
		{
			heading: 'what we keep',
			body: [
				rich(
					'ipsum dolor sit amet consectetur adipiscing, elit sed do eiusmod tempor. incididunt ut labore et dolore magna, aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in.'
				)
			]
		},
		{
			heading: 'the newsletter',
			body: [
				rich(
					'incididunt ut labore et dolore magna, aliqua ut enim ad minim. veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse cillum dolore.'
				)
			]
		},
		{
			heading: 'the visitors’ book',
			body: [
				rich(
					'veniam quis nostrud exercitation ullamco laboris, nisi ut aliquip ex ea. commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse cillum dolore eu fugiat nulla, pariatur excepteur.'
				)
			]
		},
		{
			heading: 'the webstore',
			body: [
				rich(
					'commodo consequat duis aute irure dolor, in reprehenderit in voluptate velit. esse cillum dolore eu fugiat nulla, pariatur excepteur sint occaecat cupidatat. non proident sunt in culpa qui officia deserunt mollit anim id est.'
				)
			]
		},
		{
			heading: 'your rights',
			body: [
				rich(
					'esse cillum dolore eu fugiat nulla, pariatur excepteur sint occaecat cupidatat. non proident sunt in culpa qui officia deserunt mollit anim id est. laborum lorem ipsum dolor sit.'
				)
			]
		},
		{
			heading: 'changes',
			body: [
				rich(
					'non proident sunt in culpa qui officia deserunt mollit anim id est. laborum lorem ipsum dolor.'
				)
			]
		}
	],
	updated: UPDATED
};

export const SETTINGS: Settings = {
	email: 'hello@loremipsum.art',
	instagram: 'loremipsumartgroup',
	description:
		'an online gallery for work in any medium. no rooms, no opening hours, no address. every exhibition stays open.',
	shortDescription: 'an online gallery for work in any medium. every exhibition stays open.',
	moneySplit: [
		rich(
			'70% to the artist, 30% to the gallery. ut aliquip ex ea commodo consequat, duis aute irure dolor in reprehenderit. in voluptate velit esse cillum dolore.'
		)
	],
	shipping: [
		rich(
			'nulla pariatur excepteur sint occaecat cupidatat, non proident sunt in culpa. qui officia deserunt mollit anim id est laborum lorem ipsum dolor. sit amet consectetur adipiscing elit sed do eiusmod.'
		)
	],
	shipsFrom: 'ships from lorem in about two weeks. tax and shipping are shown before you pay.',
	storeIntro:
		'labore et dolore magna aliqua ut enim ad minim veniam quis nostrud. exercitation ullamco laboris nisi ut aliquip, ex ea commodo consequat duis aute. irure dolor.',
	journalIntro:
		'in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla. pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui.',
	contactAside: [
		rich(
			'ut aliquip ex ea commodo consequat, duis aute irure dolor in reprehenderit. in voluptate velit esse cillum dolore, eu fugiat nulla pariatur excepteur. sint.'
		)
	]
};
