<script lang="ts">
	import { onMount } from 'svelte';

	// the pages you've opened are kept by the service worker, so the site still
	// works offline; this just says so.
	let offline = $state(false);

	onMount(() => {
		const update = () => (offline = !navigator.onLine);
		update();
		window.addEventListener('online', update);
		window.addEventListener('offline', update);
		return () => {
			window.removeEventListener('online', update);
			window.removeEventListener('offline', update);
		};
	});
</script>

{#if offline}
	<p class="bar bar--offline" role="status">
		you’re offline. the pages you’ve opened still work. images will load when you’re back.
	</p>
{/if}
