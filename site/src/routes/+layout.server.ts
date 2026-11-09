import { env } from '$env/dynamic/public';
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
		turnstile: env.PUBLIC_TURNSTILE_SITE_KEY || null
	};
};
