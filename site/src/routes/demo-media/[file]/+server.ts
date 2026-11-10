import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// the demo's video and sound, served in pieces. cloudflare pages answers every request
// for a static file with the whole file (200), but players ask for byte ranges (206):
// safari won't play at all without them, and nobody can skip ahead. this asks the
// pages asset store for the file and hands back just the bytes asked for.
// real works don't need it: sanity's cdn answers ranges itself.

const TYPES: Record<string, string> = {
	mp4: 'video/mp4',
	mp3: 'audio/mpeg',
	vtt: 'text/vtt; charset=utf-8'
};

type Assets = { fetch: (request: Request | string | URL) => Promise<Response> };

export const GET: RequestHandler = async ({ params, request, url, fetch, platform }) => {
	const ext = params.file.match(/^[\w-]+(?:\.[a-z]{2})?\.(mp4|mp3|vtt)$/)?.[1];
	if (!ext) error(404, 'not here');

	const source = new URL(`/demo/${params.file}`, url);
	const assets = (platform as { env?: { ASSETS?: Assets } } | undefined)?.env?.ASSETS;
	const res = assets ? await assets.fetch(source) : await fetch(source);
	if (!res.ok) error(404, 'not here');
	const bytes = new Uint8Array(await res.arrayBuffer());
	const size = bytes.byteLength;

	const headers: Record<string, string> = {
		'content-type': TYPES[ext],
		'accept-ranges': 'bytes',
		'cache-control': 'public, max-age=86400'
	};

	const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
	if (!range) {
		return new Response(bytes, { headers: { ...headers, 'content-length': String(size) } });
	}

	// "bytes=0-1", "bytes=500-" or the last n: "bytes=-500".
	let start = range[1] ? Number(range[1]) : size - Number(range[2]);
	let end = range[1] && range[2] ? Number(range[2]) : size - 1;
	start = Math.max(0, start);
	end = Math.min(end, size - 1);
	if (!(start <= end) || start >= size) {
		return new Response(null, {
			status: 416,
			headers: { ...headers, 'content-range': `bytes */${size}` }
		});
	}
	return new Response(bytes.subarray(start, end + 1), {
		status: 206,
		headers: {
			...headers,
			'content-range': `bytes ${start}-${end}/${size}`,
			'content-length': String(end - start + 1)
		}
	});
};
