/**
 * downloads a file while saying how far along it is, then hands it to the browser
 * to save. if anything goes wrong it throws, and the caller falls back to the plain
 * link (which always works, just without the progress).
 */
export async function downloadWithProgress(
	url: string,
	filename: string,
	onprogress: (loaded: number, total: number | null) => void
) {
	const res = await fetch(url);
	if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
	const total = Number(res.headers.get('content-length')) || null;
	const reader = res.body.getReader();
	const chunks: BlobPart[] = [];
	let loaded = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		loaded += value.byteLength;
		onprogress(loaded, total);
	}
	const blob = new Blob(chunks, {
		type: res.headers.get('content-type') ?? 'application/octet-stream'
	});
	const href = URL.createObjectURL(blob);
	const a = Object.assign(document.createElement('a'), { href, download: filename });
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

/** "1.2" (megabytes, one decimal), for "downloading… 1.2 of 3 mb". */
export const megabytes = (bytes: number) => (bytes / 1_000_000).toFixed(1).replace(/\.0$/, '');

/**
 * a link that saves the file instead of opening it. browsers ignore the download
 * attribute on another site's files, and sanity's are on cdn.sanity.io, so there
 * the cdn is asked to send it as a download, under a readable name. our own
 * files keep their address: the attribute works for them.
 */
export function saveAs(url: string, filename: string) {
	if (!url.startsWith('https://cdn.sanity.io/')) return url;
	const address = new URL(url);
	address.searchParams.set('dl', plainName(filename));
	return address.href;
}

/**
 * "caffè, 1.2 (side a).mp3" → "caffe-1.2-side-a.mp3". the cdn quietly ignores a name
 * with a space in it, and spells accents and commas out as %c3%a8 and %2c.
 */
export function plainName(filename: string) {
	return (
		filename
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^A-Za-z0-9._-]+/g, '-')
			.replace(/-+(\.|$)/g, '$1')
			.replace(/^-+/, '') || 'download'
	);
}

/** the file's own extension, "mp4", or the fallback when it has none. */
export const extension = (url: string, fallback: string) =>
	url
		.split('?')[0]
		.match(/\.(\w{2,4})$/)?.[1]
		?.toLowerCase() ?? fallback;
