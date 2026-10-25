<script lang="ts">
	import './works.css';
	import Card from '$lib/components/Card.svelte';
	import Filter from '$lib/components/Filter.svelte';

	let { data } = $props();

	const options = $derived([
		{ label: 'all', href: '/works', current: !data.selected },
		...data.exhibitions.map((e) => ({
			label: e.title,
			href: `/works?exhibition=${e.slug}`,
			current: data.selected === e.slug
		}))
	]);
</script>

<svelte:head>
	<title>works · lorem ipsum art group</title>
	<meta name="description" content="every work shown at lorem ipsum art group, by exhibition." />
	<meta property="og:title" content="works · lorem ipsum art group" />
</svelte:head>

<div class="works">
	<aside class="works__side">
		<Filter label="exhibition" {options} />
	</aside>

	{#if data.works.length}
		<ul class="card-grid works__grid">
			{#each data.works as work, i (work.slug)}
				<li>
					<Card
						href="/works/{work.slug}"
						image={work.image}
						lines={[work.artist, `${work.title} (${work.year})`]}
						eager={i < 4}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="works__empty">
			<p>{data.emptyNote ?? 'works go up as artists are announced, one at a time.'}</p>
			<a
				class="link"
				href="https://instagram.com/{data.settings.instagram}"
				target="_blank"
				rel="noopener">@{data.settings.instagram} on instagram</a
			>
		</div>
	{/if}
</div>
