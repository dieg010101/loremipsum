import { page } from '$app/state';
import { createDataAttribute } from '@sanity/visual-editing/create-data-attribute';

/** the studio the preview tab lives in. */
export const STUDIO_URL = 'https://loremipsumcms.sanity.studio';

/**
 * click-to-edit, in the studio's preview tab only: marks an element with the sanity
 * document (and field) it shows, so clicking it there opens that field. for visitors
 * it's undefined, and the attribute isn't written at all.
 */
export function edit(type: string, id: string | null | undefined, path: string) {
	if (!page.data.preview || !id) return undefined;
	return createDataAttribute({
		baseUrl: STUDIO_URL,
		id: id.replace(/^drafts\./, ''),
		type,
		path
	}).toString();
}
