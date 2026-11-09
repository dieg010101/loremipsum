<script lang="ts">
	import '../../error.css';
	import './newsletter.css';
	import { enhance } from '$app/forms';
	import { sp } from '$lib/spaces';

	let { data, form } = $props();

	// what you signed up for, in words.
	const thing = (exhibition: number | null) =>
		exhibition ? `one email when exhibition ${exhibition} opens` : 'our letters, about four a year';

	let busy = $state(false);
	const now = $derived(form?.left ? 'left' : (form?.state ?? data.state));
</script>

<div class="lost">
	{#if now === 'confirmed' || now === 'already'}
		<h1 class="lost__title">
			{now === 'already' ? 'you’re already on the list.' : 'thank you. you’re on the list.'}
		</h1>
		<p class="lost__text">
			you’ll get {thing(data.exhibition)}. every email has a link to leave.<br /><br /><a
				href="/exhibitions">every exhibition</a
			>{sp(3)}<a href="/letters">the letters</a>
		</p>
	{:else if now === 'left'}
		<h1 class="lost__title" tabindex="-1">done. you won’t hear from us again.</h1>
		<p class="lost__text">
			if you change your mind, you can sign up again at the bottom of any page.<br /><br /><a
				href="/">back to lorem ipsum</a
			>
		</p>
	{:else if now === 'ask'}
		<h1 class="lost__title">leave the list?</h1>
		<form
			class="lost__text"
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
					document.querySelector<HTMLElement>('.lost__title')?.focus();
				};
			}}
		>
			<p>you won’t get any more emails from lorem ipsum.</p>
			<p class="newsletter-leave">
				<button class="button" type="submit" disabled={busy}
					>{busy ? 'one moment…' : 'yes, take me off'}</button
				>
			</p>
		</form>
	{:else}
		<h1 class="lost__title" tabindex="-1">
			{now === 'expired' ? 'that link has expired.' : 'something broke on our side.'}
		</h1>
		<p class="lost__text">
			{#if now === 'expired'}links work until you sign up again, which sends a new one. you can sign
				up at the bottom of any page.{:else}try the link again in a moment. if it still doesn’t
				work, write to us and we’ll do it by hand.{/if}<br /><br /><a href="/"
				>back to lorem ipsum</a
			>
		</p>
	{/if}
</div>
