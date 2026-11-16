<script lang="ts">
	import { sp } from '$lib/spaces';
	import type { Work } from '$lib/types';
	import { saleActions, saleText } from '$lib/format';
	import { askHref, buyHref } from '$lib/work';
	import RichText from './RichText.svelte';

	// the label on a phone: under the work. a wall label, like desktop's and the webstore's:
	// the number, the artist in bold, title and year, the lines, then the note and the price.
	let { work, onfull }: { work: Work; onfull?: () => void } = $props();

	const actions = $derived(saleActions(work.sale));

	function open(event: MouseEvent) {
		if (!onfull || event.metaKey || event.ctrlKey) return;
		event.preventDefault();
		onfull();
	}
</script>

<div class="tombstone">
	<p>
		{#if work.number}{work.number}<br />{/if}<strong>{work.artist.name}</strong><br /><em
			>{work.title}</em
		>, {work.year}
		{#each work.lines as line, i (i)}<br />{line}{/each}
	</p>
	<p class="tombstone__note">
		{#if work.note}<RichText text={work.note} /><br />{/if}{saleText(
			work.sale,
			work.medium
		)}{#if actions.buy}{sp(3)}<a href={buyHref(work)}>buy</a>{/if}{#if actions.ask}{sp(
				actions.buy ? 2 : 3
			)}<a href={askHref(work)}>ask about it</a>{/if}
		{#if work.medium === 'image' && work.image}<br /><a
				href={work.image.full}
				onclick={open}
				data-full>full size</a
			>{/if}
	</p>
</div>
