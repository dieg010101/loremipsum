import { describe, expect, it } from 'vitest';
import { untranslated } from './languages';

describe('untranslated', () => {
	it('catches links to languages not translated yet', () => {
		expect(untranslated('?lang=it')).toBe(true);
		expect(untranslated('?lang=en')).toBe(false);
		expect(untranslated('/about')).toBe(false);
		expect(untranslated(null)).toBe(false);
	});
});
