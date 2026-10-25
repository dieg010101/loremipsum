<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CornerSlip from '$lib/components/CornerSlip.svelte';
	import { loadNewsletterState } from '$lib/newsletter.svelte';

	let { children } = $props();

	// grid pages keep the copyright bottom left, clear of the cards.
	const gridPages = ['/works', '/webstore'];
	const footerSide = $derived(gridPages.includes(page.url.pathname) ? 'left' : 'right');

	onMount(loadNewsletterState);
</script>

<svelte:head>
	<meta property="og:site_name" content="lorem ipsum art group" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="canonical" href={page.url.origin + page.url.pathname} />
</svelte:head>

<Header />
<main>
	{@render children()}
</main>
<Footer side={footerSide} />
<CornerSlip />
