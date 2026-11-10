<script lang="ts">
	import './newsletter.css';
	import { page } from '$app/state';
	import { looksLikeEmail } from '$lib/email';

	type Props = {
		/** what the label says before the field. */
		label?: string;
		/** what the sign-up is for, sent with it: "newsletter" or "exhibition-15". */
		tag?: string;
		id?: string;
	};

	let { label = 'newsletter:', tag = 'newsletter', id = 'newsletter' }: Props = $props();

	type Status = 'idle' | 'sending' | 'done' | 'already' | 'invalid' | 'failed';
	const ANSWERS: Status[] = ['done', 'already', 'invalid', 'failed'];

	// without javascript the sign-up comes back as ?signup=<tag>&newsletter=<answer>.
	const answer = () => {
		const params = page.url.searchParams;
		const said = params.get('newsletter');
		if (params.get('signup') !== tag || !said) return 'idle';
		if (said === 'unavailable') return 'failed';
		return ANSWERS.find((a) => a === said) ?? 'idle';
	};
	let status: Status = $state(answer());
	let email = $state('');
	let field: HTMLInputElement | undefined = $state();

	const MESSAGES: Partial<Record<Status, string>> = {
		done: 'done. one email to confirm is on its way.',
		already: 'you’re already on the list. nothing to do.',
		invalid: 'that doesn’t look like an email address.',
		failed: 'that didn’t go through. try again in a moment.'
	};

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'sending') return;
		if (!looksLikeEmail(email)) {
			status = 'invalid';
			field?.focus();
			return;
		}
		status = 'sending';
		const form = event.currentTarget as HTMLFormElement;
		try {
			const res = await fetch(form.action, {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: new FormData(form)
			});
			const out = await res.json().catch(() => ({}));
			status = res.ok
				? out.already
					? 'already'
					: 'done'
				: out.error === 'invalid'
					? 'invalid'
					: 'failed';
			if (status === 'done' || status === 'already') email = '';
			else field?.focus();
		} catch {
			status = 'failed';
		}
	}
</script>

<form
	class="newsletter"
	id="{id}-form"
	method="post"
	action="/newsletter"
	onsubmit={submit}
	novalidate
>
	<input type="hidden" name="form" value="{id}-form" />
	<label class="newsletter__label" for={id}>{label}</label>
	<span class="newsletter__row">
		<input
			class="field newsletter__field"
			{id}
			bind:this={field}
			name="email"
			type="email"
			autocomplete="email"
			inputmode="email"
			spellcheck="false"
			required
			bind:value={email}
			aria-invalid={status === 'invalid' ? 'true' : undefined}
			aria-describedby="{id}-message"
			oninput={() => {
				if (status === 'invalid' || status === 'failed') status = 'idle';
			}}
		/>
		<button class="button newsletter__button" type="submit"
			>{status === 'sending' ? 'subscribing…' : 'subscribe'}</button
		>
	</span>
	<input type="hidden" name="tag" value={tag} />
	<!-- bots fill every field; people never see this one. -->
	<input
		class="visually-hidden"
		type="text"
		name="website"
		tabindex="-1"
		autocomplete="off"
		aria-hidden="true"
	/>
	<p
		id="{id}-message"
		class="newsletter__message"
		class:error={status === 'invalid' || status === 'failed'}
		aria-live="polite"
	>
		{MESSAGES[status] ?? ''}
	</p>
</form>
