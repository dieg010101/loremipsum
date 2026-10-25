<script lang="ts">
	import './webstore.css';
	import { page } from '$app/state';
	import Card from '$lib/components/Card.svelte';
	import Filter from '$lib/components/Filter.svelte';
	import type { Image } from '$lib/types';

	type Product = {
		slug: string;
		artist: string;
		title: string;
		price: number;
		category: string;
		image: Image | null;
	};

	// the store has no product source yet; connect one here when it opens.
	const products: Product[] = [];

	const CATEGORIES = [
		't-shirt',
		'hoodie',
		'jacket',
		'pants',
		'hat',
		'scarf',
		'pin',
		'ring',
		'zine',
		'poster',
		'book',
		'flyer',
		'vase',
		'figure',
		'object',
		'tool',
		'tote',
		'blanket',
		'pillow',
		'textile',
		'stickers',
		'tags'
	];

	// phones and tablets fold the price fields into a dropdown, like the categories.
	let priceOpen = $state(false);

	const params = $derived(page.url.searchParams);
	const q = $derived(params.get('q')?.trim().toLowerCase() ?? '');
	const category = $derived(params.get('category'));
	const min = $derived(Number(params.get('min')) || 0);
	const max = $derived(Number(params.get('max')) || Infinity);

	// every filter is a query parameter, so filtered views can be linked to
	// (and the ?preview key survives while the store is closed).
	function withParams(changes: Record<string, string | null>) {
		const next = new URLSearchParams(params);
		for (const [key, value] of Object.entries(changes)) {
			if (value) next.set(key, value);
			else next.delete(key);
		}
		const query = next.toString();
		return `/webstore${query ? `?${query}` : ''}`;
	}

	// the other filters, carried along as hidden fields when a form is sent.
	const others = (...own: string[]) => [...params].filter(([key]) => !own.includes(key));

	const categoryOptions = $derived([
		{ label: 'all', href: withParams({ category: null }), current: !category },
		...CATEGORIES.map((c) => ({
			label: c,
			href: withParams({ category: c }),
			current: category === c
		}))
	]);

	const shown = $derived(
		products.filter(
			(p) =>
				(!q || `${p.artist} ${p.title}`.toLowerCase().includes(q)) &&
				(!category || p.category === category) &&
				p.price >= min &&
				p.price <= max
		)
	);
</script>

<svelte:head>
	<title>webstore · lorem ipsum art group</title>
	<meta
		name="description"
		content="lorem ipsum art group webstore: ephemera, one-of-ones, & tight curations."
	/>
</svelte:head>

<div class="webstore">
	<aside class="webstore__side">
		<form class="webstore__search" method="GET" role="search">
			{#each others('q') as [name, value] (name)}<input type="hidden" {name} {value} />{/each}
			<input
				class="input"
				type="search"
				name="q"
				value={params.get('q') ?? ''}
				placeholder="search the store"
				aria-label="search the store"
			/>
			<button class="link" type="submit">search</button>
		</form>

		<Filter label="categories" options={categoryOptions} />

		<form class="webstore__price" method="GET">
			{#each others('min', 'max') as [name, value] (name)}<input
					type="hidden"
					{name}
					{value}
				/>{/each}
			<p class="webstore__price-head">
				<span class="label">price</span>
				<button
					class="link webstore__price-toggle"
					type="button"
					aria-expanded={priceOpen}
					aria-controls="price-fields"
					aria-label="show price options"
					onclick={() => (priceOpen = !priceOpen)}>v</button
				>
			</p>
			<div
				class="webstore__price-fields"
				class:webstore__price-fields--open={priceOpen}
				id="price-fields"
			>
				<input
					class="input"
					type="number"
					name="min"
					min="0"
					placeholder="from"
					aria-label="price from"
					value={params.get('min') ?? ''}
				/>
				<input
					class="input"
					type="number"
					name="max"
					min="0"
					placeholder="to"
					aria-label="price to"
					value={params.get('max') ?? ''}
				/>
				<p class="webstore__price-actions">
					<a class="link" href={withParams({ min: null, max: null })}>reset</a>
					<button class="link" type="submit">apply</button>
				</p>
			</div>
		</form>
	</aside>

	{#if shown.length}
		<ul class="card-grid">
			{#each shown as product, i (product.slug)}
				<li>
					<Card
						href="/webstore/{product.slug}"
						image={product.image}
						lines={[product.artist, product.title, `${product.price} usd`]}
						eager={i < 4}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="webstore__empty">
			{products.length ? 'nothing matches those filters.' : 'products go up when the store opens.'}
		</p>
	{/if}
</div>
