<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import type { BookEntry } from '$lib/types';
	import { readSigned, signature, writeSigned, type Signed } from '$lib/book';
	import { shortDate } from '$lib/format';
	import { sp } from '$lib/spaces';

	type Props = { exhibition: number; entries: BookEntry[]; dates?: boolean };
	let { exhibition, entries, dates = false }: Props = $props();

	// what this browser signed: only you see "you", and only you can take it down.
	let signed: Signed[] = $state([]);
	let removed: string[] = $state([]);
	onMount(() => (signed = readSigned(exhibition)));

	const mine = (id: string) => signed.find((s) => s.id === id);
	const shown = $derived(entries.filter((e) => !removed.includes(e.id)));
</script>

{#if shown.length === 0}
	<p class="book__empty">no entries yet. the first line is yours.</p>
{:else}
	<ul class="book__list" class:book__list--dated={dates}>
		{#each shown as entry (entry.id)}
			{@const you = mine(entry.id)}
			<li class="book__entry">
				{#if dates}<time class="book__date" datetime={entry.date}>{shortDate(entry.date)}</time
					>{/if}
				<div class="book__line-text">
					“{entry.line}”{sp(2)}{signature(entry, Boolean(you))}{#if you}<br />only you see “you”.{' '}
						<form
							class="book__takedown"
							method="post"
							action="/exhibitions/{exhibition}?/takedown"
							use:enhance={() =>
								async ({ result }) => {
									if (result.type !== 'success') return;
									removed = [...removed, entry.id];
									signed = signed.filter((s) => s.id !== entry.id);
									writeSigned(exhibition, signed);
								}}
						>
							<input type="hidden" name="id" value={entry.id} /><input
								type="hidden"
								name="token"
								value={you.token}
							/><button class="link-button" type="submit">take it down</button>
						</form>{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
