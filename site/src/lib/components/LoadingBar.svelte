<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	// a slow connection is a state too: if the pictures you can see are still on their
	// way after a second, the bar counts them in. fast connections never see it.
	const WAIT = 1000;

	let total = $state(0);
	let here = $state(0);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let undo: (() => void)[] = [];

	function reset() {
		clearTimeout(timer);
		for (const fn of undo) fn();
		undo = [];
		total = 0;
	}

	function watch() {
		reset();
		timer = setTimeout(() => {
			const main = document.getElementById('main');
			if (!main) return;
			// only what's on screen: a lazy picture further down never starts, so it never counts.
			const seen = [...main.querySelectorAll('img')].filter((img) => {
				const box = img.getBoundingClientRect();
				return box.width > 0 && box.bottom > 0 && box.top < innerHeight;
			});
			const count = () => (here = seen.filter((img) => img.complete).length);
			count();
			if (here === seen.length) return;
			total = seen.length;
			for (const img of seen) {
				img.addEventListener('load', count);
				img.addEventListener('error', count);
				undo.push(() => {
					img.removeEventListener('load', count);
					img.removeEventListener('error', count);
				});
			}
		}, WAIT);
	}

	onMount(() => {
		watch();
		return reset;
	});
	afterNavigate(({ from }) => {
		if (from) watch();
	});
</script>

{#if total && here < total}
	<p class="bar bar--loading" aria-hidden="true">loading: {here} of {total} pictures here</p>
{/if}
