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
	// our own files: the asset store on cloudflare (a function can't fetch its own
	// site's static files over the network), kit's fetch for pages (the .txt).
	// sanity's files: a plain fetch. kit's would send this page's address along as
	// the origin, and the cdn refuses any origin not on its list (previews, say).
	const assets = (platform as { env?: { ASSETS?: Assets } } | undefined)?.env?.ASSETS;
	const get = async (address: string) => {
		const target = new URL(address, url);
		if (target.origin !== url.origin) return globalThis.fetch(target.href);
		if (assets) {
			const res = await assets.fetch(target);
			if (res.ok) return res;
		}
		return fetch(target.href);
	};
	async function* files() {
		// a file that won't come is left out, and the zip says so at the end.
		const missing: string[] = [];
		for (const entry of entries) {
			const res = await get(entry.url).catch((error: unknown) => {
				missing.push(`${entry.name} (${error instanceof Error ? error.message : 'failed'})`);
				return null;
			});
			if (!res) continue;
			if (!res.ok || !res.body) {
				console.error(`zip ${e!.number}: ${entry.url} → ${res.status}`);
				missing.push(`${entry.name} (${res.status})`);
				continue;
			}
			yield { name: entry.name, input: res };
		}
		if (missing.length)
			yield {
				name: 'missing.txt',
				input: `these didn't come through when the zip was made. the page has each of them, or write to us.\n\n${missing.join('\n')}\n`
			};
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
