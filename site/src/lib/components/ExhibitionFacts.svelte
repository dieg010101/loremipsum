<script lang="ts">
	import type { Exhibition } from '$lib/types';
	import { formatDate, newUntil, fileSize } from '$lib/format';
	import RichText from './RichText.svelte';
	import DownloadAll from './DownloadAll.svelte';

	type Link = { number: number; title: string } | null;
	type Props = {
		exhibition: Exhibition;
		now: Date;
		openCount: number;
		before: Link;
		after: Link;
		afterLabel: string;
		upcoming: (Link & { opens: string }) | null;
		zip: { entries: { name: string; url: string }[]; email: string };
	};
	let { exhibition: e, now, openCount, before, after, afterLabel, upcoming, zip }: Props = $props();

	const stillNew = $derived(newUntil(e) >= now);
</script>

<!-- six columns of facts under the title. -->
<div class="facts grid desktop-only">
	<p>
		<span class="strong">dates</span><br />opened {formatDate(e.opens)}<br />{#if stillNew}new until {formatDate(
				newUntil(e),
				false
			)},<br />then open for good{:else}open for good{/if}<br /><a
			href="/exhibitions/{e.number}/calendar.ics">add to calendar (.ics)</a
		>
	</p>
	<p>
		<span class="strong">with</span><br />{#each e.withLines.split('\n') as line, i (i)}{#if i}<br
				/>{/if}{line}{/each}
	</p>
	<p><span class="strong">organised by</span><br /><RichText text={e.organisedBy} /></p>
	<p><span class="strong">languages</span><br /><RichText text={e.languages} /></p>
	<p>
		<span class="strong">also available as</span><br /><a
			href="/exhibitions/{e.number}/exhibition.txt">one long text file (.txt)</a
		>{#if e.files.pdf}<br /><a href={e.files.pdf.url}
				>a pdf{e.files.pdf.pages
					? `, ${e.files.pdf.pages} pages`
					: fileSize(e.files.pdf.bytes)
						? `, ${fileSize(e.files.pdf.bytes)}`
						: ''}</a
			>{/if}<br /><DownloadAll
			href="/exhibitions/{e.number}/download.zip"
			label="download it all (.zip)"
			zip={e.files.zip?.url ?? null}
			bytes={e.files.zipBytes ?? e.files.zip?.bytes ?? null}
			entries={zip.entries}
			filename="lorem ipsum {e.number}, {e.title}.zip"
			email={zip.email}
			suffix={false}
		/>
	</p>
	<p>
		<span class="strong">exhibition {e.number} of {openCount}</span>{#if before}<br />before:
			<a href="/exhibitions/{before.number}"><em>{before.title}</em></a>{/if}<br />next: {#if after}<a
				href="/exhibitions/{after.number}"><em>{after.title}</em></a
			>{:else if upcoming}{afterLabel},
			<a href="/exhibitions/{upcoming.number}"><em>{upcoming.title}</em></a>{:else}{afterLabel}{/if}
	</p>
</div>
