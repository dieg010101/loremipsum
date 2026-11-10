<script lang="ts">
	import { edit } from '$lib/edit';
	import './work-row.css';
	import type { Work } from '$lib/types';
	import WorkMedia from './WorkMedia.svelte';
	import WorkLabel from './WorkLabel.svelte';
	import WorkTombstone from './WorkTombstone.svelte';

	// one work: the work in four columns, its label in the last two. on a phone the
	// label goes underneath, with the artist's name and a note.
	type Props = {
		work: Work;
		eager?: boolean;
		whole?: boolean;
		onfull?: () => void;
		ontogglerecord?: () => void;
		id?: string;
		/** the level of the work's own heading (an essay's title): 3 in an exhibition. */
		heading?: 2 | 3;
	};
	let { work, eager, whole, onfull, ontogglerecord, id, heading = 3 }: Props = $props();
</script>

<!-- in an exhibition, j and k move the keyboard here (tabindex -1: reachable by script, not by tab). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex: it is only ever -1. -->
<article
	class="work-row grid"
	{id}
	data-work={work.index}
	data-sanity={edit('work', work.id, 'title')}
	tabindex={id ? -1 : undefined}
	aria-label="{work.number} {work.title}"
>
	<div class="work-row__media">
		<WorkMedia {work} {eager} {whole} {onfull} {heading} />
	</div>
	<div class="work-row__label desktop-only">
		<WorkLabel {work} {onfull} {ontogglerecord} />
	</div>
	<div class="work-row__tombstone mobile-only">
		<WorkTombstone {work} {onfull} />
	</div>
</article>
