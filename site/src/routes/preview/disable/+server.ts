import { redirect } from '@sveltejs/kit';
import { endPreview } from '$lib/server/preview';

// leaving preview: back to the published site.
export const GET = async ({ url, cookies }) => {
	endPreview(cookies);
	const to = url.searchParams.get('to') ?? '/';
	redirect(303, to.startsWith('/') && !to.startsWith('//') ? to : '/');
};
