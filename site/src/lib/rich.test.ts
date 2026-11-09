import { describe, expect, it } from 'vitest';
import { plain, rich, wordCount } from './rich';
import { sp, spaced } from './spaces';

describe('rich', () => {
	it('reads italics, bold and links', () => {
		expect(rich('a *b* **c** [d](/e)')).toEqual([
			{ text: 'a ' },
			{ text: 'b', em: true },
			{ text: ' ' },
			{ text: 'c', strong: true },
			{ text: ' ' },
			{ text: 'd', href: '/e' }
		]);
	});
	it('keeps italics inside a link, all pointing at the same place', () => {
		expect(rich('[review in *lorem ipsum* (español)](https://x.test)')).toEqual([
			{ text: 'review in ', href: 'https://x.test' },
			{ text: 'lorem ipsum', em: true, href: 'https://x.test' },
			{ text: ' (español)', href: 'https://x.test' }
		]);
	});
	it('gives back plain text and counts words', () => {
		const text = rich('one *two* [three](/x)');
		expect(plain(text)).toBe('one two three');
		expect(wordCount([{ text }, { text: rich('four five') }])).toBe(5);
	});
});

describe('spaces', () => {
	it('keeps runs of spaces that html would collapse', () => {
		expect(sp(1)).toBe(' ');
		expect(sp(3)).toBe('   ');
		expect(spaced('a  ·  b')).toBe('a  ·  b');
		expect(spaced('a b')).toBe('a b');
	});
});
