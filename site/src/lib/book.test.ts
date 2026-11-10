import { describe, expect, it } from 'vitest';
import { signature, splitSigner } from './book';
import { citation } from './exhibition';

describe('the visitors’ book', () => {
	it('splits a signer into a name and a city', () => {
		expect(splitSigner('a., lorem')).toEqual({ name: 'a.', city: 'lorem' });
		expect(splitSigner('m. r.,  dolor ')).toEqual({ name: 'm. r.', city: 'dolor' });
		expect(splitSigner('s., sit, amet')).toEqual({ name: 's., sit', city: 'amet' });
		expect(splitSigner('k.')).toEqual({ name: 'k.', city: null });
		expect(splitSigner(', lorem')).toEqual({ name: null, city: 'lorem' });
		expect(splitSigner('   ')).toEqual({ name: null, city: null });
	});
	it('signs entries, anonymously when there is no name', () => {
		expect(signature({ name: 'a.', city: 'lorem' })).toBe('a., lorem');
		expect(signature({ name: null, city: null })).toBe('anonymous');
		expect(signature({ name: 'a.', city: 'lorem' }, true)).toBe('you, lorem');
	});
});

describe('citation', () => {
	const e = { number: 14, title: 'thinking for way too long', opens: '2026-11-01T10:00:00+01:00' };
	const read = new Date('2026-11-10T12:00:00+01:00');
	it('cites in mla, chicago and bibtex, with the day it was read', () => {
		expect(citation(e, read).mla).toBe(
			'lorem ipsum art group. thinking for way too long. Online exhibition 14, 1 Nov. 2026, loremipsum.art/e/14. Accessed 10 Nov. 2026.'
		);
		expect(citation(e, read).chicago).toBe(
			'lorem ipsum art group. “thinking for way too long.” Online exhibition 14, November 1, 2026. Accessed November 10, 2026. https://loremipsum.art/e/14.'
		);
		expect(citation(e, read).bibtex).toContain('author = {{lorem ipsum art group}}');
		expect(citation(e, read).bibtex).toContain('urldate = {2026-11-10}');
	});
});
