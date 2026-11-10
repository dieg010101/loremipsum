import { error, redirect } from '@sveltejs/kit';
import { createClient } from '@sanity/client';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { env } from '$env/dynamic/private';
import { previewToken, startPreview } from '$lib/server/preview';

// the studio's preview tab opens this first, with a one-time secret it made. sanity
// checks the secret; if it's good, this browser gets the preview cookie.
export const GET = async ({ url, cookies }) => {
	const token = previewToken();
	if (!token) error(503, 'preview isn’t set up: SANITY_VIEWER_TOKEN is missing.');
	const client = createClient({
		projectId: env.SANITY_PROJECT_ID,
		dataset: env.SANITY_DATASET || 'production',
		apiVersion: '2025-02-19',
		useCdn: false,
		token
	});
	const { isValid, redirectTo = '/' } = await validatePreviewUrl(client, url.toString());
	if (!isValid) error(401, 'this preview link isn’t valid. open it from the studio.');
	await startPreview(cookies);
	// only ever to a page on this site.
	redirect(307, redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/');
};
