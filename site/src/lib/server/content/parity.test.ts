import { describe, expect, it } from 'vitest';
import { demo } from './demo';
import { sanitySource } from './sanity';
import type { Work } from '$lib/types';

// sanity was filled from the demo, so both should tell the same story. a query
// that forgets a field (the index once lost every chapter's artist) shows up here
// as a difference. it reads the live dataset, so it only runs when asked:
//   SANITY_PARITY=1 npx vitest run parity
const run =
	import.meta.env.SANITY_PARITY === '1' ||
	(globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env
		.SANITY_PARITY === '1';

// the structure: who, what, where, and on sale how. (sanity's older exhibitions
// carry stand-in pictures and files the demo leaves out, so media isn't compared.)
const shape = (w: Work) => ({
	medium: w.medium,
	title: w.title,
	artist: w.artist.name,
	exhibition: w.exhibition?.number ?? null,
	number: w.number,
	index: w.index,
	sale: w.sale.kind,
	store: w.store?.slug ?? null
});

describe.runIf(run)('demo and sanity agree', () => {
	it('exhibitions', async () => {
		const [a, b] = await Promise.all([demo.exhibitions(), sanitySource.exhibitions()]);
		const line = (e: (typeof a)[number]) => [e.number, e.title, e.artists.length];
		expect(b.map(line)).toEqual(a.map(line));
		for (const e of a) {
			const [x, y] = await Promise.all([
				demo.exhibition(e.number),
				sanitySource.exhibition(e.number)
			]);
			const sum = (v: typeof x) =>
				v && {
					chapters: v.chapters
						.filter((c) => c.works.length)
						.map((c) => [c.artist.name, c.works.map(shape)]),
					files: [!!v.files.pdf, !!v.files.zip],
					text: v.text.length,
					summary: !!v.summary
				};
			expect(sum(y), `exhibition ${e.number}`).toEqual(sum(x));
		}
	}, 60_000);

	it('the index (every work)', async () => {
		const [a, b] = await Promise.all([demo.works(), sanitySource.works()]);
		expect(b.length).toBeGreaterThan(0);
		expect(b.map(shape)).toEqual(a.map(shape));
	});

	it('the webstore', async () => {
		const [a, b] = await Promise.all([demo.store(), sanitySource.store()]);
		const key = (w: Work) => w.store!.slug;
		expect(b.map(shape).sort((p, q) => (p.store! < q.store! ? -1 : 1))).toEqual(
			a.map(shape).sort((p, q) => (p.store! < q.store! ? -1 : 1))
		);
		for (const w of a) {
			const [x, y] = await Promise.all([demo.storeItem(key(w)), sanitySource.storeItem(key(w))]);
			expect(y && shape(y), key(w)).toEqual(x && shape(x));
		}
	}, 60_000);

	it('letters', async () => {
		const [a, b] = await Promise.all([demo.journal(), sanitySource.journal()]);
		const line = (j: (typeof a)[number]) => [j.slug, j.title, j.kind, j.author, !!j.href];
		expect(b.map(line)).toEqual(a.map(line));
		for (const j of a.filter((j) => !j.href)) {
			const [x, y] = await Promise.all([
				demo.journalPost(j.slug),
				sanitySource.journalPost(j.slug)
			]);
			expect(y?.paragraphs.length, j.slug).toEqual(x?.paragraphs.length);
		}
	}, 60_000);

	it('pages and settings', async () => {
		for (const name of ['about', 'privacy'] as const) {
			const [x, y] = await Promise.all([demo.page(name), sanitySource.page(name)]);
			expect(
				y?.sections.map((s) => s.heading),
				name
			).toEqual(x?.sections.map((s) => s.heading));
		}
		const [x, y] = await Promise.all([demo.settings(), sanitySource.settings()]);
		for (const k of Object.keys(x) as (keyof typeof x)[])
			expect(Boolean(y[k]) && JSON.stringify(y[k]).length > 2, `settings.${k}`).toBe(
				Boolean(x[k]) && JSON.stringify(x[k]).length > 2
			);
	});
});
