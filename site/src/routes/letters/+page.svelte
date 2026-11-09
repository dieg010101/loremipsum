<script lang="ts">
	import './letters.css';
	import { journalDate } from '$lib/format';
	import { sp } from '$lib/spaces';

	let { data } = $props();
	const href = (e: (typeof data.entries)[number]) => e.href ?? `/letters/${e.slug}`;
</script>

<h1 class="page-title">letters</h1>
{#if data.intro}<p class="page-intro">{data.intro}</p>{/if}

<ol class="journal">
	{#each data.entries as entry (entry.slug)}
		<li class="journal__row grid">
			<time datetime={entry.date}>{journalDate(entry.date)}</time>
			<p class="journal__title">
				<a href={href(entry)} rel={entry.href?.startsWith('http') ? 'noopener' : undefined}
					><em>{entry.title}</em></a
				>{sp(2)}({entry.kind}){#if entry.author}{sp(2)}— {entry.author}{/if}
			</p>
		</li>
	{/each}
</ol>
