<script lang="ts">
	import type { Work } from '$lib/types';

	// every work at a glance: small, uncropped, in a row that wraps.
	let { works }: { works: Work[] } = $props();
</script>

<ol class="sheet">
	{#each works as work (work.index)}
		<li>
			<a href="#work-{work.index}" aria-label="{work.number} {work.title}">
				{#if work.image}
					<img
						src={work.image.src}
						srcset={work.image.srcset}
						sizes="120px"
						width={work.image.width}
						height={work.image.height}
						alt=""
						loading="lazy"
						style:background={work.image.color}
					/>
				{:else}
					<span class="sheet__text">{work.medium}</span>
				{/if}
			</a>
			<span>{work.number}</span>
		</li>
	{/each}
</ol>
