<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>


<div class="min-h-screen w-full flex flex-col text-sm tracking-tight">
	<header class="relative z-10 w-full px-3 pt-4 text-xs pb-1">
	  <div class="grid grid-cols-[25%_1fr_25%] items-center">
		<div class="text-3xl tracking-tight font-bold font-[meno-text] text-white">
		  <a href="/">LOREM IPSUM</a>
		</div>
		<nav class="flex justify-center text-sm">
		  <div class="flex space-x-39">
			<a href="/portfolio" class="underline text-blue-700 font-normal bg-white px-0.5 py-0">portfolio/gallery</a>
			<a href="/webstore" class="underline text-blue-700 font-normal bg-white px-0.5">webstore</a>
			<a href="/journal" class="underline text-blue-700 font-normal bg-white px-0.5">journal</a>
			<a href="/contact" class="underline text-blue-700 font-normal bg-white px-0.5">contact</a>
		  </div>
		</nav>
		<div class="flex items-center justify-end text-xs">
		  <div class="px-1 py-[2px] flex items-center">
			<input
			  type="text"
			  aria-label="search"
			  class="bg-white text-blue-500 border-0 border-b-2 border-blue-600 outline-none text-xs px-0 py-[2px] w-100 leading-none tracking-tight"
			/>
		  </div>
		  <div class="w-2"></div>
		  <div class="bg-white px-0 py-[3px] flex items-center">
			<p class="text-blue-600 underline text-sm tracking-tight leading-none font-normal">
			  search
			</p>
		  </div>
		</div>
	  </div>
	</header>
	<main class="flex flex-1">
	  <slot />
	</main>
  </div>