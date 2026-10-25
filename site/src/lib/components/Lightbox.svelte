<script lang="ts">
	import './lightbox.css';
	import { tick } from 'svelte';
	import type { Image } from '$lib/types';

	type Props = { images: Image[]; open: boolean; index: number };

	let { images, open = $bindable(), index = $bindable() }: Props = $props();

	let dialog = $state<HTMLDivElement>();
	let closeButton = $state<HTMLButtonElement>();
	const count = $derived(images.length);
	const image = $derived(images[index]);

	function step(by: number) {
		index = (index + by + count) % count;
	}

	function close() {
		open = false;
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
		else if (e.key === 'ArrowLeft') step(-1);
		else if (e.key === 'ArrowRight') step(1);
		else if (e.key === 'Tab' && dialog) {
			// keep focus inside the dialog.
			const items = [...dialog.querySelectorAll<HTMLElement>('button')];
			const first = items[0];
			const last = items[items.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	// swipe left / right to step, swipe down to close. two fingers are a pinch,
	// which the browser zooms natively.
	let start: { x: number; y: number } | null = null;

	function onTouchStart(e: TouchEvent) {
		start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
	}

	function onTouchEnd(e: TouchEvent) {
		if (!start || (window.visualViewport && window.visualViewport.scale > 1.01)) return;
		const dx = e.changedTouches[0].clientX - start.x;
		const dy = e.changedTouches[0].clientY - start.y;
		start = null;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
		else if (dy > 80 && dy > Math.abs(dx)) close();
	}

	$effect(() => {
		if (!open) return;
		const returnTo = document.activeElement as HTMLElement | null;
		document.documentElement.classList.add('lightbox-open');
		tick().then(() => closeButton?.focus());
		return () => {
			document.documentElement.classList.remove('lightbox-open');
			returnTo?.focus();
		};
	});
</script>

<svelte:window onkeydown={open ? onKey : undefined} />

{#if open && image}
	<!-- clicking the black around the image closes it, like the close button. -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		bind:this={dialog}
		class="lightbox"
		role="dialog"
		aria-modal="true"
		aria-label="full-screen image"
		tabindex="-1"
		onclick={(e) => e.target === e.currentTarget && close()}
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
	>
		<button bind:this={closeButton} class="link lightbox__close" type="button" onclick={close}>
			close ×
		</button>

		<figure class="lightbox__figure">
			<img
				class="lightbox__img"
				src={image.src}
				srcset={image.srcset}
				sizes="100vw"
				width={image.width}
				height={image.height}
				alt={image.alt}
				style:--ratio={image.width / image.height}
				style:background-image={image.lqip ? `url(${image.lqip})` : undefined}
			/>
			<figcaption class="lightbox__caption">
				{#if count > 1}
					<button
						class="link lightbox__arrow lightbox__arrow--prev"
						type="button"
						aria-label="previous image"
						onclick={() => step(-1)}>≤</button
					>
				{/if}
				<span class="lightbox__text">{image.caption}</span>
				<span class="lightbox__count">{index + 1} / {count}</span>
				{#if count > 1}
					<button
						class="link lightbox__arrow lightbox__arrow--next"
						type="button"
						aria-label="next image"
						onclick={() => step(1)}>≥</button
					>
				{/if}
			</figcaption>
		</figure>
	</div>
{/if}
