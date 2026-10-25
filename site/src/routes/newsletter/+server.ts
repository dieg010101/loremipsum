import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { looksLikeEmail } from '$lib/email';
import type { RequestHandler } from './$types';

// newsletter and webstore sign-ups. each one is forwarded to NEWSLETTER_ENDPOINT
// (the google sheet script) as json: { email, tag, page, date }.
export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const email = String(form.get('email') ?? '').trim();
	const tag = form.get('tag') === 'webstore' ? 'webstore' : 'newsletter';

	// honeypot: bots fill every field; pretend it worked.
	if (String(form.get('website') ?? '') !== '') return json({ ok: true });
	if (!looksLikeEmail(email)) return json({ error: 'invalid' }, { status: 400 });

	if (!env.NEWSLETTER_ENDPOINT) {
		if (dev) {
			console.info(`[newsletter] ${tag}: ${email} (NEWSLETTER_ENDPOINT not set)`);
			return json({ ok: true });
		}
		console.error('newsletter sign-up dropped: NEWSLETTER_ENDPOINT is not set');
		return json({ error: 'unavailable' }, { status: 503 });
	}

	const res = await fetch(env.NEWSLETTER_ENDPOINT, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			email,
			tag,
			page: request.headers.get('referer') ?? '',
			date: new Date().toISOString()
		})
	}).catch((err) => {
		console.error('newsletter forward failed', err);
		return null;
	});

	if (!res?.ok) return json({ error: 'failed' }, { status: 502 });
	return json({ ok: true });
};
