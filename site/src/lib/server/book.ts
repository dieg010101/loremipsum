import { fail, type RequestEvent } from '@sveltejs/kit';
import { BOOK_LIMIT, splitSigner } from '$lib/book';
import { content } from './content';
import { verifyTurnstile } from './mail';

async function sha256(text: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type BookFailure = { book: { error: string; line: string; signer: string } };

/** the form actions behind every visitors' book. */
export const bookActions = {
	async sign({ request, params, getClientAddress }: RequestEvent) {
		const number = Number(params.n);
		const form = await request.formData();
		const line = String(form.get('line') ?? '')
			.trim()
			.replace(/\s+/g, ' ');
		const signer = String(form.get('signer') ?? '').slice(0, 80);

		// bots fill every field, and write faster than anyone can: thank them and move on.
		const elapsed = Number(form.get('elapsed') ?? NaN);
		const tooFast = Number.isFinite(elapsed) && elapsed < 3000;
		if (String(form.get('website') ?? '') || tooFast)
			return { book: { sent: true as const, id: '', token: '' } };

		if (!line) return fail(400, { book: { error: 'write a line first.', line, signer } });
		if (line.length > BOOK_LIMIT)
			return fail(400, {
				book: { error: `${line.length} of ${BOOK_LIMIT}. a little shorter?`, line, signer }
			});

		if (
			!(await verifyTurnstile(
				form.get('cf-turnstile-response') as string | null,
				getClientAddress()
			))
		)
			return fail(400, {
				book: { error: 'we couldn’t check you’re a person. try again in a moment.', line, signer }
			});

		const exhibition = await content().exhibition(number);
		if (!exhibition || exhibition.status !== 'open')
			return fail(404, { book: { error: 'this book isn’t open yet.', line, signer } });

		const token = crypto.randomUUID();
		try {
			const { id } = await content().sign(
				number,
				{ line, ...splitSigner(signer) },
				await sha256(token)
			);
			return { book: { sent: true as const, id, token } };
		} catch (error) {
			console.error('visitors’ book', error);
			return fail(502, {
				book: { error: 'that didn’t go through. try again in a moment.', line, signer }
			});
		}
	},

	async takedown({ request }: RequestEvent) {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const token = String(form.get('token') ?? '');
		if (!id || !token) return fail(400, { takedown: { ok: false } });
		const ok = await content().takeDown(id, await sha256(token));
		return ok ? { takedown: { ok: true, id } } : fail(403, { takedown: { ok: false } });
	}
};
