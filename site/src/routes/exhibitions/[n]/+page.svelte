<script lang="ts">
	import ExhibitionOpen from '$lib/components/ExhibitionOpen.svelte';
	import ExhibitionAnnounced from '$lib/components/ExhibitionAnnounced.svelte';

	let { data, form } = $props();
</script>

{#if data.exhibition.status === 'open'}
	<ExhibitionOpen
		exhibition={data.exhibition}
		now={data.now}
		openCount={data.openCount}
		before={data.before}
		after={data.after}
		afterLabel={data.afterLabel}
		upcoming={data.upcoming}
		book={data.book}
		bookTotal={data.bookTotal}
		bookResult={form?.book ?? null}
	/>
{:else}
	<ExhibitionAnnounced exhibition={data.exhibition} now={data.now} current={data.current} />
{/if}
