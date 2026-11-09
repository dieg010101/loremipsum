<script lang="ts">
	import './book.css';
	import { count } from '$lib/format';
	import { sp } from '$lib/spaces';
	import BookForm from '$lib/components/BookForm.svelte';
	import BookEntries from '$lib/components/BookEntries.svelte';
	import '$lib/components/visitors-book.css';

	let { data } = $props();
	const n = $derived(data.exhibition.number);
	const pageHref = (p: number) =>
		p === 1 ? `/exhibitions/${n}/book` : `/exhibitions/${n}/book?page=${p}`;
</script>

<h1 class="page-title">visitors’ book</h1>
<p class="book-page__sub">
	for exhibition {n}, <a href="/exhibitions/{n}"><em>{data.exhibition.title}</em></a>. {count(
		data.total
	)}
	{data.total === 1 ? 'entry' : 'entries'}, newest first.
</p>

<div class="book-page grid">
	<div class="book-page__write">
		<BookForm exhibition={n} />
	</div>
	<div class="book-page__entries">
		<BookEntries exhibition={n} entries={data.entries} dates />
		{#if data.pages > 1}
			<p class="book-page__pager">
				{#if data.page > 1}<a href={pageHref(data.page - 1)} rel="prev">newer entries</a
					>{/if}{#if data.page > 1 && data.page < data.pages}{sp(
						3
					)}{/if}{#if data.page < data.pages}<a href={pageHref(data.page + 1)} rel="next"
						>older entries</a
					>{/if}
			</p>
		{/if}
	</div>
</div>
