<script lang="ts">
	import { tick } from 'svelte';
	import './exhibitions.css';
	import { formatDate, formatTime, numberWord, summaryCredit } from '$lib/format';
	import { DOT, sp } from '$lib/spaces';
	import Newsletter from '$lib/components/Newsletter.svelte';

	let { data } = $props();
	let asking = $state(false);

	// opening it puts the keyboard straight into the field.
	async function ask() {
		asking = !asking;
		if (!asking) return;
		await tick();
		document.querySelector<HTMLInputElement>('#tell-me-list-box input[type="email"]')?.focus();
	}
	const so = $derived(numberWord(data.count));
</script>

<h1 class="page-title">exhibitions</h1>
<p class="exhibitions__intro desktop-only">
	{so} so far. every one is still open, exactly as it was on the day it opened.
</p>

{#if data.next}
	{@const next = data.next}
	<section class="exhibitions__group" aria-labelledby="next">
		<h2 class="strong" id="next">next</h2>
		<p class="exhibitions__row desktop-only">
			<span class="exhibitions__number">{next.number}</span><a href="/exhibitions/{next.number}"
				><em>{next.title}</em></a
			><span class="exhibitions__credit">— {summaryCredit(next)}</span>{sp(3)}opens {formatDate(
				next.opens
			)}, {formatTime(next.opens)}{sp(2)}·{sp(2)}<button
				class="link-button"
				type="button"
				aria-expanded={asking}
				aria-controls="tell-me-list-box"
				onclick={ask}>tell me when it opens</button
			>
		</p>
		<p class="exhibitions__row mobile-only">
			{next.number}{sp(2)}<a href="/exhibitions/{next.number}"><em>{next.title}</em></a>, from {formatDate(
				next.opens,
				false
			)}
		</p>
		{#if asking}
			<div class="exhibitions__ask" id="tell-me-list-box">
				<Newsletter
					label="your email, for one message on the day:"
					tag="exhibition-{next.number}"
					id="tell-me-list"
				/>
			</div>
		{/if}
	</section>
{/if}

{#each data.years as group (group.year)}
	<section class="exhibitions__group" aria-labelledby="year-{group.year}">
		<h2 class="strong" id="year-{group.year}">{group.year}</h2>
		<ol class="exhibitions__list">
			{#each group.exhibitions as e (e.number)}
				<li class="exhibitions__row">
					<span class="exhibitions__number">{e.number}</span><a href="/exhibitions/{e.number}"
						><em>{e.title}</em></a
					><span class="exhibitions__credit desktop-only"
						>— {summaryCredit(e)}{#if e.number === data.current}{sp(3)}(now showing){/if}</span
					>{#if e.number === data.current}<span class="mobile-only">{' '}(now)</span>{/if}
				</li>
			{/each}
		</ol>
	</section>
{/each}

<p class="exhibitions__also desktop-only">
	also: <a href="/index">every artist, a to z</a> and <a href="/index?sort=title">every work</a> are
	in the
	<a href="/index">index</a>.{sp(3)}<a href="/exhibitions/random" data-sveltekit-reload
		>a random exhibition</a
	>
</p>
