<script lang="ts">
	import './newsletter-form.css';
	import { looksLikeEmail } from '$lib/email';
	import { newsletter, markSignedUp } from '$lib/newsletter.svelte';

	type Props = {
		tag?: 'newsletter' | 'webstore';
		button?: string;
		success?: string;
		// header: one line, input then button. wide: input stretches, button on the right.
		variant?: 'header' | 'wide';
		input?: HTMLInputElement;
		onsuccess?: () => void;
	};

	let {
		tag = 'newsletter',
		button = 'sign up',
		success = 'you are on the list. thank you.',
		variant = 'wide',
		input = $bindable(),
		onsuccess
	}: Props = $props();

	let email = $state('');
	let sending = $state(false);
	let error = $state('');
	// the webstore notify form is separate from the newsletter list.
	let done = $state(false);
	const finished = $derived(done || (tag === 'newsletter' && newsletter.signedUp));

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		if (!looksLikeEmail(email)) {
			error = 'that email does not look right.';
			return;
		}
		sending = true;
		try {
			const res = await fetch('/newsletter', {
				method: 'POST',
				body: new FormData(event.currentTarget as HTMLFormElement)
			});
			if (res.ok) {
				done = true;
				if (tag === 'newsletter') markSignedUp();
				onsuccess?.();
			} else {
				const body = await res.json().catch(() => ({}));
				error =
					body.error === 'invalid'
						? 'that email does not look right.'
						: 'something went wrong. please try again.';
			}
		} catch {
			error = 'something went wrong. please try again.';
		} finally {
			sending = false;
		}
	}
</script>

{#if finished}
	<p class="newsletter-form__done" role="status">{success}</p>
{:else}
	<form
		class="newsletter-form newsletter-form--{variant}"
		method="POST"
		action="/newsletter"
		novalidate
		onsubmit={submit}
	>
		<input type="hidden" name="tag" value={tag} />
		<input
			class="newsletter-form__trap"
			type="text"
			name="website"
			tabindex="-1"
			autocomplete="off"
			aria-hidden="true"
		/>
		<div class="newsletter-form__row">
			<input
				bind:this={input}
				bind:value={email}
				class="input newsletter-form__input"
				type="email"
				name="email"
				inputmode="email"
				autocomplete="email"
				placeholder="your email"
				aria-label="your email"
				aria-invalid={error ? 'true' : undefined}
				oninput={() => (error = '')}
			/>
			<button class="link newsletter-form__button" type="submit" disabled={sending}>
				{sending ? 'sending…' : button}
			</button>
		</div>
		{#if error}
			<p class="error newsletter-form__error" role="alert">{error}</p>
		{/if}
	</form>
{/if}
