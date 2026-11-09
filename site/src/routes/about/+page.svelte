<script lang="ts">
	import './about.css';
	import RichText from '$lib/components/RichText.svelte';

	let { data } = $props();
</script>

<h1 class="page-title">about</h1>
<p class="about__intro"><RichText text={data.page.intro} /></p>

<div class="about__sections grid">
	{#each data.page.sections as section (section.heading)}
		<section class="about__section">
			<h2 class="strong">{section.heading}</h2>
			{#each section.body as paragraph, i (i)}<p><RichText text={paragraph} /></p>{/each}
		</section>
	{/each}
</div>
