import type { Rich, Span } from './types';

/**
 * a tiny markup for writing rich text by hand (demo content, tests):
 * *italic*, **bold**, [a link](/href) and [a link with *italics* in it](/href).
 * a "\n" stays in the text as a line break. a link made of several spans gives each
 * the same href; RichText joins them back into one link.
 */
export function rich(source: string): Rich {
	const spans: Span[] = [];
	const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
	let last = 0;
	for (const match of source.matchAll(pattern)) {
		if (match.index > last) spans.push({ text: source.slice(last, match.index) });
		const [, label, href, strong, em] = match;
		if (href) spans.push(...rich(label).map((span) => ({ ...span, href })));
		else if (strong) spans.push({ text: strong, strong: true });
		else spans.push({ text: em, em: true });
		last = match.index + match[0].length;
	}
	if (last < source.length) spans.push({ text: source.slice(last) });
	return spans;
}

/** the plain text of rich text, for feeds, the .txt version and alt text. */
export function plain(text: Rich | null | undefined): string {
	return (text ?? []).map((s) => s.text).join('');
}

/** words in some paragraphs, for "keep reading, 2,140 more words". */
export function wordCount(paragraphs: { text: Rich }[]): number {
	return paragraphs.reduce((n, p) => n + plain(p.text).split(/\s+/).filter(Boolean).length, 0);
}
