<script lang="ts">
	import './exhibitions.css';
	import Card from '$lib/components/Card.svelte';
	import Filter from '$lib/components/Filter.svelte';
	import { focusNewsletter } from '$lib/newsletter.svelte';

	let { data } = $props();

	const STATUS_TEXT = { current: 'on view', upcoming: 'upcoming', past: 'past' } as const;

	const options = $derived(
		(['all', 'current', 'upcoming', 'past'] as const).map((s) => ({
			label: s,
			href: s === 'all' ? '/exhibitions' : `/exhibitions?status=${s}`,
			current: (data.status ?? 'all') === s
		}))
	);
	const showPlaceholder = $derived(
		data.nothingAhead && (!data.status || data.status === 'upcoming')
	);
</script>

<svelte:head>
	<title>exhibitions · lorem ipsum art group</title>
	<meta
		name="description"
		content="current, upcoming and past exhibitions at lorem ipsum art group."
	/>
	<meta property="og:title" content="exhibitions · lorem ipsum art group" />
</svelte:head>

<div class="exhibitions">
	<aside class="exhibitions__side">
		<Filter label="status" {options} foldsOnDesktop={false} />
	</aside>

	<ul class="card-grid exhibitions__grid">
		{#each data.exhibitions as e, i (e.slug)}
			<li>
				<Card
					href="/exhibitions/{e.slug}"
					image={e.image}
					lines={[`${e.title} (${e.year})`, e.dates]}
					note={STATUS_TEXT[e.status]}
					eager={i < 4}
				/>
			</li>
		{/each}
		{#if showPlaceholder}
			<li>
				<a class="card" href="#newsletter" onclick={focusNewsletter}>
					<span class="card__image"></span>
					<span class="card__line">next exhibition</span>
					<span class="card__line">to be announced</span>
					<span class="card__note">upcoming</span>
				</a>
			</li>
		{/if}
	</ul>
</div>
