import { json, redirect } from '@sveltejs/kit';
import { backend, BackendError } from '$lib/server/backend';
import { looksLikeEmail } from '$lib/email';
import type { RequestHandler } from './$types';

type Result = { ok: true; already?: boolean } | { error: 'invalid' | 'unavailable' | 'failed' };

// newsletter and "tell me when it opens" sign-ups go to the sheet (backend.ts),
// whose script sends the one email that asks the person to confirm.
async function subscribe(form: FormData, page: string): Promise<Result> {
	const email = String(form.get('email') ?? '').trim();
	const list =
		String(form.get('tag') ?? 'newsletter')
			.replace(/[^a-z0-9-]/gi, '')
			.slice(0, 40) || 'newsletter';

	// honeypot: bots fill every field; pretend it worked.
	if (String(form.get('website') ?? '') !== '') return { ok: true };
	if (!looksLikeEmail(email) || email.length > 254) return { error: 'invalid' };

	try {
		const { already } = await backend('subscribe', { email, list, page });
		return { ok: true, already: Boolean(already) };
	} catch (error) {
		console.error('newsletter', error);
		if (error instanceof BackendError && error.code === 'invalid') return { error: 'invalid' };
		return {
			error:
				error instanceof BackendError && error.code.startsWith('BACKEND_URL')
					? 'unavailable'
					: 'failed'
		};
	}
}

export const POST: RequestHandler = async ({ request, url }) => {
	const page = request.headers.get('referer') ?? '';
	const form = await request.formData();
	const result = await subscribe(form, page);

	// with javascript the form reads the answer; without it, go back to the page.
	if (request.headers.get('accept')?.includes('application/json')) {
		const status = 'ok' in result ? 200 : result.error === 'invalid' ? 400 : 502;
		return json(result, { status });
	}
	const back = page.startsWith(url.origin) ? new URL(page) : new URL('/', url);
	// the page shows the answer under the form it came from.
	const tag =
		String(form.get('tag') ?? 'newsletter')
			.replace(/[^a-z0-9-]/gi, '')
			.slice(0, 40) || 'newsletter';
	const anchor = String(form.get('form') ?? '')
		.replace(/[^a-z0-9-]/gi, '')
		.slice(0, 40);
	back.searchParams.set('signup', tag);
	back.searchParams.set(
		'newsletter',
		'ok' in result ? (result.already ? 'already' : 'done') : result.error
	);
	back.hash = anchor;
	redirect(303, back.pathname + back.search + back.hash);
};
