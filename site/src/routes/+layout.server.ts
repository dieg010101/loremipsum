import { env } from '$env/dynamic/public';
import { env as secret } from '$env/dynamic/private';
import { previewToken } from '$lib/server/preview';
import { content } from '$lib/server/content';
import { dayStatus, nextLabel, timeline } from '$lib/format';
import type { LayoutServerLoad } from './$types';

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
		turnstile: env.PUBLIC_TURNSTILE_SITE_KEY || null,
		preview: locals.preview
			? {
					asOf: locals.preview.asOf,
					listen: {
						projectId: secret.SANITY_PROJECT_ID,
						dataset: secret.SANITY_DATASET || 'production',
						token: previewToken()
					},
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
