// the shapes every page works with. the content layer (demo fixtures or sanity)
// returns these, so the pages never care where the content came from.

/** a run of text, optionally italic, bold or a link. */
export type Span = {
	text: string;
	em?: boolean;
	strong?: boolean;
	href?: string;
};

/** a paragraph: spans; a "\n" inside a span is a line break. */
export type Rich = Span[];

export type Image = {
	src: string;
	srcset: string;
	/** the biggest version there is, for full size. */
	full: string;
	fullSrcset: string;
	width: number;
	height: number;
	/** the work's own average colour, shown while it loads. */
	color: string;
	alt: string;
	/** "6.1 mb", for the loading state. */
	size: string | null;
};

export type FileLink = { url: string; bytes: number | null; pages?: number | null };

export type Medium = 'image' | 'text' | 'sound' | 'video' | 'pdf' | 'website';

export type Sale =
	| { kind: 'notForSale' }
	| { kind: 'sold' }
	| { kind: 'reserved'; until: string }
	| { kind: 'free'; label?: string | null }
	| { kind: 'onRequest'; edition?: string | null }
	| { kind: 'available'; amount: number; edition?: string | null; per?: string | null };

export type Paragraph = { text: Rich; note?: Rich | null };

export type Track = { lang: string; label: string; src: string };

export type Work = {
	/** its sanity document, for click-to-edit in the studio's preview. */
	id?: string;
	/** position in its exhibition, from 1 (its address: /exhibitions/14/2). */
	index: number;
	/** "1.2": chapter, then the work within the chapter. */
	number: string;
	/** null for webstore pieces that were never in an exhibition. */
	exhibition: { number: number; title: string } | null;
	artist: ArtistRef;
	title: string;
	year: string;
	medium: Medium;
	/** the two lines under the title: what it is, and how big or long. */
	lines: string[];
	/** a few lines about the work (shown with the label on phones). */
	note: Rich | null;
	sale: Sale;
	checkoutUrl: string | null;
	image: Image | null;
	/** text works: the excerpt shown in the exhibition, then the rest. */
	text: {
		paragraphs: Paragraph[];
		excerpt: number;
		moreWords: number | null;
		pdf: FileLink | null;
		original: { label: string; href: string } | null;
	} | null;
	sound: {
		src: string;
		duration: number;
		sides: string | null;
		transcript: Rich[] | null;
		download: FileLink | null;
	} | null;
	video: {
		src: string;
		duration: number;
		loop: boolean;
		tracks: Track[];
		download: FileLink | null;
	} | null;
	pdf: { file: FileLink; cover: Image | null; title: string } | null;
	website: {
		url: string;
		source: string | null;
		note: string | null;
		needsComputer: boolean;
	} | null;
	record: {
		added: string;
		/** the original file: name, pixel size and weight. */
		file: { name: string; width: number; height: number; bytes: number } | null;
		sha256: string | null;
		photograph: string | null;
		provenance: string;
		rights: string;
	};
	store: StoreInfo | null;
};

export type StoreInfo = {
	slug: string;
	category: 'painting' | 'print' | 'book' | 'other';
	size: string | null;
	edition: string | null;
	about: Rich[] | null;
	added: string;
};

export type ArtistRef = { name: string; slug: string };

export type Chapter = {
	number: number;
	artist: ArtistRef & {
		/** its sanity document, for click-to-edit in the studio's preview. */
		id?: string;
		bio: Rich | null;
		website: string | null;
		instagram: string | null;
		about: Rich | null;
	};
	works: Work[];
};

export type Exhibition = {
	/** its sanity document, for click-to-edit in the studio's preview. */
	id?: string;
	number: number;
	title: string;
	/** when it opens, as an iso instant. */
	opens: string;
	/** how many days it is new for (30). it stays open after that. */
	newFor: number;
	status: 'announced' | 'open';
	/** false while it has no works yet: it stays announced, whatever the date. */
	ready?: boolean;
	/** the facts row, under the title. */
	withLines: string;
	organisedBy: Rich;
	languages: Rich;
	text: Rich[];
	signature: string | null;
	/** the home page sentence: what is in it. */
	summary: string;
	/** announced exhibitions: who is in it, written out. */
	announcedWith: string | null;
	chapters: Chapter[];
	files: {
		pdf: FileLink | null;
		/** a ready-made zip. without one, the visitor's browser makes it from the files. */
		zip: FileLink | null;
		/** how big the zip comes to, for the link. */
		zipBytes: number | null;
		pressRelease: FileLink | null;
		list: FileLink | null;
	};
	colophon: {
		translations: string | null;
		images: string | null;
		thanks: string | null;
		press: Rich | null;
	};
	updated: string;
};

/** what the list of exhibitions and the now line need. */
export type ExhibitionSummary = {
	number: number;
	title: string;
	opens: string;
	newFor: number;
	artists: string[];
	/** how the list credits it, when the artists alone don't say it right. */
	credit: string | null;
	/** false while it has no works yet. */
	ready?: boolean;
};

export type BookEntry = {
	id: string;
	line: string;
	name: string | null;
	city: string | null;
	date: string;
};

export type JournalEntry = {
	slug: string;
	date: string;
	title: string;
	/** a letter to everyone (like the newsletter), writing of ours, or press about us. */
	kind: 'letter' | 'essay' | 'conversation' | 'press' | 'pdf';
	author: string | null;
	/** press and pdfs live elsewhere. */
	href: string | null;
};

export type JournalPost = JournalEntry & {
	byline: Rich;
	paragraphs: Paragraph[];
};

export type Section = { heading: string; body: Rich[] };

export type Page = { intro: Rich; sections: Section[]; updated: string };

export type Settings = {
	email: string;
	instagram: string;
	description: string;
	shortDescription: string;
	moneySplit: Rich[];
	shipping: Rich[];
	shipsFrom: string;
	storeIntro: string;
	journalIntro: string;
	contactAside: Rich[];
};
