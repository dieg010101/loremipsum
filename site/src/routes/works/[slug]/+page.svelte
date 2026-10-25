<script lang="ts">
	import './work.css';
	import { afterNavigate } from '$app/navigation';
	import Carousel from '$lib/components/Carousel.svelte';

	let { data } = $props();

	const work = $derived(data.work);
	// after the show, its dates say when the work was shown.
	const showDates = $derived(data.show?.past ? `, ${data.show.dates}` : '');
	const inquireHref = $derived(`/contact?topic=sales&regarding=${encodeURIComponent(work.line)}`);
	const details = $derived(
		[
			['artist', work.artist],
			['title', work.title],
			['date', String(work.year)],
			['medium', work.medium],
			['dimensions', work.dimensions],
			['credit', work.credit],
			['availability', work.availability]
		].filter((d): d is [string, string] => !!d[1])
	);

	// "back" returns to wherever the visitor came from on this site, else to the works.
	let cameFromSite = $state(false);
	afterNavigate(({ from }) => (cameFromSite = !!from));

	function back(event: MouseEvent) {
		if (!cameFromSite) return;
		event.preventDefault();
		history.back();
	}
</script>

<svelte:head>
	<title>{work.line} · lorem ipsum art group</title>
	<meta name="description" content={work.description?.slice(0, 160) ?? work.line} />
	<meta property="og:title" content={work.line} />
	{#if data.shareImage}
		<meta property="og:image" content={data.shareImage} />
	{/if}
</svelte:head>

<article class="cols work">
	<!-- back and previous / next share the top line, so nothing on the page
	     (a long description, a sold work) can move them while stepping through. -->
	<div class="work__top">
		<a class="link work__back" href="/works" onclick={back}>&lt;----- (back)</a>
		{#if data.previous || data.next}
			<nav class="work__walk" aria-label="works in this exhibition">
				{#if data.previous}
					<a class="link" href="/works/{data.previous.slug}" rel="prev" title={data.previous.text}
						>≤ previous work</a
					>
				{/if}
				{#if data.next}
					<a
						class="link work__next"
						href="/works/{data.next.slug}"
						rel="next"
						title={data.next.text}>next work ≥</a
					>
				{/if}
			</nav>
		{/if}
	</div>

	<div class="work__media">
		{#key work.slug}
			<Carousel
				mode="pair"
				images={work.images}
				zoomable
				sizes="(min-width: 1024px) 32vw, (min-width: 600px) 50vw, 100vw"
			/>
		{/key}
	</div>

	<div class="work__details">
		{#each details as [label, value] (label)}
			<div class="field">
				<p class="label">{label}</p>
				<p>{value}</p>
			</div>
		{/each}

		{#if data.show}
			<div class="field">
				<p class="label">exhibition</p>
				<p>
					{data.show.past ? 'shown in' : 'on view in'}
					<a class="plain-link" href="/exhibitions/{data.show.slug}">{data.show.title}</a
					>{showDates}
				</p>
			</div>
		{/if}

		{#if work.description}
			<div class="field">
				<p class="label">description</p>
				<p>{work.description}</p>
			</div>
		{/if}

		{#if work.availability === 'available'}
			<p class="work__inquire"><a class="link" href={inquireHref}>inquire</a></p>
		{/if}
	</div>
</article>
