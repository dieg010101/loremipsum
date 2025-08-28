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
    caption?: string;
    imageType?: ImageType;
  };

  const defaultImgs: GalleryItem[]     = project.gallery.filter((g: GalleryItem) => !g.imageType || g.imageType === 'default');
  const siteDesktopImgs: GalleryItem[] = project.gallery.filter((g: GalleryItem) => g.imageType === 'websiteDesktop');
  const siteMobileImgs: GalleryItem[]  = project.gallery.filter((g: GalleryItem) => g.imageType === 'websiteMobile');
  const mobileList:  GalleryItem[] = project.isWebsite ? (siteMobileImgs.length ? siteMobileImgs : defaultImgs) : defaultImgs;
  const desktopList: GalleryItem[] = project.isWebsite ? (siteDesktopImgs.length ? siteDesktopImgs : defaultImgs) : defaultImgs;
  const mCount = mobileList.length;
  const dCount = desktopList.length;
  const isDesktopSingle = dCount === 1;
  const isDesktopTwoUpStatic = !project.isWebsite && dCount === 2;
  const showDesktopArrows = project.isWebsite ? dCount > 1 : dCount > 2;
  const showMobileArrows = mCount > 1;

  let idxM = 0;
  $: currentM = mobileList[idxM];
  $: captionM = currentM?.caption ?? '';
  function prevM() { idxM = (idxM - 1 + mobileList.length) % mobileList.length; }
  function nextM() { idxM = (idxM + 1) % mobileList.length; }

  let idxD = 0;
  $: slideD = [desktopList[idxD], desktopList[(idxD + 1) % desktopList.length]];
  $: slideCapsD = [slideD[0]?.caption ?? '', slideD[1]?.caption ?? ''];
  function prevD() { if (showDesktopArrows) idxD = (idxD - 1 + desktopList.length) % desktopList.length; }
  function nextD() { if (showDesktopArrows) idxD = (idxD + 1) % desktopList.length; }

  /* this is to prevent the user from zooming in on accident
  when they are actually trying to click on the left or right arrow. */
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
      ? (project.isWebsite ? sizeWebsiteDesktop : sizeNonWebsiteHalf)
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
  $: if (browser) { idxM; warmNeighborsMobile(); }

  function warmNeighborsDesktop() {
    if (!browser || !showDesktopArrows) return;
    preload(desktopList[(idxD + 2) % desktopList.length]);
    preload(desktopList[(idxD - 1 + desktopList.length) % desktopList.length]);
  }
  $: if (browser) { idxD; warmNeighborsDesktop(); }

  let mLoaded = false;
  $: { currentM; mLoaded = false; }
  function handleLoadM() { mLoaded = true; }

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

  $: desktopGridCols =
    isDesktopSingle
      ? 'md:grid-cols-[max-content_350px] lg:grid-cols-[max-content_350px]'
      : 'md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:grid-cols-[minmax(0,clamp(620px,90vw,1100px))_350px]';
</script>

