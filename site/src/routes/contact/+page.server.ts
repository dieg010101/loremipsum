import type { Actions } from './$types';
import { client } from '$lib/server/sanityClient';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

async function sendEmail(data: Record<string, string>) {
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.CONTACT_FROM,
			to: [env.CONTACT_TO],
			reply_to: data.email,
			subject: `New contact message from ${data.name}`,
			text: `Name: ${data.name}
Email: ${data.email}
Business: ${data.business ?? '-'}
Business description:
${data.bizDesc}

Project description:
${data.projDesc}
`,
			html: `
        <h2>New contact message</h2>
        <p><b>Name:</b> ${escapeHtml(data.name)}</p>
        <p><b>Email:</b> ${escapeHtml(data.email)}</p>
        <p><b>Business:</b> ${escapeHtml(data.business ?? '-')}</p>
        <p><b>Business description:</b><br/>${nl2br(escapeHtml(data.bizDesc))}</p>
        <p><b>Project description:</b><br/>${nl2br(escapeHtml(data.projDesc))}</p>
      `
		})
	});
	if (!res.ok) {
		const msg = await res.text();
		throw new Error(`Email send failed: ${msg}`);
	}
}

function escapeHtml(s = '') {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
function nl2br(s = '') {
	return s.replace(/\n/g, '<br/>');
}

/** Optional Cloudflare Turnstile verification (quiet) */
async function verifyTurnstile(token?: string, remoteip?: string) {
	const secret = env.TURNSTILE_SECRET_KEY;
	if (!secret) return true; // disabled → allow
	if (!token) return false;

	const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			secret,
			response: token,
			...(remoteip ? { remoteip } : {})
		})
	});
	const out = await resp.json().catch(() => ({}));
	return Boolean(out?.success);
}

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const form = await request.formData();
		const data = Object.fromEntries(form) as Record<string, string>;

		// Honeypots (if any filled → drop silently; do NOT save or email)
		const honeypots = ['website', 'subject', 'nickname'];
		if (honeypots.some((k) => (data[k] ?? '').trim() !== '')) {
			throw redirect(303, '/contact?sent=1');
		}

		// Required
		const required = ['name', 'email', 'bizDesc', 'projDesc'] as const;
		if (required.some((k) => !data[k]?.toString().trim())) {
			return fail(400, { missing: true });
		}

		// Turnstile (if enabled)
		const token = data['cf-turnstile-response'];
		const ok = await verifyTurnstile(token, getClientAddress?.());
		if (!ok) {
			// Treat as spam; do nothing but pretend success
			throw redirect(303, '/contact?sent=1');
		}

		// Store + email
		try {
			await client.create({
				_type: 'contactMessage',
				name: data.name,
				email: data.email,
				business: data.business,
				bizDesc: data.bizDesc,
				projDesc: data.projDesc,
				createdAt: new Date().toISOString()
			});
			await sendEmail(data);
		} catch (err) {
			console.error('contact submit error', err);
			return fail(500, { error: true });
		}

		throw redirect(303, '/contact?sent=1');
	}
};
