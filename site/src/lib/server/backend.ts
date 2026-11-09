import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { BookEntry } from '$lib/types';

/**
 * what visitors send us lives in a google sheet, behind one apps script
 * (backend/lorem-ipsum.gs): the newsletter list, the visitors' book and the
 * contact archive. sanity keeps the art and the writing.
 *
 * BACKEND_URL is the script's web app address, BACKEND_SECRET its SECRET. in
 * development without them everything is kept in memory and printed instead.
 */

type Actions = {
	subscribe: { in: { email: string; list: string; page: string }; out: { already?: boolean } };
	confirm: { in: { token: string }; out: { list: string; already?: boolean } };
	leave: { in: { token: string }; out: { list: string } };
	sign: {
		in: {
			exhibition: number;
			line: string;
			name: string | null;
			city: string | null;
			tokenHash: string;
		};
		out: { id: string };
	};
	takedown: { in: { id: string; tokenHash: string }; out: object };
	entries: { in: { exhibition: number }; out: { entries: BookEntry[] } };
	contact: {
		in: { name: string; email: string; about: string; work: string; message: string };
		out: object;
	};
};

export class BackendError extends Error {
	constructor(readonly code: string) {
		super(`backend: ${code}`);
	}
}

export async function backend<A extends keyof Actions>(
	action: A,
	payload: Actions[A]['in'],
	{ timeout = 10_000 } = {}
): Promise<Actions[A]['out']> {
	if (!env.BACKEND_URL) {
		if (dev) return memory(action, payload) as Actions[A]['out'];
		throw new BackendError('BACKEND_URL is not set');
	}
	const res = await fetch(env.BACKEND_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ action, secret: env.BACKEND_SECRET ?? '', ...payload }),
		signal: AbortSignal.timeout(timeout)
	}).catch((error) => {
		throw new BackendError(error?.name === 'TimeoutError' ? 'timeout' : 'unreachable');
	});
	// apps script answers 200 for its own errors too: read what it says.
	const out = res.ok ? await res.json().catch(() => null) : null;
	if (!out) throw new BackendError(`http ${res.status}`);
	if (out.error) throw new BackendError(String(out.error));
	return out;
}

// ------------------------------------------------- the book, read for each page

// approved lines change rarely and the script is slow to wake: each server keeps
// them for a minute, and a slow answer never holds up the exhibition.
const kept = new Map<number, { at: number; entries: BookEntry[] }>();
const KEEP = 60_000;

export async function bookEntries(exhibition: number): Promise<BookEntry[]> {
	const hit = kept.get(exhibition);
	if (hit && Date.now() - hit.at < KEEP) return hit.entries;
	try {
		const { entries } = await backend('entries', { exhibition }, { timeout: 4000 });
		kept.set(exhibition, { at: Date.now(), entries });
		return entries;
	} catch (error) {
		console.error(`visitors’ book ${exhibition}`, error);
		return hit?.entries ?? [];
	}
}

/** a new line goes to the sheet, unapproved. */
export async function signBook(
	exhibition: number,
	entry: { line: string; name: string | null; city: string | null },
	tokenHash: string
) {
	const { id } = await backend('sign', { exhibition, ...entry, tokenHash });
	return { id };
}

/** the writer takes their own line down. false if the token doesn't match. */
export async function takeDownBook(id: string, tokenHash: string) {
	try {
		await backend('takedown', { id, tokenHash });
		forgetBook();
		return true;
	} catch (error) {
		if (error instanceof BackendError && error.code === 'forbidden') return false;
		throw error;
	}
}

/** after a takedown, don't show the line from the minute's copy. */
export function forgetBook(exhibition?: number) {
	if (exhibition === undefined) kept.clear();
	else kept.delete(exhibition);
}

// ------------------------------------------------- development, without a sheet

type Row = BookEntry & { exhibition: number; tokenHash: string; approved: boolean };
const rows: Row[] = [];

function memory(action: keyof Actions, payload: Record<string, unknown>): unknown {
	console.info(
		`[backend, in memory] ${action}`,
		action === 'contact' ? { ...payload, message: '…' } : payload
	);
	switch (action) {
		case 'subscribe':
			return { ok: true };
		case 'confirm':
		case 'leave':
			return { ok: true, list: 'newsletter' };
		case 'sign': {
			const id = crypto.randomUUID();
			const p = payload as Actions['sign']['in'];
			// in development a line goes up at once, so the page can be tried.
			rows.push({
				id,
				line: p.line,
				name: p.name,
				city: p.city,
				date: new Date().toISOString(),
				exhibition: p.exhibition,
				tokenHash: p.tokenHash,
				approved: true
			});
			return { ok: true, id };
		}
		case 'takedown': {
			const p = payload as Actions['takedown']['in'];
			const at = rows.findIndex((r) => r.id === p.id && r.tokenHash === p.tokenHash);
			if (at < 0) throw new BackendError('forbidden');
			rows.splice(at, 1);
			return { ok: true };
		}
		case 'entries':
			return {
				ok: true,
				entries: rows
					.filter((r) => r.approved && r.exhibition === payload.exhibition)
					.map(({ id, line, name, city, date }) => ({ id, line, name, city, date }))
					.reverse()
			};
		case 'contact':
			return { ok: true };
	}
}
