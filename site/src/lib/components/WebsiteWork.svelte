<script lang="ts">
	import './media.css';
	import { onMount } from 'svelte';
	import type { Work } from '$lib/types';
	import { sp } from '$lib/spaces';

	// a website, running in a frame of its own. it can't reach the page around it.
	let { website, title }: { website: NonNullable<Work['website']>; title: string } = $props();

	let loaded = $state(false);
	let phone = $state(false);
	let anyway = $state(false);

	onMount(() => {
		phone = website.needsComputer && matchMedia('(max-width: 759px)').matches;
	});

	const run = $derived(!phone || anyway);
</script>

{#if run}
	<div class="media-box media-box--website" style:--ratio={16 / 10} style:--color="#ffffff">
		<iframe
			class="media-box__frame"
			src={website.url}
			{title}
			loading="lazy"
			sandbox="allow-scripts allow-popups allow-forms allow-pointer-lock"
			allow="autoplay; fullscreen"
			referrerpolicy="no-referrer"
			onload={() => (loaded = true)}
		></iframe>
		{#if !loaded}
			<p class="media-box__note">
				loading the website…{sp(2)}<a href={website.url} target="_blank" rel="noopener"
					>open it in a new window</a
				>
			</p>
		{/if}
	</div>
{/if}
<!-- on a phone, until "open it anyway": no empty box, just these two lines. -->
<p class="media-controls" class:media-controls--alone={!run}>
	{#if !run}this one needs a computer.<br /><button
			class="link-button nowrap"
			type="button"
			onclick={() => (anyway = true)}>open it anyway</button
		>{sp(2)}·{sp(2)}{/if}<a class="nowrap" href={website.url} target="_blank" rel="noopener"
		>open it in a new window</a
	>{#if website.source}{sp(2)}·{sp(2)}<a
			class="nowrap"
			href={website.source}
			target="_blank"
			rel="noopener">view source</a
		>{/if}{#if website.note && run}{sp(2)}·{sp(2)}{website.note}{/if}
</p>
