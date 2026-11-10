<script lang="ts">
	import { edit } from '$lib/edit';
	import './privacy.css';
	import RichText from '$lib/components/RichText.svelte';

	let { data } = $props();
</script>

<h1 class="page-title">privacy</h1>
<p class="privacy__intro" data-sanity={edit('privacyPage', 'privacyPage', 'intro')}>
	<RichText text={data.page.intro} />
</p>

<dl class="privacy__sections">
	{#each data.page.sections as section (section.heading)}
		<div class="privacy__section grid">
			<dt class="strong">{section.heading}</dt>
			<dd>
				{#each section.body as paragraph, i (i)}<p><RichText text={paragraph} /></p>{/each}
			</dd>
		</div>
	{/each}
</dl>
