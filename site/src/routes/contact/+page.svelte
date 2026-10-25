<script lang="ts">
	import './contact.css';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { looksLikeEmail } from '$lib/email';

	let { data, form } = $props();

	const TOPICS = ['general', 'press', 'sales', 'artists'];

	// the inquire button on a work page links here with ?topic=sales&regarding=...
	const params = page.url.searchParams;
	const sent = $derived(page.url.searchParams.has('sent'));
	const values = $derived(
		form?.values ?? {
			topic: TOPICS.includes(params.get('topic') ?? '') ? params.get('topic')! : 'general',
			regarding: params.get('regarding') ?? '',
			name: '',
			email: '',
			message: ''
		}
	);
	const errors = $derived<Record<string, string | undefined>>(
		form && 'errors' in form ? (form.errors ?? {}) : {}
	);

	let sending = $state(false);
	let unverified = $state(false);

	// ---- cloudflare turnstile: an invisible check, run when the form is sent ----

	let turnstileBox = $state<HTMLDivElement>();
	let widgetId: string | undefined;
	let pending: ((token: string | null) => void) | null = null;

	type Turnstile = {
		render: (el: HTMLElement, options: Record<string, unknown>) => string;
		execute: (id: string) => void;
		reset: (id: string) => void;
	};
	const turnstile = () => (window as unknown as { turnstile?: Turnstile }).turnstile;

	function loadTurnstile(): Promise<void> {
		if (turnstile()) return Promise.resolve();
		return new Promise((resolve, reject) => {
			const s = document.createElement('script');
			s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			s.async = true;
			s.onload = () => resolve();
			s.onerror = () => reject(new Error('turnstile failed to load'));
			document.head.appendChild(s);
		});
	}

	async function getToken(): Promise<string | null> {
		await loadTurnstile();
		const ts = turnstile()!;
		return new Promise((resolve) => {
			const timer = setTimeout(() => resolve(null), 20_000);
			pending = (token) => {
				clearTimeout(timer);
				resolve(token);
			};
			if (widgetId === undefined) {
				widgetId = ts.render(turnstileBox!, {
					sitekey: PUBLIC_TURNSTILE_SITE_KEY,
					execution: 'execute',
					appearance: 'interaction-only',
					callback: (token: string) => pending?.(token),
					'error-callback': () => pending?.(null)
				});
			} else {
				ts.reset(widgetId);
			}
			ts.execute(widgetId);
		});
	}

	// warm the script up as soon as someone starts typing.
	function warmUp() {
		if (PUBLIC_TURNSTILE_SITE_KEY) loadTurnstile().catch(() => {});
	}
</script>

<svelte:head>
	<title>contact · lorem ipsum art group</title>
	<meta
		name="description"
		content="questions, press, sales inquiries about a work, or artists who want to show with lorem ipsum art group."
	/>
	<meta property="og:title" content="contact · lorem ipsum art group" />
</svelte:head>

<div class="cols contact">
	<aside class="contact__about">
		<div class="field">
			<p class="label">message</p>
			<p>
				questions, press, sales inquiries about a work, or artists who want to show with us. pick a
				topic and we will get back to you as soon as we can.
			</p>
		</div>
		<div class="field">
			<p class="label">links</p>
			<p>
				ig: <a
					class="plain-link"
					href="https://instagram.com/{data.settings.instagram}"
					target="_blank"
					rel="noopener">@{data.settings.instagram}</a
				>
			</p>
			<p>
				email: <a class="plain-link" href="mailto:{data.settings.email}">{data.settings.email}</a>
			</p>
		</div>
	</aside>

	<section class="contact__main">
		<h1 class="label">contact</h1>

		{#if sent}
			<p class="confirm contact__sent" role="status">message sent. we will get back to you soon.</p>
			<a class="link" href="/contact">send another message</a>
		{:else}
			<form
				class="contact__form"
				method="POST"
				novalidate
				onfocusin={warmUp}
				use:enhance={async ({ formData, cancel }) => {
					unverified = false;
					sending = true;
					// incomplete forms go straight back with their errors; no need for the check.
					const complete =
						['name', 'message'].every((k) => String(formData.get(k) ?? '').trim()) &&
						looksLikeEmail(String(formData.get('email') ?? ''));
					if (PUBLIC_TURNSTILE_SITE_KEY && complete) {
						const token = await getToken().catch(() => null);
						if (!token) {
							sending = false;
							unverified = true;
							cancel();
							return;
						}
						formData.set('cf-turnstile-response', token);
					}
					return async ({ update }) => {
						await update({ reset: false });
						sending = false;
					};
				}}
			>
				<fieldset class="contact__field">
					<legend>topic</legend>
					<div class="contact__topics">
						{#each TOPICS as topic (topic)}
							<label class="contact__topic">
								<input
									class="visually-hidden"
									type="radio"
									name="topic"
									value={topic}
									checked={values.topic === topic}
								/>
								<span class="link">{topic}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				{#if values.regarding}
					<div class="contact__field">
						<label for="regarding">regarding (filled in from the work page)</label>
						<input
							id="regarding"
							class="input contact__regarding"
							name="regarding"
							value={values.regarding}
						/>
					</div>
				{/if}

				<div class="contact__field">
					<label for="name">name (required)</label>
					<input
						id="name"
						class="input"
						name="name"
						autocomplete="name"
						value={values.name}
						aria-invalid={errors.name ? 'true' : undefined}
						aria-describedby={errors.name ? 'name-error' : undefined}
					/>
					{#if errors.name}<p class="error" id="name-error">{errors.name}</p>{/if}
				</div>

				<div class="contact__field">
					<label for="email">email (required)</label>
					<input
						id="email"
						class="input"
						name="email"
						type="email"
						inputmode="email"
						autocomplete="email"
						value={values.email}
						aria-invalid={errors.email ? 'true' : undefined}
						aria-describedby={errors.email ? 'email-error' : undefined}
					/>
					{#if errors.email}<p class="error" id="email-error">{errors.email}</p>{/if}
				</div>

				<div class="contact__field">
					<label for="message">message (required)</label>
					<textarea
						id="message"
						class="input"
						name="message"
						aria-invalid={errors.message ? 'true' : undefined}
						aria-describedby={errors.message ? 'message-error' : undefined}
						>{values.message}</textarea
					>
					{#if errors.message}<p class="error" id="message-error">{errors.message}</p>{/if}
				</div>

				<!-- honeypots: hidden from people, filled in by bots. -->
				<div class="contact__trap" aria-hidden="true">
					<label>website <input type="url" name="website" tabindex="-1" autocomplete="off" /></label
					>
					<label
						>subject <input type="text" name="subject" tabindex="-1" autocomplete="off" /></label
					>
					<label
						>nickname <input type="text" name="nickname" tabindex="-1" autocomplete="off" /></label
					>
				</div>
				{#if PUBLIC_TURNSTILE_SITE_KEY}
					<div class="contact__turnstile" bind:this={turnstileBox}></div>
				{/if}

				<div class="contact__submit">
					<button class="link" type="submit" disabled={sending}
						>{sending ? 'sending…' : 'submit'}</button
					>
					{#if unverified}
						<p class="error" role="alert">
							we could not check that you are not a robot. please try again, or email {data.settings
								.email}.
						</p>
					{:else if form && 'failed' in form}
						<p class="error" role="alert">
							something went wrong sending your message. please try again, or email {data.settings
								.email}.
						</p>
					{/if}
				</div>
			</form>
		{/if}
	</section>
</div>