<svelte:head>
  <title>gallery</title>
  <link rel="preconnect" href="https://cdn.sanity.io" />
  <link rel="dns-prefetch" href="https://cdn.sanity.io" />

  {#if dCount > 0}
    <link
      rel="preload" as="image"
      href={desktopList[(idxD + 2) % dCount]?.src}
      imagesrcset={desktopList[(idxD + 2) % dCount]?.srcset}
      imagesizes={project.isWebsite ? sizeWebsiteDesktop : sizeNonWebsiteHalf}
      fetchpriority="low"
    />
  {/if}

  {#if mCount > 0}
    <link
      rel="preload" as="image"
      href={mobileList[(idxM + 1) % mCount]?.src}
      imagesrcset={mobileList[(idxM + 1) % mCount]?.srcset}
      imagesizes={sizeMobile}
      fetchpriority="low"
    />
  {/if}
</svelte:head>

<!-- mobile. -->
<div class="lg:hidden bg-black text-white px-4 py-2 min-h-screen flex flex-col overflow-x-hidden">
  <div class="relative w-full max-w-[500px] mx-auto">
    <div class="mb-2">
      <button type="button" on:click={goBack} aria-label="Back to gallery"
        class="bg-white text-blue-600 px-3 text-base leading-none underline">
        &lt;----- (back)
      </button>
    </div>

    <figure
      class="relative mx-auto flex items-center justify-center"
      style={`background-image:url('${currentM?.lqip ?? ''}'); background-size:cover; background-position:center;`}
    >
      <img
        src={currentM?.src}
        srcset={currentM?.srcset}
        sizes={sizeMobile}
        width={currentM?.w}
        height={currentM?.h}
        alt={`${details.title} – image ${idxM + 1}`}
        class={`block mx-auto h-auto w-auto max-h-[80svh] max-w-[min(100%,calc(80svh*3/4))]
                object-contain [image-orientation:from-image] select-none
                transition-[filter,opacity,transform] duration-300 will-change-transform
                ${mLoaded ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        draggable="false"
        on:load={handleLoadM}
      />

      {#if showMobileArrows}
        <button bind:this={prevBtnM} on:click={prevM} aria-label="Previous image"
          class="tap-target absolute left-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-4xl leading-none z-20">≤</button>
        <button bind:this={nextBtnM} on:click={nextM} aria-label="Next image"
          class="tap-target absolute right-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-4xl leading-none z-20">≥</button>
      {/if}
    </figure>

    <p class="text-sm mt-2">{captionM}</p>
  </div>

  <!-- Meta (mobile) -->
  <div class="mt-4 max-w-[720px] mx-auto flex flex-col gap-3 text-sm">
    <div class="flex flex-wrap gap-x-4 gap-y-2">
      <div class="flex-1 min-w-[120px]"><p class="leading-tight">
        <b class="underline text-blue-600 bg-white px-0.5">client</b><br />{details.client}</p></div>
      <div class="flex-1 min-w-[120px]"><p class="leading-tight">
        <b class="underline text-blue-600 bg-white px-0.5">title</b><br />{details.title}</p></div>
      <div class="flex-1 min-w-[120px]"><p class="leading-tight">
        <b class="underline text-blue-600 bg-white px-0.5">date</b><br />{details.date}</p></div>
    </div>
    <div class="flex flex-wrap gap-y-2 sm:gap-x-4">
      <div class="w-full sm:w-1/2"><p class="leading-tight">
        <b class="underline text-blue-600 bg-white px-0.5">medium</b><br />{details.medium}</p></div>
      <div class="w-full sm:w-1/2"><p class="leading-tight">
        <b class="underline text-blue-600 bg-white px-0.5">dimensions</b><br />{details.dimensions}</p></div>
      <div class="w-full sm:w-1/2"><p class="leading-tight">
        <b class="underline text-blue-600 bg-white px-0.5">credit</b><br />{details.credit}</p></div>
    </div>
    <div>
      <p class="underline text-blue-600 px-0.5 text-base font-thin"><b class="bg-white">description</b></p>
      <p class="text-sm leading-snug mt-1 mb-5">{details.description}</p>
    </div>
  </div>
</div>

<!-- desktop. -->
<div class={`hidden lg:grid min-h-screen bg-black text-white ${desktopGridCols} md:gap-6 lg:gap-8 px-6 py-4 overflow-x-hidden`}>
  <section class="slide flex flex-col items-center space-y-4 lg:space-y-6 w-full">
    <div class={`relative ${isDesktopSingle ? 'w-fit ml-auto' : 'w-full md:max-w-[900px] lg:max-w-none md:mx-auto'}`}>
      <div class="mb-1">
        <button type="button" on:click={goBack} aria-label="Back to gallery"
          class="bg-white text-blue-600 px-3 text-base leading-none underline">
          &lt;----- (back)
        </button>
      </div>

      {#if showDesktopArrows}
        <button bind:this={prevBtnD} on:click={prevD} aria-label="Previous image"
          class="tap-target absolute left-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl leading-none z-10">≤</button>
      {/if}

      {#if project.isWebsite}
        <figure
          class="overflow-hidden aspect-[16/9] max-h-[82vh] flex items-center justify-center"
          style={`background-image:url('${slideD[0]?.lqip ?? ''}'); background-size:cover; background-position:center;`}
        >
          <img
            src={slideD[0]?.src}
            srcset={slideD[0]?.srcset}
            sizes={sizeWebsiteDesktop}
            width={slideD[0]?.w}
            height={slideD[0]?.h}
            alt={`${details.title} – image ${idxD + 1}`}
            class={`w-full h-full object-cover object-center transition-[filter,opacity] duration-300
                    ${dLoaded[slideD[0]?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            on:load={() => markLoaded(slideD[0]?.src)}
          />
        </figure>
      {:else}
        {#if isDesktopTwoUpStatic}
          <div class="grid grid-cols-2 gap-6">
            {#each desktopList as item (item?.src)}
              <figure
                class="overflow-hidden aspect-[3/4] max-h-[82vh] flex items-center justify-center"
                style={`background-image:url('${item?.lqip ?? ''}'); background-size:cover; background-position:center;`}
              >
                <img
                  src={item?.src}
                  srcset={item?.srcset}
                  sizes={sizeNonWebsiteHalf}
                  width={item?.w}
                  height={item?.h}
                  alt={`${details.title} – image ${desktopList.indexOf(item) + 1}`}
                  class={`w-full h-full object-cover object-center transition-[filter,opacity] duration-300
                          ${dLoaded[item?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
                  loading="eager"
                  fetchpriority="low"
                  decoding="async"
                  on:load={() => markLoaded(item?.src)}
                />
              </figure>
            {/each}
          </div>
        {:else if isDesktopSingle}
          <figure
            class="overflow-hidden aspect-[3/4] max-h-[82vh] flex items-center justify-center"
            style={`background-image:url('${desktopList[0]?.lqip ?? ''}'); background-size:cover; background-position:center;`}
          >
            <img
              src={desktopList[0]?.src}
              srcset={desktopList[0]?.srcset}
              sizes={sizeNonWebsiteHalf}
              width={desktopList[0]?.w}
              height={desktopList[0]?.h}
              alt={`${details.title} – image 1`}
              class={`w-full h-full object-cover object-center transition-[filter,opacity] duration-300
                      ${dLoaded[desktopList[0]?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
              loading="eager"
              fetchpriority="high"
              decoding="async"
              on:load={() => markLoaded(desktopList[0]?.src)}
            />
          </figure>
        {:else}
          <div class="grid grid-cols-2 gap-6">
            {#each slideD as item (item?.src)}
              <figure
                class="overflow-hidden aspect-[3/4] max-h-[82vh] flex items-center justify-center"
                style={`background-image:url('${item?.lqip ?? ''}'); background-size:cover; background-position:center;`}
              >
                <img
                  src={item?.src}
                  srcset={item?.srcset}
                  sizes={sizeNonWebsiteHalf}
                  width={item?.w}
                  height={item?.h}
                  alt={`${details.title} – image ${desktopList.indexOf(item) + 1}`}
                  class={`w-full h-full object-cover object-center transition-[filter,opacity] duration-300
                          ${dLoaded[item?.src ?? ''] ? 'opacity-100 filter-none' : 'opacity-90 blur-[6px]'}`}
                  loading="eager"
                  fetchpriority={item === slideD[0] ? 'high' : 'low'}
                  decoding="async"
                  on:load={() => markLoaded(item?.src)}
                />
              </figure>
            {/each}
          </div>
        {/if}
      {/if}

      {#if showDesktopArrows}
        <button bind:this={nextBtnD} on:click={nextD} aria-label="Next image"
          class="tap-target absolute right-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl leading-none z-10">≥</button>
      {/if}
    </div>
    {#if !project.isWebsite}
      <div class={`w-full ${isDesktopSingle ? '' : 'md:max-w-[900px] lg:max-w-none md:mx-auto'}`}>
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
      <div class="grid text-xs w-full md:max-w-[900px]">
        <p>{slideCapsD[0]}</p>
      </div>
    {/if}
  </section>
  <aside class="meta flex flex-col gap-4 lg:gap-6 text-xs">
    <p class="text-sm leading-tight"><b class="underline text-blue-700 bg-white text-base">client</b><br />{details.client}</p>
    <p class="text-sm leading-tight"><b class="underline text-blue-700 bg-white text-base">title</b><br />{details.title}</p>
    <p class="text-sm leading-tight"><b class="underline text-blue-700 bg-white text-base">date</b><br />{details.date}</p>
    <p class="text-sm leading-tight"><b class="underline text-blue-700 bg-white text-base">medium</b><br />{details.medium}</p>
    <p class="text-sm leading-tight"><b class="underline text-blue-700 bg-white text-base">dimensions</b><br />{details.dimensions}</p>
    <p class="text-sm leading-tight"><b class="underline text-blue-700 bg-white text-base">credit</b><br />{details.credit}</p>
    <p class="underline text-blue-600 px-0.5 text-base font-thin"><b class="bg-white">description</b></p>
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