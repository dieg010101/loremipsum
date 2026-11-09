import type { ExhibitionSummary } from '$lib/types';
import { bookEntries, signBook, takeDownBook } from '../backend';
import {
	ABOUT,
	BOOK,
	CREDITS,
	DEMO_NOW,
	EXHIBITIONS,
	JOURNAL,
	PRIVACY,
	SETTINGS,
	STORE_ONLY,
	UPDATED,
	journalPost
} from '../demo/content';
import type { ContentSource } from './source';

// the content is the figma's, but what visitors write is real: it goes to the sheet
// like everywhere else, and shows after the demo's own lines once approved.

const allWorks = () =>
	EXHIBITIONS.filter((e) => e.status === 'open').flatMap((e) => e.chapters.flatMap((c) => c.works));

export const demo: ContentSource = {
	now: () => new Date(DEMO_NOW),

	settings: async () => SETTINGS,

	updated: async () => UPDATED,

	exhibitions: async () =>
		EXHIBITIONS.map(
			(e): ExhibitionSummary => ({
				number: e.number,
				title: e.title,
				opens: e.opens,
				newFor: e.newFor,
				artists: e.chapters.map((c) => c.artist.name),
				credit: CREDITS[e.number] ?? null
			})
		),

	exhibition: async (number) => EXHIBITIONS.find((e) => e.number === number) ?? null,

	works: async () => allWorks(),

	store: async () =>
		[...allWorks(), ...STORE_ONLY]
			.filter((w) => w.store)
			.sort((a, b) => b.store!.added.localeCompare(a.store!.added)),

	storeItem: async (slug) =>
		[...allWorks(), ...STORE_ONLY].find((w) => w.store?.slug === slug) ?? null,

	journal: async () => JOURNAL,

	journalPost: async (slug) => {
		const entry = JOURNAL.find((j) => j.slug === slug && !j.href);
		return entry ? journalPost(entry) : null;
	},

	page: async (name) => (name === 'about' ? ABOUT : PRIVACY),

	book: async (exhibition) => [...(await bookEntries(exhibition)), ...(BOOK[exhibition] ?? [])],

	sign: signBook,

	takeDown: takeDownBook
};
