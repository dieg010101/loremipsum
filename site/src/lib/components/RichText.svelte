<script lang="ts">
	import type { Rich, Span } from '$lib/types';
	import { sp } from '$lib/spaces';
	import { untranslated } from '$lib/languages';

	// one run of rich text. "\n" inside a span is a line break.
	let { text }: { text: Rich | null | undefined } = $props();

	// neighbouring spans with the same href are one link ("review in *lorem ipsum*").
	type Run = { href?: string; strong?: boolean; spans: Span[] };
	const runs = $derived(
		(text ?? []).reduce<Run[]>((out, span) => {
			const prev = out.at(-1);
			const href = untranslated(span.href) ? undefined : span.href;
			if (href && prev?.href === href) prev.spans.push(span);
			else out.push({ href, strong: span.strong, spans: [span] });
			return out;
		}, [])
	);

	// runs of spaces are kept, as in the figma ("   ·   "); html would collapse them.
	const lines = (s: Span) => s.text.replace(/ {2,}/g, (run) => sp(run.length)).split('\n');
	const external = (href: string) => /^https?:\/\//.test(href);
</script>

{#snippet content(spans: Span[])}
	{#each spans as span, j (j)}{#each lines(span) as line, i (i)}{#if i}<br />{/if}{#if span.em}<em
					>{line}</em
				>{:else}{line}{/if}{/each}{/each}
{/snippet}

{#each runs as run, i (i)}{#if run.href}<a
			href={run.href}
			rel={external(run.href) ? 'noopener' : undefined}
			class:strong={run.strong}>{@render content(run.spans)}</a
		>{:else if run.strong}<strong>{@render content(run.spans)}</strong>{:else}{@render content(
			run.spans
		)}{/if}{/each}
