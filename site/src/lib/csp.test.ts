import { describe, expect, it } from 'vitest';
import html from '../app.html?raw';
import config from '../../svelte.config.js?raw';

// the inline script in app.html runs only if its exact hash is in the csp.
describe('csp', () => {
	it('allows every inline script in app.html by its hash', async () => {
		const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
		expect(scripts.length).toBeGreaterThan(0);
		for (const script of scripts) {
			const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script));
			const hash = btoa(String.fromCharCode(...new Uint8Array(digest)));
			expect(config).toContain(`'sha256-${hash}'`);
		}
	});
});
