<script lang="ts">
	import './home.css';
	import { page } from '$app/state';

	let { data } = $props();
	const showing = $derived(data.onView);
	const join = (i: number, n: number) => (i === 0 ? '' : i === n - 1 ? ' and ' : ', ');
</script>

<h1 class="visually-hidden">lorem ipsum, an online gallery</h1>
<!-- one sentence: what lorem ipsum is, and what's on. -->
<p class="statement">
	lorem ipsum is an online gallery.{#if showing}{' '}now showing:
		<a href="/exhibitions/{showing.number}"><em>{showing.title}</em></a>, with {#each showing.artists as artist, i (artist.number)}{join(
				i,
				showing.artists.length
			)}<a href="/exhibitions/{showing.number}#artist-{artist.number}">{artist.name}</a
			>{/each}{#if showing.summary}: {showing.summary}{/if}.{/if}{#if data.next}{' '}next, from {data
			.next.opens}:
		<a href="/exhibitions/{data.next.number}"><em>{data.next.title}</em></a
		>.{/if}{#if data.earlier.length}{' '}before this, and still open: {#each data.earlier as e, i (e.number)}{join(
				i,
				data.earlier.length
			)}<a href="/exhibitions/{e.number}"><em>{e.title}</em></a
			>{/each}.{/if}{#if !showing && !data.next}{' '}write to
		<a href="mailto:{page.data.settings.email}">{page.data.settings.email}</a>.{/if}
</p>
