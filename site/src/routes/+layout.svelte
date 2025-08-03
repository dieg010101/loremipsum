<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	let menuOpen = false;
	function toggleMenu() {
		menuOpen = !menuOpen;
	}
	function closeMenu() {
		menuOpen = false;
	}
	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
			event.preventDefault();
			closeMenu();
		}
	}
	onMount(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && menuOpen) {
				closeMenu();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<div class="min-h-screen w-full flex flex-col text-sm tracking-tight relative">
	<header class="relative z-20 w-full px-3 pt-4 pb-1 text-xs bg-black">
		<div class="flex items-center justify-between">
			<div class="text-3xl tracking-tight font-bold font-[meno-text] text-white">
				<a href="/">LOREM IPSUM</a>
			</div>
			<nav class="hidden lg:block">
				<div class="flex flex-wrap justify-center gap-x-3 sm:gap-x-4 md:gap-x-6 lg:gap-x-12 xl:gap-x-20 text-sm">
					<a href="/portfolio" class="text-blue-700 bg-white px-0.5 hover:bg-gray-400">portfolio/gallery</a>
					<a href="/webstore" class="text-blue-700 bg-white px-0.5 hover:bg-gray-400">webstore</a>
					<a href="/journal" class="text-blue-700 bg-white px-0.5 hover:bg-gray-400">journal</a>
					<a href="/contact" class="text-blue-700 bg-white px-0.5 hover:bg-gray-400">contact</a>
				</div>
			</nav>
			<button
				class="lg:hidden text-white text-4xl focus:outline-none"
				onclick={toggleMenu}
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				type="button"
			>
				{#if menuOpen}
					×
				{:else}
					☰
				{/if}
			</button>
		</div>
	</header>

	{#if menuOpen}
		<div
			class="fixed inset-0 bg-black bg-opacity-50 z-10"
			role="button"
			tabindex="0"
			aria-label="Close menu"
			onclick={closeMenu}
			onkeydown={handleOverlayKeydown}
		></div>
	{/if}

	<div
		class={`lg:hidden fixed top-0 right-0 h-full w-1/3 max-w-xs bg-black text-white z-20 transform transition-transform duration-100 ease-in-out ${
			menuOpen ? 'translate-x-0' : 'translate-x-full'
		}`}
		aria-label="Mobile navigation"
	>
		<div class="flex justify-end p-4">
			<button
				class="text-white text-4xl"
				onclick={closeMenu}
				aria-label="Close menu"
				type="button"
			>
				×
			</button>
		</div>
		<nav class="flex flex-col space-y-4 px-6 pb-6">
			<a href="/portfolio" class="underline text-blue-700 bg-white px-2.5 py-2 text-right" onclick={closeMenu}>portfolio/gallery</a>
			<a href="/webstore" class="underline text-blue-700 bg-white px-2.5 py-2 text-right" onclick={closeMenu}>webstore</a>
			<a href="/journal" class="underline text-blue-700 bg-white px-2.5 py-2 text-right" onclick={closeMenu}>journal</a>
			<a href="/contact" class="underline text-blue-700 bg-white px-2.5 py-2 text-right" onclick={closeMenu}>contact</a>
		</nav>
	</div>
	<main class="flex flex-1">
		<slot />
	</main>
	<footer
    class="w-full text-center py-0 mb-4
           md:w-auto md:py-0 md:bg-white
           md:fixed md:bottom-4 md:right-4 md:z-50"
    aria-label="Copyright notice"
  >
    <span class="underline text-sm text-blue-700 bg-white select-none font-normal">
      © 2025 lorem ipsum art group. all rights reserved.
    </span>
  </footer>
</div>