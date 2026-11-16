<script lang="ts">
	import './webring.css';
	import { sp } from '$lib/spaces';

	type Link = { number: number; title: string } | null;
	// next is a link once it has opened; before that, just its date.
	type Props = { before: Link; next: Link; nextLabel: string };
	let { before, next, nextLabel }: Props = $props();
</script>

<!-- one row on a computer; on a phone, one per line (the gaps go). -->
<nav class="webring" aria-label="the exhibitions, one after another">
	<p class="webring__links">
		<span class="webring__item"
			>←{sp(2)}{#if before}<a href="/exhibitions/{before.number}" rel="prev"
					><em>{before.title}</em></a
				>{:else}this is the first one{/if}</span
		><span class="webring__gap">{sp(10)}</span><span class="webring__item"
			><a href="/exhibitions">all exhibitions</a></span
		><span class="webring__gap">{sp(10)}</span><span class="webring__item"
			><a href="/exhibitions/random" data-sveltekit-preload-data="off" data-sveltekit-reload
				>a random one</a
			></span
		><span class="webring__gap">{sp(10)}</span><span class="webring__item"
			>{#if next}<a href="/exhibitions/{next.number}" rel="next"><em>{next.title}</em></a
				>{:else}next: {nextLabel}{/if}{sp(2)}→</span
		>
	</p>
	<p class="webring__note">
		the exhibitions are linked like a webring: each one points to the one before and the one after.
	</p>
</nav>
