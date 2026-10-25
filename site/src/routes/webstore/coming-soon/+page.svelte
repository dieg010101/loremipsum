<script lang="ts">
	import './coming-soon.css';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
</script>

<svelte:head>
	<title>webstore (coming soon) · lorem ipsum art group</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta
		name="description"
		content="lorem ipsum art group webstore: ephemera, one-of-ones, & tight curations."
	/>
</svelte:head>

<div class="cols coming-soon">
	<h1 class="label coming-soon__title">webstore (coming soon)</h1>
	<section class="coming-soon__body">
		<p>
			the opening suite is almost dressed: ephemera, one-of-ones, tight curations, staged for an
			entrance. give it a minute. check back shortly.
		</p>
		<NewsletterForm
			tag="webstore"
			button="notify me"
			success="thank you. we will email you once, when it opens."
		/>
		<p>we will email you once, when it opens.</p>
		<a class="link" href="/">back to home</a>
	</section>
</div>
