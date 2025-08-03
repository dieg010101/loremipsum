<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
  const projects = data.projects ?? [];
</script>

<div class="md:hidden flex-1">
  <section class="w-full px-3 grid grid-cols-3 gap-3 mt-4 mb-10">
    {#each projects as p}
      <div class="flex flex-col">
        <div class="bg-blue-600 w-full aspect-[4/5] overflow-hidden flex items-center justify-center">
          <a href={`/gallery/${p.slug}`}>
            <img
              src={p.coverUrl ?? '/placeholder.jpg'}
              alt="portfolio piece"
              class="w-full h-full object-cover"
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

<div class="hidden md:flex flex-1">
  <aside class="w-[25%] px-3 space-y-4">
    <div>
      <p class="underline text-blue-600 font-thin text-base">
        <b class="bg-white">categories</b>
      </p>
      <ul class="list-none underline pl-4 space-y-1 text-xs">
        <li>logos</li><li>merch</li><li>packaging</li><li>other stuff</li>
        <li>stickers</li><li>apparel</li><li>prints</li><li>objects</li>
        <li>logos</li><li>merch</li><li>packaging</li><li>other stuff</li>
        <li>stickers</li><li>apparel</li><li>prints</li><li>objects</li>
        <li>logos</li><li>merch</li><li>packaging</li><li>other stuff</li>
        <li>stickers</li><li>apparel</li><li>prints</li><li>objects</li>
      </ul>
    </div>
  </aside>

  <section class="w-[75%] px-3 grid grid-cols-3 gap-6 mt-0 mb-10">
    {#each projects as p}
      <div class="flex flex-col">
        <div class="bg-blue-600 w-full aspect-[4/5] overflow-hidden flex items-center justify-center">
          <a href={`/gallery/${p.slug}`}>
            <img
              src={p.coverUrl ?? '/placeholder.jpg'}
              alt="portfolio piece"
              class="w-full h-full object-cover"
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