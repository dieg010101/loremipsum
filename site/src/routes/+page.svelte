<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let data: PageData;
	const { projects, clients } = data;

	$: uniqueClients = [...new Set((clients ?? []).map((c: string) => c?.trim()))].sort();

	let idx = 0;
	function prev() {
		idx = (idx - 1 + projects.length) % projects.length;
	}
	function next() {
		idx = (idx + 1) % projects.length;
	}

	$: current = projects[idx] ?? {};
	$: coverSrc = current.coverUrl ?? '/placeholder.jpg';
	$: coverSet = current.coverSrcSet ?? undefined;
	$: coverAlt = current.title ?? 'image';
	$: coverW = current.coverWidth ?? 600;
	$: coverH = current.coverHeight ?? 800;
	$: coverLqip = current.coverLqip ?? null;
	$: coverAspect = current.coverAspect ?? null;

	const containerAspect = 3 / 4;
	const imgFitClassFor = (aspect?: number | null) =>
		aspect == null || aspect >= containerAspect
			? 'object-contain object-center'
			: 'object-cover object-center';

	let heroLoaded = false;
	let imgEl: HTMLImageElement | null = null;

	$: imgKey = coverSrc as string;

	function isImgLoaded(el: HTMLImageElement | null) {
		return !!(el && el.complete && el.naturalWidth > 0);
	}

	onMount(() => {
		if (isImgLoaded(imgEl)) heroLoaded = true;
	});

	let _prevKey: string | null = null;
	$: if (browser && imgKey !== _prevKey) {
		heroLoaded = false;
		_prevKey = imgKey;
		if (isImgLoaded(imgEl)) heroLoaded = true;
	}

	$: blurStyle =
		coverLqip && !heroLoaded
			? `background-image:url('${coverLqip}');
		 background-size:cover;background-position:center;
		 filter:blur(6px);`
			: undefined;

	let prefetchAround: (i: number) => void = () => {};
	onMount(() => {
		prefetchAround = (i: number) => {
			if (!projects?.length) return;
			const nextIdx = (i + 1) % projects.length;
			const prevIdx = (i - 1 + projects.length) % projects.length;
			[nextIdx, prevIdx].forEach((j) => {
				const p = projects[j];
				if (!p?.coverUrl) return;
				const img = new Image();
				if (p.coverSrcSet) img.srcset = p.coverSrcSet;
				img.src = p.coverUrl;
				img.decoding = 'async';
			});
		};
		if (projects?.length > 1) prefetchAround(idx);
	});

	$: if (browser && projects?.length > 1) {
		prefetchAround(idx);
	}
</script>

<svelte:head>
	<title>Lorem Ipsum Art Group</title>
	<meta name="description" content="Lorem Ipsum Art Group: independent art practice." />
</svelte:head>

