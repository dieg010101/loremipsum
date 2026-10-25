<script lang="ts">
	import type { Image } from '$lib/types';

	type Props = {
		image: Image;
		sizes: string;
		class?: string;
		eager?: boolean;
	};

	let { image, sizes, class: className = '', eager = false }: Props = $props();
</script>

<!-- the blurred preview sits behind the image until it loads. -->
<img
	class={className}
	src={image.src}
	srcset={image.srcset}
	{sizes}
	width={image.width}
	height={image.height}
	alt={image.alt}
	style:--ratio={image.width / image.height}
	loading={eager ? 'eager' : 'lazy'}
	fetchpriority={eager ? 'high' : undefined}
	decoding="async"
	style:background-image={image.lqip ? `url(${image.lqip})` : undefined}
/>
