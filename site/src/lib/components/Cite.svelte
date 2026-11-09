<script lang="ts">
	import { sp } from '$lib/spaces';

	type Formats = { default: string; bibtex: string; chicago: string };
	let { formats, title }: { formats: Formats; title: string } = $props();

	let shown: keyof Formats = $state('default');
	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(formats[shown]);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 3000);
		} catch {
			// no clipboard (an old browser, or not allowed): select the text instead.
			const node = document.getElementById('citation');
			if (node) getSelection()?.selectAllChildren(node);
		}
	}

	const toggle = (format: 'bibtex' | 'chicago') => (shown = shown === format ? 'default' : format);
	const [before, after] = $derived(formats.default.split(title));
</script>

{#if shown === 'default'}
	<span id="citation">{before}<em>{title}</em>{after}</span><br />
{:else}
	<pre id="citation" class="cite__code">{formats[shown]}</pre>
{/if}
<button class="link-button" type="button" onclick={copy}>{copied ? 'copied.' : 'copy'}</button>{sp(
	2
)}<button
	class="link-button"
	type="button"
	aria-pressed={shown === 'bibtex'}
	onclick={() => toggle('bibtex')}>bibtex</button
>{sp(2)}<button
	class="link-button"
	type="button"
	aria-pressed={shown === 'chicago'}
	onclick={() => toggle('chicago')}>chicago</button
><span class="visually-hidden" aria-live="polite">{copied ? 'citation copied' : ''}</span>
