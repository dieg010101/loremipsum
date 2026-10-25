<script lang="ts">
	import './card.css';
	import type { Image } from '$lib/types';
	import Picture from './Picture.svelte';

	type Props = {
		href: string;
		image: Image | null;
		// link-styled lines under the image, e.g. artist and title.
		lines: string[];
		// a plain white line after them, e.g. "on view".
		note?: string;
		eager?: boolean;
	};

	let { href, image, lines, note, eager = false }: Props = $props();
</script>

<a class="card" {href}>
	<span class="card__image">
		{#if image}
			<Picture
				{image}
				{eager}
				sizes="(min-width: 1024px) 18vw, (min-width: 600px) 30vw, 46vw"
				class="card__img"
			/>
		{/if}
	</span>
	{#each lines as line, i (i)}
		<span class="card__line">{line}</span>
	{/each}
	{#if note}
		<span class="card__note">{note}</span>
	{/if}
</a>
