import { describe, expect, it } from 'vitest';
import { instagramUrl } from './instagram';

describe('instagramUrl', () => {
	it('takes a handle, with or without the @, or an address', () => {
		expect(instagramUrl('lorem.ipsum')).toBe('https://instagram.com/lorem.ipsum');
		expect(instagramUrl('@lorem_ipsum')).toBe('https://instagram.com/lorem_ipsum');
		expect(instagramUrl('https://www.instagram.com/lorem/')).toBe(
			'https://www.instagram.com/lorem/'
		);
		expect(instagramUrl('  ')).toBeNull();
		expect(instagramUrl(null)).toBeNull();
	});
});
