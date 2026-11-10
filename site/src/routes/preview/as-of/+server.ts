import { error, redirect } from '@sveltejs/kit';
import { setAsOf } from '$lib/server/preview';

// "show it as on opening day": preview pretends it's that moment, so an exhibition
// that hasn't opened shows as it will on the day. ?at= an iso date, or nothing for today.
export const GET = async ({ url, cookies, locals }) => {
	if (!locals.preview) error(403, 'only in preview.');
	const at = url.searchParams.get('at');
	setAsOf(cookies, at && !Number.isNaN(Date.parse(at)) ? new Date(at).toISOString() : null);
	const to = url.searchParams.get('to') ?? '/';
	redirect(303, to.startsWith('/') && !to.startsWith('//') ? to : '/');
};
