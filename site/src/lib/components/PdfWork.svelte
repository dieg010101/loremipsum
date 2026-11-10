<script lang="ts">
	import './media.css';
	import type { Work } from '$lib/types';
	import { fileSize } from '$lib/format';
	import { sp } from '$lib/spaces';
	import { downloadWithProgress, megabytes, saveAs } from '$lib/download';
	import Picture from './Picture.svelte';

	// a book as a pdf: its cover, then read it here (page by page) or download it.
	let { pdf, artist }: { pdf: NonNullable<Work['pdf']>; artist: string } = $props();

	type Reader = { pages: number; page: number; render: (n: number) => Promise<void> };

	let reading = $state(false);
	let loading = $state(false);
	let failed = $state(false);
	let reader: Reader | null = $state(null);
	let canvas: HTMLCanvasElement | undefined = $state();

	const download = $derived(
		`download the pdf${pdf.file.pages ? `, ${pdf.file.pages} pages` : ''}${pdf.file.bytes ? `, ${fileSize(pdf.file.bytes)}` : ''}`
	);

	// saved under the book's title, not the file's name in the cdn.
	const name = $derived(`${pdf.title || 'book'}.pdf`);
	const saveHref = $derived(saveAs(pdf.file.url, name));

	// "downloading… 1.2 of 3 mb" while it comes in; the plain link if that can't work.
	let progress: string | null = $state(null);
	async function save(event: MouseEvent) {
		if (progress !== null || event.metaKey || event.ctrlKey || event.shiftKey) return;
		event.preventDefault();
		const of = (total: number | null) => fileSize(total ?? pdf.file.bytes) ?? 'mb';
		progress = `downloading… 0 of ${of(null)}`;
		try {
			await downloadWithProgress(pdf.file.url, name, (loaded, total) => {
				progress = `downloading… ${megabytes(loaded)} of ${of(total)}`;
			});
		} catch (error) {
			console.error('pdf download', error);
			location.href = saveHref;
		} finally {
			progress = null;
		}
	}

	// pdf.js is only fetched when someone asks to read here.
	async function read() {
		reading = true;
		loading = true;
		failed = false;
		try {
			const [pdfjs, worker] = await Promise.all([
				import('pdfjs-dist'),
				import('pdfjs-dist/build/pdf.worker.min.mjs?url')
			]);
			pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
			const doc = await pdfjs.getDocument(pdf.file.url).promise;
			const render = async (n: number) => {
				const pageObject = await doc.getPage(n);
				if (!canvas) return;
				const box = canvas.parentElement!.getBoundingClientRect();
				const base = pageObject.getViewport({ scale: 1 });
				const scale = (box.width / base.width) * (window.devicePixelRatio || 1);
				const viewport = pageObject.getViewport({ scale });
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				await pageObject.render({ canvas, viewport }).promise;
			};
			reader = { pages: doc.numPages, page: 1, render };
			loading = false;
			await render(1);
		} catch (error) {
			console.error('pdf reader', error);
			loading = false;
			failed = true;
		}
	}

	async function go(step: number) {
		if (!reader) return;
		const next = Math.min(reader.pages, Math.max(1, reader.page + step));
		if (next === reader.page) return;
		reader.page = next;
		await reader.render(next);
	}
</script>

<div class="pdf" class:pdf--reading={reading}>
	<div class="pdf__page" style:--ratio={148 / 210}>
		{#if reading}
			<canvas
				bind:this={canvas}
				class="pdf__canvas"
				aria-label="page {reader?.page ?? 1} of {pdf.title}"
			></canvas>
			{#if loading}<p class="media-box__note">opening the book…</p>{/if}
			{#if failed}<p class="media-box__note error" role="status">
					that didn’t open. <a href={pdf.file.url}>open the pdf</a> instead.
				</p>{/if}
		{:else if pdf.cover}
			<Picture
				image={pdf.cover}
				title={pdf.title}
				sizes="(min-width: 760px) 30vw, 100vw"
				maxHeight={620}
			/>
		{:else}
			<!-- no cover image yet: a plain cover, set like the book's. -->
			<div class="pdf__cover" aria-label="the cover of {pdf.title}">
				<span class="pdf__cover-title">{pdf.title}</span>
				<span class="pdf__cover-square"></span>
				<span class="pdf__cover-artist">{artist}</span>
			</div>
		{/if}
	</div>
	{#if reading && reader}
		<p class="pdf__pager">
			page {reader.page} of {reader.pages}<br /><button
				class="link-button"
				type="button"
				onclick={() => go(-1)}
				aria-label="previous page">←</button
			>{sp(2)}<button class="link-button" type="button" onclick={() => go(1)} aria-label="next page"
				>→</button
			><br />{#if progress}<span role="status">{progress}</span>{:else}<a
					href={saveHref}
					download={name}
					onclick={save}>download</a
				>{/if}
		</p>
	{/if}
</div>
<p class="media-controls">
	{#if !reading}<button class="link-button" type="button" onclick={read}>read it here</button>{sp(
			2
		)}·{sp(2)}{/if}{#if progress}<span role="status">{progress}</span>{:else}<a
			href={saveHref}
			download={name}
			onclick={save}>{download}</a
		>{/if}
</p>
