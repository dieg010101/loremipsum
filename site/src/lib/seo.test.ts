import { describe, expect, it } from 'vitest';
import { isoDuration, jsonld } from './seo';

describe('seo', () => {
	it('spells durations the iso way', () => {
		expect(isoDuration(723)).toBe('PT12M3S');
		expect(isoDuration(400.9)).toBe('PT6M41S');
		expect(isoDuration(3600)).toBe('PT1H');
		expect(isoDuration(0)).toBe('PT0S');
	});
	it('keeps json-ld inside its script tag', () => {
		const out = jsonld({ name: '</script><script>alert(1)</script>' });
		expect(out.match(/<\/script>/g)).toHaveLength(1);
	});
});
