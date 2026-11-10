import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// preview: the studio's "Preview" tab shows the site with unpublished drafts in it.
// only someone the studio sends here gets in (see routes/preview/enable): they get a
// signed cookie, the site reads drafts for them, and nothing they see is ever cached.
// visitors never get a cookie.

/** the cookie's name is also checked before the cache (scripts/preview-cache.mjs). */
export const PREVIEW_COOKIE = 'lorem-preview';
/** "show it as on opening day": the moment preview pretends it is. */
export const AS_OF_COOKIE = 'lorem-preview-as-of';

/** the studios that may show the site in their preview tab. the deployed studio also
 * opens inside sanity's dashboard (www.sanity.io), and a frame must allow every page
 * above it, so that one is here too. */
export const STUDIO_ORIGINS = [
	'https://loremipsumcms.sanity.studio',
	'https://www.sanity.io',
	'http://localhost:3333'
];

const HOURS = 8;

// inside the studio the site is a frame on another site, so the cookie has to be
// SameSite=None, and Partitioned so browsers that block third-party cookies keep it
// (it lives only inside the studio's frame).
const OPTIONS = {
	path: '/',
	httpOnly: true,
	secure: true,
	sameSite: 'none',
	partitioned: true,
	maxAge: HOURS * 3600
} as const;

/** the token that reads drafts: a sanity "Viewer" token, kept on the server. */
export const previewToken = () => env.SANITY_VIEWER_TOKEN || '';

async function sign(value: string) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(`lorem-preview:${previewToken()}`),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
	return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/=+$/, '');
}

export async function startPreview(cookies: Cookies) {
	const until = String(Date.now() + HOURS * 3600_000);
	cookies.set(PREVIEW_COOKIE, `${until}.${await sign(until)}`, OPTIONS);
}

export function endPreview(cookies: Cookies) {
	cookies.delete(PREVIEW_COOKIE, OPTIONS);
	cookies.delete(AS_OF_COOKIE, OPTIONS);
}

export function setAsOf(cookies: Cookies, iso: string | null) {
	if (iso) cookies.set(AS_OF_COOKIE, iso, OPTIONS);
	else cookies.delete(AS_OF_COOKIE, OPTIONS);
}

/** preview for this request, or null: the cookie has to be ours and not expired. */
export async function readPreview(cookies: Cookies): Promise<App.Locals['preview']> {
	const value = cookies.get(PREVIEW_COOKIE);
	if (!value || !previewToken()) return null;
	const [until, mac] = value.split('.');
	if (!until || !mac || Number(until) < Date.now() || mac !== (await sign(until))) return null;
	const asOf = cookies.get(AS_OF_COOKIE);
	return { asOf: asOf && !Number.isNaN(Date.parse(asOf)) ? asOf : null };
}
