<script lang="ts">
	import './carousel.css';
	import type { Image } from '$lib/types';
	import Picture from './Picture.svelte';
	import Lightbox from './Lightbox.svelte';

	type Props = {
		images: Image[];
		// hero: the homepage, one image filling the middle column's height.
		// single: exhibition pages, one image with its caption.
		// pair: work pages, two images side by side on desktop.
		mode: 'hero' | 'single' | 'pair';
		index?: number;
		// click an image for the full-screen view.
		zoomable?: boolean;
		sizes: string;
	};

	let { images, mode, index = $bindable(0), zoomable = false, sizes }: Props = $props();

	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);

	const count = $derived(images.length);
	const shown = $derived(mode === 'pair' && count > 1 ? [index, (index + 1) % count] : [index]);

	function step(by: number) {
		index = (index + by + count) % count;
	}

	function open(i: number) {
		lightboxIndex = i;
		lightboxOpen = true;
	}

	// warm the neighbours so stepping through feels instant.
	$effect(() => {
		for (const i of [index + 1, index + 2, index - 1]) {
			const image = images[(i + count) % count];
			if (!image) continue;
			const img = new Image();
			img.sizes = sizes;
			img.srcset = image.srcset;
		}
	});
</script>

{#if count}
	<!-- desktop pairs show two at once, so two images need no arrows there. -->
	<div class="carousel carousel--{mode}" class:carousel--two={count === 2}>
		<div class="carousel__stage">
			{#each shown as i, slot (slot)}
				{@const image = images[i]}
				<figure class="carousel__figure" class:carousel__figure--second={slot === 1}>
					{#if zoomable}
						<button
							class="carousel__zoom"
							type="button"
							aria-label="view full screen: {image.alt || `image ${i + 1}`}"
							onclick={() => open(i)}
						>
							<Picture {image} {sizes} eager={slot === 0} class="carousel__img" />
						</button>
					{:else}
						<Picture {image} {sizes} eager={slot === 0} class="carousel__img" />
					{/if}
					<!-- desktop pairs caption each image underneath it. -->
					{#if mode === 'pair' && image.caption}
						<figcaption class="carousel__caption">{image.caption}</figcaption>
					{/if}
				</figure>
			{/each}
		</div>

		{#if count > 1}
			<div class="carousel__controls">
				<button
					class="link carousel__arrow carousel__arrow--prev"
					type="button"
					aria-label="previous image"
					onclick={() => step(-1)}>≤</button
				>
				<p class="carousel__count" aria-live="polite">{index + 1} / {count}</p>
				<button
					class="link carousel__arrow carousel__arrow--next"
					type="button"
					aria-label="next image"
					onclick={() => step(1)}>≥</button
				>
			</div>
		{/if}

		<!-- every caption sits in the same spot, so the slot is as tall as the
		     longest one and the page underneath never jumps when stepping. -->
		{#if mode !== 'hero' && images.some((image) => image.caption)}
			<div class="carousel__captions">
				{#each images as image, i (i)}
					<p
						class="carousel__caption"
						class:carousel__caption--current={i === index}
						aria-hidden={i !== index}
					>
						{image.caption}
					</p>
				{/each}
			</div>
		{/if}
	</div>

	{#if zoomable}
		<Lightbox {images} bind:open={lightboxOpen} bind:index={lightboxIndex} />
	{/if}
{/if}
