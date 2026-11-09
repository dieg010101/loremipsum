import { error, redirect } from '@sveltejs/kit';
import { content } from '$lib/server/content';
import { PAGE_CACHE } from '$lib/server/cache';
import { plain } from '$lib/rich';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const source = content();
	const [post, entries] = await Promise.all([source.journalPost(params.slug), source.journal()]);
	if (!post) {
		// press and pdfs live elsewhere: send old links on.
		const elsewhere = entries.find((e) => e.slug === params.slug && e.href);
		if (elsewhere?.href) redirect(302, elsewhere.href);
		error(404, 'no such letter');
	}
	const at = entries.findIndex((e) => e.slug === post.slug);
	const link = (e: (typeof entries)[number] | undefined) =>
		e ? { title: e.title, href: e.href ?? `/letters/${e.slug}` } : null;

	setHeaders(PAGE_CACHE);
	return {
		post,
		older: link(entries[at + 1]),
		newer: link(entries[at - 1]),
		title: post.title,
		description: plain(post.paragraphs[0]?.text).slice(0, 160)
	};
};
