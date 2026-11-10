<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Offline from '$lib/components/Offline.svelte';
	import { isShortcut, keys } from '$lib/keys.svelte';
	import { onMount } from 'svelte';
	import { jsonld, whole } from '$lib/seo';

	let { children } = $props();

	const title = $derived(page.data.title ? `${page.data.title} · lorem ipsum` : 'lorem ipsum');
	const description = $derived(page.data.description ?? page.data.settings.description);
	// a page without a picture of its own is shared with the gallery's mark.
	const image = $derived(
		whole(page.url.origin, page.data.image) ?? `${page.url.origin}/web-app-manifest-512x512.png`
	);

	// "/" finds in the index, from anywhere. letters typed into a field are left alone.
	onMount(() => keys.load());

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== '/' || !isShortcut(event)) return;
		event.preventDefault();
		if (page.url.pathname === '/index') document.getElementById('find')?.focus();
		else goto('/index?find=');
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:site_name" content="lorem ipsum art group" />
	<meta property="og:type" content={page.data.type ?? 'website'} />
	<meta property="og:title" content={page.data.title ?? 'lorem ipsum'} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={page.url.href} />
	<meta property="og:image" content={image} />
	<meta name="twitter:card" content={page.data.image ? 'summary_large_image' : 'summary'} />
	<!-- a filtered or sorted view (?show=, ?sort=) is the same page: found under its plain address. -->
	{#if page.status === 200}<link rel="canonical" href={page.url.origin + page.url.pathname} />
	{:else}<meta name="robots" content="noindex" />{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags: built from our own data, with < escaped. -->
	{#if page.data.schema}{@html jsonld(page.data.schema)}{/if}
</svelte:head>

<a class="visually-hidden skip" href="#main">skip to the page</a>
<Header />
<main id="main" class="page" tabindex="-1">
	{@render children()}
</main>
<Footer />
<Offline />
