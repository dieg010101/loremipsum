<script lang="ts">
	import './contact.css';
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { sp } from '$lib/spaces';
	import { looksLikeEmail } from '$lib/email';
	import RichText from '$lib/components/RichText.svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';

	let { data, form } = $props();

	const email = $derived(page.data.settings.email);
	type Errors = Partial<Record<'name' | 'email' | 'message', string>>;
	type Sent = { name: string; email: string; back: string | null };
	type Result = {
		values?: { name: string; email: string; message: string; subject?: string };
		errors?: Errors;
		failed?: boolean;
		sent?: Sent;
	};

	// what the server said, with or without javascript. read once here so the server
	// render shows it too (effects don't run there), then again on every new answer.
	const result = () => form as Result | null;
	const draft = () => result()?.values ?? { name: '', email: '', message: data.message };

	let name = $state(draft().name);
	let address = $state(draft().email);
	let message = $state(draft().message);
	let errors: Errors = $state(result()?.errors ?? {});
	let failed = $state(Boolean(result()?.failed));
	let busy = $state(false);
	// each send uses up the person-check; a new one is asked for after every answer.
	let checks = $state(0);
	let sent: Sent | null = $state(result()?.sent ?? null);
	let formElement: HTMLFormElement | undefined = $state();
	let sentTitle: HTMLElement | undefined = $state();

	$effect(() => {
		if (sent) sentTitle?.focus();
	});

	$effect.pre(() => {
		const f = result();
		if (f?.sent) {
			sent = f.sent;
			return;
		}
		({ name, email: address, message } = draft());
		errors = f?.errors ?? {};
		failed = Boolean(f?.failed);
	});

	function check() {
		const next: Errors = {};
		if (!name.trim()) next.name = 'add your name, or what we should call you.';
		if (!address.trim()) next.email = 'add your email, so we can answer.';
		else if (!looksLikeEmail(address))
			next.email = address.includes('@')
				? 'that doesn’t look like an email address.'
				: 'that doesn’t look like an email address. is the @ missing?';
		if (!message.trim()) next.message = 'write something first. a line is enough.';
		errors = next;
		return Object.keys(next).length === 0;
	}

	// after a send that didn't go through, start where the problem is.
	async function focusFirstError() {
		await tick();
		formElement?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	}

	async function again() {
		sent = null;
		message = '';
		errors = {};
		await tick();
		formElement?.querySelector<HTMLElement>('#message')?.focus();
	}
</script>

<h1 class="page-title">contact</h1>
<p class="contact__intro">
	ask about a work, an exhibition, a submission or anything else.<span class="desktop-only"
		>{' '}we answer within three days, usually sooner.</span
	>
</p>

<div class="contact grid">
	<div class="contact__main">
		{#if sent}
			<div role="status">
				<h2 class="contact__sent" tabindex="-1" bind:this={sentTitle}>
					sent. thank you, {sent.name}.
				</h2>
				<p class="contact__sent-text">
					we answer within three days, usually sooner. a copy went to {sent.email}.<br /><button
						class="link-button"
						type="button"
						onclick={again}>send another</button
					>{sp(3)}<a href={sent.back ?? data.current}>back to the exhibition</a>
				</p>
			</div>
		{:else}
			{#if failed}
				<p class="contact__failed error" role="alert">
					that didn’t go through. nothing is lost: your message is still below. <button
						class="link-button"
						type="button"
						onclick={() => formElement?.requestSubmit()}>try again</button
					>, or write to <a href="mailto:{email}">{email}</a>.
				</p>
			{/if}
			<form
				bind:this={formElement}
				class="contact__form"
				method="post"
				novalidate
				use:enhance={({ cancel }) => {
					if (!check()) {
						focusFirstError();
						return cancel();
					}
					busy = true;
					return async ({ update }) => {
						busy = false;
						checks++;
						await update({ reset: false });
						focusFirstError();
					};
				}}
			>
				<div class="contact__field">
					<label class="label" for="name">your name</label>
					<input
						class="field"
						id="name"
						name="name"
						autocomplete="name"
						bind:value={name}
						aria-invalid={errors.name ? 'true' : undefined}
						aria-describedby={errors.name ? 'name-error' : undefined}
					/>
					{#if errors.name}<p class="contact__error error" id="name-error">{errors.name}</p>{/if}
				</div>
				<div class="contact__field">
					<label class="label" for="email">your email</label>
					<input
						class="field"
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						inputmode="email"
						spellcheck="false"
						bind:value={address}
						aria-invalid={errors.email ? 'true' : undefined}
						aria-describedby={errors.email ? 'email-error' : undefined}
					/>
					{#if errors.email}<p class="contact__error error" id="email-error">{errors.email}</p>{/if}
				</div>
				<div class="contact__field">
					{#if data.about}
						<span class="label">about</span>
						<!-- the work you came from, set like a label. -->
						<p class="field contact__about">
							<em>{data.about.title}</em>, {data.about.artist}{#if data.about.number}{' '}({data
									.about.number}){/if}
						</p>
						<input type="hidden" name="work" value={data.about.key} />
					{:else}
						<label class="label" for="about">about (optional)</label>
						<input
							class="field"
							id="about"
							name="subject"
							autocomplete="off"
							maxlength="200"
							value={result()?.values?.subject ?? ''}
						/>
					{/if}
				</div>
				<div class="contact__field">
					<label class="label" for="message">message</label>
					<textarea
						class="field contact__message"
						id="message"
						name="message"
						bind:value={message}
						aria-invalid={errors.message ? 'true' : undefined}
						aria-describedby={errors.message ? 'message-error' : undefined}
					></textarea>
					{#if errors.message}<p class="contact__error error" id="message-error">
							{errors.message}
						</p>{/if}
				</div>
				<input
					class="visually-hidden"
					type="text"
					name="website"
					tabindex="-1"
					autocomplete="off"
					aria-hidden="true"
				/>
				{#if data.turnstile}<Turnstile sitekey={data.turnstile} reset={checks} />{/if}
				<button class="button contact__send" type="submit">{busy ? 'sending…' : 'send'}</button>
			</form>
		{/if}
	</div>

	<aside class="contact__aside desktop-only">
		<p>or write to <a href="mailto:{email}">{email}</a> directly.</p>
		{#each data.aside as paragraph, i (i)}<p><RichText text={paragraph} /></p>{/each}
	</aside>
</div>
