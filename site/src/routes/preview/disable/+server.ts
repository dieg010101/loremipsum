import { redirect } from '@sveltejs/kit';
import { endPreview } from '$lib/server/preview';

export const GET = async ({ url, cookies }) => {
	endPreview(cookies);
	const to = url.searchParams.get('to') ?? '/';
	redirect(303, to.startsWith('/') && !to.startsWith('//') ? to : '/');
};
