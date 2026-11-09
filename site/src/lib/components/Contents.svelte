<script lang="ts">
	import type { Work } from '$lib/types';
	import { sp } from '$lib/spaces';

	// on phones a second copy opens in place, so it takes its own id.
	let { works, id = 'contents' }: { works: Work[]; id?: string } = $props();
</script>

<nav class="contents" {id} aria-labelledby="{id}-title">
	<h2 class="strong" id="{id}-title">contents</h2>
	<ol>
		{#each works as work (work.index)}
			<li>
				{work.number}{sp(3)}{work.artist.name},
				<a href="#work-{work.index}"><em>{work.title}</em></a>{sp(3)}{work.medium}
			</li>
		{/each}
	</ol>
</nav>
