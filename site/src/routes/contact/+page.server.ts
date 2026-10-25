import type { Actions } from './$types';
import { sanityWrite as client } from '$lib/server/sanity';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { looksLikeEmail } from '$lib/email';

const TOPICS = ['general', 'press', 'sales', 'artists'];

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
Topic: ${data.topic}
Regarding: ${data.regarding || '-'}
Message:
${data.message}
`,
			html: `
        <h2>New contact message</h2>
        <p><b>Name:</b> ${escapeHtml(data.name)}</p>
        <p><b>Email:</b> ${escapeHtml(data.email)}</p>
        <p><b>Topic:</b> ${escapeHtml(data.topic)}</p>
        <p><b>Regarding:</b> ${escapeHtml(data.regarding || '-')}</p>
        <p><b>Message:</b><br/>${nl2br(escapeHtml(data.message))}</p>
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

async function verifyTurnstile(token?: string, remoteip?: string) {
	const secret = env.TURNSTILE_SECRET_KEY;
	if (!secret) return true;
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
		const honeypots = ['website', 'subject', 'nickname'];
		if (honeypots.some((k) => (data[k] ?? '').trim() !== '')) {
			throw redirect(303, '/contact?sent=1');
		}
		const values = {
			topic: TOPICS.includes(data.topic) ? data.topic : 'general',
			regarding: (data.regarding ?? '').trim(),
			name: (data.name ?? '').trim(),
			email: (data.email ?? '').trim(),
			message: (data.message ?? '').trim()
		};
		// each problem shows in red under its own field.
		const errors: Partial<Record<'name' | 'email' | 'message', string>> = {};
		if (!values.name) errors.name = 'please add your name.';
		if (!values.email) errors.email = 'please add your email.';
		else if (!looksLikeEmail(values.email)) errors.email = 'that email does not look right.';
		if (!values.message) errors.message = 'please add a message.';
		if (Object.keys(errors).length) {
			return fail(400, { values, errors });
		}
		Object.assign(data, values);
		const token = data['cf-turnstile-response'];
		const ok = await verifyTurnstile(token, getClientAddress?.());
		if (!ok) {
			throw redirect(303, '/contact?sent=1');
		}
		try {
			await client.create({
				_type: 'contactMessage',
				...values,
				createdAt: new Date().toISOString()
			});
			await sendEmail(data);
		} catch (err) {
			console.error('contact submit error', err);
			return fail(500, { values, failed: true });
		}

		throw redirect(303, '/contact?sent=1');
	}
};
