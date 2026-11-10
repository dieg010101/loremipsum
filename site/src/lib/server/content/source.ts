import type {
	BookEntry,
	Exhibition,
	ExhibitionSummary,
	JournalEntry,
	JournalPost,
	Page,
	Rich,
	Settings,
	Work
} from '$lib/types';

export type NewBookEntry = { line: string; name: string | null; city: string | null };

/** where the content comes from: the demo fixtures or sanity. */
export interface ContentSource {
	/** "now", for working out what is showing. the demo has a fixed clock. */
	now(): Date;
	settings(): Promise<Settings>;
	/** the home page's words, written in one box; empty means the site writes its own. */
	home(): Promise<Rich[]>;
	/** when anything on the site last changed. */
	updated(): Promise<string>;
	/** every exhibition, announced or open, newest first. */
	exhibitions(): Promise<ExhibitionSummary[]>;
	exhibition(number: number): Promise<Exhibition | null>;
	/** every work in every exhibition, for the index. */
	works(): Promise<Work[]>;
	/** everything in the webstore, newest first. */
	store(): Promise<Work[]>;
	storeItem(slug: string): Promise<Work | null>;
	journal(): Promise<JournalEntry[]>;
	journalPost(slug: string): Promise<JournalPost | null>;
	page(name: 'about' | 'privacy'): Promise<Page | null>;
	/** the visitors' book: only entries that have been read and put up, newest first. */
	book(exhibition: number): Promise<BookEntry[]>;
	/** a new line for the book. it waits to be read before it goes up. */
	sign(exhibition: number, entry: NewBookEntry, tokenHash: string): Promise<{ id: string }>;
	/** takes an entry down, if the token is the one it was signed with. */
	takeDown(id: string, tokenHash: string): Promise<boolean>;
}
