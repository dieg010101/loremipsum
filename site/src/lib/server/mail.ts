import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const escapeHtml = (s = '') =>
	s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

type Mail = { to: string; subject: string; text: string; replyTo?: string };

/** sends one email through resend. in dev without a key, it's printed instead. */
export async function sendMail({ to, subject, text, replyTo }: Mail) {
	if (!env.RESEND_API_KEY || !env.CONTACT_FROM) {
		if (dev) {
			console.info(`[mail] to ${to}: ${subject}\n${text}`);
			return;
		}
		throw new Error('RESEND_API_KEY and CONTACT_FROM must be set');
	}
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
		body: JSON.stringify({
			from: env.CONTACT_FROM,
			to: [to],
			reply_to: replyTo,
			subject,
			text,
			html: `<div style="font:13px/18px Helvetica,Arial,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</div>`
		})
	});
	if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

/** cloudflare turnstile, when it's switched on. */
export async function verifyTurnstile(token: string | null, ip?: string) {
	if (!env.TURNSTILE_SECRET_KEY) return true;
	if (!token) return false;
	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		body: new URLSearchParams({
			secret: env.TURNSTILE_SECRET_KEY,
			response: token,
			...(ip ? { remoteip: ip } : {})
		})
	}).catch(() => null);
	const out = await res?.json().catch(() => null);
	return Boolean(out?.success);
}
