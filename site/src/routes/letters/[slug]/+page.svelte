<script lang="ts">
	import './post.css';
	import { formatDate } from '$lib/format';
	import { sp } from '$lib/spaces';
	import RichText from '$lib/components/RichText.svelte';

	let { data } = $props();
	const post = $derived(data.post);
</script>

<article class="post">
	<p class="post__crumbs">
		<a href="/letters">letters</a>{sp(2)}→{sp(2)}<time datetime={post.date}
			>{formatDate(post.date)}</time
		>
	</p>
	<h1 class="post__title">{post.title}</h1>
	<p class="post__byline"><RichText text={post.byline} /></p>

	<div class="post__body">
		{#each post.paragraphs as paragraph, i (i)}
			<div class="post__paragraph grid">
				<p class="post__text"><RichText text={paragraph.text} /></p>
				{#if paragraph.note}<aside class="post__note" aria-label="note">
						<RichText text={paragraph.note} />
					</aside>{/if}
			</div>
		{/each}
	</div>

	<nav class="post__nav" aria-label="more letters">
		{#if data.older}<a href={data.older.href} rel="prev">← {data.older.title}</a>{sp(6)}{/if}<a
			href="/letters">all letters</a
		>{#if data.newer}{sp(6)}<a href={data.newer.href} rel="next">{data.newer.title} →</a>{/if}
	</nav>
</article>