<!-- mobile. -->
<div class="space-y-8 p-4 lg:hidden">
	<div>
		<p class="text-base font-thin text-blue-600 underline">
			<b class="bg-white">About</b>
		</p>
		<p class="text-xs">
			Lorem Ipsum Art Group is an art practice dedicated to developing nuanced design languages
			across both traditionally creative and overlooked industries. Our work records modern
			phenomena through practical application of art and design, creating visual identities that are
			culturally connected and contextually significant.
		</p>
	</div>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<p class="text-base font-thin text-blue-600 underline">
				<b class="bg-white">Services</b>
			</p>
			<ul class="list-inside list-disc space-y-1 text-xs">
				<li>brand identity & visual language</li>
				<li>merchandising & product design</li>
				<li>web & digital experience</li>
				<li>creative direction & campaigns</li>
				<li>packaging & physical touchpoints</li>
			</ul>
		</div>
		<div>
			<p class="text-base font-thin text-blue-600 underline">
				<b class="bg-white">Clients</b>
			</p>
			<ul class="list-inside list-disc space-y-1 text-xs">
				{#each uniqueClients as c}
					<li>{c}</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<!-- desktop. -->
<div class="hidden flex-1 lg:flex">
	<aside class="w-[25%] space-y-4 px-3">
		<div>
			<p class="text-base font-thin text-blue-600 underline">
				<b class="bg-white">about</b>
			</p>
			<p class="mt-0 text-xs">
				Lorem Ipsum Art Group is an art practice dedicated to developing nuanced design languages
				across both traditionally creative and overlooked industries. Our work records modern
				phenomena through practical application of art and design, creating visual identities that
				are culturally connected and contextually significant.
			</p>
		</div>

		<div>
			<p class="text-base font-thin text-blue-600 underline">
				<b class="bg-white">services</b>
			</p>
			<ul class="mt-0 list-none space-y-1 text-xs">
				<li>
					<b class="underline">brand identity & visual language</b><br />
					logos, typography, color, guidelines
				</li>
				<li>
					<b class="underline">merchandising & product design</b><br />
					apparel, accessories, cut & sew, capsules
				</li>
				<li>
					<b class="underline">web & digital experience</b><br />
					webflow, shopify, ux/ui, digital storytelling
				</li>
				<li>
					<b class="underline">creative direction & campaigns</b><br />
					campaigns, art direction, styling, rollouts
				</li>
				<li>
					<b class="underline">packaging & physical touchpoints</b><br />
					packaging, unboxing, print, collateral
				</li>
			</ul>
		</div>

		<div>
			<p class="text-base font-thin text-blue-600 underline">
				<b class="bg-white">clients</b>
			</p>
			<ul class="mt-0 list-none space-y-0.5 text-xs">
				{#each uniqueClients as c}
					<li>{c}</li>
				{/each}
			</ul>
		</div>
	</aside>

	<section class="mb-12 flex w-[50%] items-center justify-center p-0">
		<div class="flex items-center gap-4">
			<button
				aria-label="Previous"
				on:click={prev}
				class="bg-white px-0 text-2xl text-blue-600 select-none
				 focus-visible:outline focus-visible:outline-2"
			>
				&le;
			</button>
			<figure
				class="flex aspect-[3/4] w-[clamp(300px,45vw,600px)]
				 items-center justify-center overflow-hidden bg-black"
			>
				{#key imgKey}
					<img
						bind:this={imgEl}
						src={coverSrc}
						srcset={coverSet}
						sizes="(min-width: 1024px) clamp(300px,45vw,600px)"
						alt={coverAlt}
						width={coverW}
						height={coverH}
						loading="eager"
						decoding="async"
						fetchpriority="high"
						style={blurStyle}
						on:load={() => {
							heroLoaded = true;
						}}
						on:error={() => {
							heroLoaded = true;
						}}
						class={`h-full w-full ${imgFitClassFor(coverAspect)}`}
					/>
				{/key}
			</figure>

			<button
				aria-label="Next"
				on:click={next}
				class="bg-white px-0 text-2xl text-blue-600 select-none
				 focus-visible:outline focus-visible:outline-2"
			>
				&ge;
			</button>
		</div>
	</section>

	<aside class="w-[25%] space-y-4 px-3">
		<div>
			<p class="text-sm">
				<b class="bg-white text-base text-blue-700 underline">client</b><br />
				{current.client}
			</p>
			<p class="mt-4 text-sm">
				<b class="bg-white text-base text-blue-700 underline">title</b><br />
				{current.title}
			</p>
			<p class="mt-4 text-sm">
				<b class="bg-white text-base text-blue-700 underline">date</b><br />
				{current.date}
			</p>
			<p class="mt-4 text-sm">
				<b class="bg-white text-base text-blue-700 underline">medium</b><br />
				{current.medium}
			</p>
			<p class="mt-4 text-sm">
				<b class="bg-white text-base text-blue-700 underline">dimensions</b><br />
				{current.dimensions}
			</p>
			<p class="mt-4 text-sm">
				<b class="bg-white text-base text-blue-700 underline">credit</b><br />
				{current.credit}
			</p>
		</div>

		<div>
			<p class="text-base font-thin text-blue-700 underline">
				<b class="bg-white">description</b>
			</p>
			<p class="mt-0 text-sm">
				{current.description}
			</p>
		</div>
	</aside>
</div>
