<script lang="ts">
	import './visitors-book.css';
	import type { BookEntry } from '$lib/types';
	import { count } from '$lib/format';
	import { sp } from '$lib/spaces';
	import BookForm from './BookForm.svelte';
	import BookEntries from './BookEntries.svelte';

	// the book at the end of an exhibition: the form, the latest few lines, and a way to the rest.
	type Props = {
		exhibition: number;
		entries: BookEntry[];
		total: number;
		result?: Record<string, unknown> | null;
	};
	let { exhibition, entries, total, result = null }: Props = $props();
</script>

<section class="book grid" aria-labelledby="book-{exhibition}">
	<h2 class="book__title" id="book-{exhibition}">visitors’ book</h2>
	<div class="book__write">
		<BookForm {exhibition} result={result as never} />
	</div>
	<div class="book__entries">
		<BookEntries {exhibition} {entries} />
		{#if total > 0}
			<p class="book__more">
				<a href="/exhibitions/{exhibition}/book">all {count(total)} entries</a>{sp(3)}the book stays
				open as long as the exhibition does, which is always.
			</p>
		{/if}
	</div>
</section>
