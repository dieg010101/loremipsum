<script lang="ts">
	import './corner-slip.css';
	import { onMount } from 'svelte';
	import NewsletterForm from './NewsletterForm.svelte';
	import { newsletter } from '$lib/newsletter.svelte';

	// desktop only. slides in after 20 seconds; × hides it for 30 days.
	const DELAY = 20_000;
	const SNOOZE_DAYS = 30;
	const STORAGE_KEY = 'newsletter-slip-closed';

	let visible = $state(false);
	let thanked = $state(false);

	function snoozed() {
		try {
			const closed = Number(localStorage.getItem(STORAGE_KEY));
			return closed > 0 && Date.now() - closed < SNOOZE_DAYS * 86_400_000;
		} catch {
			return false;
		}
	}

	function close() {
		visible = false;
		try {
			localStorage.setItem(STORAGE_KEY, String(Date.now()));
		} catch {
			// private mode: it stays closed for this visit.
		}
	}

	function signedUp() {
		thanked = true;
		setTimeout(() => (visible = false), 4000);
	}

	onMount(() => {
		if (newsletter.signedUp || snoozed() || !matchMedia('(min-width: 1024px)').matches) return;
		const timer = setTimeout(() => {
			// signed up in the header while waiting.
			if (!newsletter.signedUp) visible = true;
		}, DELAY);
		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<aside class="corner-slip" aria-label="newsletter">
		<div class="corner-slip__top">
			<p class="label">newsletter</p>
			<button class="link" type="button" aria-label="close" onclick={close}>×</button>
		</div>
		{#if thanked}
			<p class="corner-slip__text" role="status">you are on the list. see you at the opening.</p>
		{:else}
			<p class="corner-slip__text">get the next thesis first. one email per exhibition.</p>
			<NewsletterForm onsuccess={signedUp} />
		{/if}
	</aside>
{/if}
