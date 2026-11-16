import { error, redirect } from '@sveltejs/kit';
import { isOpen } from '$lib/format';
import { downloadZip } from 'client-zip';
import { content } from '$lib/server/content';
import { exhibitionNumber } from '$lib/server/exhibitions';
import { zipEntries } from '$lib/exhibition';
import type { RequestHandler } from './$types';

type Assets = { fetch: (request: Request | string | URL) => Promise<Response> };

export const GET: RequestHandler = async ({ params, url, fetch, platform }) => {
	const source = content();
	const e = await source.exhibition(exhibitionNumber(params.n));
	if (!e || !isOpen(e, source.now())) error(404, 'no such exhibition');

	if (e.files.zip?.url) redirect(302, e.files.zip.url);

	const entries = zipEntries(e);
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
