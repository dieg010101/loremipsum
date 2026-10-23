<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	export let data: PageData;
	const { project } = data;

	type ImageType = 'default' | 'websiteDesktop' | 'websiteMobile' | undefined;
	type GalleryItem = {
		src: string;
		srcset?: string;
		w?: number;
		h?: number;
		lqip?: string | null;
		aspect?: number | null;
		caption?: string;
		imageType?: ImageType;
	};

	const defaultImgs: GalleryItem[] = project.gallery.filter(
		(g) => !g.imageType || g.imageType === 'default'
	);
	const siteDesktop: GalleryItem[] = project.gallery.filter(
		(g) => g.imageType === 'websiteDesktop'
	);
	const siteMobile: GalleryItem[] = project.gallery.filter((g) => g.imageType === 'websiteMobile');

	const mobileList: GalleryItem[] = project.isWebsite
		? siteMobile.length
			? siteMobile
			: defaultImgs
		: defaultImgs;
	const desktopList: GalleryItem[] = project.isWebsite
		? siteDesktop.length
			? siteDesktop
			: defaultImgs
		: defaultImgs;

	const mCount = mobileList.length;
	const dCount = desktopList.length;

	const isDesktopSingle = dCount === 1;
	const isDesktopTwoUpStatic = !project.isWebsite && dCount === 2;
	const showDesktopArrows = project.isWebsite ? dCount > 1 : dCount > 2;
	const showMobileArrows = mCount > 1;

	let idxM = 0;
	$: currentM = mobileList[idxM];
	$: captionM = currentM?.caption ?? '';
	function prevM() {
		idxM = (idxM - 1 + mobileList.length) % mobileList.length;
	}
	function nextM() {
		idxM = (idxM + 1) % mobileList.length;
	}

	let idxD = 0;
	$: slideD = [desktopList[idxD], desktopList[(idxD + 1) % desktopList.length]];
	$: slideCapsD = [slideD[0]?.caption ?? '', slideD[1]?.caption ?? ''];
	function prevD() {
		if (showDesktopArrows) idxD = (idxD - 1 + desktopList.length) % desktopList.length;
	}
	function nextD() {
		if (showDesktopArrows) idxD = (idxD + 1) % desktopList.length;
	}

	const containerARDefault = 3 / 4;

	function imgFitClassFor(aspect?: number | null, forceContain = false) {
		if (forceContain) return 'object-contain object-center';
		if (aspect == null || aspect >= containerARDefault) return 'object-contain object-center';
		return 'object-cover object-center';
	}
	const isWebMobile = (g?: GalleryItem) => project.isWebsite && g?.imageType === 'websiteMobile';

	function attachNoDoubleTapZoom(el: HTMLElement, onActivate: () => void) {
		el.style.touchAction = 'manipulation';
		let lastTouch = 0;
		const THRESHOLD = 300;
		const onTouchEnd = (e: TouchEvent) => {
			const now = performance.now();
			if (now - lastTouch < THRESHOLD) {
				e.preventDefault();
				onActivate();
			}
			lastTouch = now;
		};
		const onDblClick = (e: MouseEvent) => e.preventDefault();
		el.addEventListener('touchend', onTouchEnd, { passive: false });
		el.addEventListener('dblclick', onDblClick);
		return () => {
			el.removeEventListener('touchend', onTouchEnd);
			el.removeEventListener('dblclick', onDblClick);
		};
	}

	let prevBtnM: HTMLButtonElement;
	let nextBtnM: HTMLButtonElement;
	let prevBtnD: HTMLButtonElement;
	let nextBtnD: HTMLButtonElement;

	onMount(() => {
		const cleanups: Array<() => void> = [];
		if (showMobileArrows && prevBtnM) cleanups.push(attachNoDoubleTapZoom(prevBtnM, prevM));
		if (showMobileArrows && nextBtnM) cleanups.push(attachNoDoubleTapZoom(nextBtnM, nextM));
		if (showDesktopArrows && prevBtnD) cleanups.push(attachNoDoubleTapZoom(prevBtnD, prevD));
		if (showDesktopArrows && nextBtnD) cleanups.push(attachNoDoubleTapZoom(nextBtnD, nextD));
		warmNeighborsMobile();
		warmNeighborsDesktop();
		return () => cleanups.forEach((fn) => fn());
	});

	const details = {
		client: project.client,
		title: project.title,
		date: project.date,
		medium: project.medium,
		dimensions: project.dimensions,
		credit: project.credit,
		description: project.description
	};

	const sizeMobile = '100vw';
	const sizeWebsiteDesktop = '(min-width: 1024px) clamp(620px,90vw,1100px), 100vw';
	const sizeNonWebsiteHalf = '(min-width: 1024px) 45vw, 100vw';

	function goBack() {
		if (history.length > 1) history.back();
		else goto('/portfolio');
	}

	function preload(item?: GalleryItem) {
		if (!browser || !item?.src) return;
		const img = new Image();
		if (item.srcset) img.srcset = item.srcset;
		img.sizes = matchMedia('(min-width: 1024px)').matches
			? project.isWebsite
				? sizeWebsiteDesktop
				: sizeNonWebsiteHalf
			: sizeMobile;
		img.decoding = 'async';
		img.loading = 'eager';
		img.src = item.src;
	}

	function warmNeighborsMobile() {
		if (!browser || mCount < 2) return;
		preload(mobileList[(idxM + 1) % mobileList.length]);
		preload(mobileList[(idxM - 1 + mobileList.length) % mobileList.length]);
	}
	$: if (browser) {
		idxM;
		warmNeighborsMobile();
	}

	function warmNeighborsDesktop() {
		if (!browser || !showDesktopArrows) return;
		preload(desktopList[(idxD + 2) % desktopList.length]);
		preload(desktopList[(idxD - 1 + desktopList.length) % desktopList.length]);
	}
	$: if (browser) {
		idxD;
		warmNeighborsDesktop();
	}
	function ready(node: HTMLImageElement, onReady: () => void) {
		const fire = () => {
			try {
				onReady?.();
			} catch {}
		};
		if (node.complete && node.naturalWidth > 0) {
			queueMicrotask(fire);
		}
		node.addEventListener('load', fire);
		node.addEventListener('error', fire);
		return {
			destroy() {
				node.removeEventListener('load', fire);
				node.removeEventListener('error', fire);
			}
		};
	}

	let mLoaded = false;
	$: {
		currentM;
		mLoaded = false;
	}

	let dLoaded: Record<string, boolean> = {};
	$: {
		for (const item of slideD) {
			if (item?.src && dLoaded[item.src] === undefined) dLoaded[item.src] = false;
		}
	}
	function markLoaded(src?: string) {
		if (!src) return;
		dLoaded = { ...dLoaded, [src]: true };
	}

	$: desktopGridCols = isDesktopSingle
		? 'md:grid-cols-[max-content_350px] lg:grid-cols-[max-content_350px]'
		: 'md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:grid-cols-[minmax(0,clamp(620px,90vw,1100px))_350px]';
