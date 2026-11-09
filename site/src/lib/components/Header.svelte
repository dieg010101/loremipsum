<script lang="ts">
	import { DOT } from '$lib/spaces';
	import './header.css';
	import { page } from '$app/state';

	const ITEMS = [
		{ href: '/', label: 'lorem ipsum', section: (p: string) => p === '/' },
		{
			href: '/exhibitions',
			label: 'exhibitions',
			section: (p: string) => p.startsWith('/exhibitions')
		},
		{ href: '/index', label: 'index', section: (p: string) => p.startsWith('/index') },
		{ href: '/webstore', label: 'webstore', section: (p: string) => p.startsWith('/webstore') },
		{ href: '/letters', label: 'letters', section: (p: string) => p.startsWith('/letters') },
		{
			href: '/about',
			label: 'about',
			section: (p: string) => ['/about', '/contact', '/privacy'].some((s) => p.startsWith(s))
		}
	];

	// the section you're in is plain text, not a link. a missing page is in none.
	const path = $derived(page.status >= 400 ? '' : page.url.pathname);
	const showing = $derived(page.data.showing);
</script>

<header class="header">
	<nav aria-label="site">
		<ul class="header__nav grid">
			{#each ITEMS as item, i (item.href)}
				<li class="header__item" class:header__item--home={i === 0}>
					{#if path === item.href}
						<span aria-current="page">{item.label}</span>
					{:else if item.section(path)}
						<!-- inside the section: it looks like where you are, and still takes you to its front page. -->
						<a class="header__here" href={item.href} aria-current="true">{item.label}</a>
					{:else}
						<a href={item.href}>{item.label}</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>

	{#if showing}
		<p class="now">
			<span class="desktop-only"
				>now showing: <a href="/exhibitions/{showing.number}"><em>{showing.title}</em></a>,
				exhibition {showing.number}{#if showing.day}, {showing.day}{/if}{DOT}next: {showing.next}</span
			><span class="mobile-only"
				>now: <a href="/exhibitions/{showing.number}"><em>{showing.title}</em></a><br />exhibition {showing.number}{#if showing.day},
					{showing.day}{/if} · next: {showing.next}</span
			>
		</p>
	{/if}
</header>
