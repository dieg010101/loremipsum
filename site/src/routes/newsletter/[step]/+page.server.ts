import { error, fail } from '@sveltejs/kit';
import { backend, BackendError } from '$lib/server/backend';
import type { Actions, PageServerLoad } from './$types';

type State = 'confirmed' | 'already' | 'ask' | 'expired' | 'failed';

const token = (url: URL) => (url.searchParams.get('token') ?? '').slice(0, 64);

const what = (list: string) => {
	const n = list.match(/^exhibition-(\d+)$/)?.[1];
	return n ? { exhibition: Number(n) } : { exhibition: null };
};

const failed = (e: unknown): State =>
	e instanceof BackendError && e.code === 'expired' ? 'expired' : 'failed';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	if (params.step !== 'confirm' && params.step !== 'leave') error(404, 'not here');
	setHeaders({ 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' });

	if (params.step === 'leave')
		return { step: 'leave' as const, state: 'ask' as State, ...what(''), title: 'leave the list' };

	let state: State;
	let list = '';
	try {
		const out = await backend('confirm', { token: token(url) });
		state = out.already ? 'already' : 'confirmed';
		list = out.list;
	} catch (e) {
		console.error('newsletter confirm', e);
		state = failed(e);
	}
	return { step: 'confirm' as const, state, ...what(list), title: 'signed up' };
};

export const actions: Actions = {
	default: async ({ params, url }) => {
		if (params.step !== 'leave') error(404, 'not here');
		try {
			const { list } = await backend('leave', { token: token(url) });
			return { left: true, ...what(list) };
		} catch (e) {
			console.error('newsletter leave', e);
			return fail(failed(e) === 'expired' ? 400 : 502, { state: failed(e) });
		}
	}
};
