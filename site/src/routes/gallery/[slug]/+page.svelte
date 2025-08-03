<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  export let data: PageData;

  const { project } = data;
  const images = project.gallery.map((g) => g.src);
  const captions = project.gallery.map((g) => g.caption ?? '');
  const details = {
    client: project.client,
    title: project.title,
    date: project.date,
    medium: project.medium,
    dimensions: project.dimensions,
    credit: project.credit,
    description: project.description
  };

  let idx = 0;
  function prev() {
    idx = (idx - 1 + images.length) % images.length;
  }
  function next() {
    idx = (idx + 1) % images.length;
  }

  $: caption = captions[idx];
  $: slideImgs = [images[idx], images[(idx + 1) % images.length]];
  $: slideCaps = [captions[idx], captions[(idx + 1) % captions.length]];

  // #region Double-tap zoom guard (fold/collapse this)
  let prevBtn: HTMLButtonElement;
  let nextBtn: HTMLButtonElement;

  /**
   * Prevents iOS double-tap zoom on a specific element without disabling zoom globally.
   * Strategy:
   *  - CSS `touch-action: manipulation` (modern Safari/Chromium)
   *  - Prevent default on `dblclick`
   *  - Guard fast consecutive taps on touchend; if we suppress the native click,
   *    we manually invoke the provided callback so navigation still feels snappy.
   */
  function attachNoDoubleTapZoom(el: HTMLElement, onActivate: () => void) {
    // Ensure at runtime (SSR-safe) even if CSS didn’t load yet
    el.style.touchAction = 'manipulation';

    let lastTouch = 0;
    const THRESHOLD = 300; // ms

    const onTouchEnd = (e: TouchEvent) => {
      const now = performance.now();
      if (now - lastTouch < THRESHOLD) {
        // This second tap would normally trigger double-tap zoom.
        // Stop it, and trigger the action ourselves.
        e.preventDefault();
        onActivate();
      }
      lastTouch = now;
    };

    const onDblClick = (e: MouseEvent) => {
      // Some browsers still synthesize dblclick—block zoom behavior.
      e.preventDefault();
    };

    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('dblclick', onDblClick);

    return () => {
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('dblclick', onDblClick);
    };
  }

  onMount(() => {
    const cleanups: Array<() => void> = [];
    if (prevBtn) cleanups.push(attachNoDoubleTapZoom(prevBtn, prev));
    if (nextBtn) cleanups.push(attachNoDoubleTapZoom(nextBtn, next));
    return () => cleanups.forEach((fn) => fn());
  });
  // #endregion
</script>

<!-- mobile + tablet -->
<div class="lg:hidden bg-black text-white px-4 py-2 space-y-0 min-h-screen flex flex-col overflow-x-hidden">
  <!-- image carousel (smaller) -->
  <div class="relative w-full max-w-[500px] mx-auto min-w-0">
    <div class="relative">
      <div class="aspect-[3/4] w-full h-140 overflow-hidden flex items-center justify-center">
        <img
          src={images[idx]}
          alt={`${details.title} – image ${idx + 1}`}
          class="w-full h-full object-cover object-center max-w-full"
        />
      </div>

      <button
        bind:this={prevBtn}
        on:click={prev}
        aria-label="Previous image"
        class="tap-target absolute left-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-4xl leading-none"
      >≤</button>

      <button
        bind:this={nextBtn}
        on:click={next}
        aria-label="Next image"
        class="tap-target absolute right-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-4xl leading-none"
      >≥</button>
    </div>

    <p class="text-sm mt-1 max-w-[500px]">{caption}</p>
  </div>

  <!-- metadata -->
  <div class="mt-4 px-0 max-w-[720px] mx-auto flex flex-col gap-3 text-sm">
    <div class="flex flex-wrap gap-x-4 gap-y-2">
      <div class="flex-1 min-w-[120px]">
        <p class="leading-tight">
          <b class="underline text-blue-600 bg-white px-0.5">client</b><br />
          {details.client}
        </p>
      </div>
      <div class="flex-1 min-w-[120px]">
        <p class="leading-tight">
          <b class="underline text-blue-600 bg-white px-0.5">title</b><br />
          {details.title}
        </p>
      </div>
      <div class="flex-1 min-w-[120px]">
        <p class="leading-tight">
          <b class="underline text-blue-600 bg-white px-0.5">date</b><br />
          {details.date}
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-y-2 sm:gap-x-4">
      <div class="w-full sm:w-1/2">
        <p class="leading-tight">
          <b class="underline text-blue-600 bg-white px-0.5">medium</b><br />
          {details.medium}
        </p>
      </div>
      <div class="w-full sm:w-1/2">
        <p class="leading-tight">
          <b class="underline text-blue-600 bg-white px-0.5">dimensions</b><br />
          {details.dimensions}
        </p>
      </div>
      <div class="w-full sm:w-1/2">
        <p class="leading-tight">
          <b class="underline text-blue-600 bg-white px-0.5">credit</b><br />
          {details.credit}
        </p>
      </div>
    </div>

    <div>
      <p class="underline text-blue-600 px-0.5 text-base font-thin">
        <b class="bg-white">description</b>
      </p>
      <p class="text-sm leading-snug mt-1 mb-5">{details.description}</p>
    </div>
  </div>
