<script lang="ts">
	import type { PageData } from './$types';
	import { page as pageStore } from '$app/stores';

	export let data: PageData;

	const projects = data.projects ?? [];
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
	<meta
		name="description"
		content="Lorem Ipsum Art Group portfolio page: comprehensive spread of agency projects."
	/>
</svelte:head>

<!-- mobile. -->
<div class="flex-1 md:hidden">
	<section class="mt-4 mb-10 grid w-full grid-cols-3 gap-3 px-3">
		{#each filteredProjects as p}
			<div class="flex flex-col">
				<div class="flex aspect-[4/5] w-full items-end justify-center overflow-hidden bg-black">
					<a href={`/gallery/${p.slug}`} class="block h-full w-full">
						<img
							src={p.coverUrl ?? '/placeholder.jpg'}
							srcset={p.coverSrcSet}
							sizes={thumbSizes}
							loading="lazy"
							decoding="async"
							alt="portfolio piece"
							class={`h-full w-full ${imgClassFor(p.coverAspect)}`}
						/>
					</a>
				</div>

				<a href={`/gallery/${p.slug}`} class="mt-2 text-xs">
					<p class="text-sm font-thin text-blue-600 underline">
						<b class="bg-white">{p.client}</b>
					</p>
				</a>
				<a href={`/gallery/${p.slug}`} class="text-xs">
					<p class="text-sm font-thin text-blue-600 underline">
						<b class="bg-white">{p.title}</b>
					</p>
				</a>
			</div>
		{/each}
	</section>
</div>

<!-- desktop. -->
<div class="hidden flex-1 md:flex">
	<aside class="w-[25%] space-y-4 px-3">
		<div>
			<p class="text-base font-thin text-blue-600 underline">
				<b class="bg-white">categories</b>
			</p>
			<ul class="list-none space-y-1 pl-4 text-xs underline">
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

	<section class="mt-0 mb-10 grid w-[75%] grid-cols-3 gap-6 px-3">
		{#each filteredProjects as p}
			<div class="flex flex-col">
				<div class="flex aspect-[4/5] w-full items-end justify-center overflow-hidden bg-black">
					<a href={`/gallery/${p.slug}`} class="block h-full w-full">
						<img
							src={p.coverUrl ?? '/placeholder.jpg'}
							srcset={p.coverSrcSet}
							sizes={thumbSizes}
							loading="lazy"
							decoding="async"
							alt="portfolio piece"
							class={`h-full w-full ${imgClassFor(p.coverAspect)}`}
						/>
					</a>
				</div>

				<a href={`/gallery/${p.slug}`} class="mt-2 text-xs">
					<p class="text-sm font-thin text-blue-600 underline">
						<b class="bg-white">{p.client}</b>
					</p>
				</a>
				<a href={`/gallery/${p.slug}`} class="text-xs">
					<p class="text-sm font-thin text-blue-600 underline">
						<b class="bg-white">{p.title}</b>
					</p>
				</a>
			</div>
		{/each}
	</section>
</div>
