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
