<script lang="ts">
  import type { PageData } from './$types';
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
</script>

<!-- mobile + tablet: same as mobile, image section smaller, metadata moved to bottom -->
<div class="lg:hidden bg-black text-white px-4 py-2 space-y-0 min-h-screen flex flex-col">
  <!-- image carousel (smaller) -->
  <div class="relative w-full max-w-[500px] mx-auto">
    <div class="relative">
      <div class="aspect-[3/4] w-full h-140 overflow-hidden flex items-center justify-center">
        <img
          src={images[idx]}
          alt={`${details.title} – image ${idx + 1}`}
          class="w-full h-full object-cover object-center"
        />
      </div>
      <button
        on:click={prev}
        aria-label="Previous image"
        class="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-4xl"
      >≤</button>
      <button
        on:click={next}
        aria-label="Next image"
        class="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-4xl"
      >≥</button>
    </div>
    <p class="text-sm mt-1 max-w-[500px]">{caption}</p>
  </div>

  <!-- metadata (client, title, date inline first) then others -->
  <div class="mt-4 px-0 max-w-[720px] mx-auto flex flex-col gap-3 text-sm">
    <!-- client | title | date inline -->
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

    <!-- other fields -->
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

    <!-- description -->
    <div>
      <p class="underline text-blue-600 px-0.5 text-base font-thin">
        <b class="bg-white">description</b>
      </p>
      <p class="text-sm leading-snug mt-1 mb-5">{details.description}</p>
    </div>
  </div>
</div>

<!-- desktop (lg+) exact same as your original two-column -->
<div
  class="hidden lg:grid min-h-screen bg-black text-white
         md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]
         lg:grid-cols-[minmax(0,clamp(620px,90vw,1100px))_350px]
         md:gap-6 lg:gap-8 px-6 py-4"
>
  <section class="slide flex flex-col items-center space-y-4 lg:space-y-6 w-full">
    <div class="relative w-full md:max-w-[720px] lg:max-w-none md:mx-auto">
      <button
        on:click={prev}
        aria-label="Previous image"
        class="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl"
      >≤</button>

      <!-- md (hidden here because layout is gated behind lg) -->
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

      <!-- lg+: two-up -->
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
        on:click={next}
        aria-label="Next image"
        class="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl"
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