<script lang="ts">
	import { fileSize } from '$lib/format';

	// "download the exhibition": a ready-made zip if there is one, otherwise the
	// browser fetches every file and zips them itself, with a progress bar in text.
	type Entry = { name: string; url: string };
	type Props = {
		label: string;
		zip: string | null;
		bytes: number | null;
		entries: Entry[];
		filename: string;
		email: string;
		/** the size goes in brackets after the link: "(.zip, 210 mb)". */
		suffix?: boolean;
		/** the server's zip of the same files: the link's own address, without javascript. */
		href: string;
	};
	let { label, zip, bytes, entries, filename, email, suffix = true, href }: Props = $props();

	type Status =
		| { kind: 'idle' }
		| { kind: 'making'; percent: number }
		| { kind: 'ready'; url: string }
		| { kind: 'failed' };
	let status: Status = $state({ kind: 'idle' });

	const CELLS = 16;
	const bar = (percent: number) => {
		const filled = Math.round((percent / 100) * CELLS);
		return `[${'#'.repeat(filled)}${'.'.repeat(CELLS - filled)}]`;
	};

	async function make(event: MouseEvent) {
		// the ready-made one downloads itself; a new tab or "save link as" gets the server's.
		if (
			zip ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey ||
			event.button !== 0
		)
			return;
		event.preventDefault();
		if (status.kind === 'making') return;
		status = { kind: 'making', percent: 0 };
		try {
			const { downloadZip } = await import('client-zip');
			let loaded = 0;
			const total = bytes ?? 0;
			const counted = async function* () {
				for (const entry of entries) {
					const res = await fetch(entry.url);
					if (!res.ok || !res.body) throw new Error(`${entry.url}: ${res.status}`);
					const reader = res.body.getReader();
					const chunks: Uint8Array[] = [];
					for (;;) {
						const { done, value } = await reader.read();
						if (done) break;
						chunks.push(value);
						loaded += value.byteLength;
						if (total)
							status = {
								kind: 'making',
								percent: Math.min(99, Math.round((loaded / total) * 100))
							};
					}
					yield { name: entry.name, input: new Blob(chunks as BlobPart[]) };
				}
			};
			const blob = await downloadZip(counted()).blob();
			const url = URL.createObjectURL(blob);
			status = { kind: 'ready', url };
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
		} catch (error) {
			console.error('zip', error);
			status = { kind: 'failed' };
		}
	}

	const size = $derived(fileSize(bytes));
</script>

{#if status.kind === 'making'}
	<span role="status"
		>making the zip… {status.percent}%<br /><span class="mono">{bar(status.percent)}</span></span
	>
{:else if status.kind === 'ready'}
	<span role="status"
		>ready. if it didn’t start, <a href={status.url} download={filename}>download it here</a>.</span
	>
{:else if status.kind === 'failed'}
	<span role="status"
		>that didn’t work. <button class="link-button" type="button" onclick={make}>try again</button>,
		<a href={zip ?? href} download={filename}>download it straight from us</a>, or
		<a href="mailto:{email}?subject={encodeURIComponent(filename)}">write to us</a> and we’ll send it.</span
	>
{:else}
	<a href={zip ?? href} download={filename} onclick={make}>{label}</a>{#if suffix}{' '}(.zip{size
			? `, ${size}`
			: ''}){/if}
{/if}
