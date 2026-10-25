<script lang="ts">
	import './error.css';
	import { page } from '$app/state';

	const missing = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{missing ? 'not found' : 'error'} · lorem ipsum art group</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="cols error-page">
	<div class="error-page__body">
		<p class="label">{page.status}</p>
		<p class="error-page__text">
			{#if missing}
				this page does not exist. we may have been thinking about it for way too long.
			{:else}
				something went wrong on our side. please try again in a minute.
			{/if}
		</p>
		<p class="link-row">
			{#if page.data.featuredExhibition}
				<a class="link" href="/exhibitions/{page.data.featuredExhibition}"
					>see the current exhibition</a
				>
			{/if}
			<a class="link" href="/">back to home</a>
		</p>
	</div>
</div>
