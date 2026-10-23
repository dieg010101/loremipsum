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

<div class="relative flex min-h-screen w-full flex-col text-sm tracking-tight">
	<header class="relative z-20 w-full bg-black px-3 pt-4 pb-1 text-xs">
		<div class="flex items-center justify-between">
			<div class="font-[meno-text] text-3xl font-bold tracking-tight text-white">
				<a href="/">LOREM IPSUM</a>
			</div>
			<nav class="hidden lg:block">
				<div
					class="flex flex-wrap justify-center gap-x-3 text-sm sm:gap-x-4 md:gap-x-6 lg:gap-x-12 xl:gap-x-20"
				>
					<a href="/portfolio" class="bg-white px-0.5 text-blue-700 hover:bg-gray-400"
						>portfolio/gallery</a
					>
					<a href="/webstore" class="bg-white px-0.5 text-blue-700 hover:bg-gray-400">webstore</a>
					<a href="/journal" class="bg-white px-0.5 text-blue-700 hover:bg-gray-400">journal</a>
					<a href="/contact" class="bg-white px-0.5 text-blue-700 hover:bg-gray-400">contact</a>
				</div>
			</nav>
			<button
				class="text-4xl text-white focus:outline-none lg:hidden"
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
			class="fixed inset-0 z-10 bg-black/50"
			role="button"
			tabindex="0"
			aria-label="Close menu"
			onclick={closeMenu}
			onkeydown={handleOverlayKeydown}
		></div>
	{/if}

	<div
		class={`fixed top-0 right-0 z-20 h-full w-1/3 max-w-xs transform bg-black text-white transition-transform duration-100 ease-in-out lg:hidden ${
			menuOpen ? 'translate-x-0' : 'translate-x-full'
		}`}
		aria-label="Mobile navigation"
	>
		<div class="flex justify-end p-4">
			<button class="text-4xl text-white" onclick={closeMenu} aria-label="Close menu" type="button">
				×
			</button>
		</div>
		<nav class="flex flex-col space-y-4 px-6 pb-6">
			<a
				href="/portfolio"
				class="bg-white px-2.5 py-2 text-right text-blue-700 underline"
				onclick={closeMenu}>portfolio</a
			>
			<a
				href="/webstore"
				class="bg-white px-2.5 py-2 text-right text-blue-700 underline"
				onclick={closeMenu}>webstore</a
			>
			<a
				href="/journal"
				class="bg-white px-2.5 py-2 text-right text-blue-700 underline"
				onclick={closeMenu}>journal</a
			>
			<a
				href="/contact"
				class="bg-white px-2.5 py-2 text-right text-blue-700 underline"
				onclick={closeMenu}>contact</a
			>
		</nav>
	</div>
	<main class="flex flex-1">
		<slot />
	</main>
	<footer
		class="mb-0 w-full py-0 text-center
           md:fixed md:right-4 md:bottom-4
           md:z-50 md:w-auto md:bg-white md:py-0"
		aria-label="Copyright notice"
	>
		<span class="bg-white text-sm font-normal text-blue-700 underline select-none">
			© {new Date().getFullYear()} lorem ipsum art group. all rights reserved.
		</span>
	</footer>
</div>
