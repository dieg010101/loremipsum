<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { BOOK_LIMIT, readSigned, writeSigned } from '$lib/book';
	import { count } from '$lib/format';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Turnstile from './Turnstile.svelte';

	type Result = { error?: string; line?: string; signer?: string; sent?: boolean } | null;
	let { exhibition, result = null }: { exhibition: number; result?: Result } = $props();

	// the answer, when the form was posted without javascript: read once here so the
	// server render shows it (effects don't run there), then on every new answer.
	const answer = () => result;
	let line = $state(answer()?.line ?? '');
	let signer = $state(answer()?.signer ?? '');
	let error: string | null = $state(answer()?.error ?? null);
	let sent = $state(Boolean(answer()?.sent));
	let busy = $state(false);
	// how long the form has been open: a line sent within a few seconds is a bot's.
	let opened = 0;
	onMount(() => (opened = Date.now()));
	let checks = $state(0);
	let thanks: HTMLElement | undefined = $state();
	let textarea: HTMLTextAreaElement | undefined = $state();

	$effect.pre(() => {
		if (!result) return;
		line = result.line ?? '';
		signer = result.signer ?? '';
		error = result.error ?? null;
		sent = Boolean(result.sent);
	});

	const length = $derived(line.trim().length);

	function check() {
		if (!line.trim()) error = 'write a line first.';
		else if (length > BOOK_LIMIT) error = `${length} of ${BOOK_LIMIT}. a little shorter?`;
		else error = null;
		return !error;
	}
</script>

<p>what stayed with you? a line is enough. it goes up once we’ve read it, usually the same day.</p>
{#if sent}
	<p class="book__sent" role="status" tabindex="-1" bind:this={thanks}>
		thank you. it goes up once we’ve read it, usually the same day.<br /><button
			class="link-button"
			type="button"
			onclick={async () => {
				sent = false;
				line = '';
				await tick();
				textarea?.focus();
			}}>sign it again</button
		>
	</p>
{:else}
	<form
		class="book__form"
		method="post"
		action="/exhibitions/{exhibition}?/sign"
		novalidate
		use:enhance={({ cancel, formData }) => {
			if (!check()) {
				textarea?.focus();
				return cancel();
			}
			formData.set('elapsed', String(Date.now() - opened));
			busy = true;
			return async ({ result: answer, update }) => {
				busy = false;
				checks++;
				if (answer.type === 'success') {
					const book = answer.data?.book as { id?: string; token?: string } | undefined;
					if (book?.id && book.token)
						writeSigned(exhibition, [
							...readSigned(exhibition),
							{ id: book.id, token: book.token }
						]);
					sent = true;
					error = null;
					line = '';
					await tick();
					thanks?.focus();
				} else if (answer.type === 'failure') {
					error =
						(answer.data?.book as { error?: string } | undefined)?.error ??
						'that didn’t go through. try again in a moment.';
					textarea?.focus();
				} else {
					await update({ reset: false });
				}
			};
		}}
	>
		<label class="label" for="line-{exhibition}">your line</label>
		<textarea
			class="field book__line"
			id="line-{exhibition}"
			name="line"
			rows="3"
			bind:this={textarea}
			bind:value={line}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby="line-{exhibition}-count"
			oninput={() => error && check()}
		></textarea>
		<p id="line-{exhibition}-count" class="book__count" class:error aria-live="polite">
			{#if error}{error}{:else if length}{count(length)} of {BOOK_LIMIT}{/if}
		</p>
		<label class="label book__signer-label" for="signer-{exhibition}"
			>name or initials, and a city (both optional)</label
		>
		<input
			class="field book__signer"
			id="signer-{exhibition}"
			name="signer"
			type="text"
			autocomplete="off"
			maxlength="80"
			bind:value={signer}
		/>
		<input
			class="visually-hidden"
			type="text"
			name="website"
			tabindex="-1"
			autocomplete="off"
			aria-hidden="true"
		/>
		{#if page.data.turnstile}<Turnstile
				sitekey={page.data.turnstile}
				reset={checks}
				appearance="interaction-only"
			/>{/if}
		<button class="button book__button" type="submit">{busy ? 'signing…' : 'sign the book'}</button>
	</form>
{/if}
