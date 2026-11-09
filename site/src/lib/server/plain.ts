// turns a rendered page into plain text: the main content, with links written out.

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	'#39': "'",
	nbsp: ' ',
	apos: "'"
};

const decode = (s: string) =>
	s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, code: string) => {
		if (code[0] === '#') {
			const n =
				code[1] === 'x' || code[1] === 'X'
					? parseInt(code.slice(2), 16)
					: parseInt(code.slice(1), 10);
			return Number.isFinite(n) ? String.fromCodePoint(n) : m;
		}
		return ENTITIES[code] ?? m;
	});

export function htmlToText(html: string, origin: string) {
	const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
	const text = main
		.replace(/<(script|style|svg|template|noscript)[\s\S]*?<\/\1>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<(img|video|iframe)[^>]*?(?:alt|title|aria-label)="([^"]*)"[^>]*>/gi, '[$2]')
		.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, inner: string) => {
			const label = inner.replace(/<[^>]+>/g, '').trim();
			if (!label) return '';
			if (href.startsWith('#') || href.startsWith('mailto:')) return label;
			const url = href.startsWith('/') ? origin + href : href;
			return `${label} <${url}>`;
		})
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(
			/<\/(p|h[1-6]|li|dt|dd|tr|pre|blockquote|section|article|header|nav|aside|figure)>/gi,
			'\n\n'
		)
		.replace(/<(li)[^>]*>/gi, '- ')
		.replace(/<[^>]+>/g, '');
	return (
		decode(text)
			.replace(/[ \t ]+\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.replace(/[ \t]{2,}/g, (run) => run)
			.trim() + '\n'
	);
}
