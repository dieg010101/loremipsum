<script lang="ts">
	import './picture.css';
	import type { Image } from '$lib/types';

	type Props = {
		image: Image;
		/** what the image is, for "… didn’t load". */
		title: string;
		sizes: string;
		/** the tallest it may be, in px. */
		maxHeight?: number;
		eager?: boolean;
		/** click opens it at full size. */
		onopen?: () => void;
		href?: string;
		class?: string;
	};

	let {
		image,
		title,
		sizes,
		maxHeight,
		eager = false,
		onopen,
		href,
		class: className = ''
	}: Props = $props();

	let failed = $state(false);
	let loaded = $state(false);
	let attempt = $state(0);
	let img: HTMLImageElement | undefined = $state();

	// a work is never cropped and never moves: the box is the image's own shape,
	// in its own average colour, from the first paint.
	const ratio = $derived(image.width / image.height);
	const src = $derived(
		attempt ? `${image.src}${image.src.includes('?') ? '&' : '?'}retry=${attempt}` : image.src
	);

	$effect(() => {
		// an image that finished before hydration fires no load event.
		if (img?.complete && img.naturalWidth) loaded = true;
	});

	function retry() {
		failed = false;
		loaded = false;
		attempt++;
	}

	function click(event: MouseEvent) {
		if (!onopen || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
		event.preventDefault();
		onopen();
	}
</script>

<span
	class="picture {className}"
	class:picture--loaded={loaded}
	style:--ratio={ratio}
	style:--color={image.color}
	style:--max-height={maxHeight ? `${maxHeight}px` : undefined}
>
	{#if !loaded && !failed}
		<span class="picture__note" aria-hidden="true"
			>loading{image.size ? `, ${image.size}` : ''}</span
		>
	{/if}
	{#if failed}
		<span class="picture__note picture__note--failed" role="status"
			><em>{title}</em> didn’t load.
			<button class="link-button" type="button" onclick={retry}>try again</button></span
		>
	{:else if href}
		<!-- named by the image's own description, then where the link goes. -->
		<a class="picture__link" {href} onclick={click}>
			{@render picture()}<span class="visually-hidden"
				>{image.alt ? ', ' : `${title}, `}full size</span
			>
		</a>
	{:else}
		{@render picture()}
	{/if}
</span>

{#snippet picture()}
	<img
		bind:this={img}
		class="picture__img"
		{src}
		srcset={attempt ? undefined : image.srcset}
		{sizes}
		width={image.width}
		height={image.height}
		alt={image.alt}
		loading={eager ? 'eager' : 'lazy'}
		fetchpriority={eager ? 'high' : 'auto'}
		decoding={eager ? 'sync' : 'async'}
		onload={() => (loaded = true)}
		onerror={() => (failed = true)}
	/>
{/snippet}
