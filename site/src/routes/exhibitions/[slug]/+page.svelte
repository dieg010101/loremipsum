<script lang="ts">
	import './exhibition.css';
	import Carousel from '$lib/components/Carousel.svelte';

	let { data } = $props();

	const e = $derived(data.exhibition);
	const past = $derived(e.status === 'past');
	const email = $derived(data.settings.email);
</script>

<svelte:head>
	<title>{e.title} · lorem ipsum art group</title>
	<meta name="description" content={e.concept[0]?.slice(0, 160) ?? `${e.title}. ${e.dates}`} />
	<meta property="og:title" content={e.title} />
	<meta property="og:description" content={`${e.dates}${e.location ? ` · ${e.location}` : ''}`} />
	{#if data.shareImage}
		<meta property="og:image" content={data.shareImage} />
	{/if}
</svelte:head>

<article class="cols exhibition">
	<div class="exhibition__left">
		<section class="exhibition__facts">
			<div class="field">
				<p class="label">exhibition</p>
				<h1>{e.title}</h1>
			</div>
			<div class="field">
				<p class="label">dates</p>
				<p>{e.dates}</p>
			</div>
			<div class="field">
				<p class="label">location</p>
				<p>{e.location ?? 'to be announced.'}</p>
			</div>
			{#if e.hours}
				<div class="field">
					<p class="label">hours</p>
					<p>{e.hours}</p>
				</div>
			{/if}
			{#if e.inviteUrl || e.calendar || e.directions}
				<p class="field link-row">
					{#if e.inviteUrl}
						<a class="link" href={e.inviteUrl} target="_blank" rel="noopener">invite</a>
					{/if}
					{#if e.calendar}
						<a class="link" href={e.calendar} download>add to calendar</a>
					{/if}
					{#if e.directions}
						<a class="link" href={e.directions} target="_blank" rel="noopener">directions</a>
					{/if}
				</p>
			{/if}
		</section>

		{#if e.concept.length}
			<section class="exhibition__concept field">
				<h2 class="label">concept</h2>
				<div class="prose">
					{#each e.concept as paragraph, i (i)}
						<p>{paragraph}</p>
					{/each}
				</div>
			</section>
		{/if}
	</div>

	<div class="exhibition__middle">
		{#if e.images.length}
			<Carousel
				mode="single"
				images={e.images}
				zoomable
				sizes="(min-width: 1024px) 45vw, (min-width: 600px) 50vw, 100vw"
			/>
		{:else}
			<!-- holds the image's place until the first one is added. -->
			<div class="exhibition__placeholder" aria-hidden="true"></div>
		{/if}
	</div>

	<div class="exhibition__right">
		<section class="field">
			<h2 class="label">works</h2>
			{#if e.works.length}
				<ul class="exhibition__list">
					{#each e.works as work (work.slug)}
						<li class="exhibition__link">
							<a class="link" href="/works/{work.slug}">{work.text}</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p>{e.worksNote}</p>
			{/if}
		</section>

		{#if e.programs.length || !past}
			<section class="field">
				<h2 class="label">programs</h2>
				{#if e.programs.length}
					<ul class="exhibition__list">
						{#each e.programs as program, i (i)}
							<li>
								{program.text}
								{#if program.recordingUrl}
									<a class="link" href={program.recordingUrl} target="_blank" rel="noopener"
										>{program.recordingLabel}</a
									>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p>schedule coming soon.</p>
				{/if}
			</section>
		{/if}

		<section class="field">
			<h2 class="label">press</h2>
			<ul class="exhibition__list">
				{#if e.pressRelease}
					<li class="exhibition__link">
						<a class="link" href={e.pressRelease} target="_blank" rel="noopener"
							>press release (pdf)</a
						>
					</li>
				{/if}
				{#if e.pressKit}
					<li class="exhibition__link">
						<a class="link" href={e.pressKit} download>press kit (zip)</a>
					</li>
				{/if}
				<li>press inquiries: <a class="plain-link" href="mailto:{email}">{email}</a></li>
			</ul>
		</section>

		{#if past}
			{#if e.coverage.length}
				<section class="field">
					<h2 class="label">coverage</h2>
					<ul class="exhibition__list">
						{#each e.coverage as article (article.url)}
							<li class="exhibition__link">
								<a class="link" href={article.url} target="_blank" rel="noopener"
									>{article.publication}, {article.title}</a
								>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if e.photoCredit || e.photoArchive}
				<section class="field">
					<h2 class="label">documentation</h2>
					<ul class="exhibition__list">
						{#if e.photoCredit}<li>{e.photoCredit}</li>{/if}
						{#if e.photoArchive}
							<li class="exhibition__link">
								<a class="link" href={e.photoArchive} download>installation photos (zip)</a>
							</li>
						{/if}
					</ul>
				</section>
			{/if}

			<section class="field">
				<h2 class="label">next</h2>
				{#if e.next}
					<p>
						the next exhibition is <a class="plain-link" href="/exhibitions/{e.next.slug}"
							>{e.next.title}</a
						>.
					</p>
				{:else}
					<p>the next exhibition will be announced in the newsletter first.</p>
				{/if}
			</section>
		{/if}
	</div>
</article>
