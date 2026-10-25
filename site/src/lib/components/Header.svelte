<script lang="ts">
	import './header.css';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import NewsletterForm from './NewsletterForm.svelte';
	import { newsletter } from '$lib/newsletter.svelte';

	// desktop order runs left to right across the middle column; the phone menu
	// leads with what most visitors want.
	const desktopNav = ['exhibitions', 'webstore', 'journal', 'works', 'contact'];
	const menuNav = ['exhibitions', 'works', 'journal', 'webstore', 'contact'];

	let menuOpen = $state(false);
	let headerInput = $state<HTMLInputElement>();
	let menuInput = $state<HTMLInputElement>();

	const current = (name: string) =>
		page.url.pathname === `/${name}` || page.url.pathname.startsWith(`/${name}/`)
			? 'page'
			: undefined;

	afterNavigate(() => (menuOpen = false));

	// "sign up for the newsletter" links elsewhere on the site land here.
	$effect(() => {
		if (!newsletter.focusRequest) return;
		if (matchMedia('(min-width: 1024px)').matches) {
			headerInput?.focus();
		} else {
			menuOpen = true;
			tick().then(() => menuInput?.focus());
		}
	});

	$effect(() => {
		if (!menuOpen) return;
		document.documentElement.classList.add('menu-open');
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (menuOpen = false);
		window.addEventListener('keydown', onKey);
		return () => {
			document.documentElement.classList.remove('menu-open');
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<header class="header">
	<a class="header__logo" href="/">LOREM IPSUM</a>

	<nav class="header__nav" aria-label="main">
		{#each desktopNav as name (name)}
			<a class="link" href="/{name}" aria-current={current(name)}>{name}</a>
		{/each}
	</nav>

	<div class="header__newsletter">
		<NewsletterForm variant="header" bind:input={headerInput} />
	</div>

	<button
		class="link header__menu-button"
		type="button"
		aria-expanded={menuOpen}
		aria-controls="menu"
		onclick={() => (menuOpen = !menuOpen)}
	>
		{menuOpen ? 'close' : 'menu'}
	</button>
</header>

{#if menuOpen}
	<div class="menu" id="menu">
		<nav class="menu__nav" aria-label="menu">
			{#each menuNav as name (name)}
				<a class="link menu__link" href="/{name}" aria-current={current(name)}>{name}</a>
			{/each}
		</nav>
		<div class="menu__bottom">
			<p class="label">newsletter</p>
			<NewsletterForm bind:input={menuInput} />
			<a class="link menu__copyright" href="/privacy">
				© {new Date().getFullYear()} lorem ipsum art group. all rights reserved.
			</a>
		</div>
	</div>
{/if}
