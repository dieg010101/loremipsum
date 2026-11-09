<script lang="ts">
	import './index.css';
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { count } from '$lib/format';
	import { sp } from '$lib/spaces';
	import { SHOW, SORT, filterHref, group, matches, readFilters, type Row } from './filters';

	let { data } = $props();

	const filters = $derived(readFilters(page.url.searchParams));
	const rows = $derived((data.rows as Row[]).filter((r) => matches(r, filters)));
	const groups = $derived(group(rows, filters.sort));
	const shownArtists = $derived(new Set(rows.map((r) => r.artist)).size);

	// "find…" opens a field; "/" anywhere on the site lands here with it open.
	let finding = $state(false);
	let query = $state('');
	let input: HTMLInputElement | undefined = $state();

	$effect.pre(() => {
		query = filters.q;
		if (filters.q || page.url.searchParams.has('find')) finding = true;
	});

	$effect(() => {
		if (finding && page.url.searchParams.has('find')) input?.focus();
	});

	async function openFind() {
		finding = true;
		await tick();
		input?.focus();
	}

	let timer: ReturnType<typeof setTimeout> | undefined;
	function oninput() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			goto(filterHref(filters, { q: query.trim() }), {
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
		}, 120);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		query = '';
		finding = false;
		goto(filterHref(filters, { q: '' }), { replaceState: true, noScroll: true });
	}

	const announce = $derived(
		rows.length === 0
			? 'no works match.'
			: `${count(rows.length)} ${rows.length === 1 ? 'work' : 'works'} shown, sorted by ${filters.sort}.`
	);

	const describe = $derived.by(() => {
		const parts = [
			filters.show ? (SHOW.find(([, m]) => m === filters.show)?.[0] ?? filters.show) : null,
			filters.forSale ? 'for sale' : null,
			filters.q || null
		].filter(Boolean);
		return parts.map((p) => `“${p === 'images' ? 'images' : p}”`).join(' and ');
	});
</script>

<h1 class="page-title">index</h1>
<p class="index__intro">
	every work in every exhibition, as text. {count(data.rows.length)} works by {count(data.artists)} artists.
</p>

<nav class="index__filters" aria-label="filters">
	show:{sp(2)}{#each SHOW as [label, medium], i (label)}{#if i}{sp(
				3
			)}{/if}{#if filters.show === medium}<strong aria-current="true">{label}</strong>{:else}<a
				href={filterHref(filters, { show: medium })}
				data-sveltekit-noscroll
				data-sveltekit-replacestate>{label}</a
			>{/if}{/each}{sp(3)}{#if filters.forSale}<a
			class="strong index__on"
			href={filterHref(filters, { forSale: false })}
			aria-current="true"
			data-sveltekit-noscroll
			data-sveltekit-replacestate>for sale</a
		>{:else}<a
			href={filterHref(filters, { forSale: true })}
			data-sveltekit-noscroll
			data-sveltekit-replacestate>for sale</a
		>{/if}{sp(10)}<span class="index__sort"
		>sort by:{sp(2)}{#each SORT as sort, i (sort)}{#if i}{sp(
					3
				)}{/if}{#if filters.sort === sort}<strong aria-current="true">{sort}</strong>{:else}<a
					href={filterHref(filters, { sort })}
					data-sveltekit-noscroll
					data-sveltekit-replacestate>{sort}</a
				>{/if}{/each}</span
	>{sp(10)}{#if finding}<label class="visually-hidden" for="find">find an artist or a work</label
		><input
			class="field index__find"
			id="find"
			type="search"
			autocomplete="off"
			spellcheck="false"
			bind:this={input}
			bind:value={query}
			{oninput}
			{onkeydown}
		/>{:else}<button class="link-button" type="button" onclick={openFind}>find…</button>{/if}
</nav>

<!-- always in the page, so every change of filter or search is read out. -->
<p class="visually-hidden" role="status">{announce}</p>

{#if filters.q && rows.length}
	<p class="index__found">
		{count(rows.length)}
		{rows.length === 1 ? 'work' : 'works'}, {shownArtists}
		{shownArtists === 1 ? 'artist' : 'artists'}
		{shownArtists === 1 && rows.length === 1 ? 'matches' : 'match'} “{filters.q}”.
	</p>
{/if}

{#if rows.length === 0}
	<p class="index__empty">
		nothing here for {describe} yet. <a href="/index" data-sveltekit-noscroll>show everything</a>
	</p>
{:else}
	<div class="index__table">
		{#each groups as g (g.key)}
			<section class="index__group" aria-labelledby="group-{g.key}">
				<h2 class="index__letter strong" id="group-{g.key}">{g.key}</h2>
				<ul>
					{#each g.rows as row (row.key)}
						<li class="index__row grid">
							<span>{row.artist}<span class="visually-hidden">,</span></span>
							<span class="index__title"><a href={row.href}><em>{row.title}</em></a></span>
							<span class="index__year"><span class="visually-hidden">, </span>{row.year}</span>
							<span class="index__medium"><span class="visually-hidden">, </span>{row.medium}</span>
							<span
								><span class="visually-hidden">, </span>{#if row.exhibition !== null}<a
										href="/exhibitions/{row.exhibition}"
										aria-label="exhibition {row.exhibition}">{row.exhibition}</a
									>{:else}<a href={row.href}>webstore</a>{/if}</span
							>
							<span class="index__sale"><span class="visually-hidden">, </span>{row.sale}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}
