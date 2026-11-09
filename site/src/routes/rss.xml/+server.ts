import { content } from '$lib/server/content';
import { escapeHtml } from '$lib/server/mail';
import { timeline } from '$lib/format';
import { FILE_CACHE } from '$lib/server/cache';
import type { RequestHandler } from './$types';

// openings and letters, newest first.
export const GET: RequestHandler = async ({ url }) => {
	const source = content();
	const now = source.now();
	const [all, journal, settings] = await Promise.all([
		source.exhibitions(),
		source.journal(),
		source.settings()
	]);
	const { open } = timeline(all, now);
	const items = [
		...open.map((e) => ({
			title: `exhibition ${e.number}: ${e.title}`,
			link: `${url.origin}/exhibitions/${e.number}`,
			date: e.opens,
			description: `with ${e.artists.join(', ')}.`
		})),
		...journal
			.filter((j) => new Date(j.date) <= now)
			.map((j) => ({
				title: j.title,
				link: j.href?.startsWith('http')
					? j.href
					: `${url.origin}${j.href ?? `/letters/${j.slug}`}`,
				date: j.date,
				description: `${j.kind}${j.author ? `, by ${j.author}` : ''}.`
			}))
	].sort((a, b) => b.date.localeCompare(a.date));

	const body = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>lorem ipsum</title>
<link>${url.origin}/</link>
<atom:link href="${url.origin}/rss.xml" rel="self" type="application/rss+xml"/>
<description>${escapeHtml(settings.description)}</description>
<language>en</language>
${items
	.map(
		(i) => `<item>
<title>${escapeHtml(i.title)}</title>
<link>${escapeHtml(i.link)}</link>
<guid>${escapeHtml(i.link)}</guid>
<pubDate>${new Date(i.date).toUTCString()}</pubDate>
<description>${escapeHtml(i.description)}</description>
</item>`
	)
	.join('\n')}
</channel>
</rss>
`;
	return new Response(body, {
		headers: { 'content-type': 'application/rss+xml; charset=utf-8', ...FILE_CACHE }
	});
};
