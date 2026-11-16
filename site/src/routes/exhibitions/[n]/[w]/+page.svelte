<script lang="ts">
	import './work.css';
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import { goto, pushState, replaceState } from '$app/navigation';
	import { sp } from '$lib/spaces';
	import { isShortcut, keys } from '$lib/keys.svelte';
	import WorkRow from '$lib/components/WorkRow.svelte';
	import Record from '$lib/components/Record.svelte';
	import FullSize from '$lib/components/FullSize.svelte';

	let { data } = $props();
	const work = $derived(data.work);
	const base = $derived(`/exhibitions/${data.exhibition.number}`);

	let record = $state(false);
	let ready = $state(false);
	let recordTitle: HTMLElement | undefined = $state();
	onMount(() => {
		keys.load();
		ready = true;
		const sync = () => (record = location.hash === '#record');
		sync();
		window.addEventListener('hashchange', sync);
		return () => window.removeEventListener('hashchange', sync);
	});

	async function toggleRecord() {
		record = !record;
		replaceState(record ? '#record' : location.pathname + location.search, page.state);
		if (!record) return;
		await tick();
		recordTitle?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
		recordTitle?.focus({ preventScroll: true });
	}

	const full = $derived(page.state.full);
	const open = (index: number) => pushState(`${base}/${index}`, { full: index });
	const move = (index: number) => replaceState(`${base}/${index}`, { full: index });
	const close = () =>
		full !== undefined && full !== work.index
			? goto(`${base}/${full}`, { replaceState: true, noScroll: false })
			: history.back();

	function onkeydown(event: KeyboardEvent) {
		if (full !== undefined || !isShortcut(event)) return;
		if (event.key === 'k' && data.next) goto(`${base}/${data.next.index}`);
		else if (event.key === 'j' && data.previous) goto(`${base}/${data.previous.index}`);
		else if (event.key === 'f' && work.medium === 'image' && work.image) open(work.index);
		else return;
		event.preventDefault();
	}
</script>

<svelte:window {onkeydown} />

<div class="work-page" class:work-page--ready={ready}>
	<h1 class="visually-hidden">{work.title}, {data.artist}, {work.year}</h1>
	<p class="work-page__crumbs">
		exhibition {data.exhibition.number}, <a href={base}><em>{data.exhibition.title}</em></a>{sp(
			2
		)}<span class="nowrap">→{sp(2)}{data.artist}</span>{sp(2)}<span class="nowrap"
			>→{sp(2)}{work.number}</span
		>
	</p>

	<div class="work-page__work" id="work">
		<WorkRow
			{work}
			eager
			whole
			heading={2}
			onfull={work.image ? () => open(work.index) : undefined}
			ontogglerecord={toggleRecord}
		/>
	</div>

	<section
		class="work-page__record"
		id="record"
		class:work-page__record--open={record}
		aria-labelledby="record-title"
	>
		<Record {work} onclose={toggleRecord} bind:title={recordTitle} />
	</section>

	<nav class="work-page__nav" aria-label="the works on either side">
		<!-- one row on a computer; on a phone, one link per line (the gaps go). -->
		{#if data.previous}<a href="{base}/{data.previous.index}" rel="prev"
				>← {data.previous.number} <em>{data.previous.title}</em></a
			><span class="work-page__gap">{sp(6)}</span>{/if}<a href="{base}#work-{work.index}"
			>back to the exhibition, at this work</a
		>{#if data.next}<span class="work-page__gap">{sp(6)}</span><a
				href="{base}/{data.next.index}"
				rel="next"><em>{data.next.title}</em> →</a
			>{/if}
	</nav>
</div>

{#if full !== undefined && data.images.some((w) => w.index === full)}
	<FullSize works={data.images} index={full} onclose={close} onmove={move} />
{/if}
