<script lang="ts" module>
	type Api = {
		render: (el: HTMLElement, options: Record<string, unknown>) => string;
		reset: (id: string) => void;
		remove: (id: string) => void;
	};
	declare global {
		interface Window {
			turnstile?: Api;
		}
	}

	// the script is loaded once per visit, however many times the form is shown.
	let loading: Promise<Api> | null = null;
	function load(): Promise<Api> {
		if (window.turnstile) return Promise.resolve(window.turnstile);
		loading ??= new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.onload = () =>
				window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'));
			script.onerror = () => {
				loading = null;
				reject(new Error('turnstile did not load'));
			};
			document.head.append(script);
		});
		return loading;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	// cloudflare's check that you're a person, rendered by hand so it also appears
	// after moving here from another page, and can be reset after each send (a
	// token only works once).
	type Props = {
		sitekey: string;
		reset?: number;
		/** "interaction-only": nothing shows unless cloudflare needs to ask. */
		appearance?: 'always' | 'interaction-only';
	};
	let { sitekey, reset = 0, appearance = 'always' }: Props = $props();

	let box: HTMLElement | undefined = $state();
	let api: Api | null = null;
	let widget: string | null = null;
	let failed = $state(false);

	onMount(() => {
		let gone = false;
		load()
			.then((turnstile) => {
				if (gone || !box) return;
				api = turnstile;
				widget = turnstile.render(box, {
					sitekey,
					appearance,
					theme: 'light',
					'response-field-name': 'cf-turnstile-response'
				});
			})
			.catch(() => (failed = true));
		return () => {
			gone = true;
			if (api && widget) api.remove(widget);
		};
	});

	$effect(() => {
		if (reset && api && widget) api.reset(widget);
	});
</script>

<div class="turnstile" bind:this={box}></div>
{#if failed}
	<p class="error" role="status">
		the check that you’re a person didn’t load. reload the page, or write to us directly.
	</p>
{/if}
