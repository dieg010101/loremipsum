import { error } from '@sveltejs/kit';
import { content } from './content';
import { plain } from '$lib/rich';

/** about and privacy: an intro and some sections, from the cms. */
export async function loadPage(name: 'about' | 'privacy') {
	const page = await content().page(name);
	if (!page) error(404, `no ${name} page yet`);
	return { page, title: name, description: plain(page.intro).slice(0, 160), updated: page.updated };
}
