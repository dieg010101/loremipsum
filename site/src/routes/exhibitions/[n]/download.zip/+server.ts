import { error, redirect } from '@sveltejs/kit';
import { isOpen } from '$lib/format';
import { downloadZip } from 'client-zip';
import { content } from '$lib/server/content';
import { exhibitionNumber } from '$lib/server/exhibitions';
import { zipEntries } from '$lib/exhibition';
import type { RequestHandler } from './$types';

// the whole exhibition as one zip, streamed file by file as it's fetched, so nothing
// is held in memory. the page makes the same zip in the browser (with a progress bar);
// this is the address behind the link, for no javascript, "save link as" or a new tab.
type Assets = { fetch: (request: Request | string | URL) => Promise<Response> };

export const GET: RequestHandler = async ({ params, url, fetch, platform }) => {
	const source = content();
	const e = await source.exhibition(exhibitionNumber(params.n));
	if (!e || !isOpen(e, source.now())) error(404, 'no such exhibition');

	// a ready-made zip in sanity wins.
	if (e.files.zip?.url) redirect(302, e.files.zip.url);

	const entries = zipEntries(e);
	// on cloudflare a function can't fetch its own site's static files over the
	// network; it asks the asset store for them instead. pages (the .txt) still come
	// through kit's own fetch, and sanity's files from the cdn.
	const assets = (platform as { env?: { ASSETS?: Assets } } | undefined)?.env?.ASSETS;
	const get = async (address: string) => {
		const target = new URL(address, url);
		if (assets && target.origin === url.origin) {
			const res = await assets.fetch(target);
			if (res.ok) return res;
		}
		return fetch(target.href);
	};
	async function* files() {
		for (const entry of entries) {
			const res = await get(entry.url);
			if (!res.ok || !res.body) {
				console.error(`zip ${e!.number}: ${entry.url} → ${res.status}`);
				continue;
			}
			yield { name: entry.name, input: res };
		}
	}

	const name = `lorem ipsum ${e.number}, ${e.title}.zip`;
	const zip = downloadZip(files());
	return new Response(zip.body, {
		headers: {
			'content-type': 'application/zip',
			'content-disposition': `attachment; filename="lorem-ipsum-${e.number}.zip"; filename*=UTF-8''${encodeURIComponent(name)}`,
			'cache-control': 'public, max-age=3600'
		}
	});
};
