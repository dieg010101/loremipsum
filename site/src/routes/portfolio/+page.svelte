<script lang="ts">
  import type { PageData } from './$types';
  import { page as pageStore } from '$app/stores';

  export let data: PageData;

  const projects   = data.projects ?? [];
  const categories = data.categories ?? [];

  $: selectedCatSlug = $pageStore.url.searchParams.get('cat') ?? null;
  $: filteredProjects = selectedCatSlug
    ? projects.filter((p) => (p.categories ?? []).some((c) => c.slug === selectedCatSlug))
    : projects;

  $: currentPath = $pageStore.url.pathname;
  const thumbSizes = '(min-width: 768px) 25vw, 33vw';

  const containerAspect = 4 / 5;

  const imgClassFor = (aspect?: number | null) => {
    if (aspect == null) return 'object-contain object-bottom';
    return aspect >= containerAspect ? 'object-contain object-bottom' : 'object-cover';
  };
</script>

<svelte:head>
  <title>Portfolio Page</title>
  <meta name="description" content="Lorem Ipsum Art Group portfolio page: comprehensive spread of agency projects." />
</svelte:head>

<!-- mobile. -->
<div class="md:hidden flex-1">
  <section class="w-full px-3 grid grid-cols-3 gap-3 mt-4 mb-10">
    {#each filteredProjects as p}
      <div class="flex flex-col">
        <div class="w-full aspect-[4/5] overflow-hidden flex items-end justify-center bg-black">
          <a href={`/gallery/${p.slug}`} class="block w-full h-full">
            <img
              src={p.coverUrl ?? '/placeholder.jpg'}
              srcset={p.coverSrcSet}
              sizes={thumbSizes}
              loading="lazy"
              decoding="async"
              alt="portfolio piece"
              class={`w-full h-full ${imgClassFor(p.coverAspect)}`}
            />
          </a>
        </div>

        <a href={`/gallery/${p.slug}`} class="mt-2 text-xs">
          <p class="underline text-blue-600 font-thin text-sm">
            <b class="bg-white">{p.client}</b>
          </p>
        </a>
        <a href={`/gallery/${p.slug}`} class="text-xs">
          <p class="underline text-blue-600 font-thin text-sm">
            <b class="bg-white">{p.title}</b>
          </p>
        </a>
      </div>
    {/each}
  </section>
</div>

<!-- desktop. -->
<div class="hidden md:flex flex-1">
  <aside class="w-[25%] px-3 space-y-4">
    <div>
      <p class="underline text-blue-600 font-thin text-base">
        <b class="bg-white">categories</b>
      </p>
      <ul class="list-none underline pl-4 space-y-1 text-xs">
        <li>
          {#if selectedCatSlug}
            <a class="hover:opacity-70" href={currentPath}>all</a>
          {:else}
            <b class="bg-white">all</b>
          {/if}
        </li>
        {#each categories as c}
          <li>
            {#if c.slug === selectedCatSlug}
              <b class="bg-white text-blue-600">{c.title}</b>
            {:else}
              <a class="hover:opacity-70" href={`${currentPath}?cat=${c.slug}`}>{c.title}</a>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </aside>

  <section class="w-[75%] px-3 grid grid-cols-3 gap-6 mt-0 mb-10">
    {#each filteredProjects as p}
      <div class="flex flex-col">
        <div class="w-full aspect-[4/5] overflow-hidden flex items-end justify-center bg-black">
          <a href={`/gallery/${p.slug}`} class="block w-full h-full">
            <img
              src={p.coverUrl ?? '/placeholder.jpg'}
              srcset={p.coverSrcSet}
              sizes={thumbSizes}
              loading="lazy"
              decoding="async"
              alt="portfolio piece"
              class={`w-full h-full ${imgClassFor(p.coverAspect)}`}
            />
          </a>
        </div>

        <a href={`/gallery/${p.slug}`} class="mt-2 text-xs">
          <p class="underline text-blue-600 font-thin text-sm">
            <b class="bg-white">{p.client}</b>
          </p>
        </a>
        <a href={`/gallery/${p.slug}`} class="text-xs">
          <p class="underline text-blue-600 font-thin text-sm">
            <b class="bg-white">{p.title}</b>
          </p>
        </a>
      </div>
    {/each}
  </section>
</div>