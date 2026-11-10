import { env } from '$env/dynamic/public';
import { env as secret } from '$env/dynamic/private';
import { previewToken } from '$lib/server/preview';
import { content } from '$lib/server/content';
import { dayStatus, nextLabel, timeline } from '$lib/format';
import type { LayoutServerLoad } from './$types';

// what every page needs: the settings, and what's showing for the now line.
export const load: LayoutServerLoad = async ({ locals }) => {
	const source = content();
	const now = source.now();
	const [settings, exhibitions, updated] = await Promise.all([
		source.settings(),
		source.exhibitions(),
		source.updated()
	]);
	const { current, next } = timeline(exhibitions, now);

	return {
		settings,
		lang: locals.lang,
		now: now.toISOString(),
		showing: current
			? {
					number: current.number,
					title: current.title,
					day: dayStatus(current, now),
					next: nextLabel(next, now)
				}
			: null,
		updated,
		// cloudflare's person-check for the visitors' book and the contact form.
		turnstile: env.PUBLIC_TURNSTILE_SITE_KEY || null,
		// only inside the studio's preview tab: what the preview bar offers.
		preview: locals.preview
			? {
					asOf: locals.preview.asOf,
					// so the preview page hears every change, discards included (the studio
					// only announces edits). a read-only key, sent only on preview pages,
					// which only the studio can open and nothing caches.
					listen: {
						projectId: secret.SANITY_PROJECT_ID,
						dataset: secret.SANITY_DATASET || 'production',
						token: previewToken()
					},
					// the ones not open yet (by the real clock), to see as on their opening day.
					upcoming: timeline(exhibitions, new Date()).upcoming.map((e) => ({
						number: e.number,
						title: e.title,
						opens: e.opens,
						ready: Boolean(e.ready)
					}))
				}
			: null
	};
};
