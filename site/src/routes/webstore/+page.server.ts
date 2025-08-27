import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const isTrue = (v?: string) => (v ?? '').toLowerCase() === 'true';

export const load: PageServerLoad = async ({ url }) => {
	const STORE_OPEN = isTrue(env.STORE_OPEN);
	const STORE_PREVIEW_KEY = env.STORE_PREVIEW_KEY ?? '';
	if (!STORE_OPEN) {
		const key = url.searchParams.get('preview') ?? '';
		if (!STORE_PREVIEW_KEY || key !== STORE_PREVIEW_KEY) {
			throw redirect(307, '/coming-soon');
		}
	}
	return {};
};

export const prerender = false;
export const ssr = true;
