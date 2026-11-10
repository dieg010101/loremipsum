import { content } from '$lib/server/content';
import { timeline } from '$lib/format';
import { FILE_CACHE } from '$lib/server/cache';
import { workHref } from '$lib/work';
import type { RequestHandler } from './$types';

// every page worth finding, for search engines. filtered views (?show=, ?sort=) are
// left out: they're the same pages in another order.
export const GET: RequestHandler = async ({ url }) => {
	const source = content();
	const now = source.now();
	const [exhibitions, works, store, letters, updated] = await Promise.all([
		source.exhibitions(),
		source.works(),
		source.store(),
		source.journal(),
		source.updated()
	]);
	const { open } = timeline(exhibitions, now);
	const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : undefined);

	const pages: { path: string; modified?: string }[] = [
		{ path: '/', modified: day(updated) },
		{ path: '/exhibitions' },
		{ path: '/index' },
		{ path: '/webstore' },
		{ path: '/letters' },
		{ path: '/about' },
		{ path: '/contact' },
		{ path: '/privacy' },
		{ path: '/calendar' },
		...exhibitions.map((e) => ({
			path: `/exhibitions/${e.number}`,
			modified: day(open.includes(e) ? e.opens : undefined)
		})),
		...open.map((e) => ({ path: `/exhibitions/${e.number}/book` })),
		...works.map((w) => ({ path: workHref(w) })),
		...store.map((w) => ({ path: `/webstore/${w.store!.slug}`, modified: day(w.store!.added) })),
		...letters
			.filter((l) => !l.href && new Date(l.date) <= now)
			.map((l) => ({ path: `/letters/${l.slug}`, modified: day(l.date) }))
	];

	const seen = new Set<string>();
	const entries = pages
		.filter((p) => !seen.has(p.path) && seen.add(p.path))
		.map(
			(p) =>
				`\t<url><loc>${url.origin}${p.path}</loc>${p.modified ? `<lastmod>${p.modified}</lastmod>` : ''}</url>`
		);
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
	return new Response(xml, {
		headers: { 'content-type': 'application/xml; charset=utf-8', ...FILE_CACHE }
	});
};
