<script lang="ts">
	import type { Work } from '$lib/types';
	import { fileSize, formatDateTime, hashGroups } from '$lib/format';
	import { sp } from '$lib/spaces';
	import { workKey } from '$lib/work';

	// the facts a registrar wants, in a fixed-width table.
	type Props = { work: Work; onclose?: () => void; title?: HTMLElement };
	let { work, onclose, title = $bindable() }: Props = $props();

	const rows = $derived(
		(
			[
				['work', workKey(work)],
				['added', formatDateTime(work.record.added)],
				[
					'file',
					work.record.file
						? `${work.record.file.name}, ${work.record.file.width} × ${work.record.file.height} px${work.record.file.bytes ? `, ${fileSize(work.record.file.bytes)}` : ''}`
						: null
				],
				['sha-256', work.record.sha256 ? hashGroups(work.record.sha256) : null],
				['photograph', work.record.photograph],
				['provenance', work.record.provenance],
				['rights', work.record.rights]
			] as [string, string | null][]
		).filter((r): r is [string, string] => Boolean(r[1]))
	);

	function close(event: MouseEvent) {
		if (!onclose) return;
		event.preventDefault();
		onclose();
	}
</script>

<h2 class="record__title" id="record-title" tabindex="-1" bind:this={title}>
	<span class="strong">details for the record</span>{sp(3)}<a href="#work" onclick={close}>close</a>
</h2>
<pre class="record__table">{rows.map(([key, value]) => key.padEnd(12) + value).join('\n')}</pre>