</script>

<svelte:head>
	<title>Gallery</title>
	<meta
		name="description"
		content="Lorem Ipsum Art Group gallery page: features additional images & information for individual agency projects."
	/>
	<link rel="preconnect" href="https://cdn.sanity.io" />
	<link rel="dns-prefetch" href="https://cdn.sanity.io" />

	{#if dCount > 0}
		<link
			rel="preload"
			as="image"
			href={desktopList[(idxD + 2) % dCount]?.src}
			imagesrcset={desktopList[(idxD + 2) % dCount]?.srcset}
			imagesizes={project.isWebsite ? sizeWebsiteDesktop : sizeNonWebsiteHalf}
			fetchpriority="low"
		/>
	{/if}

	{#if mCount > 0}
		<link
			rel="preload"
			as="image"
			href={mobileList[(idxM + 1) % mCount]?.src}
			imagesrcset={mobileList[(idxM + 1) % mCount]?.srcset}
			imagesizes={sizeMobile}
			fetchpriority="low"
		/>
	{/if}
</svelte:head>

<!-- mobile. -->
<div class="flex min-h-screen flex-col overflow-x-hidden bg-black px-4 py-2 text-white lg:hidden">
	<div class="relative mx-auto w-full max-w-[520px]">
		<div class="mb-2">
			<button
				type="button"
				on:click={goBack}
				aria-label="Back to gallery"
				class="bg-white px-3 text-base leading-none text-blue-600 underline"
			>
				&lt;----- (back)
			</button>
		</div>
		<figure
			class="relative mx-auto flex aspect-[3/4] w-full max-w-[min(100%,520px)] items-center justify-center"
			style={`background-image:url('${currentM?.lqip ?? ''}'); background-size:cover; background-position:center;`}
		>
			<img
				use:ready={() => {
					mLoaded = true;
				}}
				src={currentM?.src}
				srcset={currentM?.srcset}
				sizes={sizeMobile}
				width={currentM?.w}
				height={currentM?.h}
				alt={`${details.title} – image ${idxM + 1}`}
				class={`h-full w-full ${imgFitClassFor(currentM?.aspect, isWebMobile(currentM))}
                transition-[filter,opacity,transform] duration-300
                will-change-transform select-none [image-orientation:from-image]
                ${mLoaded ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
				loading="eager"
				fetchpriority="high"
				decoding="async"
				draggable="false"
			/>

			{#if showMobileArrows}
				<button
					bind:this={prevBtnM}
					on:click={prevM}
					aria-label="Previous image"
					class="tap-target absolute top-1/2 left-0 z-20 -translate-y-1/2 bg-white px-3 text-4xl leading-none text-blue-600"
					>≤</button
				>
				<button
					bind:this={nextBtnM}
					on:click={nextM}
					aria-label="Next image"
					class="tap-target absolute top-1/2 right-0 z-20 -translate-y-1/2 bg-white px-3 text-4xl leading-none text-blue-600"
					>≥</button
				>
			{/if}
		</figure>

		<p class="mt-2 text-sm">{captionM}</p>
	</div>
	<div class="mx-auto mt-4 flex max-w-[720px] flex-col gap-3 text-sm">
		<div class="flex flex-wrap gap-x-4 gap-y-2">
			<div class="min-w-[120px] flex-1">
				<p class="leading-tight">
					<b class="bg-white px-0.5 text-blue-600 underline">client</b><br />{details.client}
				</p>
			</div>
			<div class="min-w-[120px] flex-1">
				<p class="leading-tight">
					<b class="bg-white px-0.5 text-blue-600 underline">title</b><br />{details.title}
				</p>
			</div>
			<div class="min-w-[120px] flex-1">
				<p class="leading-tight">
					<b class="bg-white px-0.5 text-blue-600 underline">date</b><br />{details.date}
				</p>
			</div>
		</div>
		<div class="flex flex-wrap gap-y-2 sm:gap-x-4">
			<div class="w-full sm:w-1/2">
				<p class="leading-tight">
					<b class="bg-white px-0.5 text-blue-600 underline">medium</b><br />{details.medium}
				</p>
			</div>
			<div class="w-full sm:w-1/2">
				<p class="leading-tight">
					<b class="bg-white px-0.5 text-blue-600 underline">dimensions</b><br
					/>{details.dimensions}
				</p>
			</div>
			<div class="w-full sm:w-1/2">
				<p class="leading-tight">
					<b class="bg-white px-0.5 text-blue-600 underline">credit</b><br />{details.credit}
				</p>
			</div>
		</div>
		<div>
			<p class="px-0.5 text-base font-thin text-blue-600 underline">
				<b class="bg-white">description</b>
			</p>
			<p class="mt-1 mb-5 text-sm leading-snug">{details.description}</p>
		</div>
	</div>
</div>

<!-- desktop. -->
<div
	class={`hidden min-h-screen bg-black text-white lg:grid ${desktopGridCols} overflow-x-hidden px-6 py-4 md:gap-6 lg:gap-8`}
>
	<section class="slide flex w-full flex-col items-center space-y-4 lg:space-y-6">
		<div
			class={`relative ${isDesktopSingle ? 'ml-auto w-fit' : 'w-full md:mx-auto md:max-w-[900px] lg:max-w-none'}`}
		>
			<div class="mb-1">
				<button
					type="button"
					on:click={goBack}
					aria-label="Back to gallery"
					class="bg-white px-3 text-base leading-none text-blue-600 underline"
				>
					&lt;----- (back)
				</button>
			</div>

			{#if showDesktopArrows}
				<button
					bind:this={prevBtnD}
					on:click={prevD}
					aria-label="Previous image"
					class="tap-target absolute top-1/2 left-0 z-10 -translate-y-1/2 bg-white px-3 text-2xl leading-none text-blue-600"
					>≤</button
				>
			{/if}

			{#if project.isWebsite}
				<figure
					class="flex aspect-[16/9] max-h-[82vh] items-center justify-center overflow-hidden"
					style={`background-image:url('${slideD[0]?.lqip ?? ''}'); background-size:cover; background-position:center;`}
				>
					<img
						use:ready={() => markLoaded(slideD[0]?.src)}
						src={slideD[0]?.src}
						srcset={slideD[0]?.srcset}
						sizes={sizeWebsiteDesktop}
						width={slideD[0]?.w}
						height={slideD[0]?.h}
						alt={`${details.title} – image ${idxD + 1}`}
						class={`h-full w-full object-cover object-center transition-[filter,opacity] duration-300
                    ${dLoaded[slideD[0]?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
						loading="eager"
						fetchpriority="high"
						decoding="async"
					/>
				</figure>
			{:else if isDesktopTwoUpStatic}
				<div class="grid grid-cols-2 gap-6">
					{#each desktopList as item (item?.src)}
						<figure
							class="flex aspect-[3/4] max-h-[82vh] items-center justify-center overflow-hidden"
							style={`background-image:url('${item?.lqip ?? ''}'); background-size:cover; background-position:center;`}
						>
							<img
								use:ready={() => markLoaded(item?.src)}
								src={item?.src}
								srcset={item?.srcset}
								sizes={sizeNonWebsiteHalf}
								width={item?.w}
								height={item?.h}
								alt={`${details.title} – image ${desktopList.indexOf(item) + 1}`}
								class={`h-full w-full ${imgFitClassFor(item?.aspect)}
                          transition-[filter,opacity] duration-300
                          ${dLoaded[item?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
								loading="eager"
								fetchpriority="low"
								decoding="async"
							/>
						</figure>
					{/each}
				</div>
			{:else if isDesktopSingle}
				<figure
					class="flex aspect-[3/4] max-h-[82vh] items-center justify-center overflow-hidden"
					style={`background-image:url('${desktopList[0]?.lqip ?? ''}'); background-size:cover; background-position:center;`}
				>
					<img
						use:ready={() => markLoaded(desktopList[0]?.src)}
						src={desktopList[0]?.src}
						srcset={desktopList[0]?.srcset}
						sizes={sizeNonWebsiteHalf}
						width={desktopList[0]?.w}
						height={desktopList[0]?.h}
						alt={`${details.title} – image 1`}
						class={`h-full w-full ${imgFitClassFor(desktopList[0]?.aspect)}
                      transition-[filter,opacity] duration-300
                      ${dLoaded[desktopList[0]?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
						loading="eager"
						fetchpriority="high"
						decoding="async"
					/>
				</figure>
			{:else}
				<div class="grid grid-cols-2 gap-6">
					{#each slideD as item (item?.src)}
						<figure
							class="flex aspect-[3/4] max-h-[82vh] items-center justify-center overflow-hidden"
							style={`background-image:url('${item?.lqip ?? ''}'); background-size:cover; background-position:center;`}
						>
							<img
								use:ready={() => markLoaded(item?.src)}
								src={item?.src}
								srcset={item?.srcset}
								sizes={sizeNonWebsiteHalf}
								width={item?.w}
								height={item?.h}
								alt={`${details.title} – image ${desktopList.indexOf(item) + 1}`}
								class={`h-full w-full ${imgFitClassFor(item?.aspect)}
                          transition-[filter,opacity] duration-300
                          ${dLoaded[item?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
								loading="eager"
								fetchpriority={item === slideD[0] ? 'high' : 'low'}
								decoding="async"
							/>
						</figure>
					{/each}
				</div>
			{/if}

			{#if showDesktopArrows}
				<button
					bind:this={nextBtnD}
					on:click={nextD}
					aria-label="Next image"
					class="tap-target absolute top-1/2 right-0 z-10 -translate-y-1/2 bg-white px-3 text-2xl leading-none text-blue-600"
					>≥</button
				>
			{/if}
		</div>

		{#if !project.isWebsite}
			<div class={`w-full ${isDesktopSingle ? '' : 'md:mx-auto md:max-w-[900px] lg:max-w-none'}`}>
				{#if isDesktopTwoUpStatic}
					<div class="grid grid-cols-2 gap-6 text-xs">
						<p class="text-left">{desktopList[0]?.caption ?? ''}</p>
						<p class="text-left">{desktopList[1]?.caption ?? ''}</p>
					</div>
				{:else if isDesktopSingle}
					<div class="text-xs"><p class="text-left">{desktopList[0]?.caption ?? ''}</p></div>
				{:else}
					<div class="grid grid-cols-2 gap-6 text-xs">
						<p class="text-left">{slideCapsD[0]}</p>
						<p class="text-left">{slideCapsD[1]}</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="grid w-full text-xs md:max-w-[900px]">
				<p>{slideCapsD[0]}</p>
			</div>
		{/if}
	</section>

	<aside class="meta flex flex-col gap-4 text-xs lg:gap-6">
		<p class="text-sm leading-tight">
			<b class="bg-white text-base text-blue-700 underline">client</b><br />{details.client}
		</p>
		<p class="text-sm leading-tight">
			<b class="bg-white text-base text-blue-700 underline">title</b><br />{details.title}
		</p>
		<p class="text-sm leading-tight">
			<b class="bg-white text-base text-blue-700 underline">date</b><br />{details.date}
		</p>
		<p class="text-sm leading-tight">
			<b class="bg-white text-base text-blue-700 underline">medium</b><br />{details.medium}
		</p>
		<p class="text-sm leading-tight">
			<b class="bg-white text-base text-blue-700 underline">dimensions</b><br />{details.dimensions}
		</p>
		<p class="text-sm leading-tight">
			<b class="bg-white text-base text-blue-700 underline">credit</b><br />{details.credit}
		</p>
		<p class="px-0.5 text-base font-thin text-blue-600 underline">
			<b class="bg-white">description</b>
		</p>
		<p class="text-sm leading-snug">{details.description}</p>
	</aside>
</div>

<style>
	.tap-target {
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
	}
</style>