</div>

<!-- desktop (lg+) -->
<div
  class="hidden lg:grid min-h-screen bg-black text-white
         md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]
         lg:grid-cols-[minmax(0,clamp(620px,90vw,1100px))_350px]
         md:gap-6 lg:gap-8 px-6 py-4"
>
  <section class="slide flex flex-col items-center space-y-4 lg:space-y-6 w-full">
    <div class="relative w-full md:max-w-[720px] lg:max-w-none md:mx-auto">
      <button
        bind:this={prevBtn}
        on:click={prev}
        aria-label="Previous image"
        class="tap-target absolute left-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl leading-none"
      >≤</button>

      <div class="block lg:hidden">
        <div class="w-full h-[52vh] max-h-[620px] overflow-hidden flex items-center justify-center">
          <img
            src={images[idx]}
            alt={`${details.title} – image ${idx + 1}`}
            class="max-h-full max-w-full object-contain"
          />
        </div>
        <p class="text-[11px] mt-2">{captions[idx]}</p>
      </div>

      <div class="hidden lg:grid grid-cols-2 gap-6">
        {#each slideImgs as src, i}
          <figure class="overflow-hidden aspect-[3/4] flex items-center justify-center">
            <img
              src={src}
              alt={`${details.title} – image ${(idx + i) % images.length + 1}`}
              class="w-full h-full object-cover object-center"
            />
          </figure>
        {/each}
      </div>

      <button
        bind:this={nextBtn}
        on:click={next}
        aria-label="Next image"
        class="tap-target absolute right-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl leading-none"
      >≥</button>
    </div>

    <div class="hidden lg:grid grid-cols-2 gap-6 text-xs w-full">
      {#each slideCaps as c}
        <p>{c}</p>
      {/each}
    </div>
  </section>

  <aside class="meta flex flex-col gap-4 lg:gap-6 text-xs">
    <p class="text-sm leading-tight">
      <b class="underline text-blue-700 bg-white text-base">client</b><br />{details.client}
    </p>
    <p class="text-sm leading-tight">
      <b class="underline text-blue-700 bg-white text-base">title</b><br />{details.title}
    </p>
    <p class="text-sm leading-tight">
      <b class="underline text-blue-700 bg-white text-base">date</b><br />{details.date}
    </p>
    <p class="text-sm leading-tight">
      <b class="underline text-blue-700 bg-white text-base">medium</b><br />{details.medium}
    </p>
    <p class="text-sm leading-tight">
      <b class="underline text-blue-700 bg-white text-base">dimensions</b><br />{details.dimensions}
    </p>
    <p class="text-sm leading-tight">
      <b class="underline text-blue-700 bg-white text-base">credit</b><br />{details.credit}
    </p>

    <p class="underline text-blue-600 px-0.5 text-base font-thin">
      <b class="bg-white">description</b>
    </p>
    <p class="text-xs leading-snug">{details.description}</p>
  </aside>
</div>

<style>
  /* Small utility to hint “this is an interactive tap target” and reduce iOS artifacts */
  .tap-target {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
</style>