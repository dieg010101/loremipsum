import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// the inline script in app.html runs only if its exact hash is in the csp.
describe('csp', () => {
	it('allows every inline script in app.html by its hash', () => {
		const html = readFileSync('src/app.html', 'utf8');
		const config = readFileSync('svelte.config.js', 'utf8');
		const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
		expect(scripts.length).toBeGreaterThan(0);
		for (const script of scripts) {
			const hash = createHash('sha256').update(script).digest('base64');
			expect(config).toContain(`'sha256-${hash}'`);
		}
	});
});
