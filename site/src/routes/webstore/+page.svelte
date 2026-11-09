<script lang="ts">
	import './webstore.css';
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { saleActions, storePrice } from '$lib/format';
	import { sp } from '$lib/spaces';
	import { askHref, buyHref } from '$lib/work';
	import { SHOW, SORT, apply, filterHref, readFilters } from './filters';

	let { data } = $props();

	const filters = $derived(readFilters(page.url.searchParams));
	const items = $derived(apply(data.items, filters));

	// on a phone, six at a time.
	const STEP = 6;
	let limit = $state(STEP);
	$effect.pre(() => {
		void filters.show;
		void filters.sort;
		limit = STEP;
	});

	// the keyboard moves on to the first of the new ones.
	async function more() {
		const first = limit;
		limit += STEP;
		await tick();
		document
			.querySelectorAll('.store__item')
			[first]?.querySelector<HTMLElement>('.store__caption a')
			?.focus();
	}
</script>

<h1 class="page-title">webstore</h1>
{#if data.intro}<p class="page-intro desktop-only">{data.intro}</p>{/if}

<nav class="store__filters" aria-label="filters">
	<span class="desktop-only"
		>show:{sp(2)}{#each SHOW as s, i (s.label)}{#if i}{sp(
					3
				)}{/if}{#if filters.show === s.key}<strong aria-current="true">{s.label}</strong>{:else}<a
					href={filterHref(filters, { show: s.key })}
					data-sveltekit-noscroll
					data-sveltekit-replacestate>{s.label}</a
				>{/if}{/each}{sp(10)}sort by:{sp(2)}{#each SORT as sort, i (sort)}{#if i}{sp(
					3
				)}{/if}{#if filters.sort === sort}<strong aria-current="true">{sort}</strong>{:else}<a
					href={filterHref(filters, { sort })}
					data-sveltekit-noscroll
					data-sveltekit-replacestate>{sort}</a
				>{/if}{/each}</span
	><span class="mobile-only"
		>show:{sp(1)}{#each SHOW.filter((s) => s.short) as s, i (s.label)}{#if i}{sp(
					2
				)}{/if}{#if filters.show === s.key}<strong aria-current="true">{s.short}</strong>{:else}<a
					href={filterHref(filters, { show: s.key })}
					data-sveltekit-noscroll
					data-sveltekit-replacestate>{s.short}</a
				>{/if}{/each}</span
	>
</nav>

{#if items.length === 0}
	<p class="store__empty" role="status">
		nothing here yet. <a href="/webstore" data-sveltekit-noscroll>show everything</a>
	</p>
{:else}
	<ul class="store__grid">
		{#each items as work, i (work.store?.slug)}
			{@const actions = saleActions(work.sale)}
			<li class="store__item" class:store__item--more={i >= limit}>
				<a
					class="store__image"
					href="/webstore/{work.store?.slug}"
					tabindex="-1"
					aria-hidden="true"
				>
					{#if work.image}
						<img
							src={work.image.src}
							srcset={work.image.srcset}
							sizes="(min-width: 760px) 25vw, 50vw"
							width={work.image.width}
							height={work.image.height}
							alt={work.image.alt}
							loading={i < 4 ? 'eager' : 'lazy'}
							fetchpriority={i < 4 ? 'high' : 'auto'}
							style:background={work.image.color}
							style:--ratio={work.image.width / work.image.height}
						/>
					{/if}
				</a>
				<p class="store__caption">
					{work.artist.name}<br /><a href="/webstore/{work.store?.slug}"><em>{work.title}</em></a
					><span class="desktop-only">, {work.year}</span><br />{storePrice(
						work.sale,
						work.medium
					)}<span class="desktop-only"
						>{#if actions.buy}{sp(3)}<a href={buyHref(work)}>buy</a>{/if}{#if actions.ask}{sp(
								actions.buy ? 2 : 3
							)}<a href={askHref(work)}>ask about it</a>{/if}</span
					>
				</p>
			</li>
		{/each}
	</ul>
	{#if items.length > limit}
		<p class="store__more mobile-only">
			<button class="link-button" type="button" onclick={more}
				>show {Math.min(STEP, items.length - limit)} more</button
			>
		</p>
	{/if}
{/if}
