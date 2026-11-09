<script lang="ts">
	import './error.css';
	import { page } from '$app/state';
	import { sp } from '$lib/spaces';

	const missing = $derived(page.status === 404);
	const email = $derived(page.data.settings?.email ?? 'hello@loremipsum.art');
	const showing = $derived(page.data.showing);
	const report = $derived(
		`mailto:${email}?subject=${encodeURIComponent('a broken link')}&body=${encodeURIComponent(`this address didn’t work: ${page.url.href}`)}`
	);
</script>

<svelte:head><title>{missing ? 'not here' : 'something broke'} · lorem ipsum</title></svelte:head>

<div class="lost">
	<h1 class="lost__title">{missing ? 'this page isn’t here.' : 'something broke.'}</h1>
	<p class="lost__text">
		{#if missing}the address may be old, or mistyped. every exhibition stays open, so whatever was
			here is likely still somewhere close.{:else}it’s on our side, not yours. try again in a
			moment.{/if}<br /><br />{#if showing}<a href="/exhibitions/{showing.number}"
				>the current exhibition</a
			>{sp(3)}{/if}<a href="/exhibitions">every exhibition</a>{sp(3)}<a href="/index">the index</a
		>{sp(3)}<a href={report}>write to us about a broken link</a>
	</p>
</div>
