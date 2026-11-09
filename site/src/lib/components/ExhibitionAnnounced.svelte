<script lang="ts">
	import { tick } from 'svelte';
	import './exhibition-announced.css';
	import type { Exhibition } from '$lib/types';
	import { formatDate, formatTime, inDays } from '$lib/format';
	import { DOT } from '$lib/spaces';
	import RichText from './RichText.svelte';
	import Newsletter from './Newsletter.svelte';

	type Props = {
		exhibition: Exhibition;
		now: string;
		current: { number: number; title: string } | null;
	};
	let { exhibition: e, now, current }: Props = $props();

	let asking = $state(false);

	// opening it puts the keyboard straight into the field.
	async function ask() {
		asking = !asking;
		if (!asking) return;
		await tick();
		document.querySelector<HTMLInputElement>('#tell-me-box input[type="email"]')?.focus();
	}
</script>

<div class="announced">
	<p class="announced__kicker">
		exhibition {e.number}{DOT}opens {formatDate(e.opens)} at {formatTime(e.opens)}, {inDays(
			e.opens,
			new Date(now)
		)}
	</p>
	<h1 class="announced__title">{e.title}</h1>
	{#if e.announcedWith}<p class="announced__with">with {e.announcedWith}.</p>{/if}
	<div class="announced__text">
		{#each e.text as paragraph, i (i)}<p><RichText text={paragraph} /></p>{/each}
	</div>
	<p class="announced__links">
		<a href="/exhibitions/{e.number}/calendar.ics">add it to your calendar (.ics)</a>{DOT}<button
			class="link-button"
			type="button"
			aria-expanded={asking}
			aria-controls="tell-me-box"
			onclick={ask}>tell me when it opens</button
		> (one email, on the day)
	</p>
	{#if asking}
		<div class="announced__ask" id="tell-me-box">
			<Newsletter
				label="your email, for one message on the day:"
				tag="exhibition-{e.number}"
				id="tell-me-email"
			/>
		</div>
	{/if}
	{#if current}
		<p class="announced__until">
			until then: <a href="/exhibitions/{current.number}"><em>{current.title}</em></a> is showing,
			and every
			<a href="/exhibitions">earlier exhibition</a> is still open.
		</p>
	{/if}
</div>
