<script lang="ts">
	import './home.css';
	import Carousel from '$lib/components/Carousel.svelte';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
	import { focusNewsletter } from '$lib/newsletter.svelte';

	let { data } = $props();

	let index = $state(0);
	const slide = $derived(data.slides[index]);
	const paragraphs = $derived(data.settings.about.split(/\n\s*\n/).filter(Boolean));
	const showLabel = $derived(data.between ? 'last exhibition' : 'current exhibition');
	const dates = $derived(
		data.show && (data.between ? `${data.show.dates}. closed.` : data.show.dates)
	);
</script>

<svelte:head>
	<title>lorem ipsum art group</title>
	<meta
		name="description"
		content="lorem ipsum is a blank slate for discussion and experience, functioning both as a gallery and gathering space."
	/>
	<meta property="og:title" content="lorem ipsum art group" />
	{#if data.shareImage}
		<meta property="og:image" content={data.shareImage} />
	{/if}
</svelte:head>

<div class="cols home">
	{#if data.between || !data.show}
		<section class="home__next field" class:home__next--alone={!data.show}>
			<p class="label">next exhibition</p>
			<p>
				to be announced. <a class="plain-link" href="#newsletter" onclick={focusNewsletter}
					>sign up for the newsletter</a
				> to hear first.
			</p>
		</section>
	{/if}

	{#if data.show}
		<section class="home__hero">
			<p class="label home__hero-label">{showLabel}</p>
			{#if data.slides.length}
				<Carousel
					mode="hero"
					images={data.slides.map((s) => s.image)}
					sizes="(min-width: 1024px) 40vw, (min-width: 600px) 50vw, 100vw"
					bind:index
				/>
			{:else}
				<!-- holds the image's place until the show has images. -->
				<div class="home__placeholder" aria-hidden="true"></div>
			{/if}
			<!-- phones: the show's title and a one-line summary under the image. -->
			<div class="home__hero-caption">
				<a class="link" href="/exhibitions/{data.show.slug}">{data.show.title}</a>
				<p>{[dates, data.show.location].filter(Boolean).join(' · ')}</p>
			</div>
		</section>

		<!-- desktop: the show's details in the right column. -->
		<section class="home__info">
			{#if data.between}
				<div class="field">
					<p class="label">next exhibition</p>
					<p>
						to be announced. sign up for the
						<a class="plain-link" href="#newsletter" onclick={focusNewsletter}>newsletter</a> to hear
						first.
					</p>
				</div>
			{/if}
			<div class="field">
				<p class="label">{showLabel}</p>
				<p>{data.show.title}</p>
			</div>
			<div class="field">
				<p class="label">dates</p>
				<p>{dates}</p>
			</div>
			<div class="field">
				<p class="label">location</p>
				<p>{data.show.location ?? 'to be announced.'}</p>
			</div>
			{#if data.show.hours}
				<div class="field">
					<p class="label">hours</p>
					<p>{data.show.hours}</p>
				</div>
			{/if}
			<p class="field link-row">
				<a class="link" href="/exhibitions/{data.show.slug}">see the exhibition</a>
				{#if data.show.inviteUrl}
					<a class="link" href={data.show.inviteUrl} target="_blank" rel="noopener">invite</a>
				{/if}
			</p>
			{#if slide}
				<div class="field">
					<p class="label">this image</p>
					<a class="link" href={slide.href}>{slide.text}</a>
				</div>
			{/if}
		</section>
	{/if}

	<section class="home__about">
		<p class="label">about</p>
		<div class="prose">
			{#each paragraphs as paragraph, i (i)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</section>

	<section class="home__newsletter" id="newsletter">
		<p class="label">newsletter</p>
		<NewsletterForm />
	</section>
</div>
