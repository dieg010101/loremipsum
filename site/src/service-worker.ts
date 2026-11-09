/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
// the pages you've opened keep working offline. pages come from the network first
// and fall back to the last copy; the app's own files and images are kept.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const APP = `app-${version}`;
const PAGES = 'pages';
const IMAGES = 'images';
const SHELL = [...build, ...files.filter((f) => !f.startsWith('/demo/'))];
const MAX_IMAGES = 300;

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(APP)
			.then((cache) => cache.addAll(SHELL))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys())
				if (key.startsWith('app-') && key !== APP) await caches.delete(key);
			await sw.clients.claim();
		})()
	);
});

async function trim(cacheName: string, max: number) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET' || request.headers.has('range')) return;
	const url = new URL(request.url);

	// the app's own built files never change under the same name.
	if (url.origin === location.origin && SHELL.includes(url.pathname)) {
		event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
		return;
	}

	// images: from the cache when we have them, kept as they're seen.
	const isImage =
		request.destination === 'image' &&
		(url.origin === location.origin || url.hostname === 'cdn.sanity.io');
	if (isImage) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(IMAGES);
				const hit = await cache.match(request);
				if (hit) return hit;
				const res = await fetch(request);
				if (res.ok) {
					await cache.put(request, res.clone());
					trim(IMAGES, MAX_IMAGES);
				}
				return res;
			})()
		);
		return;
	}

	// pages and their data: the network, then the last copy.
	if (
		url.origin === location.origin &&
		(request.mode === 'navigate' || url.pathname.endsWith('/__data.json'))
	) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(PAGES);
				try {
					const res = await fetch(request);
					if (res.ok) cache.put(request, res.clone());
					return res;
				} catch (err) {
					const hit = await cache.match(request);
					if (hit) return hit;
					throw err;
				}
			})()
		);
	}
});
