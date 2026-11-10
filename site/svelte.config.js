import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// the styles are small: inline them so the first paint needs no extra request.
		inlineStyleThreshold: 12_000,
		serviceWorker: { register: true },
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				// svelte's server render marks images and frames with onload/onerror="this.__e=event"
				// so a load that lands before hydration is replayed. allow exactly that, by hash.
				'script-src': [
					'self',
					'unsafe-hashes',
					'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I=',
					// the click-holder in app.html.
					'sha256-VUVGOyseGtKszOJYyGJf5Tm3ov6AMeSYcYfhDvSrDMs=',
					'https://challenges.cloudflare.com'
				],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'blob:', 'https://cdn.sanity.io'],
				'media-src': ['self', 'blob:', 'https://cdn.sanity.io'],
				'connect-src': ['self', 'https://cdn.sanity.io'],
				'frame-src': ['self', 'https:', 'https://challenges.cloudflare.com'],
				'worker-src': ['self', 'blob:'],
				'font-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['self']
			}
		}
	}
};

export default config;
