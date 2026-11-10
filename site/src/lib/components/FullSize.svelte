<script lang="ts">
	import './full-size.css';
	import { onMount } from 'svelte';
	import type { Work } from '$lib/types';
	import { DOT, sp } from '$lib/spaces';
	import { workHref } from '$lib/work';
	import { isShortcut } from '$lib/keys.svelte';

	// the work on white, as large as the screen allows, at every pixel there is.
	// a modal dialog: the page behind it is out of reach until it closes.
	type Props = {
		works: Work[];
		index: number;
		onclose: () => void;
		onmove: (index: number) => void;
	};
	let { works, index, onclose, onmove }: Props = $props();

	const at = $derived(
		Math.max(
			0,
			works.findIndex((w) => w.index === index)
		)
	);
	const work = $derived(works[at]);
	const image = $derived(work.image!);
	const previous = $derived(works[(at - 1 + works.length) % works.length]);
	const next = $derived(works[(at + 1) % works.length]);
	const many = $derived(works.length > 1);

	let dialog: HTMLDialogElement | undefined = $state();
	let loaded = $state(false);
	let failed = $state(false);

	$effect(() => {
		// a new work: show its colour until it arrives.
		void work.index;
		loaded = false;
		failed = false;
	});

	$effect(() => {
		// fetch the neighbours now, so ← and → are instant.
		for (const w of [previous, next]) {
			if (!w?.image || w === work) continue;
			const img = new Image();
			img.sizes = sizesFor(w);
			img.srcset = w.image.fullSrcset;
			img.src = w.image.full;
		}
	});

	onMount(() => {
		const opener = document.activeElement;
		const { overflow } = document.documentElement.style;
		document.documentElement.style.overflow = 'hidden';
		dialog?.showModal();
		dialog?.focus();
		return () => {
			dialog?.close();
			document.documentElement.style.overflow = overflow;
			if (opener instanceof HTMLElement && opener.isConnected)
				opener.focus({ preventScroll: true });
		};
	});

	function onkeydown(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const letter = isShortcut(event);
		// j back, k on, as in the exhibition. f closes what f opened; so does space,
		// unless it's pressing a button.
		const onButton = event.target instanceof Element && event.target.closest('button');
		if (many && (event.key === 'ArrowLeft' || (letter && event.key === 'j')))
			onmove(previous.index);
		else if (many && (event.key === 'ArrowRight' || (letter && event.key === 'k')))
			onmove(next.index);
		else if ((letter && event.key === 'f') || (event.key === ' ' && !onButton)) onclose();
		else return;
		event.preventDefault();
	}

	// esc: the dialog's own cancel. we close through the history instead, so back works too.
	function oncancel(event: Event) {
		event.preventDefault();
		onclose();
	}

	// links that work as links (a new tab, a copied address), and move in place on a plain click.
	function go(event: MouseEvent, to: number) {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
		event.preventDefault();
		onmove(to);
	}

	// on a phone: swipe sideways for the next one.
	let touch: { x: number; y: number } | null = null;
	function ontouchstart(event: TouchEvent) {
		touch =
			event.touches.length === 1
				? { x: event.touches[0].clientX, y: event.touches[0].clientY }
				: null;
	}
	function ontouchend(event: TouchEvent) {
		// pinched in to look closer: the swipe is for panning, not for moving on.
		const zoomed = (window.visualViewport?.scale ?? 1) > 1.01;
		if (!touch || !many || zoomed) return;
		const dx = event.changedTouches[0].clientX - touch.x;
		const dy = event.changedTouches[0].clientY - touch.y;
		touch = null;
		if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
		onmove(dx < 0 ? next.index : previous.index);
	}

	// as wide as the screen allows: the browser picks the file for that many device pixels.
	function sizesFor(w: Work) {
		const img = w.image!;
		return `min(100vw, calc((100vh - 76px) * ${(img.width / img.height).toFixed(4)}))`;
	}
	const sizes = $derived(sizesFor(work));
</script>

<dialog
	class="full"
	aria-label="{work.title}, full size"
	bind:this={dialog}
	{onkeydown}
	{oncancel}
	{ontouchstart}
	{ontouchend}
>
	<div class="full__stage" style:--ratio={image.width / image.height}>
		<div class="full__box" style:background={loaded ? 'transparent' : image.color}>
			{#if failed}
				<p class="full__note" role="status">
					<em>{work.title}</em> didn’t load.
					<button class="link-button" type="button" onclick={() => (failed = false)}
						>try again</button
					>
				</p>
			{:else}
				{#key work.index}
					<img
						class="full__img"
						src={image.full}
						srcset={image.fullSrcset}
						{sizes}
						width={image.width}
						height={image.height}
						alt={image.alt}
						decoding="async"
						fetchpriority="high"
						onload={() => (loaded = true)}
						onerror={() => (failed = true)}
					/>
				{/key}
			{/if}
		</div>
	</div>

	<p class="full__close">
		<button class="link-button" type="button" onclick={onclose}>close</button><span
			class="desktop-only"
			aria-hidden="true">{' '}(esc or f)</span
		>
	</p>

	<!-- the caption is read out as each work comes in. -->
	<p class="full__caption">
		<span aria-live="polite"
			><span class="desktop-only"
				>{work.artist.name}, <em>{work.title}</em>, {work.year}{#if work.number}{DOT}{work.number}{/if}</span
			><span class="mobile-only">{work.artist.name}, <em>{work.title}</em></span></span
		>
		{#if many}<span class="full__nav mobile-only"
				><br /><a href={workHref(previous)} onclick={(e) => go(e, previous.index)}>← previous</a
				>{sp(3)}<a href={workHref(next)} onclick={(e) => go(e, next.index)}>next →</a></span
			>{/if}
	</p>
	{#if many}
		<p class="full__nav desktop-only">
			<a href={workHref(previous)} onclick={(e) => go(e, previous.index)}>← previous</a>{sp(3)}<a
				href={workHref(next)}
				onclick={(e) => go(e, next.index)}>next →</a
			>
		</p>
	{/if}
</dialog>
