import { error, redirect } from '@sveltejs/kit';
import { downloadZip } from 'client-zip';
import { content } from '$lib/server/content';
import { exhibitionNumber } from '$lib/server/exhibitions';
import { zipEntries } from '$lib/exhibition';
import type { RequestHandler } from './$types';

// the whole exhibition as one zip, streamed file by file as it's fetched, so nothing
// is held in memory. the page makes the same zip in the browser (with a progress bar);
// this is the address behind the link, for no javascript, "save link as" or a new tab.
export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const source = content();
	const e = await source.exhibition(exhibitionNumber(params.n));
	if (!e || new Date(e.opens) > source.now()) error(404, 'no such exhibition');

	// a ready-made zip in sanity wins.
	if (e.files.zip?.url) redirect(302, e.files.zip.url);

	const entries = zipEntries(e);
	async function* files() {
		for (const entry of entries) {
			const res = await fetch(new URL(entry.url, url).href);
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
