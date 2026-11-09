<script lang="ts">
	import './media.css';
	import type { Work } from '$lib/types';
	import { count } from '$lib/format';
	import { plain, wordCount } from '$lib/rich';
	import { sp } from '$lib/spaces';
	import { workHref } from '$lib/work';
	import RichText from './RichText.svelte';

	// an essay: its title, then the text with notes in the margin. in the exhibition
	// it's the first few paragraphs and a way to keep reading; on its own page, all of it.
	let {
		work,
		whole = false,
		heading = 3
	}: { work: Work; whole?: boolean; heading?: 2 | 3 } = $props();

	const text = $derived(work.text!);
	const shown = $derived(whole ? text.paragraphs : text.paragraphs.slice(0, text.excerpt));
	const more = $derived(text.moreWords ?? wordCount(text.paragraphs.slice(text.excerpt)));
</script>

<div class="essay">
	<svelte:element this={`h${heading}`} class="essay__title"><em>{work.title}</em></svelte:element>
	{#each shown as paragraph, i (i)}
		<div class="essay__paragraph">
			<p><RichText text={paragraph.text} /></p>
			{#if paragraph.note}<aside class="essay__note" aria-label="note">
					<RichText text={paragraph.note} />
				</aside>{/if}
		</div>
	{/each}
	<p class="essay__more">
		{#if !whole && more > 0}<a href={workHref(work)}>keep reading, {count(more)} more words</a
			>{/if}{#if text.pdf}{#if !whole && more > 0}{sp(2)}·{sp(2)}{/if}<a
				href={text.pdf.url}
				download>download as pdf{text.pdf.pages ? `, ${text.pdf.pages} pages` : ''}</a
			>{/if}{#if text.original}{sp(2)}·{sp(2)}<a href={text.original.href}>{text.original.label}</a
			>{/if}
	</p>
</div>
