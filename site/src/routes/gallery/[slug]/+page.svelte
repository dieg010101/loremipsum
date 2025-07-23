<script lang="ts">
    import type { PageData } from './$types';
    export let data: PageData;
    const { project } = data;
    const images   = project.gallery.map((g) => g.src);
    const captions = project.gallery.map((g) => g.caption ?? '');
    const details = {
      client:      project.client,
      title:       project.title,
      date:        project.date,
      medium:      project.medium,
      dimensions:  project.dimensions,
      credit:      project.credit,
      description: project.description
    };
    let idx = 0;
    function prev() { idx = (idx - 1 + images.length) % images.length; }
    function next() { idx = (idx + 1) % images.length; }
  
    $: slideImgs = [images[idx], images[(idx + 1) % images.length]];
    $: slideCaps = [captions[idx], captions[(idx + 1) % captions.length]];
  </script>
  
  <!-- \\\ mobile \\\ -->
  <div class="md:hidden bg-black text-white p-4 space-y-8">
    {#each images as src, i}
      <figure class="space-y-2">
        <img
          src={src}
          alt={`${details.title} – image ${i + 1}`}
          class="w-full object-contain"
        />
        <p class="text-xs">{captions[i]}</p>
      </figure>
    {/each}
    <section class="space-y-4">
      {#each Object.entries(details).slice(0, -1) as [label, val]}
        <p class="text-xs">
          <b class="underline text-blue-600 bg-white px-0.5">{label}</b><br />
          {val}
        </p>
      {/each}
  
      <p class="underline text-blue-600 bg-white px-0.5 text-base font-thin">
        description
      </p>
      <p class="text-xs bg-white">{details.description}</p>
    </section>
  </div>
  
  <!-- \\\ desktop \\\ -->
  <div
    class="hidden md:grid min-h-screen bg-black text-white
           grid-cols-[minmax(0,clamp(620px,90vw,1100px))_350px]
           gap-8 px-6 py-3"
  >
    <section class="slide flex flex-col items-center space-y-6">
      <div class="relative w-full">
        <button
          on:click={prev}
          aria-label="Previous image"
          class="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl
                 focus-visible:outline focus-visible:outline-2"
        >
          &le;
        </button>
  
        <div class="grid grid-cols-2 gap-6">
          {#each slideImgs as src, i}
            <figure
              class="overflow-hidden aspect-[3/4]
                     flex items-center justify-center bg-black"
            >
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
          class="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-3 text-2xl
                 focus-visible:outline focus-visible:outline-2"
        >
          &ge;
        </button>
      </div>
  
      <div class="grid grid-cols-2 gap-6 text-xs">
        {#each slideCaps as c}
          <p>{c}</p>
        {/each}
      </div>
    </section>
  
    <aside class="meta flex flex-col gap-6">
      {#each [
        ['client',      details.client],
        ['title',       details.title],
        ['date',        details.date],
        ['medium',      details.medium],
        ['dimensions',  details.dimensions],
        ['credit',      details.credit]
      ] as [label, val]}
        <p class="text-sm leading-tight">
          <b class="underline text-blue-700 bg-white text-base">{label}</b><br />
          {val}
        </p>
      {/each}
  
      <p class="underline text-blue-600 px-0.5 text-base font-thin">
        <b class="bg-white">description</b>
      </p>
      <p class="text-xs leading-snug">{details.description}</p>
    </aside>
  </div>