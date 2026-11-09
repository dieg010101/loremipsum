import type { BookEntry } from './types';

export const BOOK_LIMIT = 280;

/** “a line.”  a., lorem */
export function signature(entry: Pick<BookEntry, 'name' | 'city'>, you = false) {
	const name = you ? 'you' : entry.name || 'anonymous';
	return entry.city ? `${name}, ${entry.city}` : name;
}

/** "a., lorem" → name "a.", city "lorem". the city is whatever follows the last comma. */
export function splitSigner(value: string) {
	const text = value.trim().replace(/\s+/g, ' ');
	if (!text) return { name: null, city: null };
	const at = text.lastIndexOf(',');
	if (at < 0) return { name: text, city: null };
	const name = text.slice(0, at).trim();
	const city = text.slice(at + 1).trim();
	return { name: name || null, city: city || null };
}

/** what this browser signed: kept locally so only you see "you", and can take it down. */
export type Signed = { id: string; token: string };

const key = (exhibition: number) => `lorem:book:${exhibition}`;

export function readSigned(exhibition: number): Signed[] {
	try {
		const raw = localStorage.getItem(key(exhibition));
		const list = raw ? JSON.parse(raw) : [];
		return Array.isArray(list)
			? list.filter((s) => typeof s?.id === 'string' && typeof s?.token === 'string')
			: [];
	} catch {
		return [];
	}
}

export function writeSigned(exhibition: number, list: Signed[]) {
	try {
		localStorage.setItem(key(exhibition), JSON.stringify(list));
	} catch {
		// private mode or storage off: the entry still goes up, it just won't say "you".
	}
}
