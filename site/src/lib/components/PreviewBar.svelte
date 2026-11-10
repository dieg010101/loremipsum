<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { formatDate } from '$lib/format';
	import { DOT } from '$lib/spaces';

	// only in the studio's preview tab: says that drafts are showing, lets you see an
	// exhibition as on its opening day, and keeps the studio and the page in step.
	type Preview = NonNullable<App.PageData['preview']>;
	let { preview }: { preview: Preview } = $props();

	const here = $derived(page.url.pathname + page.url.search);
	const pretending = $derived(
		preview.asOf ? preview.upcoming.find((e) => e.opens <= preview.asOf!) : null
	);
	const asOf = (iso: string) =>
		`/preview/as-of?at=${encodeURIComponent(new Date(Date.parse(iso) + 60_000).toISOString())}&to=`;

	// the studio's side: clicking a marked element opens its field there, edits show
	// up here as they're made, and the address follows along both ways.
	// changes arrive in bursts (typing): fetch once they settle.
	let timer: ReturnType<typeof setTimeout> | undefined;
	const again = () =>
		new Promise<void>((done) => {
			clearTimeout(timer);
			timer = setTimeout(() => invalidateAll().then(done), 250);
		});

	let tell: ((update: { type: 'push' | 'pop' | 'replace'; url: string }) => void) | null = null;
	afterNavigate(() => tell?.({ type: 'push', url: location.pathname + location.search }));

	onMount(() => {
		let off: (() => void) | undefined;
		let gone = false;
		import('@sanity/visual-editing/enable-visual-editing').then(({ enableVisualEditing }) => {
			if (gone) return;
			off = enableVisualEditing({
				zIndex: 1000,
				history: {
					subscribe: (navigate) => {
						tell = navigate;
						navigate({ type: 'replace', url: location.pathname + location.search });
						return () => (tell = null);
					},
					update: (update) => {
						if (update.type === 'pop') history.back();
						else goto(update.url, { replaceState: update.type === 'replace' });
					}
				},
				// an edit in the studio: fetch the page's data again, no reload.
				refresh: (payload) => (payload.source === 'mutation' ? again() : false)
			});
		});
		// the studio doesn't announce a discarded draft or a deleted document, so the page
		// also listens to sanity itself, while it's in preview.
		let sub: { unsubscribe: () => void } | undefined;
		import('@sanity/client').then(({ createClient }) => {
			if (gone) return;
			const { projectId, dataset, token } = preview.listen;
			sub = createClient({ projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false })
				.listen('*[!(_id in path("_.**"))]', {}, { events: ['mutation'], includeResult: false })
				.subscribe({ next: () => void again(), error: () => {} });
		});
		return () => {
			gone = true;
			off?.();
			sub?.unsubscribe();
		};
	});
</script>

<p class="preview-bar" role="status">
	<span class="strong">preview</span>: drafts are showing{#if pretending}, as on {formatDate(
			pretending.opens,
			false
		)}, the day <em>{pretending.title}</em> opens.
		<a href="/preview/as-of?to={encodeURIComponent(here)}" data-sveltekit-reload>back to today</a
		>{:else}.{#each preview.upcoming as e (e.number)}{DOT}<a
				href="{asOf(e.opens)}{encodeURIComponent(`/exhibitions/${e.number}`)}"
				data-sveltekit-reload>see {e.number} as on its opening day</a
			>{#if !e.ready}{' '}(no works yet, so it stays announced){/if}{/each}{/if}{DOT}<a
		href="/preview/disable?to={encodeURIComponent(here)}"
		data-sveltekit-reload>leave preview</a
	>
</p>

<style>
	.preview-bar {
		position: fixed;
		right: var(--margin);
		bottom: var(--margin);
		z-index: 30;
		max-width: calc(100% - 2 * var(--margin));
		padding: 2px 6px;
		background: var(--highlight, #ffff66);
		color: var(--black);
	}
</style>
