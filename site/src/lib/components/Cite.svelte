<script lang="ts">
	import { sp } from '$lib/spaces';
	import type { CiteStyle } from '$lib/exhibition';

	// three styles, all three always listed: the one showing is plain black text,
	// so you can see where you are and click any other to switch back.
	type Formats = Record<CiteStyle, string>;
	let { formats, title }: { formats: Formats; title: string } = $props();

	const STYLES: CiteStyle[] = ['mla', 'chicago', 'bibtex'];

	let shown: CiteStyle = $state('mla');
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

	function choose(style: CiteStyle) {
		shown = style;
		copied = false;
	}

	// mla sets the exhibition's title in italics.
	const mla = $derived.by(() => {
		const at = formats.mla.indexOf(`. ${title}. `);
		if (at < 0) return null;
		const start = at + 2;
		return [formats.mla.slice(0, start), formats.mla.slice(start + title.length)];
	});
</script>

{#if shown === 'bibtex'}
	<pre id="citation" class="cite__code">{formats.bibtex}</pre>
{:else if shown === 'mla' && mla}
	<span id="citation">{mla[0]}<em>{title}</em>{mla[1]}</span><br />
{:else}
	<span id="citation">{formats[shown]}</span><br />
{/if}
{#each STYLES as style, i (style)}{#if i}{sp(2)}{/if}<button
		class="link-button cite__style"
		type="button"
		aria-pressed={shown === style}
		onclick={() => choose(style)}>{style}</button
	>{/each}{sp(3)}<button class="link-button" type="button" onclick={copy}
	>{copied ? 'copied.' : `copy ${shown}`}</button
><span class="visually-hidden" aria-live="polite">{copied ? `${shown} citation copied` : ''}</span>
