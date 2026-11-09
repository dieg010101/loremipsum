<script lang="ts">
	import { sp } from '$lib/spaces';
	import type { Work } from '$lib/types';
	import { saleActions, saleText } from '$lib/format';
	import { askHref, buyHref, recordHref, workHref } from '$lib/work';

	type Props = {
		work: Work;
		/** opens the image at full size; without it, "full size" links to the file. */
		onfull?: () => void;
		/** on the work's own page, "details for the record" opens and closes in place. */
		ontogglerecord?: () => void;
	};

	let { work, onfull, ontogglerecord }: Props = $props();

	const actions = $derived(saleActions(work.sale));
	const full = $derived(work.medium === 'image' && work.image);

	function open(event: MouseEvent, fn?: () => void) {
		if (!fn || event.metaKey || event.ctrlKey || event.shiftKey) return;
		event.preventDefault();
		fn();
	}
</script>

<p class="label-text">
	{#if work.number}{work.number}<br />{/if}<em>{work.title}</em>, {work.year}<br />
	{#each work.lines as line, i (i)}{line}<br />{/each}<br />
	{saleText(work.sale, work.medium)}{#if actions.buy}{sp(3)}<a href={buyHref(work)}>buy</a
		>{/if}{#if actions.ask}{sp(actions.buy ? 2 : 3)}<a href={askHref(work)}>ask about it</a>{/if}<br
	/>
	{#if full}<a href={work.image?.full} onclick={(e) => open(e, onfull)}>full size</a>{sp(2)}{/if}<a
		href={workHref(work)}>link to this work</a
	>{sp(2)}<a href={recordHref(work)} onclick={(e) => open(e, ontogglerecord)}
		>details for the record</a
	>
</p>
