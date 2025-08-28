<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
  
	export let data: PageData;
	const { projects, clients } = data;
  
	$: uniqueClients = [...new Set((clients ?? []).map((c: string) => c?.trim()))].sort();
  
	let idx = 0;
	function prev() { idx = (idx - 1 + projects.length) % projects.length; }
	function next() { idx = (idx + 1) % projects.length; }

	$: current    = projects[idx] ?? {};
	$: coverSrc   = current.coverUrl       ?? '/placeholder.jpg';
	$: coverSet   = current.coverSrcSet    ?? undefined;
	$: coverAlt   = current.title          ?? 'image';
	$: coverW     = current.coverWidth     ?? 600;
	$: coverH     = current.coverHeight    ?? 800;
	$: coverLqip  = current.coverLqip      ?? null;
  
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
  
	$: blurStyle = (coverLqip && !heroLoaded)
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
    <title>lorem ipsum art group</title>
  </svelte:head>

  <div class="lg:hidden p-4 space-y-8">
	<div>
	  <p class="underline text-blue-600 font-thin text-base">
		<b class="bg-white">About</b>
	  </p>
	  <p class="text-xs">
		LOREM IPSUM is an independent art practice focused on developing nuanced design
		languages, straddling both creative and uncelebrated industries in the interest
		of delivering culturally resonant visual identities. Founded in 2025 by a group
		of chronically online friends, Lorem Ipsum maintains interest in recording
		modern phenomena through practical art and design — via unconsidered aesthetics.
		Services include branding design, web development, merchandising, marketing
		materials, packaging, and art direction.
	  </p>
	</div>
	<div class="grid grid-cols-2 gap-4">
	  <div>
		<p class="underline text-blue-600 font-thin text-base">
		  <b class="bg-white">Services</b>
		</p>
		<ul class="text-xs list-disc list-inside space-y-1">
		  <li>brand identity & visual language</li>
		  <li>merchandising & product design</li>
		  <li>web & digital experience</li>
		  <li>creative direction & campaigns</li>
		  <li>packaging & physical touchpoints</li>
		</ul>
	  </div>
	  <div>
		<p class="underline text-blue-600 font-thin text-base">
		  <b class="bg-white">Clients</b>
		</p>
		<ul class="text-xs list-disc list-inside space-y-1">
		  {#each uniqueClients as c}
			<li>{c}</li>
		  {/each}
		</ul>
	  </div>
	</div>
  </div>
  
  <!-- desktop. -->
  <div class="hidden lg:flex flex-1">
	<aside class="w-[25%] px-3 space-y-4">
	  <div>
		<p class="underline text-blue-600 font-thin text-base">
		  <b class="bg-white">about</b>
		</p>
		<p class="text-xs mt-0">
		  LOREM IPSUM is an independent art practice focused on developing nuanced design
		  languages, straddling both creative and uncelebrated industries in the interest
		  of delivering culturally resonant visual identities. Founded in 2025 by a group
		  of chronically online friends, Lorem Ipsum maintains interest in recording
		  modern phenomena through practical art and design — via unconsidered aesthetics.
		  Services include branding design, web development, merchandising, marketing
		  materials, packaging, and art direction.
		</p>
	  </div>
  
	  <div>
		<p class="underline text-blue-600 font-thin text-base">
		  <b class="bg-white">services</b>
		</p>
		<ul class="text-xs mt-0 list-none space-y-1">
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
		<p class="underline text-blue-600 font-thin text-base">
		  <b class="bg-white">clients</b>
		</p>
		<ul class="mt-0 list-none space-y-0.5 text-xs">
		  {#each uniqueClients as c}
			<li>{c}</li>
		  {/each}
		</ul>
	  </div>
	</aside>
  
	<section class="w-[50%] flex justify-center items-center p-0 mb-12">
	  <div class="flex items-center gap-4">
		<button
		  aria-label="Previous"
		  on:click={prev}
		  class="bg-white text-blue-600 px-0 text-2xl select-none
				 focus-visible:outline focus-visible:outline-2">
		  &le;
		</button>
  
		<figure
		  class="overflow-hidden aspect-[3/4] w-[clamp(300px,45vw,600px)]
				  flex items-center justify-center bg-black">
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
			  on:load={() => { heroLoaded = true; }}
			  on:error={() => { heroLoaded = true; }}
			  class="w-full h-full object-cover object-center" />
		  {/key}
		</figure>
  
		<button
		  aria-label="Next"
		  on:click={next}
		  class="bg-white text-blue-600 px-0 text-2xl select-none
				 focus-visible:outline focus-visible:outline-2">
		  &ge;
		</button>
	  </div>
	</section>
  
	<aside class="w-[25%] px-3 space-y-4">
	  <div>
		<p class="text-sm">
		  <b class="underline text-blue-700 bg-white text-base">client</b><br />
		  {current.client}
		</p>
		<p class="mt-4 text-sm">
		  <b class="underline text-blue-700 bg-white text-base">title</b><br />
		  {current.title}
		</p>
		<p class="mt-4 text-sm">
		  <b class="underline text-blue-700 bg-white text-base">date</b><br />
		  {current.date}
		</p>
		<p class="mt-4 text-sm">
		  <b class="underline text-blue-700 bg-white text-base">medium</b><br />
		  {current.medium}
		</p>
		<p class="mt-4 text-sm">
		  <b class="underline text-blue-700 bg-white text-base">dimensions</b><br />
		  {current.dimensions}
		</p>
		<p class="mt-4 text-sm">
		  <b class="underline text-blue-700 bg-white text-base">credit</b><br />
		  {current.credit}
		</p>
	  </div>
  
	  <div>
		<p class="underline text-blue-700 font-thin text-base">
		  <b class="bg-white">description</b>
		</p>
		<p class="mt-0 text-sm">
		  {current.description}
		</p>
	  </div>
	</aside>
  </div>